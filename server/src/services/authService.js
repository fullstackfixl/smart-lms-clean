const BaseService = require('../core/BaseService');
const UserRepository = require('../repositories/UserRepository');
const User = require('../models/User');
const domainValidation = require('./domainValidation');
const jwtUtils = require('../utils/jwt');
const sendEmail = require('../utils/email');
const generateOTP = require('../utils/otp').generateOTP;
const bcrypt = require('bcryptjs');
const { ValidationError, AuthenticationError, NotFoundError } = require('../core/errors');

class AuthService extends BaseService {
  constructor() {
    super(UserRepository);
  }
  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate required fields
   * @param {Object} data
   * @param {string[]} requiredFields
   * @throws {ValidationError}
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = {};
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        missingFields[field] = `${field} is required`;
      }
    }
    if (Object.keys(missingFields).length > 0) {
      throw new ValidationError('Validation failed', missingFields);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<{user, token}>}
   */
  async register(userData) {
    const { email, password, fullName, role, registrationType, organization_id: passedOrgId } = userData;

    // Validate required fields
    this.validateRequiredFields({ email, password, fullName }, ['email', 'password', 'fullName']);

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new ValidationError('Invalid email format', { email: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long', { password: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('Email is already registered', { email: 'Email is already registered' });
    }

    let organization_id = null;
    let userRole = 'public_student';

    // Handle organization registration
    if (registrationType === 'organization') {
      // Extract domain from email
      const domain = domainValidation.extractDomain(email);

      if (passedOrgId) {
        // Use pre-validated organization ID from controller
        organization_id = passedOrgId;

        // Additional validation: ensure organization exists and is active
        const Organization = require('../models/Organization');
        const organization = await Organization.findById(organization_id);

        if (!organization || !organization.isActive) {
          throw new Error('Organization not found or not active');
        }

        // Domain validation removed per user request ("remove .edu compulsory")
        // We trust the Organization Code validation from the controller or passedOrgId.
      } else {
        // Fallback: Find organization by domain
        const organization = await domainValidation.findOrganizationByDomain(domain);

        if (!organization) {
          throw new Error('Email domain is not registered with any organization. Please use an organization email or register as a public student.');
        }

        organization_id = organization._id;
      }

      // Validate role for organization users
      const validOrgRoles = ['student', 'instructor', 'org_admin', 'parent'];
      if (role && !validOrgRoles.includes(role)) {
        throw new Error('Invalid role for organization registration');
      }

      userRole = role || 'student';
    } else {
      // Public registration
      if (role && role !== 'public_student') {
        throw new Error('Public registration only allows public_student role');
      }
      userRole = 'public_student';
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      profile: { fullName },
      role: userRole,
      organization_id,
      isActive: true, // Account is active, but might need email verification
      email_verified: false // Default to false
    });

    // OTP is required for: Organization Admin, Instructor, Org Student
    // NOT required for: Public Student
    const requiresOTP = registrationType === 'organization';

    if (requiresOTP) {
      // Generate OTP
      const otp = generateOTP();

      // Hash OTP
      const salt = await bcrypt.genSalt(10);
      user.otp_hash = await bcrypt.hash(otp, salt);
      user.otp_expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes

      await user.save();

      // Send OTP Email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Verification Code - Smart LMS',
          text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`
        });
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Consider rollback or proceed with warning
      }

      return {
        requiresVerification: true,
        email: user.email,
        message: 'Verification code sent to your email'
      };

    } else {
      // Public student - auto verify
      user.email_verified = true;
      await user.save();

      // Generate JWT token
      const token = jwtUtils.generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      });

      return {
        user: user.toPublicJSON(),
        token
      };
    }
  }

  /**
   * Authenticate user and generate token
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, token}>}
   */
  async login(email, password) {
    // Validate inputs
    if (!email || !password) {
      throw new ValidationError('Email and password are required', {
        email: !email ? 'Email is required' : undefined,
        password: !password ? 'Password is required' : undefined
      });
    }

    // Find user by email (include password_hash field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check email verification for Organization Users (admin, instructor, org_student)
    // Platform admins and public students are allowed without email verification
    if (user.organization_id && !user.email_verified && user.role !== 'platform_admin') {
      throw new AuthenticationError('Email not verified. Please verify your email.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwtUtils.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    });

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  /**
   * Verify JWT token
   * @param {string} token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    return jwtUtils.verifyToken(token);
  }

  /**
   * Verify OTP code
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{user, token}>}
   */
  async verifyOtp(email, otp) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp_hash');

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.email_verified) {
      throw new ValidationError('Email already verified');
    }

    if (!user.otp_hash || !user.otp_expires_at) {
      throw new ValidationError('No OTP request found');
    }

    if (user.otp_expires_at < Date.now()) {
      throw new ValidationError('OTP expired');
    }

    const isMatch = await bcrypt.compare(otp, user.otp_hash);
    if (!isMatch) {
      throw new ValidationError('Invalid OTP');
    }

    // Verify user
    user.email_verified = true;
    user.otp_hash = undefined;
    user.otp_expires_at = undefined;
    await user.save();

    // Generate Token
    const token = jwtUtils.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    });

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  /**
   * Resend OTP
   * @param {string} email
   */
  async resendOtp(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new NotFoundError('User');
    if (user.email_verified) throw new ValidationError('Email already verified');

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    user.otp_hash = await bcrypt.hash(otp, salt);
    user.otp_expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your Verification Code - Smart LMS',
      text: `Your new verification code is: ${otp}`,
      html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
    });

    return { message: 'OTP resent successfully' };
  }
}

module.exports = new AuthService();
