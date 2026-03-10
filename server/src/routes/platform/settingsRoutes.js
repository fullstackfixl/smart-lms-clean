const express = require('express');
const settingsController = require('../../controllers/platformAdmin/settingsController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

// Settings are Admin-only
router.use(requirePlatformAdmin);

router.get('/', settingsController.get);
router.put('/', settingsController.update);

module.exports = router;
