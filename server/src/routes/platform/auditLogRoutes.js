const express = require('express');
const auditLogController = require('../../controllers/platform/auditLogController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformAdmin);

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
