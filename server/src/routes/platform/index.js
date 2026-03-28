const express = require('express');
const { authMiddleware, requirePlatformAdmin } = require('../../middleware/auth');

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
const platformStaffController = require('../../controllers/PlatformStaffController');

const router = express.Router();

/**
 * Platform API Hub
 * Enforces authentication and platform admin verification
 */
router.post('/create-super-admin', PlatformController.createSuperAdmin);
router.use(authMiddleware, requirePlatformAdmin);

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

router.get('/admins', platformAdminsController.getAll.bind(platformAdminsController));
router.post('/admins', platformAdminsController.create.bind(platformAdminsController));
router.patch('/admins/:id/status', platformAdminsController.updateStatus.bind(platformAdminsController));

router.get('/staff', platformStaffController.listStaff.bind(platformStaffController));
router.post('/staff/create', platformStaffController.createStaff.bind(platformStaffController));
router.patch('/staff/:id/status', platformStaffController.updateStaffStatus.bind(platformStaffController));
router.get('/staff/logs', platformStaffController.getActivityLogs.bind(platformStaffController));

router.get('/conversations', communicationController.getConversations);
router.get('/messages/:conversationId', communicationController.getMessages);
router.get('/communication/overview', communicationController.getOverview);
router.get('/revenue', billingController.getBillingStats.bind(billingController));

module.exports = router;
