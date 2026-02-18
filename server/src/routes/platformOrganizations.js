const express = require('express');
const router = express.Router();
const { authMiddleware, requirePlatformAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const auditLog = require('../middleware/auditLog');
const { 
  platformAdminStrictLimiter, 
  organizationCreationLimiter 
} = require('../middleware/platformRateLimiter');
const PlatformOrganizationController = require('../controllers/PlatformOrganizationController');

// All routes require platform admin authentication
router.use(authMiddleware, requirePlatformAdmin);

// Stats route (must be before /:id routes)
router.get('/stats', async (req, res) => {
  try {
    const PlatformOrganization = require('../models/PlatformOrganization');
    
    const [total, active, suspended] = await Promise.all([
      PlatformOrganization.countDocuments(),
      PlatformOrganization.countDocuments({ status: 'active' }),
      PlatformOrganization.countDocuments({ status: 'suspended' })
    ]);

    const byPlan = await PlatformOrganization.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);

    const planStats = {
      basic: 0,
      premium: 0
    };

    byPlan.forEach(item => {
      if (item._id === 'basic') planStats.basic = item.count;
      if (item._id === 'premium') planStats.premium = item.count;
    });

    return res.success({
      stats: {
        total,
        active,
        suspended,
        byPlan: planStats
      }
    }, 'Organization stats retrieved successfully');
  } catch (error) {
    console.error('Get organization stats error:', error);
    return res.error(error.message, 'Failed to get organization stats', 500);
  }
});

// Organization CRUD routes with validation and audit logging
router.post('/', 
  organizationCreationLimiter,
  validate(schemas.createOrganization, 'body'),
  auditLog('CREATE', 'organization'),
  PlatformOrganizationController.createOrganization.bind(PlatformOrganizationController)
);

router.get('/', 
  validate(schemas.listQuery, 'query'),
  PlatformOrganizationController.getOrganizations.bind(PlatformOrganizationController)
);

router.get('/:id', 
  validate(schemas.mongoId, 'params'),
  PlatformOrganizationController.getOrganization.bind(PlatformOrganizationController)
);

router.put('/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateOrganization, 'body'),
  auditLog('UPDATE', 'organization'),
  PlatformOrganizationController.updateOrganization.bind(PlatformOrganizationController)
);

// Status transition routes with audit logging
router.patch('/:id/status', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateOrganizationStatus, 'body'),
  auditLog('UPDATE', 'organization'),
  async (req, res) => {
    try {
      const PlatformOrganization = require('../models/PlatformOrganization');
      const { status } = req.body;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        req.params.id,
        { status, updated_at: new Date() },
        { new: true }
      ).lean();

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, 'Organization status updated successfully');
    } catch (error) {
      console.error('Update organization status error:', error);
      return res.error(error.message, 'Failed to update organization status', 500);
    }
  }
);

router.patch('/:id/suspend', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('SUSPEND', 'organization'),
  PlatformOrganizationController.suspendOrganization.bind(PlatformOrganizationController)
);

router.patch('/:id/activate', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('ACTIVATE', 'organization'),
  PlatformOrganizationController.activateOrganization.bind(PlatformOrganizationController)
);

router.delete('/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('DELETE', 'organization'),
  PlatformOrganizationController.deleteOrganization.bind(PlatformOrganizationController)
);

// Restore route with audit logging
router.post('/:id/restore', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('RESTORE', 'organization'),
  async (req, res) => {
    try {
      const PlatformOrganization = require('../models/PlatformOrganization');
      
      const organization = await PlatformOrganization.findById(req.params.id);

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      organization.is_deleted = false;
      organization.deleted_at = null;
      organization.deleted_by = null;
      await organization.save();

      return res.success(organization.toObject(), 'Organization restored successfully');
    } catch (error) {
      console.error('Restore organization error:', error);
      return res.error(error.message, 'Failed to restore organization', 500);
    }
  }
);

module.exports = router;
