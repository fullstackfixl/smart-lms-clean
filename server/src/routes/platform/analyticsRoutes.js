const express = require('express');
const analyticsController = require('../../controllers/platform/analyticsController');
const router = express.Router();

router.get('/overview', analyticsController.getOverview);
router.get('/growth', analyticsController.getGrowth);

module.exports = router;
