const reportService = require('../../services/platform/reportService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Report Controller
 */
class ReportController extends BaseController {
  constructor() {
    super(reportService);
  }

  /**
   * POST /api/platform/reports/generate
   */
  generate = async (req, res, next) => {
    try {
      const { type, filters } = req.body;
      const reportMetadata = await reportService.generateReport(type, filters);
      return this.sendSuccess(res, reportMetadata, 'Report generation protocol initialized');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/reports/:reportId/download
   */
  download = async (req, res, next) => {
    try {
      const csv = await reportService.exportCSV(req.params.reportId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.csv`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
