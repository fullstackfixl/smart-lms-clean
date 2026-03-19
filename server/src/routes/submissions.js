const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const moduleGuard = require('../middleware/moduleGuard');

const router = express.Router();

router.use(auth, moduleGuard('SUBJECTS'));

router.get('/', [
  auth,
  query('assignment_id').optional().isMongoId(),
  query('course_id').optional().isMongoId(),
  query('student_id').optional().isMongoId(),
  query('active').optional().isIn(['true', 'false'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Please check your query parameters', details: errors.array() });
    }

    const { Submission, Assignment, Course, AcademicEnrollment } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;
    const { assignment_id, course_id, student_id, active } = req.query;

    const filters = {
      organization_id: orgId
    };
    if (assignment_id) filters.assignment_id = assignment_id;
    if (course_id) filters.course_id = course_id;
    if (active === 'true') filters.is_active = true;
    if (active === 'false') filters.is_active = false;

    if (role === 'student') {
      filters.student_id = userId;
    } else if (student_id) {
      filters.student_id = student_id;
    }

    if (role === 'instructor' && course_id) {
      const course = await Course.findOne({
        _id: course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      if (!course || String(course.instructor_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You can only view submissions for your assigned courses' });
      }
    }

    if (role === 'instructor' && assignment_id) {
      const a = await Assignment.findOne({ _id: assignment_id, organization_id: orgId, is_active: true });
      if (a) {
        const course = await Course.findOne({
          _id: a.course_id,
          organization_id: orgId,
          $or: [{ is_active: true }, { isActive: true }]
        });
        if (!course || String(course.instructor_id) !== String(userId)) {
          return res.status(403).json({ success: false, error: 'Access denied', message: 'You can only view submissions for your assignments' });
        }
      }
    }

    const submissions = await Submission.find(filters)
      .populate('assignment_id', 'title max_score due_date')
      .populate('course_id', 'title')
      .populate('student_id', 'name email profile')
      .populate('graded_by', 'name email')
      .sort({ submitted_at: -1, createdAt: -1 })
      .lean();

    return res.json({ success: true, data: { submissions }, message: 'Submissions retrieved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve submissions' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { Submission, Course } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    const submission = await Submission.findOne({ _id: req.params.id, organization_id: orgId })
      .populate('assignment_id', 'title max_score due_date')
      .populate('course_id', 'title instructor_id')
      .populate('student_id', 'name email profile')
      .populate('graded_by', 'name email')
      .lean();

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found', message: 'Submission not found' });
    }

    if (role === 'student' && String(submission.student_id?._id || submission.student_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied', message: 'You do not have access to this submission' });
    }

    if (role === 'instructor') {
      const course = await Course.findOne({
        _id: submission.course_id?._id || submission.course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      if (!course || String(course.instructor_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You do not have access to this submission' });
      }
    }

    return res.json({ success: true, data: { submission }, message: 'Submission retrieved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve submission' });
  }
});

router.post('/', auth, async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[Submission POST] ===== START =====');
    console.log('[Submission POST] Headers:', JSON.stringify(req.headers));
    console.log('[Submission POST] Raw body:', req.body);
    console.log('[Submission POST] Body type:', typeof req.body);
    console.log('[Submission POST] Body keys:', req.body ? Object.keys(req.body) : 'null');
    console.log('[Submission POST] Content-Type:', req.headers['content-type']);
    
    // Force parse if body is empty but we have data
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('[Submission POST] WARNING: Body is empty!');
    }
    
    const t1 = Date.now();
    const { Submission, Assignment, Course, AcademicEnrollment } = require('../models');
    console.log(`[Submission POST] Models loaded in ${Date.now() - t1}ms`);
    
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    if (role !== 'student') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'Only students can submit assignments' });
    }

    // Try to get data from body directly
    let { assignment_id, content, attachments } = req.body || {};
    
    // Also check if data is nested under a 'data' or 'body' key
    if (!assignment_id && req.body?.data) {
      assignment_id = req.body.data.assignment_id;
      content = req.body.data.content;
      attachments = req.body.data.attachments;
      console.log('[Submission POST] Found nested data in req.body.data');
    }
    
    console.log('[Submission POST] Extracted values:', { assignment_id, content: content?.substring?.(0, 50), attachments_count: attachments?.length });
    
    // Validate assignment_id exists and is valid format
    if (!assignment_id) {
      console.log('[Submission POST] ERROR: assignment_id is missing/undefined');
      return res.status(400).json({ success: false, error: 'assignment_id required', message: 'Please provide assignment_id' });
    }
    
    // Check if it's a valid MongoDB ID format (24 hex chars)
    if (!/^[0-9a-fA-F]{24}$/.test(assignment_id)) {
      console.log('[Submission POST] ERROR: Invalid assignment_id format:', assignment_id);
      return res.status(400).json({ success: false, error: 'Invalid assignment_id format', message: 'assignment_id must be a valid MongoDB ID' });
    }

    const t2 = Date.now();
    console.log('[Submission POST] Querying assignment with:', { _id: assignment_id, organization_id: orgId });
    
    const assignment = await Assignment.findOne({ _id: assignment_id, organization_id: orgId });
    console.log(`[Submission POST] Assignment query took ${Date.now() - t2}ms, result:`, assignment ? 'Found' : 'Not found');
    
    if (!assignment) {
      // Try to find without orgId to debug
      const assignmentAnyOrg = await Assignment.findOne({ _id: assignment_id });
      console.log('[Submission POST] Assignment without org filter:', assignmentAnyOrg ? `Found in org ${assignmentAnyOrg.organization_id}` : 'Not found anywhere');
      
      return res.status(404).json({ success: false, error: 'Assignment not found', message: 'Assignment not found' });
    }

    // Check if assignment has subject+batch, if not, just use course-based check
    let canSubmit = false;
    
    if (assignment.subjectId && assignment.batchId) {
      const t3 = Date.now();
      const enrolled = await AcademicEnrollment.findOne({
        organizationId: orgId,
        studentId: userId,
        subjectId: assignment.subjectId,
        batchId: assignment.batchId
      }).select('_id').lean();
      console.log(`[Submission POST] AcademicEnrollment query took ${Date.now() - t3}ms, enrolled:`, enrolled ? 'Yes' : 'No');
      
      if (enrolled) {
        canSubmit = true;
      } else {
        console.log('[Submission POST] Student not enrolled in subject+batch:', { userId, subjectId: assignment.subjectId, batchId: assignment.batchId });
      }
    }
    
    // Fallback: check if student is enrolled in the course
    if (!canSubmit && assignment.course_id) {
      const t4 = Date.now();
      const { Enrollment } = require('../models');
      const courseEnrolled = await Enrollment.findOne({
        student_id: userId,
        course_id: assignment.course_id
      }).select('_id').lean();
      console.log(`[Submission POST] Course Enrollment query took ${Date.now() - t4}ms, enrolled:`, courseEnrolled ? 'Yes' : 'No');
      
      if (courseEnrolled) {
        canSubmit = true;
      }
    }
    
    if (!canSubmit) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You are not enrolled in this course/assignment'
      });
    }

    // Only validate course if assignment has a course_id (optional for college subjects)
    if (assignment.course_id) {
      const t5 = Date.now();
      const course = await Course.findOne({
        _id: assignment.course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      console.log(`[Submission POST] Course validation took ${Date.now() - t5}ms, found:`, course ? 'Yes' : 'No');
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found', message: 'Course not found in your organization' });
      }
    }

    const t6 = Date.now();
    const submission = await Submission.findOneAndUpdate(
      { organization_id: orgId, assignment_id, student_id: userId, is_active: true },
      {
        $set: {
          course_id: assignment.course_id,
          content,
          attachments,
          status: 'submitted',
          submitted_at: new Date(),
          graded_by: null,
          graded_at: null,
          earned_score: null,
          comments: null
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Submission POST] Submission save took ${Date.now() - t6}ms`);

    // Populate fields after save, with conditional populate for course
    const t7 = Date.now();
    const populateFields = [
      { path: 'assignment_id', select: 'title max_score due_date' },
      { path: 'student_id', select: 'name email profile' }
    ];
    if (assignment.course_id) {
      populateFields.push({ path: 'course_id', select: 'title' });
    }
    
    await submission.populate(populateFields);
    console.log(`[Submission POST] Population took ${Date.now() - t7}ms`);
    
    const leanSubmission = submission.toObject();
    console.log(`[Submission POST] ===== SUCCESS - Total time: ${Date.now() - startTime}ms =====`);

    return res.json({ success: true, data: { submission }, message: 'Submission saved successfully' });
  } catch (error) {
    console.error(`[Submission POST] ===== ERROR after ${Date.now() - startTime}ms =====`, error);
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to save submission' });
  }
});

router.patch('/:id/grade', [
  auth,
  body('earned_score').isFloat({ min: 0 }),
  body('comments').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Please check your input', details: errors.array() });
    }

    const { Submission, Assignment, Course, Grade, Notification } = require('../models');
    const socketService = require('../services/socketService');

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'Only instructors and administrators can grade submissions' });
    }

    const submission = await Submission.findOne({ _id: req.params.id, organization_id: orgId, is_active: true });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found', message: 'Submission not found' });
    }

    const assignment = await Assignment.findOne({ _id: submission.assignment_id, organization_id: orgId });
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found', message: 'Assignment not found' });
    }

    const course = await Course.findOne({
      _id: submission.course_id,
      organization_id: orgId,
      $or: [{ is_active: true }, { isActive: true }]
    });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', message: 'Course not found in your organization' });
    }

    if (role === 'instructor' && String(course.instructor_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied', message: 'You can only grade submissions for your assigned courses' });
    }

    const { earned_score, comments } = req.body;

    submission.earned_score = earned_score;
    submission.comments = comments;
    submission.status = 'graded';
    submission.graded_by = userId;
    submission.graded_at = new Date();

    await submission.save();

    await Grade.findOneAndUpdate(
      {
        organization_id: orgId,
        course_id: submission.course_id,
        student_id: submission.student_id,
        assignment_type: 'assignment',
        assignment_title: assignment.title,
        is_active: true
      },
      {
        $set: {
          assignment_description: assignment.description,
          max_score: assignment.max_score,
          earned_score: earned_score,
          percentage: assignment.max_score > 0 ? (earned_score / assignment.max_score) * 100 : 0,
          weight: 100,
          due_date: assignment.due_date,
          submitted_date: submission.submitted_at,
          graded_date: new Date(),
          graded_by: userId,
          comments: comments
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    setImmediate(async () => {
      try {
        const notif = await Notification.create({
          organization_id: orgId,
          recipient_id: submission.student_id,
          sender_id: userId,
          type: 'general',
          title: 'Assignment Graded',
          message: `${assignment.title}`,
          data: { submission_id: submission._id, assignment_id: assignment._id, course_id: submission.course_id },
          priority: 'medium',
          action_url: '/student/grades',
          action_text: 'View'
        });
        socketService.sendNotification(notif.recipient_id, notif);
      } catch (e) {
        return;
      }
    });

    const populated = await Submission.findById(submission._id)
      .populate('assignment_id', 'title max_score due_date')
      .populate('course_id', 'title')
      .populate('student_id', 'name email profile')
      .populate('graded_by', 'name email')
      .lean();

    return res.json({ success: true, data: { submission: populated }, message: 'Submission graded successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to grade submission' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { Submission, Course } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    const submission = await Submission.findOne({ _id: req.params.id, organization_id: orgId, is_active: true });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found', message: 'Submission not found' });
    }

    if (role === 'student') {
      if (String(submission.student_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You do not have access to delete this submission' });
      }
    } else if (role === 'instructor') {
      const course = await Course.findOne({
        _id: submission.course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      if (!course || String(course.instructor_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You do not have access to delete this submission' });
      }
    } else if (role !== 'org_admin') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'You do not have access to delete this submission' });
    }

    submission.is_active = false;
    await submission.save();

    return res.json({ success: true, data: { submission_id: submission._id }, message: 'Submission deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to delete submission' });
  }
});

module.exports = router;
