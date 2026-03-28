const express = require('express');
const dashboardController = require('../../controllers/platform/dashboardController');
const { requirePlatformStaff } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformStaff);

router.get('/', dashboardController.getDashboardStats);
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
