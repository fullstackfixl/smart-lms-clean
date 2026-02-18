const BaseRepository = require('../core/BaseRepository');
const Course = require('../models/Course');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findById(id, organizationId) {
    const filter = { _id: id, is_deleted: false };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.findOne(filter);
  }

  async findAll(filters = {}, pagination = {}, organizationId) {
    const baseFilters = { ...filters, is_deleted: false };
    return super.findAll(baseFilters, pagination, organizationId);
  }

  async findByInstructor(instructorId, organizationId) {
    const filter = { instructor_id: instructorId, is_deleted: false };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.find(filter);
  }

  async findPublished(filters = {}, pagination = {}, organizationId) {
    const query = { ...filters, status: 'published', is_deleted: false };
    return await this.findAll(query, pagination, organizationId);
  }

  async updateStatus(courseId, status, organizationId) {
    return await this.update(courseId, { status }, organizationId);
  }

  async delete(id, organizationId) {
    const filter = { _id: id };
    if (organizationId) {
      filter.organization_id = organizationId;
    }

    return await this.model.findOneAndUpdate(
      filter,
      { $set: { is_deleted: true, isActive: false, status: 'archived' } },
      { new: true }
    );
  }
}

module.exports = new CourseRepository();
