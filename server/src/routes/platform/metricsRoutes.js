const express = require('express');
const analyticsController = require('../../controllers/platform/analyticsController');
const dashboardController = require('../../controllers/platform/dashboardController');
const router = express.Router();

router.get('/overview', analyticsController.getOverview);
router.get('/activity', analyticsController.getActivity);
router.get('/engagement', analyticsController.getEngagement);
router.get('/dashboard', dashboardController.getDashboardStats);

module.exports = router;
