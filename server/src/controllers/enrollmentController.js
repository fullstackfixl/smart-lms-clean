const BaseController = require('../core/BaseController');
const enrollmentService = require('../services/enrollmentService');

class EnrollmentController extends BaseController {
  constructor() {
    super(enrollmentService);
  }

  enrollInCourse = this.asyncHandler(async (req, res) => {
    const { course_id } = req.body;
    const enrollment = await this.service.enrollInCourse(
      course_id,
      req.user._id,
      req.user.organization_id
    );
    this.sendSuccess(res, enrollment, 'Enrolled successfully', 201);
  });

  getStudentEnrollments = this.asyncHandler(async (req, res) => {
    const enrollments = await this.service.getStudentEnrollments(
      req.user._id,
      req.user.organization_id
    );
    this.sendSuccess(res, enrollments, 'Enrollments retrieved successfully');
  });

  getCourseStudents = this.asyncHandler(async (req, res) => {
    const students = await this.service.getCourseStudents(
      req.params.id,
      req.user.organization_id
    );
    this.sendSuccess(res, students, 'Students retrieved successfully');
  });

  unenroll = this.asyncHandler(async (req, res) => {
    await this.service.unenroll(req.params.id, req.user._id, req.user.organization_id);
    this.sendSuccess(res, null, 'Unenrolled successfully');
  });
}

module.exports = new EnrollmentController();
