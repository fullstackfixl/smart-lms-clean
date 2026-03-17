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
router.post('/platform-admin/login', authController.platformAdminLogin);
router.post('/org-admin/login', authController.orgAdminLogin);
router.post('/login', authController.login);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.post('/firebase-login', authController.firebaseLogin);

// Organization Onboarding
router.post('/apply-organization', applyOrgLimiter, authController.applyOrganization);
router.post('/complete-organization-registration', completeRegistrationLimiter, authController.completeOrganizationRegistration);

// Student/Parent Signup via Subdomain
router.post('/register', authController.registerUser);
router.post('/register/request-otp', authController.requestRegistrationOtp);
router.post('/register/verify-otp', authController.verifyRegistrationOtp);
router.post('/register/resend-otp', authController.resendRegistrationOtp);

// Password Management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Accept Invite
router.get('/accept-invite/verify', authController.verifyInviteToken);
router.post('/accept-invite', authController.acceptInvite);

// Password setup (alias using invite token)
router.post('/set-password', async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }
    const result = await require('../services/authService').acceptInvite({ token, name: name || 'User', password });
    return res.status(200).json({ success: true, data: result, message: 'Password set successfully' });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});
// Logout
router.post('/logout', authMiddleware, authController.logout);

// Refresh token
router.post('/refresh', authMiddleware, authController.refresh);

// Get current user
router.get('/me', authMiddleware, authController.me);

module.exports = router;
