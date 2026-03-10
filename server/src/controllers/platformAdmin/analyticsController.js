const analyticsService = require('../../services/platform/analyticsService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Analytics Controller
 */
class AnalyticsController extends BaseController {
  constructor() {
    super(analyticsService);
  }

  /**
   * GET /api/platform/analytics/overview
   */
  getOverview = async (req, res, next) => {
    try {
      const overview = await analyticsService.getOverview();
      return this.sendSuccess(res, overview, 'Ecosystem snapshot retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/analytics/growth
   */
  getGrowth = async (req, res, next) => {
    try {
      const growth = await analyticsService.getGrowthMetrics();
      return this.sendSuccess(res, growth, 'Growth trajectories computed');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
