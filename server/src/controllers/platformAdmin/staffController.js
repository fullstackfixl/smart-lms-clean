const staffService = require('../../services/platform/staffService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Staff Controller
 */
class StaffController extends BaseController {
  constructor() {
    super(staffService);
  }

  /**
   * POST /api/platform/staff
   */
  create = async (req, res, next) => {
    try {
      const staff = await staffService.createStaff(req.body, req.user);
      return this.sendSuccess(res, staff, 'Internal node provisioned', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/staff
   */
  list = async (req, res, next) => {
    try {
      const staff = await staffService.listStaff();
      return this.sendSuccess(res, staff, 'Internal staff registry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/platform/staff/:staffId
   */
  update = async (req, res, next) => {
    try {
      const staff = await staffService.updateStaff(req.params.staffId, req.body, req.user);
      return this.sendSuccess(res, staff, 'Staff identity updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/staff/:staffId/disable
   */
  disable = async (req, res, next) => {
    try {
      const staff = await staffService.updateStatus(req.params.staffId, 'inactive', req.user);
      return this.sendSuccess(res, staff, 'Staff node status: INACTIVE');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StaffController();
