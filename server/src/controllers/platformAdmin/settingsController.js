const settingsService = require('../../services/platform/settingsService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Settings Controller
 */
class SettingsController extends BaseController {
  constructor() {
    super(settingsService);
  }

  /**
   * GET /api/platform/settings
   */
  get = async (req, res, next) => {
    try {
      const settings = await settingsService.getSettings();
      return this.sendSuccess(res, settings, 'Global configuration retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/platform/settings
   */
  update = async (req, res, next) => {
    try {
      const settings = await settingsService.updateSettings(req.body, req.user);
      return this.sendSuccess(res, settings, 'Global configuration updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
