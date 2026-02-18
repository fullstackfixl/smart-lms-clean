const BaseController = require('../core/BaseController');
const paymentService = require('../services/paymentService');

class PaymentController extends BaseController {
  constructor() {
    super(paymentService);
  }

  createPayment = this.asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment(req.body, req.user._id, req.user.organization_id);
    this.sendSuccess(res, payment, 'Payment order created successfully', 201);
  });

  verifyPayment = this.asyncHandler(async (req, res) => {
    const result = await paymentService.verifyPayment(req.body, req.user.organization_id);
    this.sendSuccess(res, result, 'Payment verified successfully');
  });

  handleWebhook = this.asyncHandler(async (req, res) => {
    const result = await paymentService.handleWebhook(req.body, req.headers);
    this.sendSuccess(res, result, 'Webhook processed successfully');
  });

  getPaymentHistory = this.asyncHandler(async (req, res) => {
    const history = await paymentService.getPaymentHistory(req.user._id, req.user.organization_id);
    this.sendSuccess(res, history, 'Payment history retrieved successfully');
  });

  processRefund = this.asyncHandler(async (req, res) => {
    const refund = await paymentService.processRefund(req.body, req.user.organization_id);
    this.sendSuccess(res, refund, 'Refund processed successfully');
  });
}

module.exports = new PaymentController();