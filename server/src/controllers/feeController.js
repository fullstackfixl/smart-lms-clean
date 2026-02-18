const BaseController = require('../core/BaseController');
const feeService = require('../services/feeService');

class FeeController extends BaseController {
  constructor() {
    super(feeService);
  }

  setFees = this.asyncHandler(async (req, res) => {
    const fee = await feeService.setFees(req.body, req.user.organization_id);
    this.sendSuccess(res, fee, 'Fees set successfully', 201);
  });

  getFeeDetails = this.asyncHandler(async (req, res) => {
    const fees = await feeService.getFeeDetails(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, fees, 'Fee details retrieved successfully');
  });

  recordPayment = this.asyncHandler(async (req, res) => {
    const payment = await feeService.recordPayment(req.body.fee_id, req.body, req.user.organization_id);
    this.sendSuccess(res, payment, 'Payment recorded successfully');
  });

  getPendingFees = this.asyncHandler(async (req, res) => {
    const fees = await feeService.getPendingFees(req.user.organization_id);
    this.sendSuccess(res, fees, 'Pending fees retrieved successfully');
  });

  getPaymentHistory = this.asyncHandler(async (req, res) => {
    const history = await feeService.getPaymentHistory(req.params.student_id, req.user.organization_id);
    this.sendSuccess(res, history, 'Payment history retrieved successfully');
  });

  sendReminder = this.asyncHandler(async (req, res) => {
    const result = await feeService.sendReminder(req.body.student_id, req.user.organization_id);
    this.sendSuccess(res, result, 'Reminder sent successfully');
  });
}

module.exports = new FeeController();
