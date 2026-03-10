const { Course, Enrollment, AuditLog } = require('../../models');
const BaseController = require('../../core/BaseController');

/**
 * Platform Course Monitoring Controller
 */
class CourseController extends BaseController {
  /**
   * GET /api/platform/courses
   */
  list = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, organization, status } = req.query;
      const query = { is_deleted: { $ne: true } };

      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      if (organization) query.organization_id = organization;
      if (status) query.status = status;

      const total = await Course.countDocuments(query);
      const courses = await Course.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('organization_id', 'name')
        .populate('instructor_id', 'name email')
        .lean();

      // Hydrate with enrollment counts
      const hydratedCourses = await Promise.all(courses.map(async (c) => {
        const count = await Enrollment.countDocuments({ course_id: c._id, is_deleted: { $ne: true } });
        return { ...c, enrollmentCount: count };
      }));

      return this.sendSuccess(res, { courses: hydratedCourses, total }, 'Platform product registry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/courses/:courseId/suspend
   */
  suspend = async (req, res, next) => {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.courseId,
        { status: 'draft', updated_at: new Date() }, // Suspend usually means taking it offline
        { new: true }
      );

      if (!course) return this.sendError(res, 'Course resource not found', 404);

      await AuditLog.create({
        user_id: req.user._id,
        user_email: req.user.email,
        user_role: req.user.role,
        action: 'SUSPEND',
        resource: 'course',
        resource_id: req.params.courseId
      });

      return this.sendSuccess(res, course, 'Course resource status: SUSPENDED');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/courses/:courseId/activate
   */
  activate = async (req, res, next) => {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.courseId,
        { status: 'published', updated_at: new Date() },
        { new: true }
      );

      if (!course) return this.sendError(res, 'Course resource not found', 404);

      await AuditLog.create({
        user_id: req.user._id,
        user_email: req.user.email,
        user_role: req.user.role,
        action: 'ACTIVATE',
        resource: 'course',
        resource_id: req.params.courseId
      });

      return this.sendSuccess(res, course, 'Course resource status: ACTIVE');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CourseController();
