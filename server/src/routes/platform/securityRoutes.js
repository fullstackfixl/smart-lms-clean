const express = require('express');
const securityController = require('../../controllers/platform/securityController');
const router = express.Router();

router.get('/overview', securityController.getOverview);
router.get('/audit-logs', securityController.getAuditLogs);

module.exports = router;
