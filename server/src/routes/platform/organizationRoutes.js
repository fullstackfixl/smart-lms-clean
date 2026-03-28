const express = require('express');
const organizationController = require('../../controllers/platform/organizationController');
const { createOrganizationValidator, updateOrganizationValidator } = require('../../validators/platform/organizationValidator');
const { requirePlatformAdmin, requirePlatformStaff } = require('../../middleware/auth');
const router = express.Router();

router.use(requirePlatformStaff);

router.get('/', organizationController.getOrganizations);
router.get('/stats', organizationController.getOrganizationStats);
router.get('/:orgId/stats', organizationController.getOrganizationStats);
router.get('/:orgId/control', organizationController.getOrganizationControlPanel);
router.get('/:orgId', organizationController.getOrganizationDetails);
router.get('/:orgId/instructors', organizationController.getOrganizationInstructors);
router.get('/:orgId/students', organizationController.getOrganizationStudents);
router.get('/:orgId/courses', organizationController.getOrganizationCourses);
router.get('/:orgId/activity', organizationController.getOrganizationActivity);
router.get('/:orgId/live-classes', organizationController.getOrganizationLiveClasses);
router.get('/:orgId/quizzes', organizationController.getOrganizationQuizzes);
router.get('/:orgId/certificates', organizationController.getOrganizationCertificates);
router.get('/:orgId/attendance', organizationController.getOrganizationAttendance);

router.post('/', requirePlatformAdmin, createOrganizationValidator, organizationController.createOrganization);
router.post('/invite', requirePlatformAdmin, organizationController.inviteOrganization);
router.post('/:orgId/reset-admin-password', requirePlatformAdmin, organizationController.resetAdminPassword);
router.post('/:orgId/context', requirePlatformStaff, organizationController.enterOrganizationContext);
router.patch('/:orgId/control', requirePlatformAdmin, organizationController.updateOrganizationControlPanel);
router.put('/:orgId', requirePlatformAdmin, updateOrganizationValidator, organizationController.updateOrganization);
router.patch('/:orgId/suspend', requirePlatformAdmin, organizationController.suspendOrganization);
router.patch('/:orgId/activate', requirePlatformAdmin, organizationController.activateOrganization);
router.delete('/:orgId', requirePlatformAdmin, organizationController.deleteOrganization);

module.exports = router;
