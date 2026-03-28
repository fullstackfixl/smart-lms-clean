const crypto = require('crypto');
const { OrganizationApplication, OrganizationApprovalToken, PlatformAuditLog } = require('../models');
const emailService = require('../services/email.service');
const BaseController = require('../core/BaseController');

const ALLOWED_STAFF_STATUSES = ['pending', 'contacted', 'negotiation', 'ready_for_approval'];
const STATUS_FLOW = {
  pending: ['contacted'],
  contacted: ['negotiation', 'ready_for_approval'],
  negotiation: ['ready_for_approval', 'contacted'],
  ready_for_approval: []
};

function serializeApplication(application) {
  if (!application) return null;
  const data = typeof application.toObject === 'function'
    ? application.toObject({ virtuals: true })
    : { ...application };

  return {
    ...data,
    orgName: data.organization_name,
    contactPerson: data.contact_person_name,
    email: data.contact_email,
    phone: data.contact_phone,
    assignedTo: data.assigned_to || data.assignedTo || null,
    followUpAt: data.follow_up_date || data.followUpAt || null,
    activityLog: Array.isArray(data.activityLog) ? data.activityLog : [],
    notes: Array.isArray(data.notes) ? data.notes : []
  };
}

function pushActivity(application, { action, details = {}, user }) {
  application.activityLog = application.activityLog || [];
  application.activityLog.push({
    action,
    details,
    created_by: user?._id || null,
    created_by_role: user?.role || null,
    created_at: new Date()
  });
}

function pushNote(application, { text, type = 'note', user }) {
  application.notes = application.notes || [];
  application.notes.push({
    text,
    type,
    created_by: user?._id || null,
    created_by_role: user?.role || null,
    created_at: new Date()
  });
}

function ensureStaffOwnership(application, user, allowAutoAssign = true) {
  if (['platform_admin', 'platformAdmin'].includes(user.role)) {
    return true;
  }

  if (application.assigned_to && application.assigned_to.toString() !== user._id.toString()) {
    return false;
  }

  if (allowAutoAssign && !application.assigned_to) {
    application.assigned_to = user._id;
    application.assigned_at = application.assigned_at || new Date();
  }

  return true;
}

class PlatformApplicationController extends BaseController {
  async getApplications(req, res) {
    return this.listApplications(req, res);
  }

  async listApplications(req, res) {
    try {
      const { status, page = 1, limit = 10, assigned = 'all', search = '', priority } = req.query;
      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (priority && priority !== 'all') {
        query.priority = priority;
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
          { contact_phone: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { state: { $regex: search, $options: 'i' } }
        ];
      }

      const applications = await OrganizationApplication.find(query)
        .populate('assigned_to', 'name email role profilePicture profile')
        .populate('approved_by', 'name email role')
        .sort({ created_at: -1 })
        .limit(parseInt(limit, 10))
        .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
        .lean();

      const total = await OrganizationApplication.countDocuments(query);

      return res.success({
        applications: applications.map(serializeApplication),
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      }, 'Applications retrieved successfully');
    } catch (error) {
      console.error('Get applications error:', error);
      return res.error(error.message, 'Failed to retrieve applications', 500);
    }
  }

  async getApplication(req, res) {
    try {
      const application = await OrganizationApplication.findById(req.params.id)
        .populate('assigned_to', 'name email role profilePicture profile')
        .populate('approved_by', 'name email role')
        .lean();

      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      return res.success({ application: serializeApplication(application) }, 'Application retrieved successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to retrieve application', 500);
    }
  }

  async claimApplication(req, res) {
    try {
      const application = await OrganizationApplication.findById(req.params.id);

      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (!ensureStaffOwnership(application, req.user, true)) {
        return res.error('Application is already assigned to another staff member', 'Validation Error', 400);
      }

      application.assigned_to = req.user._id;
      application.assigned_at = application.assigned_at || new Date();
      pushActivity(application, {
        action: 'claimed',
        details: { assignedTo: req.user._id },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_claimed',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { assignedTo: req.user._id }
      });

      return res.success({ application: serializeApplication(application) }, 'Application claimed successfully');
    } catch (error) {
      console.error('Claim application error:', error);
      return res.error(error.message, 'Failed to claim application', 500);
    }
  }

