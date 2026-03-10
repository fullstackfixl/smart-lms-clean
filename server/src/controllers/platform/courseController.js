const courseService = require('../../services/platform/courseService');

exports.getCourses = async (req, res) => {
  try {
    const result = await courseService.listCourses(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'COURSE_LIST_ERROR'
    });
  }
};

exports.suspendCourse = async (req, res) => {
  try {
    const course = await courseService.suspendCourse(req.params.courseId);
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'COURSE_SUSPEND_ERROR'
    });
  }
};
