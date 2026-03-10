const express = require('express');
const reportController = require('../../controllers/platformAdmin/reportController');
const router = express.Router();

router.post('/generate', reportController.generate);
router.get('/:reportId/download', reportController.download);

module.exports = router;
