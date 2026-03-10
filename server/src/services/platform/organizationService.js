const { Organization, User, Course, AuditLog } = require('../../models');
const crypto = require('crypto');
const emailService = require('../email.service');

/**
 * Platform Organization Service
 * Handles institutional lifecycle management
 */
class OrganizationService {
  /**
   * Create a new organization entity
   */
  async createOrganization(data, actor) {
    try {
      const { name, subdomain, email, type, plan, maxStudents, maxInstructors } = data;

      // Uniqueness check
      const existing = await Organization.findOne({ subdomain: subdomain.toLowerCase() });
      if (existing) throw new Error('Subdomain protocol conflict: already in use');

      const organization = new Organization({
        name,
        subdomain: subdomain.toLowerCase(),
        email: email.toLowerCase(),
        type: type || 'COLLEGE',
        plan: plan || 'basic',
        limits: {
          students: maxStudents || 1000,
          instructors: maxInstructors || 50
        },
        status: 'active',
        created_by: actor._id
      });

      await organization.save();

      // Audit Log
      await AuditLog.create({
        user_id: actor._id,
        user_email: actor.email,
        user_role: actor.role,
        action: 'CREATE',
        resource: 'organization',
        resource_id: organization._id.toString(),
        details: { name, subdomain, type, plan }
      });

      return organization;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List organizations with advanced filtering
   */
  async listOrganizations(filters = {}) {
    try {
      const { page = 1, limit = 10, search, status, plan } = filters;
      const query = { is_deleted: { $ne: true } };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { subdomain: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) query.status = status;
      if (plan) query.plan = plan;

      const total = await Organization.countDocuments(query);
      const organizations = await Organization.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      return { organizations, total };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get exhaustive organization details
   */
  async getDetails(orgId) {
    const org = await Organization.findById(orgId).lean();
    if (!org) throw new Error('Organization not found');

    const [userCount, courseCount] = await Promise.all([
      User.countDocuments({ organization_id: orgId, is_deleted: { $ne: true } }),
      Course.countDocuments({ organization_id: orgId, is_deleted: { $ne: true } })
    ]);

    return { ...org, userCount, courseCount };
  }

  /**
   * Update organization parameters
   */
  async updateOrganization(orgId, data, actor) {
    const org = await Organization.findByIdAndUpdate(orgId, { ...data, updated_at: new Date() }, { new: true });
    if (!org) throw new Error('Organization not found');

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: 'UPDATE',
      resource: 'organization',
      resource_id: orgId,
      details: data
    });

    return org;
  }

  /**
   * Suspend/Activate organization
   */
  async updateStatus(orgId, status, actor) {
    const org = await Organization.findByIdAndUpdate(orgId, { status, updated_at: new Date() }, { new: true });
    if (!org) throw new Error('Organization not found');

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: status === 'active' ? 'ACTIVATE' : 'SUSPEND',
      resource: 'organization',
      resource_id: orgId
    });

    return org;
  }

  /**
   * Soft delete organization node
   */
  async deleteOrganization(orgId, actor) {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error('Organization not found');

    org.is_deleted = true;
    org.deleted_at = new Date();
    org.deleted_by = actor._id;
    await org.save();

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: 'DELETE',
      resource: 'organization',
      resource_id: orgId
    });

    return org;
  }
  /**
   * Initiate organization invitation flow
   */
  async inviteOrganization(data, actor) {
    try {
      const { orgName, orgType, adminName, adminEmail } = data;

      if (!orgName || !orgType || !adminName || !adminEmail) {
        throw new Error('Incomplete protocol: all fields are required for invitation');
      }

      // Check if admin email is already registered
      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        throw new Error('Identity conflict: admin email already registered');
      }

      // 1. Create Organization with status PENDING
      const subdomainBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSubdomain = `${subdomainBase}-${crypto.randomBytes(3).toString('hex')}`;

      // Lookup template for modules (optional but recommended for seeding)
      let modulesEnabled = [];
      try {
        const OrgTemplate = require('../../models/OrgTemplate');
        const template = await OrgTemplate.findOne({ type: orgType.toUpperCase() });
        if (template) modulesEnabled = template.modulesEnabled;
      } catch (e) {
        console.warn('⚠️ Template lookup failed, using empty module list');
      }

      const organization = new Organization({
        name: orgName,
        email: adminEmail.toLowerCase(),
        type: orgType.toUpperCase(),
        subdomain: uniqueSubdomain,
        status: 'pending',
        modulesEnabled,
        created_by: actor._id
      });
      await organization.save();

      // 2. Create Org Admin user with status PENDING and Invite Token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const admin = new User({
        name: adminName,
        email: adminEmail.toLowerCase(),
        role: 'org_admin',
        organization_id: organization._id,
        status: 'pending',
        email_verified: false,
        inviteToken,
        inviteTokenExpiry
      });
      await admin.save();

      // Link Admin to Org
      organization.admin_user_id = admin._id;
      await organization.save();

      // 3. Dispatch Invitation Email
      const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
      const setupLink = `${baseUrl}/org/setup?token=${inviteToken}`;

      let emailSent = false;
      try {
        emailSent = await emailService.sendTemplatedEmail({
          to: adminEmail,
          templateName: 'invitation',
          data: {
            organizationName: orgName,
            link: setupLink
          }
        });
      } catch (emailErr) {
        console.error('❌ Email dispatch failed:', emailErr.message);
      }

      // Audit Log
      await AuditLog.create({
        user_id: actor._id,
        user_email: actor.email,
        user_role: actor.role,
        action: 'INVITE',
        resource: 'organization',
        resource_id: organization._id.toString(),
        details: { orgName, orgType, adminEmail, emailSent, setupLink }
      });

      return {
        organization: {
          id: organization._id,
          name: organization.name,
          status: organization.status
        },
        setupLink,
        emailSent
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrganizationService();
