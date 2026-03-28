const express = require('express');
const staffController = require('../../controllers/platform/staffController');
const { createStaffValidator, updateStaffValidator } = require('../../validators/platform/staffValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

// Only Platform Admin can manage staff
router.use(requirePlatformAdmin);

router.get('/', staffController.getStaffList);
router.post('/', createStaffValidator, staffController.createStaff);
router.post('/invite', staffController.inviteStaff);
router.get('/logs', staffController.getActivityLogs);
router.put('/:staffId', updateStaffValidator, staffController.updateStaff);
router.patch('/:staffId/disable', staffController.disableStaff);
router.patch('/:staffId/enable', staffController.enableStaff);
router.patch('/:staffId/deactivate', staffController.deactivateStaff);

module.exports = router;
