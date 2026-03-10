const express = require('express');
const organizationController = require('../../controllers/platform/organizationController');
const { createOrganizationValidator, updateOrganizationValidator } = require('../../validators/platform/organizationValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.get('/', organizationController.getOrganizations);
router.post('/', requirePlatformAdmin, createOrganizationValidator, organizationController.createOrganization);
router.get('/:orgId', organizationController.getOrganizationDetails);
router.put('/:orgId', updateOrganizationValidator, organizationController.updateOrganization);
router.patch('/:orgId/suspend', organizationController.suspendOrganization);
router.delete('/:orgId', requirePlatformAdmin, organizationController.deleteOrganization);

module.exports = router;
