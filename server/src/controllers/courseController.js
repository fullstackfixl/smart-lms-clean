const BaseController = require('../core/BaseController');
const courseService = require('../services/courseService');

class CourseController extends BaseController {
  constructor() {
    super(courseService);
  }

  createCourse = this.asyncHandler(async (req, res) => {
    const course = await this.service.createCourse(
      req.body,
      req.user._id,
      req.user.organization_id
    );
    this.sendSuccess(res, course, 'Course created successfully', 201);
  });

  getCourses = this.asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, search, category, level, sortBy, sortOrder } = req.query;
    
    const filters = {};
    if (search) filters.$text = { $search: search };
    if (category) filters.category = category;
    if (level) filters.level = level;

    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await this.service.getCourses(filters, pagination, req.user?.organization_id);
    this.sendSuccess(res, result, 'Courses retrieved successfully');
  });

  getCourseById = this.asyncHandler(async (req, res) => {
    const course = await this.service.getCourseById(req.params.id, req.user?.organization_id);
    this.sendSuccess(res, course, 'Course retrieved successfully');
  });

  updateCourse = this.asyncHandler(async (req, res) => {
    const course = await this.service.updateCourse(
      req.params.id,
      req.body,
      req.user._id,
      req.user.organization_id
    );
    this.sendSuccess(res, course, 'Course updated successfully');
  });

  deleteCourse = this.asyncHandler(async (req, res) => {
    await this.service.deleteCourse(req.params.id, req.user._id, req.user.organization_id);
    this.sendSuccess(res, null, 'Course deleted successfully');
  });

  publishCourse = this.asyncHandler(async (req, res) => {
    const course = await this.service.publishCourse(
      req.params.id,
      req.user._id,
      req.user.organization_id
    );
    this.sendSuccess(res, course, 'Course published successfully');
  });
}

module.exports = new CourseController();