const express = require('express');
const platformApplicationController = require('../controllers/PlatformApplicationController');
const platformAnalyticsController = require('../controllers/PlatformAnalyticsController');
const platformOrganizationController = require('../controllers/PlatformOrganizationController');
const platformAdminsController = require('../controllers/PlatformAdminsController');
const PlatformController = require('../controllers/platformController');
const Course = require('../models/Course');
const { authMiddleware, requirePlatformAdmin } = require('../middleware/auth');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔌 [Platform Router] ${req.method} ${req.path}`);
    next();
});

// One-time super admin creation
router.post('/create-super-admin', PlatformController.createSuperAdmin);

// All routes below require platform_admin role
router.use(authMiddleware, requirePlatformAdmin);

// --- Dashboard & Analytics ---
router.get('/dashboard/stats', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/overview', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/global', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/revenue', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));

// --- Organizations Management ---
router.get('/organizations', platformOrganizationController.listOrganizations.bind(platformOrganizationController));
router.get('/organizations/stats', async (req, res) => {
    // Simple stats for organizations list view
    try {
        const { Organization } = require('../models');
        const [total, active] = await Promise.all([
            Organization.countDocuments({ is_deleted: false }),
            Organization.countDocuments({ is_deleted: false, status: 'active' })
        ]);
        res.json({ success: true, data: { total, active } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.get('/organizations/:id', platformOrganizationController.getOrganizationDetails.bind(platformOrganizationController));
router.post('/organizations', platformOrganizationController.createOrganization.bind(platformOrganizationController));
router.put('/organizations/:id', platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.patch('/organizations/:id/status', platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.delete('/organizations/:id', platformOrganizationController.deleteOrganization.bind(platformOrganizationController));

// --- Organization Applications ---
router.get('/applications', platformApplicationController.getApplications);
router.put('/applications/:id/approve', platformApplicationController.approveApplication);
router.put('/applications/:id/reject', platformApplicationController.rejectApplication);

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
// --- Platform Admins ---
router.get('/admins', platformAdminsController.getAll.bind(platformAdminsController));
router.post('/admins', platformAdminsController.create.bind(platformAdminsController));
router.patch('/admins/:id/status', platformAdminsController.updateStatus.bind(platformAdminsController));

// --- System Configuration ---
router.get('/config', (req, res) => res.json({ success: true, data: {} }));
router.put('/config', (req, res) => res.json({ success: true, data: {} }));

// --- User Management (Platform-wide) ---
router.get('/users', (req, res) => res.json({ success: true, data: [] }));
router.get('/users/:id', (req, res) => res.json({ success: true, data: {} }));
router.patch('/users/:id/status', (req, res) => res.json({ success: true, data: {} }));

const platformCourseController = require('../controllers/PlatformCourseController');

// --- Courses Platform Review & Marketplace ---
router.get('/courses', platformCourseController.listCourses.bind(platformCourseController));
router.get('/courses/stats', platformCourseController.getStats.bind(platformCourseController));
router.patch('/courses/:id/global-publish', platformCourseController.toggleGlobalPublish.bind(platformCourseController));
router.patch('/courses/:id/marketplace', platformCourseController.publishToMarketplace.bind(platformCourseController));

module.exports = router;
