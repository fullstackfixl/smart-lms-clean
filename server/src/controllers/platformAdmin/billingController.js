const billingService = require('../../services/platform/billingService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Billing Controller
 */
class BillingController extends BaseController {
  constructor() {
    super(billingService);
  }

  /**
   * GET /api/platform/billing
   */
  getBillingStats = async (req, res, next) => {
    try {
      const stats = await billingService.getStats();
      return this.sendSuccess(res, stats, 'Financial telemetry synchronized');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillingController();
