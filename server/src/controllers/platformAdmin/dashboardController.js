const dashboardService = require('../../services/platform/dashboardService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Dashboard Controller
 */
class DashboardController extends BaseController {
  constructor() {
    super(dashboardService);
  }

  /**
   * GET /api/platform/dashboard
   */
  getDashboardSync = async (req, res, next) => {
    try {
      const stats = await dashboardService.getStats();
      const activity = await dashboardService.getRecentActivity();

      return this.sendSuccess(res, {
        ...stats,
        ...activity
      }, 'Intelligence delta synchronized');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
