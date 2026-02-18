const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');

/**
 * Middleware to check if student has access to a lecture
 * 
 * ACCESS RULES:
 * - User must have role "student"
 * - User must belong to same organization as the course
 * - User must have active enrollment in the course
 */
const checkStudentLectureAccess = async (req, res, next) => {
  try {
    const { lectureId } = req.params;
    const user = req.user;

    // 1. Validate JWT (already done by authMiddleware)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // 2. Ensure role === "student"
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only students can access lectures'
      });
    }

    // 3. Fetch lecture
    const lecture = await Lesson.findById(lectureId)
      .select('course_id organization_id title type isPreview')
      .lean();

    if (!lecture) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Lecture not found'
      });
    }

    // 4. Check if lecture is preview (accessible without enrollment)
    if (lecture.isPreview) {
      req.lecture = lecture;
      req.isPreview = true;
      return next();
    }

    // 5. Fetch course to check organization
    const course = await Course.findById(lecture.course_id)
      .select('organization_id title')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Course not found'
      });
    }

    // 6. Check organization match
    if (course.organization_id.toString() !== user.organization_id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access to this organization\'s content'
      });
    }

    // 7. Check enrollment exists with status "active"
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: lecture.course_id,
      status: 'active'
    }).lean();

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You must be enrolled in this course to access this lecture',
        requiresEnrollment: true,
        courseId: lecture.course_id
      });
    }

    // 8. Attach lecture, course, and enrollment to request
    req.lecture = lecture;
    req.course = course;
    req.enrollment = enrollment;
    req.isPreview = false;

    next();
  } catch (error) {
    console.error('Check student lecture access error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to verify lecture access'
    });
  }
};

module.exports = checkStudentLectureAccess;
