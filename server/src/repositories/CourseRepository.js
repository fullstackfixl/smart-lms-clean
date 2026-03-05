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
    return await this.model.findOne(filter)
      .populate('subject_id')
      .populate('semester_id')
      .populate('department_id');
  }

  async findAll(filters = {}, pagination = {}, organizationId) {
    const baseFilters = { ...filters, is_deleted: false };
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const query = { ...baseFilters };
    if (organizationId) {
      query.organization_id = organizationId;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const documents = await this.model
      .find(query)
      .populate('subject_id')
      .populate('semester_id')
      .populate('department_id')
      .sort(sort)
      .limit(limit)
      .skip(offset);

    const total = await this.model.countDocuments(query);

    return {
      data: documents,
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit)
    };
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
