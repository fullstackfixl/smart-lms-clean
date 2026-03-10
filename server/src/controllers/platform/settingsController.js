const settingsService = require('../../services/platform/settingsService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'SETTINGS_FETCH_ERROR'
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await settingsService.updateSettings(req.body, req.user._id);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'settings_updated',
      entityType: 'SystemConfig',
      entityId: settings._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'SETTINGS_UPDATE_ERROR'
    });
  }
};
