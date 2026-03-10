const auditLogService = require('../../services/platform/auditLogService');

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await auditLogService.listLogs(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'AUDIT_LOG_LIST_ERROR'
    });
  }
};
