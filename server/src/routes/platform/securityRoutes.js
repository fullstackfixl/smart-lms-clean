const express = require('express');
const securityController = require('../../controllers/platform/securityController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformAdmin);

router.get('/overview', securityController.getOverview);
router.get('/audit-logs', securityController.getAuditLogs);

module.exports = router;
