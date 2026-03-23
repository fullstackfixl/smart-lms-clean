const express = require('express');
const organizationController = require('../../controllers/platform/organizationController');
const { createOrganizationValidator, updateOrganizationValidator } = require('../../validators/platform/organizationValidator');
const { requirePlatformAdmin } = require('../../middleware/auth');
const router = express.Router();

router.get('/', organizationController.getOrganizations);
router.post('/', requirePlatformAdmin, createOrganizationValidator, organizationController.createOrganization);
router.post('/invite', organizationController.inviteOrganization);
router.get('/:orgId', organizationController.getOrganizationDetails);
router.get('/:orgId/instructors', organizationController.getOrganizationInstructors);
router.get('/:orgId/students', organizationController.getOrganizationStudents);
router.get('/:orgId/stats', organizationController.getOrganizationStats);
router.get('/:orgId/courses', organizationController.getOrganizationCourses);
router.get('/:orgId/activity', organizationController.getOrganizationActivity);
router.get('/:orgId/live-classes', organizationController.getOrganizationLiveClasses);
router.get('/:orgId/quizzes', organizationController.getOrganizationQuizzes);
router.get('/:orgId/certificates', organizationController.getOrganizationCertificates);
router.get('/:orgId/attendance', organizationController.getOrganizationAttendance);
router.post('/:orgId/reset-admin-password', organizationController.resetAdminPassword);
router.put('/:orgId', updateOrganizationValidator, organizationController.updateOrganization);
router.patch('/:orgId/suspend', organizationController.suspendOrganization);
router.patch('/:orgId/activate', organizationController.activateOrganization);
router.delete('/:orgId', requirePlatformAdmin, organizationController.deleteOrganization);

module.exports = router;
