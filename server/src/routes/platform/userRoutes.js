const express = require('express');
const userController = require('../../controllers/platform/userController');
const PlatformController = require('../../controllers/platformController');
const { requirePlatformAdmin, requirePlatformStaff } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformStaff);

router.get('/stats', PlatformController.getUserStats.bind(PlatformController));
router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserDetails);

router.patch('/:userId/status', requirePlatformAdmin, PlatformController.updateUserStatus.bind(PlatformController));
router.patch('/:userId/suspend', requirePlatformAdmin, userController.suspendUser);
router.patch('/:userId/activate', requirePlatformAdmin, userController.activateUser);
router.post('/:userId/reset-password', requirePlatformAdmin, userController.resetUserPassword);

module.exports = router;
