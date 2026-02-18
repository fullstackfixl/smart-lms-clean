const express = require('express');
const { verifyWebhookSignature: verifyRazorpaySignature } = require('../config/razorpay');
const { verifyWebhookSignature: verifyStripeSignature } = require('../config/stripe');

// Raw body parser for webhooks
const rawBodyParser = express.raw({ type: 'application/json' });

// Razorpay webhook verification
const verifyRazorpayWebhook = (req, res, next) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    
    if (!signature) {
      return res.error('Missing signature', 'Webhook signature required', 400);
    }

    const body = JSON.stringify(req.body);
    const isValid = verifyRazorpaySignature(body, signature);

    if (!isValid) {
      return res.error('Invalid signature', 'Webhook signature verification failed', 400);
    }

    next();
  } catch (error) {
    console.error('Razorpay webhook verification error:', error);
    res.error(error.message, 'Webhook verification failed', 400);
  }
};

// Stripe webhook verification
const verifyStripeWebhook = (req, res, next) => {
  try {
    const signature = req.get('stripe-signature');
    
    if (!signature) {
      return res.error('Missing signature', 'Webhook signature required', 400);
    }

    const event = verifyStripeSignature(req.body, signature);
    req.stripeEvent = event;

    next();
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    res.error(error.message, 'Webhook verification failed', 400);
  }
};

// Organization isolation middleware for webhooks
const validateWebhookOrganization = async (req, res, next) => {
  try {
    // Extract organization_id from webhook payload
    let organizationId;

    if (req.body.payload && req.body.payload.payment) {
      // Razorpay webhook
      organizationId = req.body.payload.payment.entity.notes?.organization_id;
    } else if (req.stripeEvent && req.stripeEvent.data.object.metadata) {
      // Stripe webhook
      organizationId = req.stripeEvent.data.object.metadata.organization_id;
    }

    if (!organizationId) {
      return res.error('Missing organization ID', 'Organization context required', 400);
    }

    req.organizationId = organizationId;
    next();
  } catch (error) {
    console.error('Webhook organization validation error:', error);
    res.error(error.message, 'Organization validation failed', 400);
  }
};

module.exports = {
  rawBodyParser,
  verifyRazorpayWebhook,
  verifyStripeWebhook,
  validateWebhookOrganization
};