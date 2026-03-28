const express = require('express');
const analyticsController = require('../../controllers/platform/analyticsController');
const dashboardController = require('../../controllers/platform/dashboardController');
const { requirePlatformStaff } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformStaff);

router.get('/', analyticsController.getOverview);
router.get('/overview', analyticsController.getOverview);
router.get('/activity', analyticsController.getActivity);
router.get('/engagement', analyticsController.getEngagement);
router.get('/growth', analyticsController.getGrowth);
router.get('/dashboard', dashboardController.getDashboardStats);
router.get('/global', dashboardController.getDashboardStats);
router.get('/revenue', dashboardController.getDashboardStats);

module.exports = router;
