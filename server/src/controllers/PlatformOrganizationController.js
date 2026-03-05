const { Organization, User, Course } = require('../models');
const BaseController = require('../core/BaseController');

class PlatformOrganizationController extends BaseController {
  async createOrganization(req, res) {
    try {
      console.log('🚀 [PlatformOrgController] createOrganization called');
      console.log('   Body:', JSON.stringify(req.body, null, 2));
      const { name, subdomain, adminEmail, adminName, password, plan = 'basic', type = 'School' } = req.body;

      // Check if organization exists
      const existingOrg = await Organization.findOne({ subdomain: subdomain.toLowerCase() });
      if (existingOrg) {
        return this.sendError(res, 'Subdomain already in use', 400);
      }

      // Check if admin user exists
      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        return this.sendError(res, 'Admin email already registered', 400);
      }

      // Lookup template for the requested type so we can seed modules
      const OrgTemplate = require('../models/OrgTemplate');
      const template = await OrgTemplate.findOne({ type });

      // 1. Create Organization
      const organization = new Organization({
        name,
        email: adminEmail.toLowerCase(),
        subdomain: subdomain.toLowerCase(),
        plan,
        status: 'active',
        type: type.toUpperCase(), // Ensure uppercase to match model enum
        modulesEnabled: template ? template.modulesEnabled : [],
        templateVersion: template ? template._id : undefined
      });
      await organization.save();

      // 2. Create First Org Admin
      const admin = new User({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password_hash: password, // Will be hashed by pre-save hook
        role: 'org_admin',
        organization_id: organization._id,
        status: 'active',
        email_verified: true
      });
      await admin.save();

      // 3. Link Admin to Organization
      organization.admin_user_id = admin._id;
      await organization.save();

      // 4. Notify User of Account Creation
      try {
        const emailService = require('../services/email.service');
        const { generateUserCreationTemplate } = emailService;
        const html = generateUserCreationTemplate(adminName, 'Organization Admin', name);
        await emailService.sendEmail({
          to: adminEmail,
          subject: 'Welcome to Smart LMS - Account Created',
          html
        });
      } catch (notifyErr) {
        console.warn('⚠️ User creation notification failed:', notifyErr.message);
      }

      return this.sendSuccess(res, {
        organization,
        admin: admin.toPublicJSON()
      }, 'Organization and Admin created successfully', 201);
    } catch (error) {
      console.error('Create organization error:', error);
      return this.sendError(res, error.message, 500, { stack: error.stack });
    }
  }

  async createOrganizationWithInvite(req, res) {
    try {
      const { orgName, orgType, adminName, adminEmail } = req.body;

      if (!orgName || !orgType || !adminName || !adminEmail) {
        return this.sendError(res, 'All fields are required', 400);
      }

      // Check if admin user exists
      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        return this.sendError(res, 'Admin email already registered', 409);
      }

      // 1. Create Organization with status PENDING
      // Generating a temporary subdomain/slug from name if not provided
      const subdomain = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const organization = new Organization({
        name: orgName,
        email: adminEmail.toLowerCase(),
        type: orgType.toUpperCase(),
        subdomain: `${subdomain}-${Math.random().toString(36).substring(2, 7)}`, // Ensure uniqueness for now
        status: 'pending',
        created_by: req.user?._id
      });
      await organization.save();

      // 2. Create Org Admin user with status PENDING
      const inviteToken = require('crypto').randomBytes(32).toString('hex');
      const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const admin = new User({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password_hash: null, // No password yet
        role: 'org_admin',
        organization_id: organization._id,
        status: 'pending',
        email_verified: false,
        inviteToken,
        inviteTokenExpiry
      });
      await admin.save();

      // 3. Link Admin to Organization
      organization.admin_user_id = admin._id;
      await organization.save();

      const emailService = require('../services/email.service');
      const { generateInvitationTemplate } = emailService;
      const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
      const setupLink = `${baseUrl}/org/setup?token=${inviteToken}`;

      let emailSent = false;
      try {
        const html = generateInvitationTemplate(orgName, setupLink);
        emailSent = await emailService.sendEmail({
          to: adminEmail,
          subject: `You're invited to join ${orgName} - Smart LMS`,
          html
        });
      } catch (emailError) {
        console.error('📧 [PORTAL] Failed to send invitation email:', emailError.message);
      }

      return this.sendSuccess(res, {
        organization: {
          id: organization._id,
          name: organization.name,
          status: organization.status
        },
        setupLink, // Return link so admin can share it manually if email fails
        emailSent,
        warning: !emailSent ? 'Organization created but invitation email failed to send. Please share the setup link manually.' : null
      }, emailSent
        ? 'Organization created and invitation sent successfully'
        : 'Organization created but invitation email failed. You can copy the setup link below.', 201);
    } catch (error) {
      console.error('Create organization with invite error:', error);
      return this.sendError(res, error.message, 500);
    }
  }

  async listOrganizations(req, res) {
    try {
      const { page = 1, limit = 10, search, status, plan, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Plan filter
      if (plan) {
        query.plan = plan;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const organizations = await Organization.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      const total = await Organization.countDocuments(query);

      // Get user counts for each organization
      const orgsWithCounts = await Promise.all(
        organizations.map(async (org) => {
          const userCount = await User.countDocuments({ organization_id: org._id });
          const courseCount = await Course.countDocuments({ organization_id: org._id });
          return {
            ...org,
            userCount,
            courseCount
          };
        })
      );

      return this.sendSuccess(res, {
        organizations: orgsWithCounts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }, 'Organizations retrieved successfully');
    } catch (error) {
      console.error('Get organizations error:', error);
      return this.sendError(res, error.message, 500);
    }
  }

  async getOrganizationStats(req, res) {
    try {
      const [total, active, suspended, basic, premium] = await Promise.all([
        Organization.countDocuments({ is_deleted: { $ne: true } }),
        Organization.countDocuments({ is_deleted: { $ne: true }, status: 'active' }),
        Organization.countDocuments({ is_deleted: { $ne: true }, status: 'suspended' }),
        Organization.countDocuments({ is_deleted: { $ne: true }, plan: 'basic' }),
        Organization.countDocuments({ is_deleted: { $ne: true }, plan: 'premium' })
      ]);

      return this.sendSuccess(res, {
        stats: {
          total,
          active,
          suspended,
          byPlan: {
            basic,
            premium
          }
        }
      }, 'Organization statistics retrieved successfully');
    } catch (error) {
      console.error('Get organization stats error:', error);
      return this.sendError(res, error.message, 500);
    }
  }

  async getOrganizationDetails(req, res) {
    try {
      const organization = await Organization.findById(req.params.id).lean();

      if (!organization) {
        return this.sendError(res, 'Organization not found', 404);
      }

      // Get additional stats
      const userCount = await User.countDocuments({ organization_id: organization._id });
      const courseCount = await Course.countDocuments({ organization_id: organization._id });

      return this.sendSuccess(res, {
        ...organization,
        userCount,
        courseCount
      }, 'Organization retrieved successfully');
    } catch (error) {
      console.error('Get organization error:', error);
      return this.sendError(res, error.message, 500);
    }
  }

  async updateOrganization(req, res) {
    try {
      const organization = await Organization.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!organization) {
        return this.sendError(res, 'Organization not found', 404);
      }

      return this.sendSuccess(res, organization, 'Organization updated successfully');
    } catch (error) {
      console.error('Update organization error:', error);
      return this.sendError(res, error.message, 400);
    }
  }

  async suspendOrganization(req, res) {
    try {
      const organization = await Organization.findByIdAndUpdate(
        req.params.id,
        { status: 'suspended', updated_at: new Date() },
        { new: true }
      );

      if (!organization) {
        return this.sendError(res, 'Organization not found', 404);
      }

      return this.sendSuccess(res, organization, 'Organization suspended successfully');
    } catch (error) {
      console.error('Suspend organization error:', error);
      return this.sendError(res, error.message, 400);
    }
  }

  async activateOrganization(req, res) {
    try {
      const organization = await Organization.findByIdAndUpdate(
        req.params.id,
        { status: 'active', updated_at: new Date() },
        { new: true }
      );

      if (!organization) {
        return this.sendError(res, 'Organization not found', 404);
      }

      return this.sendSuccess(res, organization, 'Organization activated successfully');
    } catch (error) {
      console.error('Activate organization error:', error);
      return this.sendError(res, error.message, 400);
    }
  }

  async deleteOrganization(req, res) {
    try {
      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        return this.sendError(res, 'Organization not found', 404);
      }

      // Soft delete
      organization.is_deleted = true;
      organization.deleted_at = new Date();
      organization.deleted_by = req.user._id;
      await organization.save();

      return this.sendSuccess(res, organization, 'Organization deleted successfully');
    } catch (error) {
      console.error('Delete organization error:', error);
      return this.sendError(res, error.message, 400);
    }
  }
}

module.exports = new PlatformOrganizationController();
