const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const Grade = require('../models/Grade');
const GradeSummary = require('../models/GradeSummary');
const Course = require('../models/Course');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/grades
 * Create a new grade entry
 */
router.post('/', [
  auth,
  body('course_id').isMongoId().withMessage('Valid course ID is required'),
  body('student_id').isMongoId().withMessage('Valid student ID is required'),
  body('assignment_type').isIn(['assignment', 'quiz', 'exam', 'project', 'participation', 'lab_work', 'presentation', 'other']).withMessage('Valid assignment type required'),
  body('assignment_title').trim().isLength({ min: 1, max: 200 }).withMessage('Assignment title is required (max 200 characters)'),
  body('max_score').isFloat({ min: 0 }).withMessage('Max score must be positive'),
  body('earned_score').isFloat({ min: 0 }).withMessage('Earned score must be positive'),
  body('weight').isFloat({ min: 0, max: 100 }).withMessage('Weight must be between 0 and 100'),
  body('assignment_description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('due_date').optional().isISO8601().withMessage('Valid due date required'),
  body('submitted_date').optional().isISO8601().withMessage('Valid submitted date required'),
  body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments max 1000 characters'),
  body('rubric_scores').optional().isArray().withMessage('Rubric scores must be array'),
  body('is_extra_credit').optional().isBoolean().withMessage('Extra credit must be boolean'),
  body('late_submission').optional().isBoolean().withMessage('Late submission must be boolean'),
  body('late_penalty').optional().isFloat({ min: 0 }).withMessage('Late penalty must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can create grades
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can create grades'
      });
    }

    const {
      course_id,
      student_id,
      assignment_type,
      assignment_title,
      assignment_description,
      max_score,
      earned_score,
      weight,
      grade_category,
      due_date,
      submitted_date,
      comments,
      rubric_scores = [],
      is_extra_credit = false,
      late_submission = false,
      late_penalty = 0,
      academic_year,
      semester,
      quiz_id
    } = req.body;

    // Verify course exists and belongs to organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check if instructor is assigned to this course (unless org_admin)
    if (role === 'instructor' && course.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only create grades for your assigned courses'
      });
    }

    // Verify student exists and belongs to organization
    const student = await User.findOne({
      _id: student_id,
      organization_id: organization_id,
      role: 'student',
      is_active: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'Student not found in your organization'
      });
    }

    // Validate grade weights don't exceed 100%
    const currentTotalWeight = await Grade.validateCourseWeights(course_id, organization_id);
    if (currentTotalWeight + weight > 100) {
      return res.status(400).json({
        success: false,
        error: 'Weight limit exceeded',
        message: `Total grade weights cannot exceed 100%. Current total: ${currentTotalWeight}%, Adding: ${weight}%`
      });
    }

    // Create grade record
    const grade = new Grade({
      organization_id,
      course_id,
      student_id,
      assignment_type,
      assignment_title,
      assignment_description,
      max_score,
      earned_score,
      weight,
      grade_category,
      due_date: due_date ? new Date(due_date) : null,
      submitted_date: submitted_date ? new Date(submitted_date) : null,
      graded_by: userId,
      comments,
      rubric_scores,
      is_extra_credit,
      late_submission,
      late_penalty,
      academic_year,
      semester,
      quiz_id
    });

    await grade.save();

    // Populate for response
    await grade.populate([
      { path: 'student_id', select: 'full_name email' },
      { path: 'course_id', select: 'title' },
      { path: 'graded_by', select: 'full_name' }
    ]);

    res.status(201).json({
      success: true,
      data: grade,
      message: 'Grade created successfully'
    });

  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create grade'
    });
  }
});

/**
 * GET /api/grades/course/:course_id
 * Get grades for a course
 */
router.get('/course/:course_id', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('assignment_type').optional().isIn(['assignment', 'quiz', 'exam', 'project', 'participation', 'lab_work', 'presentation', 'other']),
  query('student_id').optional().isMongoId().withMessage('Valid student ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { course_id } = req.params;
    const { organization_id, role, _id: userId } = req.user;
    const { page = 1, limit = 20, assignment_type, student_id } = req.query;

    // Verify course access
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check permissions
    if (role === 'instructor' && course.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view grades for your assigned courses'
      });
    }

    if (role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Students should use the student-specific endpoint'
      });
    }

    // Build filters
    const filters = { course_id: course_id };
    if (assignment_type) filters.assignment_type = assignment_type;
    if (student_id) filters.student_id = student_id;

    // Get grades with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const grades = await Grade.findByOrganization(organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const totalGrades = await Grade.countDocuments({
      organization_id: organization_id,
      is_active: true,
      ...filters
    });

    // Get course grade statistics
    const courseStats = await Grade.getCourseGradeStats(course_id, organization_id, filters);

    res.json({
      success: true,
      data: {
        grades,
        course_statistics: courseStats,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalGrades / parseInt(limit)),
          total_items: totalGrades,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Course grades retrieved successfully'
    });

  } catch (error) {
    console.error('Get course grades error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve course grades'
    });
  }
});

