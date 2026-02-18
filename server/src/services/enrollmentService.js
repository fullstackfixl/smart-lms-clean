const BaseService = require('../core/BaseService');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const CourseRepository = require('../repositories/CourseRepository');
const { NotFoundError, ConflictError } = require('../core/errors');

class EnrollmentService extends BaseService {
  constructor() {
    super(EnrollmentRepository);
  }

  async enrollInCourse(courseId, userId, organizationId) {
    const course = await CourseRepository.findById(courseId, organizationId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const existing = await this.repository.findAll(
      { course_id: courseId, student_id: userId },
      {},
      organizationId
    );

    if (existing.data.length > 0) {
      throw new ConflictError('Already enrolled in this course');
    }

    return await this.repository.create({
      course_id: courseId,
      student_id: userId,
      status: 'active',
      enrolledAt: new Date()
    }, organizationId);
  }

  async getStudentEnrollments(userId, organizationId) {
    return await this.repository.findByStudent(userId, organizationId);
  }

  async getCourseStudents(courseId, organizationId) {
    return await this.repository.findByCourse(courseId, organizationId);
  }

  async unenroll(enrollmentId, userId, organizationId) {
    const enrollment = await this.repository.findById(enrollmentId, organizationId);
    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    return await this.repository.delete(enrollmentId, organizationId);
  }
}

module.exports = new EnrollmentService();
