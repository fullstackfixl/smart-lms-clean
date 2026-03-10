const express = require('express');
const { authMiddleware, requirePlatformStaff } = require('../../middleware/auth');
const { activityLogger } = require('../../middleware/activityLogger');

const dashboardRoutes = require('./dashboardRoutes');
const organizationRoutes = require('./organizationRoutes');
const staffRoutes = require('./staffRoutes');
const userRoutes = require('./userRoutes');
const courseRoutes = require('./courseRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reportRoutes = require('./reportRoutes');
const settingsRoutes = require('./settingsRoutes');
const billingRoutes = require('./billingRoutes');
const inviteRoutes = require('./inviteRoutes');

const router = express.Router();

/**
 * Public Platform Routes
 */
router.use('/org-invite', inviteRoutes);

/**
 * Platform API Hub
 * Enforces authentication and platform-level role verification
 */
router.use(authMiddleware, requirePlatformStaff, activityLogger);

router.use('/dashboard', dashboardRoutes);
router.use('/organizations', organizationRoutes);
router.use('/staff', staffRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/billing', billingRoutes);

module.exports = router;
