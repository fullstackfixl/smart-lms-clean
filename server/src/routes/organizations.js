const express = require('express');
const organizationService = require('../services/organizationService');
const jwtUtils = require('../utils/jwt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generateOTP } = require('../utils/otp');
const sendEmail = require('../utils/email');
const VerificationOTP = require('../models/VerificationOTP');

const router = express.Router();

// Step 1: Request OTP for organization registration
router.post('/register/request-otp', async (req, res) => {
  try {
    const { organizationName, domain, adminName, adminEmail, password } = req.body;

    // Validate required fields
    if (!organizationName || !domain || !adminName || !adminEmail || !password) {
      return res.error('All fields are required', 'Validation failed', 400);
    }

    // Validate password length
    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    // Extract domain from admin email
    const emailDomain = adminEmail.split('@')[1];
    
    // Validate admin email domain matches organization domain
    if (emailDomain !== domain) {
      return res.error(
        `Admin email domain must match organization domain (${domain})`,
        'Registration failed',
        400
      );
    }

    // Check if organization domain already exists
    const Organization = require('../models/Organization');
    const existingOrg = await Organization.findOne({ domain });
    if (existingOrg) {
      return res.error('Organization domain is already registered', 'Registration failed', 400);
    }

    // Check if admin email already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.error('Admin email is already registered', 'Registration failed', 400);
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with registration data
    await VerificationOTP.findOneAndDelete({ email: adminEmail.toLowerCase() });
    
    const verificationRecord = new VerificationOTP({
      email: adminEmail.toLowerCase(),
      otp,
      registrationData: {
        organizationName,
        domain,
        adminName,
        adminEmail: adminEmail.toLowerCase(),
        password,
        type: 'organization'
      }
    });

    await verificationRecord.save();

    // Send OTP email
    const emailSubject = 'Verify Your Organization Registration - Smart LMS';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Organization Registration Verification</h2>
        <p>Hello ${adminName},</p>
        <p>Thank you for registering <strong>${organizationName}</strong> with Smart LMS.</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
      </div>
    `;

    await sendEmail(adminEmail, emailSubject, emailHtml);

    res.success({
      email: adminEmail.toLowerCase(),
      message: 'Verification code sent to your email'
    }, 'OTP sent successfully');

  } catch (error) {
    console.error('Organization OTP request error:', error);
    res.error(error.message, 'Failed to send verification code', 400);
  }
});

// Step 2: Verify OTP and complete organization registration
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.error('Email and OTP are required', 'Validation failed', 400);
    }

    // Find verification record
    const verificationRecord = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false,
      'registrationData.type': 'organization'
    });

    if (!verificationRecord) {
      return res.error('No verification request found', 'Verification failed', 400);
    }

    // Check if expired
    if (new Date() > verificationRecord.expiresAt) {
      await VerificationOTP.deleteOne({ _id: verificationRecord._id });
      return res.error('Verification code expired. Please request a new one', 'Verification failed', 400);
    }

    // Check attempts
    if (verificationRecord.attempts >= 5) {
      await VerificationOTP.deleteOne({ _id: verificationRecord._id });
      return res.error('Too many failed attempts. Please request a new code', 'Verification failed', 400);
    }

    // Verify OTP
    if (verificationRecord.otp !== otp) {
      verificationRecord.attempts += 1;
      await verificationRecord.save();
      return res.error(
        `Invalid verification code. ${5 - verificationRecord.attempts} attempts remaining`,
        'Verification failed',
        400
      );
    }

    // OTP is valid - create organization and admin user
    const { organizationName, domain, adminName, adminEmail, password } = verificationRecord.registrationData;

    // Generate organization code
    const generateOrgCode = () => {
      const prefix = organizationName.substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `ORG-${prefix}${random}`;
    };

    const orgCode = generateOrgCode();

    // Create organization
    const Organization = require('../models/Organization');
    const organization = new Organization({
      name: organizationName,
      domain,
      code: orgCode,
      emailDomains: [domain],
      type: 'educational',
      isActive: true
    });

    await organization.save();

    // Create admin user
    const User = require('../models/User');
    const adminUser = new User({
      email: adminEmail.toLowerCase(),
      password,
      profile: { fullName: adminName },
      role: 'org_admin',
      organization_id: organization._id,
      isActive: true,
      emailVerified: true
    });

    await adminUser.save();

    // Delete verification record
    await VerificationOTP.deleteOne({ _id: verificationRecord._id });

    // Send welcome email with organization code
    const welcomeEmailSubject = 'Welcome to Smart LMS - Your Organization Code';
    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">🎉 Organization Successfully Registered!</h2>
        <p>Hello ${adminName},</p>
        <p>Congratulations! <strong>${organizationName}</strong> has been successfully registered with Smart LMS.</p>
        
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Your Organization Code</h3>
          <div style="background: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 8px; color: #3b82f6;">
            ${orgCode}
          </div>
          <p style="margin-bottom: 0; margin-top: 15px; font-size: 14px; color: #64748b;">
            Share this code with your students and instructors to join your organization.
          </p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>⚠️ Important:</strong> Keep this code secure. Only share it with authorized members of your organization.
          </p>
        </div>

        <h3 style="color: #1e40af;">Next Steps:</h3>
        <ol style="color: #475569; line-height: 1.8;">
          <li>Share the organization code with your team members</li>
          <li>Students and instructors will need this code during registration</li>
          <li>They must use an email with your domain: <strong>${domain}</strong></li>
          <li>Log in to your admin dashboard to manage your organization</li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Smart LMS - Learning Management System<br>
          If you have any questions, please contact our support team.
        </p>
      </div>
    `;

    await sendEmail(adminEmail, welcomeEmailSubject, welcomeEmailHtml);

    // Generate JWT token
    const token = jwtUtils.generateToken({
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      organization_id: adminUser.organization_id
    });

    jwtUtils.setTokenCookie(res, token);

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        domain: organization.domain,
        code: organization.code
      },
      admin: adminUser.toPublicJSON(),
      token
    }, 'Organization registered successfully');

  } catch (error) {
    console.error('Organization verification error:', error);
    res.error(error.message, 'Verification failed', 400);
  }
});

