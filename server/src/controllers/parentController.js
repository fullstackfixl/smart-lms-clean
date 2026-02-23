const BaseController = require('../core/BaseController');
const parentService = require('../services/parentService');

class ParentController extends BaseController {
  constructor() {
    super(parentService);
  }

  getLinkedChildren = this.asyncHandler(async (req, res) => {
    const children = await parentService.getLinkedChildren(req.user._id, req.user.organization_id);
    this.sendSuccess(res, children, 'Linked children retrieved successfully');
  });

  generateCode = this.asyncHandler(async (req, res) => {
    const result = await parentService.generateVerificationCode(req.user._id, req.user.organization_id);
    this.sendSuccess(res, result, 'Verification code generated successfully');
  });

  linkChildByCode = this.asyncHandler(async (req, res) => {
    const { verificationCode } = req.body;
    const result = await parentService.linkChildByCode(req.user._id, verificationCode, req.user.organization_id);
    this.sendSuccess(res, result, 'Child linked successfully');
  });

  getChildProgress = this.asyncHandler(async (req, res) => {
    const progress = await parentService.getChildProgress(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, progress, 'Child progress retrieved successfully');
  });

  getChildAttendance = this.asyncHandler(async (req, res) => {
    const attendance = await parentService.getChildAttendance(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, attendance, 'Child attendance retrieved successfully');
  });

  getChildGrades = this.asyncHandler(async (req, res) => {
    const grades = await parentService.getChildGrades(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, grades, 'Child grades retrieved successfully');
  });

  getChildFees = this.asyncHandler(async (req, res) => {
    const fees = await parentService.getChildFees(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, fees, 'Child fees retrieved successfully');
  });
}

module.exports = new ParentController();
