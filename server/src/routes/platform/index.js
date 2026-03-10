const express = require('express');
const { authMiddleware, requirePlatformStaff } = require('../../middleware/auth');

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

const router = express.Router();

/**
 * Platform API Hub
 * Enforces authentication and platform-level role verification (ADMIN or STAFF)
 */
router.use(authMiddleware, requirePlatformStaff);

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

module.exports = router;
