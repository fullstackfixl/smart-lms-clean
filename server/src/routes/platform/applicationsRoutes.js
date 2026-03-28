const express = require('express');
const platformApplicationController = require('../../controllers/PlatformApplicationController');
const { requirePlatformAdmin, requirePlatformStaff } = require('../../middleware/auth');

const router = express.Router();

router.use(requirePlatformStaff);

router.get('/', platformApplicationController.getApplications.bind(platformApplicationController));
router.get('/:id', platformApplicationController.getApplication.bind(platformApplicationController));
router.post('/:id/claim', platformApplicationController.claimApplication.bind(platformApplicationController));
router.patch('/:id/contact', platformApplicationController.contactApplication.bind(platformApplicationController));
router.patch('/:id/note', platformApplicationController.addNote.bind(platformApplicationController));
router.patch('/:id/status', platformApplicationController.updateStatus.bind(platformApplicationController));
router.patch('/:id/priority', platformApplicationController.updatePriority.bind(platformApplicationController));
router.patch('/:id/follow-up', platformApplicationController.setFollowUp.bind(platformApplicationController));
// Support PATCH (preferred) + PUT (legacy)
router.patch('/:id/approve', requirePlatformAdmin, platformApplicationController.approveApplication.bind(platformApplicationController));
router.patch('/:id/reject', requirePlatformAdmin, platformApplicationController.rejectApplication.bind(platformApplicationController));
router.put('/:id/approve', requirePlatformAdmin, platformApplicationController.approveApplication.bind(platformApplicationController));
router.put('/:id/reject', requirePlatformAdmin, platformApplicationController.rejectApplication.bind(platformApplicationController));

module.exports = router;
