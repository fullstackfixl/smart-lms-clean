const reportService = require('../../services/platform/reportService');
const auditLogService = require('../../services/platform/auditLogService');
const path = require('path');

exports.getReports = async (req, res) => {
  try {
    const result = await reportService.listReports(req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'REPORT_LIST_ERROR'
    });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const report = await reportService.generateReport(req.body, req.user._id);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'report_generated',
      entityType: 'PlatformReport',
      entityId: report._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'REPORT_GENERATE_ERROR'
    });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.reportId);
    if (!report.filePath) {
      return res.status(400).json({
        success: false,
        message: 'Report file not ready',
        errorCode: 'REPORT_NOT_READY'
      });
    }
    
    const fullPath = path.join(__dirname, '../../../public', report.filePath);
    res.download(fullPath);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
      errorCode: 'REPORT_DOWNLOAD_ERROR'
    });
  }
};
