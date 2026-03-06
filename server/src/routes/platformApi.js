const express = require('express');
const platformOrganizationController = require('../controllers/PlatformOrganizationController');
const platformInviteController = require('../controllers/PlatformInviteController');
const { authMiddleware, requirePlatformAdmin, requirePlatformAccess } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔌 [Platform API Router] ${req.method} ${req.path}`);
    next();
});

// --- Public Invitation Routes (No Admin Required) ---
router.get('/org-invite/verify', platformInviteController.verifyToken.bind(platformInviteController));
router.post('/org-invite/complete', platformInviteController.completeSetup.bind(platformInviteController));

// --- Protected Platform Routes (admin + staff) ---
router.use(authMiddleware, requirePlatformAccess, activityLogger);

router.post('/organizations/create', platformOrganizationController.createOrganizationWithInvite.bind(platformOrganizationController));

module.exports = router;
