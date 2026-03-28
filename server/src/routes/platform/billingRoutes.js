const express = require('express');
const billingController = require('../../controllers/platformAdmin/billingController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformAdmin);

router.get('/', billingController.getBillingStats);

module.exports = router;
