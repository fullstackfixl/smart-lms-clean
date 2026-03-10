const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/organization/dashboardController');
const { authMiddleware, requireRole } = require('../../middleware/auth');


router.use(authMiddleware);

router.get('/', requireRole(['org_admin', 'instructor']), dashboardController.getDashboardData);


module.exports = router;
