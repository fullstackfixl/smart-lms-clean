const { User, AuditLog } = require('../../models');
const BaseController = require('../../core/BaseController');

/**
 * Platform User Monitoring Controller
 */
class UserController extends BaseController {
  /**
   * GET /api/platform/users
   */
  list = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, role, organization } = req.query;
      const query = { is_deleted: { $ne: true } };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) query.role = role;
      if (organization) query.organization_id = organization;

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('organization_id', 'name')
        .select('-password_hash')
        .lean();

      return this.sendSuccess(res, { users, total }, 'Platform user registry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/users/:userId
   */
  getDetails = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId)
        .populate('organization_id', 'name subdomain status')
        .select('-password_hash')
        .lean();

      if (!user) return this.sendError(res, 'User identity not found', 404);

      return this.sendSuccess(res, user, 'User telemetry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/users/:userId/suspend
   */
  suspend = async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { status: 'suspended', updated_at: new Date() },
        { new: true }
      );

      if (!user) return this.sendError(res, 'User identity not found', 404);

      await AuditLog.create({
        user_id: req.user._id,
        user_email: req.user.email,
        user_role: req.user.role,
        action: 'SUSPEND',
        resource: 'user',
        resource_id: req.params.userId
      });

      return this.sendSuccess(res, user, 'User node status: SUSPENDED');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
