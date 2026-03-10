const express = require('express');
const organizationController = require('../../controllers/platformAdmin/organizationController');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.post('/', requirePlatformAdmin, organizationController.create);
router.post('/invite', requirePlatformAdmin, organizationController.invite);
router.get('/', organizationController.list);
router.get('/:orgId', organizationController.getDetails);
router.put('/:orgId', requirePlatformAdmin, organizationController.update);
router.patch('/:orgId/suspend', organizationController.suspend);
router.patch('/:orgId/activate', organizationController.activate);
router.delete('/:orgId', requirePlatformAdmin, organizationController.delete);

module.exports = router;
