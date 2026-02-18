const BaseController = require('../core/BaseController');
const progressService = require('../services/progressService');

class ProgressController extends BaseController {
  constructor() {
    super(progressService);
  }

  updateProgress = this.asyncHandler(async (req, res) => {
    const progress = await progressService.updateProgress(req.body.course_id, req.body.lesson_id, req.user._id, req.user.organization_id);
    this.sendSuccess(res, progress, 'Progress updated successfully');
  });

  getCourseProgress = this.asyncHandler(async (req, res) => {
    const progress = await progressService.getCourseProgress(req.params.course_id, req.user._id, req.user.organization_id);
    this.sendSuccess(res, progress, 'Progress retrieved successfully');
  });

  getCertificates = this.asyncHandler(async (req, res) => {
    const certificates = await progressService.getUserCertificates(req.user._id, req.user.organization_id);
    this.sendSuccess(res, certificates, 'Certificates retrieved successfully');
  });

  getCertificateById = this.asyncHandler(async (req, res) => {
    const certificate = await progressService.getCertificateById(req.params.id, req.user.organization_id);
    this.sendSuccess(res, certificate, 'Certificate retrieved successfully');
  });

  downloadCertificate = this.asyncHandler(async (req, res) => {
    const pdfUrl = await progressService.downloadCertificate(req.params.id, req.user.organization_id);
    this.sendSuccess(res, { url: pdfUrl }, 'Certificate download link generated');
  });

  verifyCertificate = this.asyncHandler(async (req, res) => {
    const certificate = await progressService.verifyCertificate(req.params.unique_id);
    this.sendSuccess(res, certificate, 'Certificate verified successfully');
  });
}

module.exports = new ProgressController();
