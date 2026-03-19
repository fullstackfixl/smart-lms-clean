const { OrganizationApplication, OrganizationApprovalToken } = require('../models');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const BaseController = require('../core/BaseController');

class PlatformApplicationController extends BaseController {
    /**
     * Get all organization applications (for platform staff and admin)
     */
    async getApplications(req, res) {
        try {
            const { status, page = 1, limit = 10, assigned = 'all', search = '' } = req.query;
            const query = {};
            
            // Filter by status if provided
            if (status && status !== 'all') {
                query.status = status;
            }

            if (assigned === 'mine') {
                query.assigned_to = req.user._id;
            } else if (assigned === 'unassigned') {
                query.assigned_to = null;
            }

            if (search) {
                query.$or = [
                    { organization_name: { $regex: search, $options: 'i' } },
                    { contact_person_name: { $regex: search, $options: 'i' } },
                    { contact_email: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } }
                ];
            }

            const applications = await OrganizationApplication.find(query)
                .populate('assigned_to', 'name email role')
                .populate('approved_by', 'name email role')
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
     * Claim an application (assign to self - for platform staff)
     */
    async claimApplication(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            if (application.assigned_to && application.assigned_to.toString() !== userId.toString()) {
                return res.error('Application is already assigned to another staff', 'Validation Error', 400);
            }

            application.assigned_to = userId;
            await application.save();

            return res.success({ application }, 'Application claimed successfully');
        } catch (error) {
            console.error('Claim application error:', error);
            return res.error(error.message, 'Failed to claim application', 500);
        }
    }

    /**
     * Mark application as contacted (platform staff action)
     */
    async contactApplication(req, res) {
        try {
            const { id } = req.params;
            const { contact_notes, follow_up_date } = req.body;
            const userId = req.user.id;

            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            // Staff can only contact applications assigned to them or unassigned
            if (application.assigned_to && application.assigned_to.toString() !== userId.toString()) {
                return res.error('Application is assigned to another staff', 'Validation Error', 400);
            }

            // Update status to contacted
            application.status = 'contacted';
            application.assigned_to = userId;
            application.contact_notes = contact_notes || '';
            application.follow_up_date = follow_up_date ? new Date(follow_up_date) : null;
            await application.save();

            return res.success({ application }, 'Application marked as contacted');
        } catch (error) {
            console.error('Contact application error:', error);
            return res.error(error.message, 'Failed to update application', 500);
        }
    }

    /**
     * Approve an application — assigns template modules and sends account creation email
     */
    async approveApplication(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;
            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            if (application.status === 'approved' || application.status === 'account_created' || application.status === 'active') {
                return res.success({
                    application,
                    message: 'Application already approved'
                }, 'Application already processed');
            }

            if (application.status !== 'pending' && application.status !== 'contacted') {
                return res.error(`Cannot approve application with status: ${application.status}`, 'Validation Error', 400);
            }

            const applicationOrgType = (application.organization_type || 'school').toLowerCase();
            const templateOrgType = applicationOrgType.toUpperCase();

            // Lookup template for the requested type
            const OrgTemplate = require('../models/OrgTemplate');
            const template = await OrgTemplate.findOne({ type: templateOrgType });

            const modulesEnabled = template ? template.modulesEnabled : [];

            // Save assigned modules
            application.modulesEnabled = modulesEnabled;
            // Keep stored value aligned with OrganizationApplication enum (lowercase)
            application.organization_type = applicationOrgType;

            // Generate secure token for account setup
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
            application.approved_by = adminId;
            application.approved_at = new Date();
            await application.save();

            // Send approval email with account creation link
            const baseUrl = process.env.CLIENT_URL || 'https://smartlms.com';
            const setupLink = `${baseUrl.replace(/\/$/, '')}/org-admin/setup?token=${token}`;

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">🎉 Organization Approved!</h2>
                    <p>Dear ${application.contact_person_name},</p>
                    <p>Great news! Your organization <strong>${application.organization_name}</strong> has been approved.</p>
                    <p>Click the button below to create your organization admin account:</p>
                    <div style="margin: 20px 0;">
                        <a href="${setupLink}" style="background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create Admin Account</a>
                    </div>
                    <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
            `;

            let emailSent = false;
            try {
                emailSent = await emailService.sendEmail({
                    to: application.contact_email,
                    subject: `Your Organization "${application.organization_name}" Has Been Approved - Create Account`,
                    html
                });

                if (!emailSent) {
                    console.warn('⚠️ [PlatformApplication] Approval email failed to send.');
                }
            } catch (mailErr) {
                console.warn('⚠️ [PlatformApplication] Approval email threw error:', mailErr.message);
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
     * Reject an application with reason
     */
    async rejectApplication(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.user.id;

            const application = await OrganizationApplication.findById(id);

            if (!application) {
                return res.error('Application not found', 'Not found', 404);
            }

            if (application.status === 'approved' || application.status === 'account_created' || application.status === 'active') {
                return res.error('Cannot reject an already approved application', 'Validation Error', 400);
            }

            application.status = 'rejected';
            application.rejection_reason = reason || 'No reason provided';
            await application.save();

            // Send rejection email
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ef4444;">Application Update</h2>
                    <p>Dear ${application.contact_person_name},</p>
                    <p>Thank you for your interest in Smart LMS.</p>
                    <p>Unfortunately, your application for <strong>${application.organization_name}</strong> was not approved at this time.</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                    <p>If you have any questions, please contact our support team.</p>
                    <p style="margin-top: 20px;">Best regards,<br/>Smart LMS Team</p>
                </div>
            `;

            await emailService.sendEmail({
                to: application.contact_email,
                subject: `Update on Your Application for "${application.organization_name}"`,
                html
            });

            return res.success(application, 'Application rejected successfully');
        } catch (error) {
            console.error('Reject application error:', error);
            return res.error(error.message, 'Failed to reject application', 400);
        }
    }
}

module.exports = new PlatformApplicationController();
