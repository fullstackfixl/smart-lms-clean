const express = require('express');
const platformApplicationController = require('../controllers/PlatformApplicationController');
const platformAnalyticsController = require('../controllers/PlatformAnalyticsController');
const platformOrganizationController = require('../controllers/PlatformOrganizationController');
const platformAdminsController = require('../controllers/PlatformAdminsController');
const platformStaffController = require('../controllers/PlatformStaffController');
const PlatformController = require('../controllers/platformController');
const platformCourseController = require('../controllers/PlatformCourseController');
const { authMiddleware, requirePlatformAdmin, requirePlatformAccess } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔌 [Platform Router] ${req.method} ${req.path}`);
    next();
});

// One-time super admin creation (no auth)
router.post('/create-super-admin', PlatformController.createSuperAdmin);

// ══════════════════════════════════════════════════════════════════════════════
// SHARED ROUTES — platform_admin + platform_staff
// ══════════════════════════════════════════════════════════════════════════════
router.use(authMiddleware, requirePlatformAccess, activityLogger);

// --- Dashboard & Analytics ---
router.get('/dashboard/stats', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/overview', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/global', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/revenue', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));

// --- Organizations (read-only for staff) ---
router.get('/organizations', platformOrganizationController.listOrganizations.bind(platformOrganizationController));
router.get('/organizations/stats', platformOrganizationController.getOrganizationStats.bind(platformOrganizationController));
router.get('/organizations/:id', platformOrganizationController.getOrganizationDetails.bind(platformOrganizationController));

// --- Organization Applications (staff can approve/reject) ---
router.get('/applications', platformApplicationController.getApplications);
router.put('/applications/:id/approve', platformApplicationController.approveApplication);
router.put('/applications/:id/reject', platformApplicationController.rejectApplication);

// --- Courses (read & review for staff) ---
router.get('/courses', platformCourseController.listCourses.bind(platformCourseController));
router.get('/courses/stats', platformCourseController.getStats.bind(platformCourseController));
router.patch('/courses/:id/global-publish', platformCourseController.toggleGlobalPublish.bind(platformCourseController));
router.patch('/courses/:id/marketplace', platformCourseController.publishToMarketplace.bind(platformCourseController));

// --- User Management (read-only for staff) ---
router.get('/users', PlatformController.listUsers.bind(PlatformController));
router.get('/users/stats', PlatformController.getUserStats.bind(PlatformController));
router.get('/users/:id', (req, res) => res.json({ success: true, data: {} }));

// --- Email Diagnostics ---
router.get('/email/test', async (req, res) => {
    try {
        const emailService = require('../services/email.service');
        const to = req.query.to;
        let testSend = null;
        if (to) {
            testSend = await emailService.sendEmail({
                to: to.toString(),
                subject: 'Smart LMS Email Test',
                html: '<p><strong>Smart LMS</strong> email configuration is working.</p>'
            });
        }
        res.json({ success: true, data: { testSend } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN-ONLY ROUTES — platform_admin only
// ══════════════════════════════════════════════════════════════════════════════

// --- Organizations (create, update, delete) ---
router.post('/organizations', requirePlatformAdmin, platformOrganizationController.createOrganization.bind(platformOrganizationController));
router.put('/organizations/:id', requirePlatformAdmin, platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.patch('/organizations/:id/status', requirePlatformAdmin, platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.delete('/organizations/:id', requirePlatformAdmin, platformOrganizationController.deleteOrganization.bind(platformOrganizationController));

// --- Platform Admins Management ---
router.get('/admins', requirePlatformAdmin, platformAdminsController.getAll.bind(platformAdminsController));
router.post('/admins', requirePlatformAdmin, platformAdminsController.create.bind(platformAdminsController));
router.patch('/admins/:id/status', requirePlatformAdmin, platformAdminsController.updateStatus.bind(platformAdminsController));

// --- Platform Staff Management (admin creates/manages staff) ---
router.post('/staff/create', requirePlatformAdmin, platformStaffController.createStaff.bind(platformStaffController));
router.get('/staff', requirePlatformAdmin, platformStaffController.listStaff.bind(platformStaffController));
router.patch('/staff/:id/status', requirePlatformAdmin, platformStaffController.updateStaffStatus.bind(platformStaffController));
router.get('/staff/logs', requirePlatformAdmin, platformStaffController.getActivityLogs.bind(platformStaffController));

// --- User Status Updates (admin only) ---
router.patch('/users/:id/status', requirePlatformAdmin, PlatformController.updateUserStatus.bind(PlatformController));

// --- System Configuration (admin only) ---
router.get('/config', requirePlatformAdmin, (req, res) => res.json({ success: true, data: {} }));
router.put('/config', requirePlatformAdmin, (req, res) => res.json({ success: true, data: {} }));

module.exports = router;
