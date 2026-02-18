const BaseService = require('../core/BaseService');
const CourseRepository = require('../repositories/CourseRepository');
const { NotFoundError, AuthorizationError } = require('../core/errors');

class CourseService extends BaseService {
  constructor() {
    super(CourseRepository);
  }

  async createCourse(courseData, userId, organizationId) {
    courseData.instructor_id = userId;
    courseData.organization_id = organizationId;
    courseData.status = 'draft';
    
    return await this.repository.create(courseData, organizationId);
  }

  async getCourses(filters = {}, pagination = {}, organizationId) {
    return await this.repository.findAll(filters, pagination, organizationId);
  }

  async getCourseById(courseId, organizationId) {
    const course = await this.repository.findById(courseId, organizationId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course;
  }

  async updateCourse(courseId, updates, userId, organizationId) {
    const course = await this.getCourseById(courseId, organizationId);
    
    if (course.instructor_id.toString() !== userId.toString()) {
      throw new AuthorizationError('You do not have permission to update this course');
    }

    delete updates.organization_id;
    delete updates.instructor_id;

    return await this.repository.update(courseId, updates, organizationId);
  }

  async deleteCourse(courseId, userId, organizationId) {
    const course = await this.getCourseById(courseId, organizationId);
    
    if (course.instructor_id.toString() !== userId.toString()) {
      throw new AuthorizationError('You do not have permission to delete this course');
    }

    return await this.repository.delete(courseId, organizationId);
  }

  async publishCourse(courseId, userId, organizationId) {
    return await this.repository.updateStatus(courseId, 'published', organizationId);
  }

  async getPublishedCourses(filters = {}, pagination = {}, organizationId) {
    return await this.repository.findPublished(filters, pagination, organizationId);
  }
}

module.exports = new CourseService();