/**
 * GET /api/grades/student/:student_id
 * Get grades for a student
 */
router.get('/student/:student_id', [
  auth,
  query('course_id').optional().isMongoId().withMessage('Valid course ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { student_id } = req.params;
    const { organization_id, role, _id: userId } = req.user;
    const { course_id } = req.query;

    // Check access permissions
    if (role === 'student' && student_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own grades'
      });
    }

    if (role === 'parent') {
      const isLinkedStudent = await User.findOne({
        _id: student_id,
        parent_id: userId,
        organization_id: organization_id
      });

      if (!isLinkedStudent) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view grades for your linked students'
        });
      }
    }

    // Verify student exists
    const student = await User.findOne({
      _id: student_id,
      organization_id: organization_id,
      role: 'student',
      is_active: true
    }).select('full_name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'Student not found in your organization'
      });
    }

    // Build filters
    const filters = {};
    if (course_id) filters.course_id = course_id;

    // Get student grades summary
    const gradesSummary = await Grade.getStudentGradesSummary(student_id, organization_id, filters);

    // Get grade summaries from GradeSummary model
    const gradeSummaries = await GradeSummary.find({
      student_id: student_id,
      organization_id: organization_id,
      is_active: true,
      ...(course_id ? { course_id: course_id } : {})
    }).populate('course_id', 'title');

    res.json({
      success: true,
      data: {
        student: student,
        grades_by_course: gradesSummary,
        grade_summaries: gradeSummaries
      },
      message: 'Student grades retrieved successfully'
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve student grades'
    });
  }
});

/**
 * PUT /api/grades/:id
 * Update a grade
 */
router.put('/:id', [
  auth,
  body('earned_score').optional().isFloat({ min: 0 }).withMessage('Earned score must be positive'),
  body('max_score').optional().isFloat({ min: 0 }).withMessage('Max score must be positive'),
  body('weight').optional().isFloat({ min: 0, max: 100 }).withMessage('Weight must be between 0 and 100'),
  body('comments').optional().trim().isLength({ max: 1000 }).withMessage('Comments max 1000 characters'),
  body('rubric_scores').optional().isArray().withMessage('Rubric scores must be array'),
  body('late_penalty').optional().isFloat({ min: 0 }).withMessage('Late penalty must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can update grades
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can update grades'
      });
    }

    const grade = await Grade.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: 'Grade not found',
        message: 'Grade record not found'
      });
    }

    // Check if instructor owns this grade
    if (role === 'instructor' && grade.graded_by.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update grades you created'
      });
    }

    // Validate weight changes
    if (req.body.weight !== undefined && req.body.weight !== grade.weight) {
      const currentTotalWeight = await Grade.validateCourseWeights(
        grade.course_id,
        organization_id,
        grade._id
      );
      
      if (currentTotalWeight + req.body.weight > 100) {
        return res.status(400).json({
          success: false,
          error: 'Weight limit exceeded',
          message: `Total grade weights cannot exceed 100%. Current total: ${currentTotalWeight}%, New weight: ${req.body.weight}%`
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'earned_score', 'max_score', 'weight', 'comments', 
      'rubric_scores', 'late_penalty', 'grade_category'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        grade[field] = req.body[field];
      }
    });

    // Update rubric scores if provided
    if (req.body.rubric_scores) {
      await grade.updateFromRubric();
    }

    await grade.save();

    await grade.populate([
      { path: 'student_id', select: 'full_name email' },
      { path: 'course_id', select: 'title' },
      { path: 'graded_by', select: 'full_name' }
    ]);

    res.json({
      success: true,
      data: grade,
      message: 'Grade updated successfully'
    });

  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update grade'
    });
  }
});

/**
 * DELETE /api/grades/:id
 * Delete a grade
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can delete grades
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can delete grades'
      });
    }

    const grade = await Grade.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: 'Grade not found',
        message: 'Grade record not found'
      });
    }

    // Check if instructor owns this grade
    if (role === 'instructor' && grade.graded_by.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete grades you created'
      });
    }

    // Soft delete
    grade.is_active = false;
    await grade.save();

    // Recalculate grade summaries
    await Grade.recalculateCourseSummaries(grade.course_id, organization_id);

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });

  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete grade'
    });
  }
});

/**
 * POST /api/grades/bulk-entry
 * Bulk grade entry for multiple students
 */
