const express = require('express');
const auditLogController = require('../../controllers/platform/auditLogController');
const router = express.Router();

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
