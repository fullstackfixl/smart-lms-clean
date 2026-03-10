const express = require('express');
const staffController = require('../../controllers/platformAdmin/staffController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

// All staff operations are Admin-only as per requirements
router.use(requirePlatformAdmin);

router.post('/', staffController.create);
router.get('/', staffController.list);
router.put('/:staffId', staffController.update);
router.patch('/:staffId/disable', staffController.disable);

module.exports = router;