router.post('/bulk-entry', [
  auth,
  body('course_id').isMongoId().withMessage('Valid course ID required'),
  body('assignment_type').isIn(['assignment', 'quiz', 'exam', 'project', 'participation', 'lab_work', 'presentation', 'other']).withMessage('Valid assignment type required'),
  body('assignment_title').trim().isLength({ min: 1, max: 200 }).withMessage('Assignment title required'),
  body('max_score').isFloat({ min: 0 }).withMessage('Max score must be positive'),
  body('weight').isFloat({ min: 0, max: 100 }).withMessage('Weight must be between 0 and 100'),
  body('grades').isArray({ min: 1 }).withMessage('Grades array is required'),
  body('grades.*.student_id').isMongoId().withMessage('Valid student ID required'),
  body('grades.*.earned_score').isFloat({ min: 0 }).withMessage('Earned score must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can create bulk grades
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can create bulk grades'
      });
    }

    const {
      course_id,
      assignment_type,
      assignment_title,
      assignment_description,
      max_score,
      weight,
      grade_category,
      due_date,
      grades,
      academic_year,
      semester
    } = req.body;

    // Verify course exists and belongs to organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check if instructor is assigned to this course
    if (role === 'instructor' && course.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only create grades for your assigned courses'
      });
    }

    // Validate grade weights
    const currentTotalWeight = await Grade.validateCourseWeights(course_id, organization_id);
    if (currentTotalWeight + weight > 100) {
      return res.status(400).json({
        success: false,
        error: 'Weight limit exceeded',
        message: `Total grade weights cannot exceed 100%. Current total: ${currentTotalWeight}%, Adding: ${weight}%`
      });
    }

    // Create grade records
    const gradeRecords = grades.map(gradeData => ({
      organization_id,
      course_id,
      student_id: gradeData.student_id,
      assignment_type,
      assignment_title,
      assignment_description,
      max_score,
      earned_score: gradeData.earned_score,
      weight,
      grade_category,
      due_date: due_date ? new Date(due_date) : null,
      graded_by: userId,
      comments: gradeData.comments || '',
      is_extra_credit: gradeData.is_extra_credit || false,
      late_submission: gradeData.late_submission || false,
      late_penalty: gradeData.late_penalty || 0,
      academic_year,
      semester
    }));

    const createdGrades = await Grade.insertMany(gradeRecords);

    // Recalculate grade summaries for the course
    await Grade.recalculateCourseSummaries(course_id, organization_id);

    res.status(201).json({
      success: true,
      data: {
        created_count: createdGrades.length,
        grades: createdGrades
      },
      message: `${createdGrades.length} grades created successfully`
    });

  } catch (error) {
    console.error('Bulk grade entry error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create bulk grades'
    });
  }
});

/**
 * GET /api/grades/summary/:course_id/:student_id
 * Get grade summary for a specific student in a course
 */
router.get('/summary/:course_id/:student_id', auth, async (req, res) => {
  try {
    const { course_id, student_id } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    // Check access permissions
    if (role === 'student' && student_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own grade summary'
      });
    }

    if (role === 'parent') {
      const isLinkedStudent = await User.findOne({
        _id: student_id,
        parent_id: userId,
        organization_id: organization_id
      });

      if (!isLinkedStudent) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view grade summaries for your linked students'
        });
      }
    }

    // Get grade summary
    const gradeSummary = await GradeSummary.findOne({
      course_id: course_id,
      student_id: student_id,
      organization_id: organization_id,
      is_active: true
    }).populate([
      { path: 'course_id', select: 'title' },
      { path: 'student_id', select: 'full_name email' }
    ]);

    if (!gradeSummary) {
      return res.status(404).json({
        success: false,
        error: 'Grade summary not found',
        message: 'No grade summary found for this student and course'
      });
    }

    // Get detailed grades
    const detailedGrades = await Grade.find({
      course_id: course_id,
      student_id: student_id,
      organization_id: organization_id,
      is_active: true
    }).sort({ graded_date: -1 });

    // Calculate trend
    const trend = await gradeSummary.calculateTrend();

    res.json({
      success: true,
      data: {
        summary: gradeSummary,
        detailed_grades: detailedGrades,
        category_breakdown: gradeSummary.getCategoryBreakdown(),
        trend: trend
      },
      message: 'Grade summary retrieved successfully'
    });

  } catch (error) {
    console.error('Get grade summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve grade summary'
    });
  }
});

/**
 * POST /api/grades/recalculate-totals
 * Recalculate grade totals for a course
 */
router.post('/recalculate-totals', [
  auth,
  body('course_id').isMongoId().withMessage('Valid course ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role } = req.user;
    const { course_id } = req.body;

    // Only instructors and org_admin can recalculate totals
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can recalculate grade totals'
      });
    }

    // Recalculate grade summaries
    const updatedSummaries = await Grade.recalculateCourseSummaries(course_id, organization_id);

    res.json({
      success: true,
      data: {
        updated_summaries_count: updatedSummaries.length,
        summaries: updatedSummaries
      },
      message: 'Grade totals recalculated successfully'
    });

  } catch (error) {
    console.error('Recalculate totals error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to recalculate grade totals'
    });
  }
});

module.exports = router;