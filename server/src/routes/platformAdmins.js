const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const auditLog = require('../middleware/auditLog');
const { 
  platformAdminLimiter, 
  platformAdminStrictLimiter 
} = require('../middleware/platformRateLimiter');
const PlatformAdminsController = require('../controllers/PlatformAdminsController');

// All routes require platform_admin role
router.use(authMiddleware);
router.use(requireRole(['platform_admin']));
router.use(platformAdminLimiter);

// Platform admin management endpoints
router.get('/', 
  validate(schemas.listQuery, 'query'),
  PlatformAdminsController.getAll
);

router.post('/', 
  platformAdminStrictLimiter,
  validate(schemas.createPlatformAdmin, 'body'),
  auditLog('CREATE', 'admin'),
  PlatformAdminsController.create
);

router.patch('/:id/status', 
  platformAdminStrictLimiter,
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateAdminStatus, 'body'),
  auditLog('UPDATE', 'admin'),
  PlatformAdminsController.updateStatus
);

module.exports = router;