  async updatePriority(req, res) {
    try {
      const { priority } = req.body || {};
      if (!['hot', 'warm', 'cold'].includes(priority)) {
        return res.error('Invalid priority. Use hot, warm, or cold', 'Validation Error', 400);
      }

      const application = await OrganizationApplication.findById(req.params.id);
      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (!ensureStaffOwnership(application, req.user, true)) {
        return res.error('Application is assigned to another staff member', 'Validation Error', 400);
      }

      application.priority = priority;
      pushActivity(application, {
        action: 'priority_updated',
        details: { priority },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_priority_updated',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { priority }
      });

      return res.success({ application: serializeApplication(application) }, 'Priority updated successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to update priority', 500);
    }
  }

  async setFollowUp(req, res) {
    try {
      const { follow_up_date } = req.body || {};
      const application = await OrganizationApplication.findById(req.params.id);
      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (!ensureStaffOwnership(application, req.user, true)) {
        return res.error('Application is assigned to another staff member', 'Validation Error', 400);
      }

      application.follow_up_date = follow_up_date ? new Date(follow_up_date) : null;
      pushActivity(application, {
        action: 'follow_up_updated',
        details: { followUpDate: application.follow_up_date },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_follow_up_updated',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { followUpDate: application.follow_up_date }
      });

      return res.success({ application: serializeApplication(application) }, 'Follow-up updated successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to update follow-up', 500);
    }
  }

  async addNote(req, res) {
    try {
      const { text, type = 'note' } = req.body || {};
      if (!text || !String(text).trim()) {
        return res.error('Note text is required', 'Validation Error', 400);
      }

      const application = await OrganizationApplication.findById(req.params.id);
      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (!ensureStaffOwnership(application, req.user, true)) {
        return res.error('Application is assigned to another staff member', 'Validation Error', 400);
      }

      pushNote(application, { text: String(text).trim(), type, user: req.user });
      pushActivity(application, {
        action: type === 'call' ? 'call_logged' : 'note_added',
        details: { text: String(text).trim(), type },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_note_added',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { type, text: String(text).trim() }
      });

      return res.success({ application: serializeApplication(application) }, 'Note added successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to add note', 500);
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body || {};
      const application = await OrganizationApplication.findById(req.params.id);
      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      const normalized = String(status || '').toLowerCase();
      if (!normalized || !Object.keys(STATUS_FLOW).includes(normalized)) {
        return res.error('Invalid application status', 'Validation Error', 400);
      }

      const isAdmin = ['platform_admin', 'platformAdmin'].includes(req.user.role);
      if (!isAdmin) {
        if (!ALLOWED_STAFF_STATUSES.includes(normalized)) {
          return res.error('Staff cannot move application to that status', 'Access denied', 403);
        }
        if (!ensureStaffOwnership(application, req.user, true)) {
          return res.error('Application is assigned to another staff member', 'Validation Error', 400);
        }
        const allowedNext = STATUS_FLOW[application.status] || [];
        if (application.status !== normalized && !allowedNext.includes(normalized)) {
          return res.error(`Invalid status transition from ${application.status} to ${normalized}`, 'Validation Error', 400);
        }
      } else if (['approved', 'rejected'].includes(normalized) && application.status === 'pending') {
        // platform admin can override directly
      }

      if (!isAdmin && ['approved', 'rejected'].includes(normalized)) {
        return res.error('Staff cannot approve or reject applications', 'Access denied', 403);
      }

      application.status = normalized;
      pushActivity(application, {
        action: 'status_updated',
        details: { status: normalized },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_status_updated',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { status: normalized }
      });

      return res.success({ application: serializeApplication(application) }, 'Application status updated successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to update application status', 500);
    }
  }

  async contactApplication(req, res) {
    try {
      const { id } = req.params;
      const { contact_notes, follow_up_date } = req.body;
      const application = await OrganizationApplication.findById(id);

      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (!ensureStaffOwnership(application, req.user, true)) {
        return res.error('Application is assigned to another staff member', 'Validation Error', 400);
      }

      application.assigned_to = req.user._id;
      application.assigned_at = application.assigned_at || new Date();
      application.status = 'contacted';
      if (contact_notes) {
        application.contact_notes = contact_notes;
        pushNote(application, { text: contact_notes, type: 'call', user: req.user });
      }
      if (follow_up_date) {
        application.follow_up_date = new Date(follow_up_date);
      }
      pushActivity(application, {
        action: 'contact_logged',
        details: {
          contact_notes: contact_notes || '',
          follow_up_date: application.follow_up_date
        },
        user: req.user
      });
      await application.save();

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_contacted',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { contact_notes: contact_notes || '', follow_up_date: application.follow_up_date }
      });

