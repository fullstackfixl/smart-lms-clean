const express = require('express');
const analyticsController = require('../../controllers/platformAdmin/analyticsController');
const router = express.Router();

router.get('/overview', analyticsController.getOverview);
router.get('/growth', analyticsController.getGrowth);

module.exports = router;
