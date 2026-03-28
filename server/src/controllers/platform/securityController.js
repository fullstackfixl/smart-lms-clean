const securityService = require('../../services/platform/securityService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getOverview = async (req, res) => {
  try {
    const overview = await securityService.getOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'SECURITY_OVERVIEW_ERROR'
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await auditLogService.listLogs(req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'SECURITY_AUDIT_ERROR'
    });
  }
};
