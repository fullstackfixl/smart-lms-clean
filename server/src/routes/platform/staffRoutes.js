const express = require('express');
const staffController = require('../../controllers/platform/staffController');
const { createStaffValidator, updateStaffValidator } = require('../../validators/platform/staffValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

// Only Platform Admin can manage staff
router.use(requirePlatformAdmin);

router.get('/', staffController.getStaffList);
router.post('/', createStaffValidator, staffController.createStaff);
router.put('/:staffId', updateStaffValidator, staffController.updateStaff);
router.patch('/:staffId/disable', staffController.disableStaff);

module.exports = router;
