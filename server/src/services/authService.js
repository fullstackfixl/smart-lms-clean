const { User, Organization, Invite, OrganizationApplication, OrganizationApprovalToken } = require('../models');
const jwtUtils = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AuthenticationError, ValidationError, NotFoundError } = require('../core/errors');
const emailService = require('./email.service');

class AuthService {
  /**
   * Redirect logic based on role
   */
  getRedirectUrl(role) {
    const redirects = {
      'platform_admin': '/platform/dashboard',
      'platform_staff': '/platform/dashboard',
      'org_admin': '/org-admin/dashboard',
      'instructor': '/instructor/dashboard',
      'student': '/student/dashboard',
      'public_student': '/public/dashboard',
      'parent': '/parent/dashboard',
      'support_staff': '/support/dashboard'
    };
    return redirects[role] || '/dashboard';
  }

  /**
   * Strict role-separated login
   * - Enforces allowedRoles (403 on mismatch)
   * - Optionally requires organization_id
   * - Optionally normalizes role string in response/JWT
   */
  async loginStrict(email, password, mfaCode, options = {}) {
    const {
      allowedRoles = [],
      requireOrganization = false,
      normalizeRole = null
    } = options;

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password_hash +mfa_secret')
      .populate('organization_id');

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new AuthenticationError(`Account is ${user.status}. Please contact support.`);
    }

    if (!user.email_verified) {
      throw new AuthenticationError('Email not verified. Please complete setup.');
    }

