const express = require('express');
const router = express.Router();
const { authMiddleware, requirePlatformAdmin } = require('../middleware/auth');
const PlatformAnalyticsController = require('../controllers/PlatformAnalyticsController');

// All routes require platform admin authentication
router.use(authMiddleware, requirePlatformAdmin);

// Analytics routes
router.get('/overview', PlatformAnalyticsController.getOverview.bind(PlatformAnalyticsController));

module.exports = router;