// Resend OTP for organization registration
router.post('/register/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.error('Email is required', 'Validation failed', 400);
    }

    const verificationRecord = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false,
      'registrationData.type': 'organization'
    });

    if (!verificationRecord) {
      return res.error('No verification request found', 'Resend failed', 400);
    }

    // Generate new OTP
    const otp = generateOTP();
    verificationRecord.otp = otp;
    verificationRecord.attempts = 0;
    verificationRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await verificationRecord.save();

    // Send OTP email
    const { adminName, organizationName } = verificationRecord.registrationData;
    const emailSubject = 'Verify Your Organization Registration - Smart LMS';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Organization Registration Verification</h2>
        <p>Hello ${adminName},</p>
        <p>Your new verification code for <strong>${organizationName}</strong> is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
      </div>
    `;

    await sendEmail(email, emailSubject, emailHtml);

    res.success({
      message: 'New verification code sent to your email'
    }, 'OTP resent successfully');

  } catch (error) {
    console.error('Resend organization OTP error:', error);
    res.error(error.message, 'Failed to resend verification code', 400);
  }
});

// Legacy register endpoint (kept for backward compatibility)
router.post('/register', async (req, res) => {
  try {
    // Accept both camelCase (frontend) and snake_case (legacy) field names
    const organizationName = req.body.organizationName || req.body.organization_name;
    const organizationDomain = req.body.domain || req.body.organizationDomain || req.body.organization_domain;
    const adminName = req.body.adminName || req.body.admin_name;
    const adminEmail = req.body.adminEmail || req.body.admin_email;
    const password = req.body.password;

    // Validate required fields
    if (!organizationName || !organizationDomain || !adminName || !adminEmail || !password) {
      return res.error('All fields are required', 'Validation failed', 400);
    }

    // Validate password length
    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    // Extract domain from admin email
    const emailDomain = adminEmail.split('@')[1];

    // Validate admin email domain matches organization domain
    if (emailDomain !== organizationDomain) {
      return res.error(
        `Admin email domain must match organization domain (${organizationDomain})`,
        'Registration failed',
        400
      );
    }

    // Check if organization domain already exists
    const Organization = require('../models/Organization');
    const existingOrg = await Organization.findOne({ domain: organizationDomain });
    if (existingOrg) {
      return res.error('Organization domain is already registered', 'Registration failed', 400);
    }

    // Check if admin email already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.error('Admin email is already registered', 'Registration failed', 400);
    }

    // Generate unique organization code
    const generateOrgCode = () => {
      const prefix = organizationName.substring(0, 3).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `ORG-${prefix}${random}`;
    };

    const orgCode = generateOrgCode();

    // Create organization
    const organization = new Organization({
      name: organizationName,
      domain: organizationDomain,
      code: orgCode,
      emailDomains: [organizationDomain],
      type: 'educational',
      isActive: true
    });

    await organization.save();

    // Create admin user
    const adminUser = new User({
      email: adminEmail.toLowerCase(),
      password,
      profile: { fullName: adminName },
      role: 'org_admin',
      organization_id: organization._id,
      isActive: true,
      email_verified: true
    });

    await adminUser.save();

    // Generate JWT token
    const token = jwtUtils.generateToken({
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      organization_id: adminUser.organization_id
    });

    jwtUtils.setTokenCookie(res, token);

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        domain: organization.domain,
        code: organization.code
      },
      admin: adminUser.toPublicJSON(),
      token
    }, 'Organization registered successfully');

  } catch (error) {
    console.error('Organization registration error:', error);
    res.error(error.message, 'Registration failed', 400);
  }
});

// Create organization (with admin user)
router.post('/', async (req, res) => {
  try {
    const { name, primaryDomain, adminEmail, adminPassword, adminFullName } = req.body;

    const result = await organizationService.createOrganization({
      name,
      primaryDomain,
      adminEmail,
      adminPassword,
      adminFullName
    });

    // Generate token for admin user
    const token = jwtUtils.generateToken({
      userId: result.admin.id,
      email: result.admin.email,
      role: result.admin.role,
      organization_id: result.organization._id
    });

    jwtUtils.setTokenCookie(res, token);

    res.success({
      organization: {
        id: result.organization._id,
        name: result.organization.name,
        emailDomains: result.organization.emailDomains
      },
      admin: result.admin,
      message: 'Organization created successfully'
    }, 'Organization created');

  } catch (error) {
    console.error('Create organization error:', error);
    res.error(error.message, 'Failed to create organization', 400);
  }
});

// Get organization details (org admin only)
router.get('/:id', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user belongs to this organization
    if (req.user.organization_id.toString() !== id) {
      return res.error('Access denied', 'You can only access your own organization', 403);
    }

    const organization = await organizationService.getOrganizationDetails(id);

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        emailDomains: organization.emailDomains,
        type: organization.type,
        settings: organization.settings,
        isActive: organization.isActive,
        createdAt: organization.createdAt
      }
    }, 'Organization details retrieved');

  } catch (error) {
    console.error('Get organization error:', error);
    res.error(error.message, 'Failed to get organization', 500);
  }
});

// Add email domain (org admin only)
router.post('/:id/domains', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    // Verify user belongs to this organization
    if (req.user.organization_id.toString() !== id) {
      return res.error('Access denied', 'You can only manage your own organization', 403);
    }

    if (!domain) {
      return res.error('Domain required', 'Email domain is required', 400);
    }

    const organization = await organizationService.addDomain(id, domain);

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        emailDomains: organization.emailDomains
      },
      message: 'Domain added successfully'
    }, 'Domain added');

  } catch (error) {
    console.error('Add domain error:', error);
    res.error(error.message, 'Failed to add domain', 400);
  }
});

// Remove email domain (org admin only)
router.delete('/:id/domains/:domain', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { id, domain } = req.params;

    // Verify user belongs to this organization
    if (req.user.organization_id.toString() !== id) {
      return res.error('Access denied', 'You can only manage your own organization', 403);
    }

    const organization = await organizationService.removeDomain(id, domain);

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        emailDomains: organization.emailDomains
      },
      message: 'Domain removed successfully'
    }, 'Domain removed');

  } catch (error) {
    console.error('Remove domain error:', error);
    res.error(error.message, 'Failed to remove domain', 400);
  }
});

// Get organization users (org admin only)
router.get('/:id/users', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user belongs to this organization
    if (req.user.organization_id.toString() !== id) {
      return res.error('Access denied', 'You can only view users from your own organization', 403);
    }

    const users = await organizationService.getOrganizationUsers(id);

    res.success({
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        fullName: user.profile.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      count: users.length
    }, 'Users retrieved');

  } catch (error) {
    console.error('Get users error:', error);
    res.error(error.message, 'Failed to get users', 500);
  }
});

// Update user role (org admin only)
router.patch('/:id/users/:userId/role', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    // Verify user belongs to this organization
    if (req.user.organization_id.toString() !== id) {
      return res.error('Access denied', 'You can only manage users from your own organization', 403);
    }

    if (!role) {
      return res.error('Role required', 'New role is required', 400);
    }

    const user = await organizationService.updateUserRole(id, userId, role);

    res.success({
      user,
      message: 'User role updated successfully'
    }, 'Role updated');

  } catch (error) {
    console.error('Update role error:', error);
    res.error(error.message, 'Failed to update role', 400);
  }
});

module.exports = router;
