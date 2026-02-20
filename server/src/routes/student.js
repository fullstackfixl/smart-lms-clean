const express = require('express');
const { Course, Section, Lesson, Enrollment, User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get published courses from student's organization
router.get('/courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      level
    } = req.query;

    // Build filter for organization-scoped published courses
    const filter = {
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    };

    // Apply additional filters
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    // Get courses
    const courses = await Course.find(filter)
      .populate('instructor_id', 'name profile')
      .select('title description thumbnail instructor_id duration rating category level price')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    // Check enrollment status for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await Enrollment.findOne({
          student_id: req.user._id,
          course_id: course._id,
          status: { $in: ['active', 'completed'] }
        });

        return {
          ...course.toObject(),
          isEnrolled: !!enrollment,
          enrollmentId: enrollment?._id,
          progress: enrollment?.progress?.completionPercentage || 0
        };
      })
    );

    res.success({
      courses: coursesWithEnrollment,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }, 'Courses retrieved successfully');

  } catch (error) {
    console.error('Get student courses error:', error);
    res.error(error.message, 'Failed to get courses', 500);
  }
});

// Get course details
router.get('/courses/:id', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify course exists, belongs to student's organization, and is published
    const course = await Course.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    })
      .populate('instructor_id', 'name profile')
      .populate('organization_id', 'name');

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available', 404);
    }

    // Get course sections with lessons
    const sections = await Section.find({
      course_id: course._id,
      isActive: true
    }).sort({ order: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({
          section_id: section._id,
          isActive: true
        }).sort({ order: 1 }).select('title description type duration order isPreview');

        return {
          ...section.toObject(),
          lessons
        };
      })
    );

    // Check enrollment status
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: course._id,
      status: { $in: ['active', 'completed'] }
    });

    // Calculate total lessons
    const totalLessons = sectionsWithLessons.reduce((sum, section) => sum + section.lessons.length, 0);

    res.success({
      course: {
        ...course.toObject(),
        totalLessons
      },
      sections: sectionsWithLessons,
      isEnrolled: !!enrollment,
      progress: enrollment?.progress || null
    }, 'Course details retrieved successfully');

  } catch (error) {
    console.error('Get course details error:', error);
    res.error(error.message, 'Failed to get course details', 500);
  }
});

// Enroll in a course
router.post('/enroll/:courseId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists, belongs to student's organization, and is published
    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Get total lessons count
    const sections = await Section.find({ course_id: courseId, isActive: true });
    let totalLessons = 0;
    for (const section of sections) {
      const lessonCount = await Lesson.countDocuments({ section_id: section._id, isActive: true });
      totalLessons += lessonCount;
    }

    // Create enrollment
    const enrollment = new Enrollment({
      organization_id: req.user.organization_id,
      student_id: req.user._id,
      course_id: courseId,
      enrollmentType: course.price > 0 ? 'paid' : 'free',
      status: 'active',
      progress: {
        completedLessons: [],
        totalLessons: totalLessons,
        completionPercentage: 0,
        totalTimeSpent: 0
      },
      enrolledAt: new Date()
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
      $addToSet: { students: req.user._id }
    });

    res.success({
      enrollment: {
        _id: enrollment._id,
        course_id: courseId,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress
      }
    }, 'Enrollment successful');

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

// Get student's enrollments
router.get('/enrollments', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const filter = {
      student_id: req.user._id,
      organization_id: req.user.organization_id
    };

    if (status !== 'all') {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course_id',
        select: 'title description thumbnail instructor_id duration rating',
        populate: {
          path: 'instructor_id',
          select: 'name'
        }
      })
      .sort({ enrolledAt: -1 });

    const enrollmentsData = enrollments.map(enrollment => ({
      _id: enrollment._id,
      course: enrollment.course_id,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }));

    res.success({
      enrollments: enrollmentsData
    }, 'Enrollments retrieved successfully');

  } catch (error) {
    console.error('Get enrollments error:', error);
    res.error(error.message, 'Failed to get enrollments', 500);
  }
});

// Mark lecture as complete and update progress
router.patch('/progress/lecture/:lectureId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { timeSpent = 0 } = req.body;

    // Find the lesson and its course
    const lesson = await Lesson.findById(lectureId);
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    const section = await Section.findById(lesson.section_id);
    if (!section) {
      return res.error('Section not found', 'Section does not exist', 404);
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: section.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.progress.completedLessons.some(
      cl => cl.lessonId.toString() === lectureId
    );

    if (!alreadyCompleted) {
      // Add lesson to completed lessons
      enrollment.progress.completedLessons.push({
        lessonId: lectureId,
        completedAt: new Date(),
        timeSpent: timeSpent
      });
    }

    // Update total time spent
    enrollment.progress.totalTimeSpent = (enrollment.progress.totalTimeSpent || 0) + timeSpent;

    // Update last accessed lesson
    enrollment.progress.lastAccessedLesson = lectureId;

    // Calculate progress percentage
    const totalLessons = enrollment.progress.totalLessons || 1;
    const completedCount = enrollment.progress.completedLessons.length;
    enrollment.progress.completionPercentage = Math.round((completedCount / totalLessons) * 100);

    // Check if course is completed
    if (enrollment.progress.completionPercentage >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    // Update last accessed timestamp
    enrollment.lastAccessedAt = new Date();

    await enrollment.save();

    res.success({
      progress: enrollment.progress,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }, 'Progress updated successfully');

  } catch (error) {
    console.error('Update progress error:', error);
    res.error(error.message, 'Failed to update progress', 500);
  }
});

module.exports = router;
