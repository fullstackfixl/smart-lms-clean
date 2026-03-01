const express = require('express');
const marketplaceController = require('../controllers/MarketplaceController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const { verifyStripeWebhook, validateWebhookOrganization } = require('../middleware/webhooks');

// Public Routes
router.get('/courses', marketplaceController.listCourses.bind(marketplaceController));
router.get('/courses/:id', marketplaceController.getCourseDetails.bind(marketplaceController));

// Protected Marketplace Routes (Checkout)
router.post('/create-checkout-session', authMiddleware, marketplaceController.createCheckoutSession.bind(marketplaceController));

// Webhook for Stripe (Auto-enrollment)
// Note: We use global webhook middleware for consistency
router.post('/webhook', verifyStripeWebhook, marketplaceController.handleWebhook.bind(marketplaceController));

module.exports = router;