      return res.success({ application: serializeApplication(application) }, 'Application marked as contacted');
    } catch (error) {
      console.error('Contact application error:', error);
      return res.error(error.message, 'Failed to update application', 500);
    }
  }

  async approveApplication(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user._id;
      const application = await OrganizationApplication.findById(id);

      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (application.status === 'approved' || application.status === 'account_created' || application.status === 'active') {
        return res.success({
          application: serializeApplication(application),
          message: 'Application already approved'
        }, 'Application already processed');
      }

      if (application.status === 'rejected') {
        return res.error('Cannot approve a rejected application', 'Validation Error', 400);
      }

      const applicationOrgType = (application.organization_type || 'school').toLowerCase();
      const templateOrgType = applicationOrgType.toUpperCase();

      const OrgTemplate = require('../models/OrgTemplate');
      const template = await OrgTemplate.findOne({ type: templateOrgType });
      const modulesEnabled = template ? template.modulesEnabled : [];

      application.modulesEnabled = modulesEnabled;
      application.organization_type = applicationOrgType;

      const token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const approvalToken = new OrganizationApprovalToken({
        application_id: application._id,
        token,
        expires_at
      });
      await approvalToken.save();

      application.status = 'approved';
      application.approved_by = adminId;
      application.approved_at = new Date();
      pushActivity(application, {
        action: 'approved',
        details: { approved_by: adminId },
        user: req.user
      });
      await application.save();

      const baseUrl = process.env.CLIENT_URL || 'https://smartlms.com';
      const setupLink = `${baseUrl.replace(/\/$/, '')}/org-admin/setup?token=${token}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Organization Approved</h2>
          <p>Dear ${application.contact_person_name},</p>
          <p>Great news! Your organization <strong>${application.organization_name}</strong> has been approved.</p>
          <p>Click the button below to create your organization admin account:</p>
          <div style="margin: 20px 0;">
            <a href="${setupLink}" style="background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create Admin Account</a>
          </div>
          <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
        </div>
      `;

      let emailSent = false;
      try {
        emailSent = await emailService.sendEmail({
          to: application.contact_email,
          subject: `Your Organization "${application.organization_name}" Has Been Approved - Create Account`,
          html
        });
      } catch (mailErr) {
        console.warn('Approval email failed to send:', mailErr.message);
      }

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_approved',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { token, setupLink, emailSent }
      });

      return res.success({
        application: serializeApplication(application),
        token,
        setupLink,
        emailSent,
        modulesEnabled
      }, 'Application approved successfully');
    } catch (error) {
      console.error('Approval error:', error);
      return res.error(error.message || 'Internal Server Error', 'Failed to approve application', 500);
    }
  }

  async rejectApplication(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const application = await OrganizationApplication.findById(id);

      if (!application) {
        return res.error('Application not found', 'Not found', 404);
      }

      if (application.status === 'approved' || application.status === 'account_created' || application.status === 'active') {
        return res.error('Cannot reject an already approved application', 'Validation Error', 400);
      }

      application.status = 'rejected';
      application.rejection_reason = reason || 'No reason provided';
      pushActivity(application, {
        action: 'rejected',
        details: { reason: application.rejection_reason },
        user: req.user
      });
      await application.save();

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Application Update</h2>
          <p>Dear ${application.contact_person_name},</p>
          <p>Thank you for your interest in Smart LMS.</p>
          <p>Unfortunately, your application for <strong>${application.organization_name}</strong> was not approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `;

      try {
        await emailService.sendEmail({
          to: application.contact_email,
          subject: `Update on Your Application for "${application.organization_name}"`,
          html
        });
      } catch (mailErr) {
        console.warn('Rejection email failed to send:', mailErr.message);
      }

      await PlatformAuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'application_rejected',
        entityType: 'OrganizationApplication',
        entityId: application._id,
        details: { reason: application.rejection_reason }
      });

      return res.success({ application: serializeApplication(application) }, 'Application rejected successfully');
    } catch (error) {
      console.error('Reject application error:', error);
      return res.error(error.message, 'Failed to reject application', 400);
    }
  }
}

module.exports = new PlatformApplicationController();
