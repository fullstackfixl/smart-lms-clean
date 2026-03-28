const express = require('express');
const platformOrganizationController = require('../controllers/PlatformOrganizationController');
const platformInviteController = require('../controllers/PlatformInviteController');
const platformAnalyticsController = require('../controllers/PlatformAnalyticsController');
const platformApplicationController = require('../controllers/PlatformApplicationController');
const platformCourseController = require('../controllers/PlatformCourseController');
const PlatformController = require('../controllers/platformController');
const platformAdminsController = require('../controllers/PlatformAdminsController');
const platformStaffController = require('../controllers/PlatformStaffController');
const { authMiddleware, requirePlatformAdmin, requirePlatformStaff } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔌 [Platform API Router] ${req.method} ${req.path}`);
    next();
});

// --- Public Invitation Routes (No Admin Required) ---
router.get('/org-invite/verify', platformInviteController.verifyToken.bind(platformInviteController));
router.post('/org-invite/complete', platformInviteController.completeSetup.bind(platformInviteController));

// --- One-time super admin creation (no auth - secret required internally) ---
router.post('/create-super-admin', PlatformController.createSuperAdmin);

// --- Protected Platform Routes (admin + staff) ---
router.use(authMiddleware, requirePlatformStaff, activityLogger);

// --- Dashboard & Analytics ---
router.get('/dashboard/stats', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/overview', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/global', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));
router.get('/analytics/revenue', platformAnalyticsController.getDashboardStats.bind(platformAnalyticsController));

// --- Organizations ---
router.get('/organizations', platformOrganizationController.listOrganizations.bind(platformOrganizationController));
router.get('/organizations/stats', platformOrganizationController.getOrganizationStats.bind(platformOrganizationController));
router.get('/organizations/:id/stats', platformOrganizationController.getOrganizationStats.bind(platformOrganizationController));
router.get('/organizations/:id', platformOrganizationController.getOrganizationDetails.bind(platformOrganizationController));
router.post('/organizations/create', platformOrganizationController.createOrganizationWithInvite.bind(platformOrganizationController));

// --- Organization Applications ---
router.get('/applications', platformApplicationController.getApplications);
router.put('/applications/:id/approve', platformApplicationController.approveApplication);
router.put('/applications/:id/reject', platformApplicationController.rejectApplication);

// --- Courses ---
router.get('/courses', platformCourseController.listCourses.bind(platformCourseController));
router.get('/courses/stats', platformCourseController.getStats.bind(platformCourseController));
router.patch('/courses/:id/global-publish', platformCourseController.toggleGlobalPublish.bind(platformCourseController));
router.patch('/courses/:id/marketplace', platformCourseController.publishToMarketplace.bind(platformCourseController));

// --- User Management ---
router.get('/users', PlatformController.listUsers.bind(PlatformController));
router.get('/users/stats', PlatformController.getUserStats.bind(PlatformController));

// --- ADMIN-ONLY ROUTES ---
router.post('/organizations', requirePlatformAdmin, platformOrganizationController.createOrganization.bind(platformOrganizationController));
router.put('/organizations/:id', requirePlatformAdmin, platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.patch('/organizations/:id/status', requirePlatformAdmin, platformOrganizationController.updateOrganization.bind(platformOrganizationController));
router.delete('/organizations/:id', requirePlatformAdmin, platformOrganizationController.deleteOrganization.bind(platformOrganizationController));

router.get('/admins', requirePlatformAdmin, platformAdminsController.getAll.bind(platformAdminsController));
router.post('/admins', requirePlatformAdmin, platformAdminsController.create.bind(platformAdminsController));
router.patch('/admins/:id/status', requirePlatformAdmin, platformAdminsController.updateStatus.bind(platformAdminsController));

router.post('/staff/create', requirePlatformAdmin, platformStaffController.createStaff.bind(platformStaffController));
router.get('/staff', requirePlatformAdmin, platformStaffController.listStaff.bind(platformStaffController));
router.patch('/staff/:id/status', requirePlatformAdmin, platformStaffController.updateStaffStatus.bind(platformStaffController));
router.get('/staff/logs', requirePlatformAdmin, platformStaffController.getActivityLogs.bind(platformStaffController));

router.patch('/users/:id/status', requirePlatformAdmin, PlatformController.updateUserStatus.bind(PlatformController));

module.exports = router;
