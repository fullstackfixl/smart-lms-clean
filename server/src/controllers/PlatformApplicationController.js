const { OrganizationApplication, OrganizationApprovalToken } = require('../models');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const BaseController = require('../core/BaseController');

class PlatformApplicationController extends BaseController {
    /**
     * Get all organization applications
     */
    async getApplications(req, res) {
        try {
            const { status = 'pending', page = 1, limit = 10 } = req.query;
            const query = { status };

            const applications = await OrganizationApplication.find(query)
                .sort({ created_at: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .lean();

            const total = await OrganizationApplication.countDocuments(query);

            return res.success({
                applications,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }, 'Applications retrieved successfully');
        } catch (error) {
            console.error('Get applications error:', error);
            return res.error(error.message, 'Failed to retrieve applications', 500);
        }
    }

    /**
     * Approve an application — assigns template modules to the new organization
     */
    async approveApplication(req, res) {
        try {
            const { id } = req.params;
            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            console.log(`📥 [Platform] Approval request for ID: ${id}`);

            if (application.status === 'approved') {
                console.log(`✅ [Approval] Application ${id} already approved`);
                return res.success({
                    application,
                    message: 'Application already approved'
                }, 'Application already processed');
            }

            console.log(`📋 [Approval] Current Status: ${application.status}`);

            if (application.status !== 'pending') {
                console.error(`❌ [Approval] Invalid Status: ${application.status}`);
                return res.error(`Application status is ${application.status}`, 'Validation Error', 400);
            }

            // Module mapping based on strictly defined specification
            const moduleMapping = {
                'SCHOOL': [
                    "ACADEMIC_YEAR",
                    "GRADES_SECTIONS",
                    "ATTENDANCE",
                    "EXAMS",
                    "PARENT_PORTAL",
                    "COURSES",
                    "REPORTS",
                    "TIMETABLE",
                    "EVENTS",
                    "LIVE_CLASSES"
                ],
                'COLLEGE': [
                    "DEPARTMENTS",
                    "SEMESTERS",
                    "SUBJECTS",
                    "GPA_REPORTS",
                    "COURSES",
                    "EXAMS",
                    "TIMETABLE",
                    "EVENTS",
                    "LIVE_CLASSES",
                    "REPORTS"
                ],
                'INSTITUTE': [
                    "BATCHES",
                    "TEST_SERIES",
                    "TRAINERS",
                    "COURSES",
                    "LEADERBOARDS",
                    "TIMETABLE",
                    "EVENTS",
                    "LIVE_CLASSES",
                    "REPORTS",
                    "FEES"
                ],
                'ONLINE_ACADEMY': [
                    "PUBLIC_CATALOG",
                    "COUPONS",
                    "COURSE_SALES",
                    "CERTIFICATES",
                    "STUDENT_ANALYTICS",
                    "LIVE_CLASSES",
                    "REPORTS"
                ]
            };

            // Default to SCHOOL if type is missing (legacy applications)
            if (!application.organization_type) {
                console.log(`⚠️  [Approval] Application ${application._id} missing type, defaulting to SCHOOL`);
                application.organization_type = 'SCHOOL';
            }

            const orgType = application.organization_type.toUpperCase();
            const modulesEnabled = moduleMapping[orgType] || moduleMapping['SCHOOL'];

            console.log(`📋 [Approval] Assigning modules for ${orgType}: ${modulesEnabled.join(', ')}`);

            // Save assigned modules to application so registration completion can use them
            application.modulesEnabled = modulesEnabled;
            application.organization_type = orgType; // Normalize case

            // Generate secure token
            const token = crypto.randomBytes(32).toString('hex');
            const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const approvalToken = new OrganizationApprovalToken({
                application_id: application._id,
                token,
                expires_at
            });
            await approvalToken.save();

            // Update application status
            application.status = 'approved';
            await application.save();

            // Send approval email with link
            const baseUrl = process.env.CLIENT_URL || 'https://smartlms.com';
            const setupLink = `${baseUrl.replace(/\/$/, '')}/complete-registration?token=${token}`;
            const emailSent = await emailService.sendApprovalEmail(application.admin_email, setupLink);
            if (!emailSent) {
                console.warn('⚠️ [PlatformApplication] Approval email failed to send.');
            }

            return res.success({
                application,
                token,
                setupLink,
                emailSent,
                modulesEnabled
            }, 'Application approved successfully');
        } catch (error) {
            console.error('❌ [Approval Error]:', error);
            return res.error(error.message || 'Internal Server Error', 'Failed to approve application', 500);
        }
    }

    /**
     * Reject an application
     */
    async rejectApplication(req, res) {
        try {
            const { id } = req.params;
            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            application.status = 'rejected';
            await application.save();

            return res.success(application, 'Application rejected successfully');
        } catch (error) {
            console.error('Reject application error:', error);
            return res.error(error.message, 'Failed to reject application', 400);
        }
    }
}

module.exports = new PlatformApplicationController();