    if (user.mfa_enabled) {
      if (!mfaCode) {
        throw new AuthenticationError('MFA code required');
      }
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        const err = new AuthenticationError('Access denied');
        err.statusCode = 403;
        throw err;
      }
    }

    if (requireOrganization) {
      if (!user.organization_id) {
        const err = new AuthenticationError('Access denied');
        err.statusCode = 403;
        throw err;
      }
    }

    // Check organization status for org-bound roles
    if (user.organization_id) {
      const org = await Organization.findById(user.organization_id);
      if (!org || org.status !== 'active') {
        throw new AuthenticationError('Organization is suspended or inactive. Please contact your administrator.');
      }
    }

    const normalizedRole = normalizeRole || user.role;
    const orgId = user.organization_id?._id || user.organization_id || null;

    const token = jwtUtils.generateToken({
      userId: user._id,
      user_id: user._id,
      role: normalizedRole,
      organizationId: orgId,
      organization_id: orgId
    });

    return {
      token,
      role: normalizedRole,
      redirectUrl: this.getRedirectUrl(normalizedRole),
      user: user.toPublicJSON(),
      organization: user.organization_id ? {
        _id: user.organization_id._id || user.organization_id,
        name: user.organization_id.name,
        type: user.organization_id.type,
        email: user.organization_id.email,
        modulesEnabled: user.organization_id.modulesEnabled || []
      } : null
    };
  }

  /**
   * Unified login
   */
  async login(email, password, mfaCode) {
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password_hash +mfa_secret')
      .populate('organization_id');
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

    // Check organization status (if not platform admin or staff)
    if (user.role !== 'platform_admin' && user.role !== 'platform_staff' && user.organization_id) {
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
    const orgType = (user.organization_id?.type || user.organization_id?.organizationType || user.organizationType || null);
    const token = jwtUtils.generateToken({
      user_id: user._id,
      role: user.role,
      organization_id: user.organization_id?._id || user.organization_id,
      organization_type: orgType,
      organizationType: orgType,
      subdomain: user.role !== 'platform_admin' ? user.organization_id?.subdomain : null
    });

    return {
      token,
      role: user.role,
      redirectUrl: this.getRedirectUrl(user.role),
      user: user.toPublicJSON(),
      organization: user.organization_id ? {
        _id: user.organization_id._id || user.organization_id,
        name: user.organization_id.name,
        type: user.organization_id.type,
        email: user.organization_id.email,
        modulesEnabled: user.organization_id.modulesEnabled || []
      } : null
    };
  }

  /**
   * Submit Organization Application
   */
  async applyOrganization(data) {
    const { 
      organizationName, 
      organizationType,
      contactPersonName,
      contactEmail,
      contactPhone,
      country,
      state,
      city,
      expectedUsers,
      message
    } = data;

    // Check if application already exists with same contact email and pending status
    const existingApp = await OrganizationApplication.findOne({
      contact_email: contactEmail.toLowerCase(),
      status: { $in: ['pending', 'contacted'] }
    });
    if (existingApp) {
      throw new Error('An application with this email already exists and is under review');
    }

    // Generate a route-friendly slug from organizationName
    let routeSlug = (organizationName || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `org-${Date.now()}`;

    // Ensure slug uniqueness
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
      organization_type: organizationType,
      contact_person_name: contactPersonName,
      contact_email: contactEmail.toLowerCase(),
      contact_phone: contactPhone,
      country,
      state,
      city,
      expected_users: expectedUsers,
      message: message || '',
      subdomain: routeSlug,
      status: 'pending'
    });
    await application.save();

    // Send confirmation email to applicant
    try {
      const baseUrl = (process.env.CLIENT_URL || 'https://smartlms.com').replace(/\/$/, '');
      const subject = 'Your Application Has Been Received - Smart LMS';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Application Received!</h2>
          <p>Dear ${contactPersonName},</p>
          <p>Thank you for your interest in Smart LMS. Your application for <strong>${organizationName}</strong> has been received and is now under review.</p>
          <p>Our team will contact you shortly at <strong>${contactPhone}</strong> or <strong>${contactEmail}</strong>.</p>
          <p style="margin-top: 20px;">Best regards,<br/>Smart LMS Team</p>
        </div>
      `;
      await emailService.sendEmail({
        to: contactEmail,
        subject,
        html
      });
    } catch (emailErr) {
      console.warn('Application confirmation email failed:', emailErr.message);
    }

    // Notify Platform Staff and Admin via email
    try {
      const adminNotifyEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
      if (adminNotifyEmail) {
        const baseUrl = (process.env.CLIENT_URL || 'https://smartlms.com').replace(/\/$/, '');
        const listLink = `${baseUrl}/platform/applications`;
        const subject = `🔔 New Organization Application: ${organizationName}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Application Received</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Organization</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${organizationName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${organizationType}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Contact Person</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${contactPersonName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${contactEmail}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${contactPhone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${city}, ${state}, ${country}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Expected Users</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${expectedUsers}</td></tr>
              ${message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${message}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px;">
              <a href="${listLink}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Application</a>
            </div>
          </div>
        `;
        await emailService.sendEmail({
          to: adminNotifyEmail,
          subject,
          html
        });
      }
    } catch (emailErr) {
      console.warn('Admin notification email failed:', emailErr.message);
    }

    return application;
  }

  /**
   * Complete Organization Registration (Set Password)
   */
  async completeOrganizationRegistration(data) {
    const { token, name, password } = data;

    if (!name) {
      throw new ValidationError('Name is required');
    }

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

    const orgType = (application.organization_type || 'school').toUpperCase();
    const contactEmail = application.contact_email.toLowerCase();

    // 1. Create Organization with modules from application
    const organization = new Organization({
      name: application.organization_name,
      email: contactEmail,
      subdomain: application.subdomain,
      plan: application.selected_plan || 'basic',
      type: orgType,
      modulesEnabled: application.modulesEnabled || [],
      templateVersion: `v1_${orgType.toLowerCase()}`,
      status: 'active'
    });
    await organization.save();
    console.log(`📋 [Registration] Created org "${organization.name}" type="${orgType}" adminEmail="${contactEmail}" modules=[${organization.modulesEnabled.join(', ')}]`);

    // 2. Create Org Admin User
    const admin = new User({
      name: name,
      email: contactEmail,
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

    // 5. Update application status
    application.status = 'account_created';
    await application.save();

    // Notify Platform Admin that organization has been created
    try {
      const adminNotifyEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
      if (adminNotifyEmail) {
        const subject = `Organization Created: ${organization.name}`;
        const html = `
          <h2>Organization Onboarding Complete</h2>
          <p><strong>Organization:</strong> ${organization.name}</p>
          <p><strong>Admin:</strong> ${admin.name} (${admin.email})</p>
          <p>The organization is now active and the administrator has set their password.</p>
        `;
        await emailService.sendEmail({
          to: adminNotifyEmail,
          subject,
          html
        });
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

    if (!['instructor', 'student', 'support_staff'].includes(role)) {
      throw new ValidationError('Invalid role for staff invitation — must be instructor, student, or support_staff');
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

    // Fetch the organization for context in the invitation email
    const organization = await Organization.findById(orgId).select('name subdomain code organization_code');
    const orgName = organization?.name || 'Your Organization';

    if (existingInvite) {
      // Resend the email for the existing invite
      try {
        const baseUrl = (process.env.CLIENT_URL || 'https://smart-lms-clean.vercel.app').replace(/\/$/, '');
        const acceptLink = `${baseUrl}/accept-invite?token=${existingInvite.token}`;
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        await emailService.sendEmail(
          email.toLowerCase(),
          `Reminder: You're invited to join ${orgName} as ${roleLabel} — Smart LMS`,
          `You have a pending invitation to join ${orgName} as a ${roleLabel}.\n\nAccept here: ${acceptLink}\n\nExpires in 7 days.`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
            <h2 style="color:#818cf8;">Invitation Reminder 🎓</h2>
            <p>You have been invited to join <strong style="color:#c4b5fd;">${orgName}</strong> as a <strong style="color:#c4b5fd;">${roleLabel}</strong> on Smart LMS.</p>
            <div style="margin:28px 0;"><a href="${acceptLink}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Accept Invitation →</a></div>
            <p style="color:#64748b;font-size:13px;">This link expires in <strong>7 days</strong>.</p>
          </div>`
        );
        console.log(`📧 [Invite] Reminder email sent to ${email}`);
      } catch (e) {
        console.error('⚠️ [Invite] Failed to resend invite email:', e.message);
      }
      return existingInvite;
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

    // Send invitation email with accept link
    try {
      const baseUrl = (process.env.CLIENT_URL || 'https://smart-lms-clean.vercel.app').replace(/\/$/, '');
      const acceptLink = `${baseUrl}/accept-invite?token=${token}`;
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      const subject = `Invitation to join ${orgName} as ${roleLabel}`;
      const { generateInvitationTemplate } = emailService;
      const html = generateInvitationTemplate(orgName, acceptLink);
      await emailService.sendEmail({
        to: email.toLowerCase(),
        subject,
        html
      });
      console.log(`📧 [Invite] Email sent to ${email} (${role}) for org: ${orgName} | Link: ${acceptLink}`);
    } catch (emailErr) {
      console.error('⚠️ [Invite] Failed to send invitation email:', emailErr.message);
      // Don't throw — the invite record is already created; email failure is non-fatal
    }

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
    
    // Hash password securely
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (user) {
      if (user.status !== 'pending') {
        throw new ValidationError('User already exists and is active');
      }
      // Update the pending user (automated provisioning flow created this user)
      user.name = name;
      user.password_hash = passwordHash;
      user.status = 'active';
      user.email_verified = true;
      // Ensure organization_code is set
      if (!user.organization_code) {
        const organization = await Organization.findById(invite.organization_id);
        user.organization_code = organization?.code || organization?.organization_code || invite.organization_code;
      }
    } else {
      // Create new user (standard invite flow)
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
    }
    await user.save();

    // Mark invite as used
    invite.used = true;
    await invite.save();

    return user.toPublicJSON();
  }

  async verifyInviteToken(token) {
    if (!token) {
      throw new ValidationError('Invitation token is required');
    }

    const invite = await Invite.findOne({ token, used: false, expires_at: { $gt: new Date() } });
    if (!invite) {
      throw new ValidationError('Invalid or expired invitation token');
    }

    const organization = await Organization.findById(invite.organization_id).select('name type');

    return {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      organization: {
        name: organization?.name || 'Your Organization',
        type: organization?.type || 'SCHOOL'
      }
    };
  }
  /**
   * Forgot Password - Generate token and send email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if user exists
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpires
    });

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password/${resetToken}`;

    const { generatePasswordResetTemplate } = emailService;
    const html = generatePasswordResetTemplate(resetLink);

    await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Smart LMS',
      html
    });

    return true;
  }

  /**
   * Reset Password - Verify token and update password
   */
  async resetPassword(token, password) {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    // Set new password
    user.password_hash = password; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return true;
  }

  /**
   * Social Login (Google/Auth0)
   */
  async socialLogin(profile) {
    const { email, name, providerId, provider } = profile;

    if (!email) {
      throw new ValidationError('Email is required from social provider');
    }

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() }).populate('organization_id');

    if (!user) {
      // Create new student if user doesn't exist
      user = new User({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'public_student', // Default role for marketplace users without org
        status: 'active',
        email_verified: true,
        socialProvider: {
          name: provider || 'google',
          id: providerId
        }
      });
      await user.save();
      console.log(`👤 [AuthService] Created new public student: ${email}`);
    } else {
      // Update social provider info if not set
      if (!user.socialProvider || !user.socialProvider.id) {
        user.socialProvider = {
          name: provider || 'google',
          id: providerId
        };
        await user.save();
      }
      console.log(`👤 [AuthService] Social login for existing user: ${email}`);
    }

    // Generate token
    const token = jwtUtils.generateToken({
      user_id: user._id,
      role: user.role,
      organization_id: user.organization_id?._id || user.organization_id
    });

    return {
      token,
      role: user.role,
      redirectUrl: this.getRedirectUrl(user.role),
      user: user.toPublicJSON()
    };
  }
}

module.exports = new AuthService();
