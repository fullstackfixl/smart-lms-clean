const express = require('express');
const router = express.Router();
const mfaService = require('../services/mfaService');
const { authMiddleware } = require('../middleware/auth');

/**
 * MFA Routes
 * All routes require authentication
 */

// Generate MFA secret and QR code
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const result = await mfaService.generateMFASecret(
      req.user._id,
      req.user.email
    );

    res.success(result, 'MFA setup initiated. Scan QR code with your authenticator app.');
  } catch (error) {
    res.error(error.message, 'MFA setup failed', 500);
  }
});

// Verify MFA token and enable MFA
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.error('Token is required', 'Validation failed', 400);
    }

    await mfaService.verifyAndEnableMFA(req.user._id, token);

    res.success(null, 'MFA enabled successfully');
  } catch (error) {
    res.error(error.message, 'MFA verification failed', 400);
  }
});

// Verify MFA token during login (called from auth service)
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.error('Token is required', 'Validation failed', 400);
    }

    const isValid = await mfaService.verifyMFAToken(req.user._id, token);

    res.success({ valid: isValid }, 'MFA token validated');
  } catch (error) {
    res.error(error.message, 'MFA validation failed', 400);
  }
});

// Disable MFA
router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.error('Password is required', 'Validation failed', 400);
    }

    await mfaService.disableMFA(req.user._id, password);

    res.success(null, 'MFA disabled successfully');
  } catch (error) {
    res.error(error.message, 'MFA disable failed', 400);
  }
});

// Regenerate backup codes
router.post('/backup-codes/regenerate', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.error('Password is required', 'Validation failed', 400);
    }

    const backupCodes = await mfaService.regenerateBackupCodes(req.user._id, password);

    res.success(
      { backupCodes },
      'Backup codes regenerated. Save these codes securely.'
    );
  } catch (error) {
    res.error(error.message, 'Backup code regeneration failed', 400);
  }
});

// Check MFA status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const isEnabled = await mfaService.isMFAEnabled(req.user._id);

    res.success({
      mfaEnabled: isEnabled,
      email: req.user.email
    });
  } catch (error) {
    res.error(error.message, 'Failed to check MFA status', 500);
  }
});

module.exports = router;
