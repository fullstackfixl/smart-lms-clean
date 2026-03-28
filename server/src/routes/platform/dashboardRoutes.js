const express = require('express');
const dashboardController = require('../../controllers/platform/dashboardController');
const router = express.Router();

router.get('/', dashboardController.getDashboardStats);
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
