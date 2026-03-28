const express = require('express');
const reportController = require('../../controllers/platform/reportController');
const { generateReportValidator } = require('../../validators/platform/reportValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformAdmin);

router.get('/', reportController.getReports);
router.post('/generate', generateReportValidator, reportController.generateReport);
router.get('/:reportId/download', reportController.downloadReport);

module.exports = router;
