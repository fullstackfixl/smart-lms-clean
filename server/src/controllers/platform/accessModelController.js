const accessModelService = require('../../services/platform/accessModelService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getAccessModel = async (req, res) => {
  try {
    const data = await accessModelService.getAccessModel();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ACCESS_MODEL_FETCH_ERROR'
    });
  }
};

exports.updateFeatureToggles = async (req, res) => {
  try {
    const data = await accessModelService.updateFeatureToggles(req.body, req.user?._id);

    await auditLogService.logAction({
      actorId: req.user?._id,
      actorRole: req.user?.role,
      action: 'platform_feature_toggles_updated',
      entityType: 'SystemConfig',
      entityId: data.configId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'ACCESS_MODEL_UPDATE_ERROR'
    });
  }
};
