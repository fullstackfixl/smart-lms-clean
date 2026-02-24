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
     * Approve an application
     */
    async approveApplication(req, res) {
        try {
            const { id } = req.params;
            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            // Allow re-approval email if already approved
            if (application.status === 'rejected') {
                return res.error('Application already processed', 'Validation Error', 400);
            }

            // Generate secure token
            const token = crypto.randomBytes(32).toString('hex');
            const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const approvalToken = new OrganizationApprovalToken({
                application_id: application._id,
                token,
                expires_at
            });
            await approvalToken.save();

            // Update application status if still pending
            if (application.status === 'pending') {
                application.status = 'approved';
                await application.save();
            }

            // Send approval email with link
            const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
            const setupLink = `${clientUrl}/complete-registration?token=${token}`;
            const sent = await emailService.sendApprovalEmail(application.admin_email, setupLink);
            if (!sent) {
                console.warn('⚠️ [PlatformApplicationController] Approval email could not be sent. Check SMTP/EMAIL env config.');
            }

            return res.success({ application, token, setupLink }, 'Application approved successfully');
        } catch (error) {
            console.error('Approve application error:', error);
            return res.error(error.message, 'Failed to approve application', 400);
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
