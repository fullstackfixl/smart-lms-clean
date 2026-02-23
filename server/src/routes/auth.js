const express = require('express');
const authController = require('../controllers/AuthController');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Rate limiters
const applyOrgLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const completeRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// Unified Login
router.post('/login', authController.login);

// Organization Onboarding
router.post('/apply-organization', applyOrgLimiter, authController.applyOrganization);
router.post('/complete-organization-registration', completeRegistrationLimiter, authController.completeOrganizationRegistration);

// Student/Parent Signup via Subdomain
router.post('/register', authController.registerUser);
router.post('/register/request-otp', authController.requestRegistrationOtp);
router.post('/register/verify-otp', authController.verifyRegistrationOtp);
router.post('/register/resend-otp', authController.resendRegistrationOtp);

// Accept Invite
router.post('/accept-invite', authController.acceptInvite);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Refresh token
router.post('/refresh', authMiddleware, authController.refresh);

// Get current user
router.get('/me', authMiddleware, authController.me);

module.exports = router;
