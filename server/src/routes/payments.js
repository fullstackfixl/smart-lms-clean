const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { rawBodyParser, verifyRazorpayWebhook, verifyStripeWebhook, validateWebhookOrganization } = require('../middleware/webhooks');
const { createOrder, verifyPaymentSignature, getPayment } = require('../config/razorpay');
const { createPaymentIntent, createCustomer, getPaymentIntent } = require('../config/stripe');
const { Organization, User } = require('../models');
const notificationService = require('../utils/notificationService');

const router = express.Router();

// Razorpay: Create order
router.post('/razorpay/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.error('Invalid amount', 'Amount must be greater than 0', 400);
    }

    const order = await createOrder(amount, currency, receipt, {
      organization_id: req.user.organization_id.toString(),
      user_id: req.user._id.toString()
    });

    res.success({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    }, 'Razorpay order created successfully');

  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.error(error.message, 'Failed to create Razorpay order', 500);
  }
});

// Razorpay: Verify payment
router.post('/razorpay/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.error('Missing parameters', 'Order ID, payment ID, and signature are required', 400);
    }

    const isValid = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.error('Invalid signature', 'Payment verification failed', 400);
    }

    // Get payment details
    const payment = await getPayment(paymentId);

    // Verify organization context
    if (payment.notes.organization_id !== req.user.organization_id.toString()) {
      return res.error('Organization mismatch', 'Payment does not belong to your organization', 403);
    }

    // Send payment success notification
    try {
      await notificationService.sendPaymentSuccessNotification({
        studentId: req.user._id,
        courseId: payment.notes.course_id, // Assuming course_id is in notes
        amount: payment.amount / 100,
        currency: payment.currency,
        paymentId: payment.id,
        organizationId: req.user.organization_id,
        organizationName: 'Smart LMS' // This should come from organization data
      });
    } catch (notificationError) {
      console.error('Failed to send payment success notification:', notificationError);
      // Don't fail the payment verification if notification fails
    }

    res.success({
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount / 100,
      status: payment.status,
      method: payment.method
    }, 'Payment verified successfully');

  } catch (error) {
    console.error('Razorpay verify payment error:', error);
    res.error(error.message, 'Payment verification failed', 500);
  }
});

// Stripe: Create payment intent
router.post('/stripe/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.error('Invalid amount', 'Amount must be greater than 0', 400);
    }

    const paymentIntent = await createPaymentIntent(amount, currency, {
      organization_id: req.user.organization_id.toString(),
      user_id: req.user._id.toString()
    });

    res.success({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    }, 'Stripe payment intent created successfully');

  } catch (error) {
    console.error('Stripe create payment intent error:', error);
    res.error(error.message, 'Failed to create Stripe payment intent', 500);
  }
});

// Stripe: Verify payment
router.post('/stripe/verify', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.error('Missing payment intent ID', 'Payment intent ID is required', 400);
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId);

    // Verify organization context
    if (paymentIntent.metadata.organization_id !== req.user.organization_id.toString()) {
      return res.error('Organization mismatch', 'Payment does not belong to your organization', 403);
    }

    res.success({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method
    }, 'Payment verified successfully');

  } catch (error) {
    console.error('Stripe verify payment error:', error);
    res.error(error.message, 'Payment verification failed', 500);
  }
});

// Razorpay webhook
router.post('/webhooks/razorpay', rawBodyParser, verifyRazorpayWebhook, validateWebhookOrganization, async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log('Razorpay webhook received:', event);

    switch (event) {
      case 'payment.captured':
        // Handle successful payment
        const payment = payload.payment.entity;
        console.log('Payment captured:', payment.id);
        
        // For course enrollments, the verification is handled in the enrollment route
        // This webhook can be used for additional processing like notifications
        
        break;

      case 'payment.failed':
        // Handle failed payment
        const failedPayment = payload.payment.entity;
        console.log('Payment failed:', failedPayment.id);
        
        // Clean up any pending enrollment records if needed
        // Send failure notification to user
        
        break;

      case 'order.paid':
        // Handle order completion
        const order = payload.order.entity;
        console.log('Order paid:', order.id);
        break;

      default:
        console.log('Unhandled Razorpay event:', event);
    }

    res.success(null, 'Webhook processed successfully');

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.error(error.message, 'Webhook processing failed', 500);
  }
});

// Stripe webhook
router.post('/webhooks/stripe', rawBodyParser, verifyStripeWebhook, validateWebhookOrganization, async (req, res) => {
  try {
    const event = req.stripeEvent;

    console.log('Stripe webhook received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update organization subscription or handle payment success
        // Add your business logic here
        
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        const failedPaymentIntent = event.data.object;
        console.log('Payment failed:', failedPaymentIntent.id);
        
        // Add your business logic here
        
        break;

      case 'invoice.payment_succeeded':
        // Handle subscription payment success
        const invoice = event.data.object;
        console.log('Subscription payment succeeded:', invoice.id);
        
        // Add your business logic here
        
        break;

      default:
        console.log('Unhandled Stripe event:', event.type);
    }

    res.success(null, 'Webhook processed successfully');

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.error(error.message, 'Webhook processing failed', 500);
  }
});

module.exports = router;