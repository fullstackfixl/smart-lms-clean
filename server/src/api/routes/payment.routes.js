const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const paymentController = require('../../controllers/paymentController');

const router = express.Router();

// Payment APIs
router.post('/create', authMiddleware, paymentController.createPayment);
router.post('/verify', authMiddleware, paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // Public endpoint for payment gateway
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.post('/refund', authMiddleware, paymentController.processRefund);

module.exports = router;
