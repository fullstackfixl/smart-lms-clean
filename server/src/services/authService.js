const { User, Organization, Invite, OrganizationApplication, OrganizationApprovalToken } = require('../models');
const jwtUtils = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AuthenticationError, ValidationError, NotFoundError } = require('../core/errors');
const emailService = require('./emailService');

class AuthService {
  /**
   * Redirect logic based on role
   */
  getRedirectUrl(role) {
    const redirects = {
      'platform_admin': '/platform/dashboard',
      'org_admin': '/organization/dashboard',
      'instructor': '/instructor/dashboard',
      'student': '/student/dashboard',
      'parent': '/parent/dashboard',
      'support_staff': '/support/dashboard'
    };
    return redirects[role] || '/dashboard';
  }

  /**
   * Unified login
   */
  async login(email, password, mfaCode) {
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash +mfa_secret');
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check user status
    if (user.status !== 'active') {
      throw new AuthenticationError(`Account is ${user.status}. Please contact support.`);
    }
    // Require verified email
    if (!user.email_verified) {
      throw new AuthenticationError('Email not verified. Please complete setup.');
    }

    // Check organization status (if not platform admin)
    if (user.role !== 'platform_admin' && user.organization_id) {
      const org = await Organization.findById(user.organization_id);
      if (!org || org.status !== 'active') {
        throw new AuthenticationError('Organization is suspended or inactive. Please contact your administrator.');
      }
    }

    // MFA check (if enabled)
    if (user.mfa_enabled) {
      if (!mfaCode) {
        throw new AuthenticationError('MFA code required');
      }
      // Simple MFA verification logic (placeholder for actual implementation)
    }

    // Generate token
    const token = jwtUtils.generateToken({
      user_id: user._id,
      role: user.role,
      organization_id: user.organization_id,
      subdomain: user.role !== 'platform_admin' ? (await Organization.findById(user.organization_id))?.subdomain : null
    });

    return {
      token,
      role: user.role,
      redirectUrl: this.getRedirectUrl(user.role),
      user: user.toPublicJSON()
    };
  }

