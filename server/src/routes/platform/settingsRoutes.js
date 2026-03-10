const express = require('express');
const settingsController = require('../../controllers/platform/settingsController');
const { updatePlatformSettingsValidator } = require('../../validators/platform/settingsValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

// Only Platform Admin can manage settings
router.use(requirePlatformAdmin);

router.get('/', settingsController.getSettings);
router.put('/', updatePlatformSettingsValidator, settingsController.updateSettings);

module.exports = router;
