const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { validate, schemas } = require('../../middleware/validation');
const { platformAdminLimiter, platformAdminStrictLimiter } = require('../../middleware/platformRateLimiter');
const auditLog = require('../../middleware/auditLog');
const PlatformController = require('../../controllers/platformController');

// All platform routes require platform_admin role and rate limiting
router.use(authMiddleware);
router.use(requireRole(['platform_admin']));
router.use(platformAdminLimiter);

// Dashboard & Analytics
router.get('/dashboard/stats', PlatformController.getDashboardStats);
router.get('/analytics/global', PlatformController.getGlobalAnalytics);
router.get('/analytics/revenue', PlatformController.getRevenueAnalytics);

// Organization Management
router.get('/organizations', 
  validate(schemas.listQuery, 'query'),
  PlatformController.getAllOrganizations
);
router.get('/organizations/:id', 
  validate(schemas.mongoId, 'params'),
  PlatformController.getOrganizationById
);
router.post('/organizations', 
  platformAdminStrictLimiter,
  validate(schemas.createOrganization, 'body'),
  auditLog('CREATE', 'organization'),
  PlatformController.createOrganization
);
router.put('/organizations/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateOrganization, 'body'),
  auditLog('UPDATE', 'organization'),
  PlatformController.updateOrganization
);
router.delete('/organizations/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('DELETE', 'organization'),
  PlatformController.deleteOrganization
);
router.patch('/organizations/:id/status', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateOrganizationStatus, 'body'),
  auditLog('UPDATE', 'organization'),
  PlatformController.toggleOrganizationStatus
);

// Subscription Management
router.get('/subscriptions', 
  validate(schemas.listQuery, 'query'),
  PlatformController.getAllSubscriptions
);
router.get('/subscriptions/:id', 
  validate(schemas.mongoId, 'params'),
  PlatformController.getSubscriptionById
);
router.post('/subscriptions', 
  platformAdminStrictLimiter,
  validate(schemas.createSubscription, 'body'),
  auditLog('CREATE', 'subscription'),
  PlatformController.createSubscription
);
router.put('/subscriptions/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateSubscription, 'body'),
  auditLog('UPDATE', 'subscription'),
  PlatformController.updateSubscription
);
router.delete('/subscriptions/:id', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  auditLog('DELETE', 'subscription'),
  PlatformController.cancelSubscription
);

// System Configuration
router.get('/config', PlatformController.getSystemConfig);
router.put('/config', 
  platformAdminStrictLimiter,
  validate(schemas.updateSystemConfig, 'body'),
  auditLog('UPDATE', 'config'),
  PlatformController.updateSystemConfig
);

// User Management (Platform-wide)
router.get('/users', 
  validate(schemas.listQuery, 'query'),
  PlatformController.getAllUsers
);
router.get('/users/:id', 
  validate(schemas.mongoId, 'params'),
  PlatformController.getUserById
);
router.patch('/users/:id/status', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateAdminStatus, 'body'),
  auditLog('UPDATE', 'user'),
  PlatformController.toggleUserStatus
);

// Reports
router.get('/reports/organizations', PlatformController.getOrganizationReport);
router.get('/reports/revenue', PlatformController.getRevenueReport);
router.get('/reports/users', PlatformController.getUserReport);

module.exports = router;
