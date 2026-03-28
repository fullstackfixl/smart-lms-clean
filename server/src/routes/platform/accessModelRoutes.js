const express = require('express');
const accessModelController = require('../../controllers/platform/accessModelController');
const { requirePlatformAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requirePlatformAdmin);

router.get('/', accessModelController.getAccessModel);
router.put('/feature-toggles', requirePlatformAdmin, accessModelController.updateFeatureToggles);

module.exports = router;
