const AnalyticsService = require('../services/analyticsService');
const BaseController = require('../core/BaseController');

class PlatformAnalyticsController extends BaseController {
  async getDashboardStats(req, res) {
    try {
      console.log('📊 [PlatformAnalyticsController] getDashboardStats called');
      console.log('📊 [PlatformAnalyticsController] User:', req.user?.email);
      
      const stats = await AnalyticsService.getOverviewStats();
      
      console.log('📊 [PlatformAnalyticsController] Stats retrieved successfully:', JSON.stringify(stats, null, 2));
      
      return res.success(stats, 'Platform dashboard statistics retrieved successfully');
    } catch (error) {
      console.error('❌ [PlatformAnalyticsController] Error retrieving stats:', error);
      console.error('❌ [PlatformAnalyticsController] Error stack:', error.stack);
      return res.error(error.message, 'Failed to retrieve platform statistics', 500);
    }
  }
}

module.exports = new PlatformAnalyticsController();
