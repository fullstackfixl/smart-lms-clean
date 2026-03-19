const express = require('express');
const platformApplicationController = require('../../controllers/PlatformApplicationController');
const { requirePlatformAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', platformApplicationController.getApplications.bind(platformApplicationController));
router.post('/:id/claim', platformApplicationController.claimApplication.bind(platformApplicationController));
router.patch('/:id/contact', platformApplicationController.contactApplication.bind(platformApplicationController));
// Support PATCH (preferred) + PUT (legacy)
router.patch('/:id/approve', requirePlatformAdmin, platformApplicationController.approveApplication.bind(platformApplicationController));
router.patch('/:id/reject', requirePlatformAdmin, platformApplicationController.rejectApplication.bind(platformApplicationController));
router.put('/:id/approve', requirePlatformAdmin, platformApplicationController.approveApplication.bind(platformApplicationController));
router.put('/:id/reject', requirePlatformAdmin, platformApplicationController.rejectApplication.bind(platformApplicationController));

module.exports = router;
