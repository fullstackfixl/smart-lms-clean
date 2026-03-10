const express = require('express');
const platformInviteController = require('../../controllers/PlatformInviteController');
const router = express.Router();

/**
 * Public Invitation Routes
 * Used by invited admins to verify tokens and complete setup.
 */
router.get('/verify', platformInviteController.verifyToken.bind(platformInviteController));
router.post('/complete', platformInviteController.completeSetup.bind(platformInviteController));

module.exports = router;
