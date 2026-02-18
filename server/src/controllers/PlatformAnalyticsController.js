const AnalyticsService = require('../services/analyticsService');
const BaseController = require('../core/BaseController');

class PlatformAnalyticsController extends BaseController {
  async getOverview(req, res) {
    try {
      const stats = await AnalyticsService.getOverviewStats();
      return res.success(stats, 'Analytics retrieved successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to retrieve analytics', 500);
    }
  }
}

module.exports = new PlatformAnalyticsController();
