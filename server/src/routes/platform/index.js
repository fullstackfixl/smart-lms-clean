const express = require('express');
const {
  authMiddleware,
  requirePlatformAdmin,
  requirePlatformStaff
} = require('../../middleware/auth');
const { activityLogger } = require('../../middleware/activityLogger');

const dashboardRoutes = require('./dashboardRoutes');
const organizationRoutes = require('./organizationRoutes');
const staffRoutes = require('./staffRoutes');
const userRoutes = require('./userRoutes');
const courseRoutes = require('./courseRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reportRoutes = require('./reportRoutes');
const settingsRoutes = require('./settingsRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const billingRoutes = require('./billingRoutes');
const applicationsRoutes = require('./applicationsRoutes');
const accessModelRoutes = require('./accessModelRoutes');
const metricsRoutes = require('./metricsRoutes');
const securityRoutes = require('./securityRoutes');
const communicationController = require('../../controllers/platform/communicationController');
const billingController = require('../../controllers/platformAdmin/billingController');
const PlatformController = require('../../controllers/platformController');
const platformAdminsController = require('../../controllers/PlatformAdminsController');
const staffActionController = require('../../controllers/platform/staffController');

const router = express.Router();

router.post('/create-super-admin', PlatformController.createSuperAdmin);
router.post('/staff/accept-invite', staffActionController.acceptInvite);
router.get('/staff/accept-invite/verify', staffActionController.verifyInvite);

router.use(authMiddleware, activityLogger);

router.use('/dashboard', dashboardRoutes);
router.use('/organizations', organizationRoutes);
router.use('/staff', staffRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/billing', billingRoutes);
router.use('/applications', applicationsRoutes);
router.use('/access-model', accessModelRoutes);
router.use('/metrics', metricsRoutes);
router.use('/security', securityRoutes);

router.get('/admins', requirePlatformAdmin, platformAdminsController.getAll.bind(platformAdminsController));
router.post('/admins', requirePlatformAdmin, platformAdminsController.create.bind(platformAdminsController));
router.patch('/admins/:id/status', requirePlatformAdmin, platformAdminsController.updateStatus.bind(platformAdminsController));

router.get('/conversations', requirePlatformStaff, communicationController.getConversations);
router.get('/messages/:conversationId', requirePlatformStaff, communicationController.getMessages);
router.get('/communication/overview', requirePlatformStaff, communicationController.getOverview);

router.get('/revenue', requirePlatformAdmin, billingController.getBillingStats.bind(billingController));

module.exports = router;
