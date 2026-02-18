const { Enrollment, Course, Lesson } = require('../models');

// Middleware to check if user is enrolled in a course
const checkEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.error('Course ID required', 'Course ID is required to check enrollment', 400);
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You must be enrolled in this course to access its content', 403);
    }

    // Add enrollment to request object for use in route handlers
    req.enrollment = enrollment;
    next();

  } catch (error) {
    console.error('Enrollment check error:', error);
    res.error(error.message, 'Failed to verify enrollment', 500);
  }
};

// Middleware to check lesson access (enrollment + prerequisites)
const checkLessonAccess = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    if (!lessonId) {
      return res.error('Lesson ID required', 'Lesson ID is required to check access', 400);
    }

    // Get lesson details
    const lesson = await Lesson.findOne({
      _id: lessonId,
      isActive: true
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Check if lesson is a preview (accessible without enrollment)
    if (lesson.isPreview) {
      req.lesson = lesson;
      req.accessType = 'preview';
      return next();
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: lesson.course_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You must be enrolled in the course to access this lesson', 403);
    }

    // Check prerequisites
    if (lesson.prerequisites && lesson.prerequisites.length > 0) {
      const completedLessons = enrollment.progress.completed_lessons.map(cl => cl.lesson_id.toString());
      const unmetPrerequisites = lesson.prerequisites.filter(prereq => 
        !completedLessons.includes(prereq.toString())
      );

      if (unmetPrerequisites.length > 0) {
        return res.error('Prerequisites not met', 'Complete prerequisite lessons before accessing this lesson', 403);
      }
    }

    // Check organization isolation
    if (lesson.organization_id.toString() !== req.user.organization_id.toString()) {
      return res.error('Access denied', 'You cannot access lessons from other organizations', 403);
    }

    // Add lesson and enrollment to request object
    req.lesson = lesson;
    req.enrollment = enrollment;
    req.accessType = 'enrolled';
    next();

  } catch (error) {
    console.error('Lesson access check error:', error);
    res.error(error.message, 'Failed to verify lesson access', 500);
  }
};

// Middleware to check if user can access course content (instructor or enrolled student)
const checkCourseAccess = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.error('Course ID required', 'Course ID is required to check access', 400);
    }

    // Get course details
    const course = await Course.findOne({
      _id: courseId,
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist', 404);
    }

    // Check if user is the instructor or admin
    if (course.instructor_id.toString() === req.user._id.toString() || req.user.role === 'admin') {
      req.course = course;
      req.accessType = 'instructor';
      return next();
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.error('Access denied', 'You must be enrolled in this course or be the instructor to access its content', 403);
    }

    // Check organization isolation
    if (course.organization_id.toString() !== req.user.organization_id.toString()) {
      return res.error('Access denied', 'You cannot access courses from other organizations', 403);
    }

    req.course = course;
    req.enrollment = enrollment;
    req.accessType = 'enrolled';
    next();

  } catch (error) {
    console.error('Course access check error:', error);
    res.error(error.message, 'Failed to verify course access', 500);
  }
};

// Middleware to check organization isolation
const checkOrganizationAccess = (resourceType = 'resource') => {
  return async (req, res, next) => {
    try {
      // This middleware assumes the resource has organization_id field
      // and it's already loaded in a previous middleware or route handler
      
      const resource = req[resourceType];
      
      if (!resource) {
        return res.error('Resource not found', `${resourceType} not found`, 404);
      }

      if (resource.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.error('Access denied', `You cannot access ${resourceType}s from other organizations`, 403);
      }

      next();

    } catch (error) {
      console.error('Organization access check error:', error);
      res.error(error.message, 'Failed to verify organization access', 500);
    }
  };
};

module.exports = {
  checkEnrollment,
  checkLessonAccess,
  checkCourseAccess,
  checkOrganizationAccess
};