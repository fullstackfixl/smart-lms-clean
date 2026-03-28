const express = require('express');
const userController = require('../../controllers/platform/userController');
const PlatformController = require('../../controllers/platformController');
const router = express.Router();

router.get('/stats', PlatformController.getUserStats.bind(PlatformController));
router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserDetails);
router.patch('/:userId/status', PlatformController.updateUserStatus.bind(PlatformController));
router.patch('/:userId/suspend', userController.suspendUser);
router.patch('/:userId/activate', userController.activateUser);
router.post('/:userId/reset-password', userController.resetUserPassword);

module.exports = router;