  /**
   * Submit Organization Application
   */
  async applyOrganization(data) {
    const { organizationName, subdomain, adminName, adminEmail, selectedPlan } = data;
    // Generate a route-friendly slug from organizationName if subdomain not provided
    let routeSlug = (subdomain || organizationName || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `org-${Date.now()}`;

    // No subdomain logic: do not block on slug conflicts; rely on admin email uniqueness in pending queue

    // Check if application already exists
    const existingApp = await OrganizationApplication.findOne({
      admin_email: adminEmail.toLowerCase(),
      status: 'pending'
    });
    if (existingApp) {
      return existingApp;
    }

    // Ensure slug uniqueness against existing applications and organizations
    const slugExists = async (slug) => {
      const existsApp = await OrganizationApplication.findOne({ subdomain: slug });
      const existsOrg = await Organization.findOne({ subdomain: slug });
      return !!(existsApp || existsOrg);
    };
    let attempt = 0;
    const baseSlug = routeSlug;
    while (await slugExists(routeSlug)) {
      attempt += 1;
      routeSlug = `${baseSlug}-${attempt}`;
      if (attempt > 10) {
        routeSlug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    // Create Application
    const application = new OrganizationApplication({
      organization_name: organizationName,
      subdomain: routeSlug, // store route-friendly slug for consistency
      admin_name: adminName,
      admin_email: adminEmail.toLowerCase(),
      selected_plan: selectedPlan
    });
    await application.save();

    // Notify Platform Admin via email (simple notification)
    try {
      const adminNotifyEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
      if (adminNotifyEmail) {
        const baseUrl = (process.env.CLIENT_URL || 'https://smartlms.com').replace(/\/$/, '');
        const listLink = `${baseUrl}/platform/applications?status=pending`;
        const subject = 'New Organization Application Submitted';
        const text = `A new organization application has been submitted.\n\nOrganization: ${organizationName}\nRoute: /org/${routeSlug}\nAdmin: ${adminName} <${adminEmail}>\nPlan: ${selectedPlan}\n\nReview pending applications:\n${listLink}`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color:#2563eb;margin-bottom:8px;">New Organization Application</h2>
            <p><strong>Organization:</strong> ${organizationName}</p>
            <p><strong>Route:</strong> /org/${routeSlug}</p>
            <p><strong>Admin:</strong> ${adminName} &lt;${adminEmail}&gt;</p>
            <p><strong>Plan:</strong> ${selectedPlan}</p>
            <div style="margin:20px 0;">
              <a href="${listLink}" style="background-color:#2563eb;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">Review Applications</a>
            </div>
          </div>
        `;
        await emailService.sendEmail(adminNotifyEmail, subject, text, html);
      }
    } catch (notifyErr) {
      console.error('⚠️ Notify platform admin failed:', notifyErr.message);
    }

    return application;
  }

  /**
   * Complete Organization Registration (Set Password)
   */
  async completeOrganizationRegistration(data) {
    const { token, password } = data;

    // Find and validate token
    const approvalToken = await OrganizationApprovalToken.findOne({
      token,
      used: false,
      expires_at: { $gt: new Date() }
    });
    if (!approvalToken) {
      const foundToken = await OrganizationApprovalToken.findOne({ token });
      if (foundToken && foundToken.expires_at <= new Date()) {
        const { AppError } = require('../core/errors');
        throw new AppError('Registration token expired', 410, 'TOKEN_EXPIRED');
      }
      throw new ValidationError('Invalid or expired registration token');
    }

    // Get Application data
    const application = await OrganizationApplication.findById(approvalToken.application_id);
    if (!application || application.status !== 'approved') {
      throw new ValidationError('Application not found or not approved');
    }

    // Check if organization was already created (safety)
    const existingOrg = await Organization.findOne({ subdomain: application.subdomain });
    if (existingOrg) {
      throw new ValidationError('Organization already created');
    }

    // Hash password securely
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 1. Create Organization
    const organization = new Organization({
      name: application.organization_name,
      subdomain: application.subdomain,
      plan: application.selected_plan,
      status: 'active'
    });
    await organization.save();

    // 2. Create Org Admin User
    const admin = new User({
      name: application.admin_name,
      email: application.admin_email,
      password_hash: passwordHash,
      role: 'org_admin',
      organization_id: organization._id,
      organization_code: organization.code || organization.organization_code,
      status: 'active',
      email_verified: true
    });
    await admin.save();

    // 3. Link Admin to Organization
    organization.admin_user_id = admin._id;
    await organization.save();

    // 4. Mark token as used
    approvalToken.used = true;
    await approvalToken.save();

    // Notify Platform Admin that organization has been created
    try {
      const adminNotifyEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
      if (adminNotifyEmail) {
        const subject = 'Organization Created Successfully';
        const baseUrl = (process.env.CLIENT_URL || 'https://smartlms.com').replace(/\/$/, '');
        const orgLink = `${baseUrl}/platform/organizations`;
        const text = `A new organization has been created.\n\nOrganization: ${organization.name}\nSubdomain: ${organization.subdomain}\nAdmin: ${admin.name} <${admin.email}>\nPlan: ${organization.plan}\n\nManage organizations:\n${orgLink}`;
        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#16a34a;margin-bottom:8px;">Organization Created</h2>
            <p><strong>Organization:</strong> ${organization.name}</p>
            <p><strong>Subdomain:</strong> ${organization.subdomain}</p>
            <p><strong>Admin:</strong> ${admin.name} &lt;${admin.email}&gt;</p>
            <p><strong>Plan:</strong> ${organization.plan}</p>
            <div style="margin:20px 0;">
              <a href="${orgLink}" style="background-color:#2563eb;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">View Organizations</a>
            </div>
          </div>
        `;
        await emailService.sendEmail(adminNotifyEmail, subject, text, html);
      }
    } catch (notifyErr) {
      console.error('⚠️ Notify platform admin of creation failed:', notifyErr.message);
    }

    // Generate login response
    return this.login(admin.email, password);
  }

  /**
   * Register Student/Parent via Subdomain
   */
  async registerUser(data) {
    const { role, name, email, password, orgSubdomain } = data;

    if (!['student', 'parent'].includes(role)) {
      throw new ValidationError('Invalid role for self-signup');
    }

    // Find organization
    const org = await Organization.findOne({ subdomain: orgSubdomain.toLowerCase() });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    // Check email uniqueness within org
    const existingUser = await User.findOne({ email: email.toLowerCase(), organization_id: org._id });
    if (existingUser) {
      throw new ValidationError('Email already registered in this organization');
    }

    // Hash password securely
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      organization_id: org._id,
      status: 'active',
      email_verified: false
    });
    await user.save();

    return user.toPublicJSON();
  }

  /**
   * Invite Staff/Instructor (Org Admin only)
   */
  async inviteStaff(orgId, inviteData) {
    const { email, role } = inviteData;

    if (!['instructor', 'support_staff'].includes(role)) {
      throw new ValidationError('Invalid role for staff invitation');
    }

    // Check if user already exists in this org
    const existingUser = await User.findOne({ email: email.toLowerCase(), organization_id: orgId });
    if (existingUser) {
      throw new ValidationError('User already exists in this organization');
    }

    // Check if active invite already exists
    const existingInvite = await Invite.findOne({
      email: email.toLowerCase(),
      organization_id: orgId,
      used: false,
      expires_at: { $gt: new Date() }
    });

    if (existingInvite) {
      return existingInvite; // Return existing invite if still valid
    }

    // Create new invite
    const token = crypto.randomBytes(32).toString('hex');
    const invite = new Invite({
      email: email.toLowerCase(),
      role,
      organization_id: orgId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await invite.save();

    return invite;
  }

  /**
   * Accept Invite (Staff/Instructor)
   */
  async acceptInvite(data) {
    const { token, name, password } = data;

    // Find invite
    const invite = await Invite.findOne({ token, used: false, expires_at: { $gt: new Date() } });
    if (!invite) {
      throw new ValidationError('Invalid or expired invitation token');
    }

    // Check if user already exists
    let user = await User.findOne({ email: invite.email, organization_id: invite.organization_id });
    if (user) {
      throw new ValidationError('User already exists');
    }

    // Hash password securely
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const organization = await Organization.findById(invite.organization_id);
    user = new User({
      name,
      email: invite.email,
      password_hash: passwordHash,
      role: invite.role,
      organization_id: invite.organization_id,
      organization_code: organization?.code || organization?.organization_code || invite.organization_code,
      status: 'active',
      email_verified: true
    });
    await user.save();

    // Mark invite as used
    invite.used = true;
    await invite.save();

    return user.toPublicJSON();
  }
}

module.exports = new AuthService();
