const BaseRepository = require('../core/BaseRepository');
const Enrollment = require('../models/Enrollment');

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  async findByStudent(studentId, organizationId) {
    const filter = { student_id: studentId };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.find(filter).populate('course_id');
  }

  async findByCourse(courseId, organizationId) {
    const filter = { course_id: courseId };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.find(filter).populate('student_id');
  }
}

module.exports = new EnrollmentRepository();
