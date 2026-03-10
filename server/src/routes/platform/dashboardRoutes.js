const express = require('express');
const dashboardController = require('../../controllers/platformAdmin/dashboardController');
const router = express.Router();

router.get('/', dashboardController.getDashboardSync);

module.exports = router;
