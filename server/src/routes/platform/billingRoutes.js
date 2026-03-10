const express = require('express');
const billingController = require('../../controllers/platformAdmin/billingController');
const router = express.Router();

router.get('/', billingController.getBillingStats);

module.exports = router;
