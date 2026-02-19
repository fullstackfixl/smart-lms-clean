const express = require('express');
const authService = require('../services/authService');
const organizationService = require('../services/organizationService');
const jwtUtils = require('../utils/jwt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generateOTP } = require('../utils/otp');
const emailService = require('../services/emailService');
const VerificationOTP = require('../models/VerificationOTP');

const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validate organization code endpoint
router.post('/validate-organization', async (req, res) => {
  try {
    const { organizationCode } = req.body;

    if (!organizationCode) {
      return res.error('Organization code is required', 'Validation failed', 400);
    }

    const Organization = require('../models/Organization');
    const cleanCode = organizationCode.trim();
    
    let organization = null;
    
    // Check if it's a 6-character code or 24-character ObjectId
    if (cleanCode.length === 6) {
      organization = await Organization.findOne({ 
        code: cleanCode.toUpperCase(), 
        isActive: true 
      });
    } else if (cleanCode.length === 24) {
      try {
        organization = await Organization.findOne({ 
          _id: cleanCode, 
          isActive: true 
        });
      } catch (err) {
        return res.error('Invalid organization code format', 'Validation failed', 400);
      }
    } else {
      return res.error('Organization code must be either 6 or 24 characters', 'Validation failed', 400);
    }

    if (!organization) {
      return res.error('Invalid organization code', 'Validation failed', 400);
    }

    res.success({
      organization: {
        id: organization._id,
        name: organization.name,
        code: organization.code
      }
    }, 'Organization found');

  } catch (error) {
    console.error('Organization validation error:', error);
    return res.error(error.message, 'Validation failed', 400);
  }
});

// Step 1: Request OTP for registration
router.post('/register/request-otp', authLimiter, async (req, res) => {
  try {
    const { email, password, name, role, organization_code, organization_name } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.error('All fields are required', 'Validation failed', 400);
    }

    // Validate password length
    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    // Check if email already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.error('Email is already registered', 'Registration failed', 400);
    }

    let organization_id = null;
    let organizationName = null;
    let organizationCode = null;

    // Admin/Org_Admin registration - NO organization code needed (they create the org)
    if (role === 'org_admin') {
      if (!organization_name) {
        return res.error('Organization name is required for admin registration', 'Registration failed', 400);
      }
      organizationName = organization_name;
      // Organization will be created after OTP verification
    }
    // Other roles need organization code
    else if (role !== 'public_student') {
      if (!organization_code) {
        return res.error('Organization code is required for organization registration', 'Registration failed', 400);
      }

      const Organization = require('../models/Organization');
      let organization = null;

      // Trim whitespace
      const cleanCode = organization_code.trim();

      // Check if it's a 6-character code or 24-character ObjectId
      if (cleanCode.length === 6) {
        // Short code lookup (case-insensitive)
        organization = await Organization.findOne({ 
          code: cleanCode.toUpperCase(), 
          isActive: true 
        });
        
        if (!organization) {
          return res.error('Invalid organization code. Please check the 6-character code with your organization admin.', 'Registration failed', 400);
        }
        organizationCode = organization.code; // Save the 6-char code
      } else if (cleanCode.length === 24) {
        // MongoDB ObjectId lookup (exact match)
        try {
          organization = await Organization.findOne({ 
            _id: cleanCode, 
            isActive: true 
          });
          
          if (!organization) {
            return res.error('Invalid organization ID. Please check the 24-character code with your organization admin.', 'Registration failed', 400);
          }
          organizationCode = organization.code; // Save the 6-char code from the found organization
        } catch (err) {
          // Invalid ObjectId format
          return res.error('Invalid organization code format. The 24-character code must be a valid MongoDB ObjectId.', 'Registration failed', 400);
        }
      } else {
        return res.error('Organization code must be either 6 characters (e.g., IYUHBH) or 24 characters (e.g., 698d6fc6515b2f503e65574d). Please check with your organization admin.', 'Registration failed', 400);
      }

      organization_id = organization._id;
      organizationName = organization.name;
    }

    // Generate OTP
    const otp = generateOTP();

    // Only log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    // Store OTP with registration data
    await VerificationOTP.findOneAndDelete({ email: email.toLowerCase() });
    
    const verificationRecord = new VerificationOTP({
      email: email.toLowerCase(),
      otp,
      registrationData: {
        email: email.toLowerCase(),
        password,
        name,
        role,
        organization_id,
        organization_name: organizationName,
        organizationCode
      }
    });

    await verificationRecord.save();

    // Send OTP email using email service
    console.log(`📧 [AUTH] Sending OTP email to ${email}`);
    const emailResult = await emailService.sendOTP(email, otp, name, organizationName);

    if (emailResult.success) {
      console.log(`✅ [AUTH] OTP email sent successfully to ${email}`);
      return res.success({
        email: email.toLowerCase(),
        organizationName,
        message: 'Verification code sent to your email',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }, 'OTP sent successfully');
    } else {
      // Email failed - return OTP in response (graceful degradation)
      console.error(`❌ [AUTH] Failed to send OTP email: ${emailResult.error}`);
      console.log(`⚠️ [AUTH] Email service unavailable - returning OTP in response for ${email}`);
      
      return res.success({
        email: email.toLowerCase(),
        organizationName,
        message: 'Email service temporarily unavailable. Your verification code is displayed below.',
        otp: otp,
        emailFailed: true
      }, 'OTP generated (email service unavailable)');
    }

  } catch (error) {
    return res.error(error.message, 'Failed to send verification code', 400);
  }
});

// Step 2: Verify OTP and complete registration
router.post('/register/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.error('Email and OTP are required', 'Validation failed', 400);
    }

    // Find verification record
    const verificationRecord = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false
    });

    if (!verificationRecord) {
      return res.error('No verification request found or already verified', 'Verification failed', 400);
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

    // OTP is valid - create user account
    const { password, name, role, organization_id, organization_name, organizationCode } = verificationRecord.registrationData;

    // Map public_student to student (they're the same, just without org)
    const finalRole = role === 'public_student' ? 'student' : role;

    let finalOrgId = organization_id;
    let orgCode = null;

    // If admin/org_admin, create organization first
    if (role === 'org_admin' && organization_name) {
      const Organization = require('../models/Organization');
      
      // Generate unique organization code
      const generateOrgCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };
      
      // Generate slug from organization name
      const generateSlug = (name) => {
        return name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      
      let uniqueCode = generateOrgCode();
      let codeExists = await Organization.findOne({ code: uniqueCode });
      
      while (codeExists) {
        uniqueCode = generateOrgCode();
        codeExists = await Organization.findOne({ code: uniqueCode });
      }
      
      let slug = generateSlug(organization_name);
      let slugExists = await Organization.findOne({ slug });
      let slugCounter = 1;
      
      while (slugExists) {
        slug = `${generateSlug(organization_name)}-${slugCounter}`;
        slugExists = await Organization.findOne({ slug });
        slugCounter++;
      }
      
      const newOrg = new Organization({
        name: organization_name,
        slug,
        code: uniqueCode,
        domain: email.split('@')[1],
        emailDomains: [email.split('@')[1]],
        isActive: true
      });
      
      await newOrg.save();
      finalOrgId = newOrg._id;
      orgCode = uniqueCode;
    }

    const User = require('../models/User');
    const newUser = new User({
      email: email.toLowerCase(),
      password_hash: password,
      name: name,
      role: finalRole,
      organization_id: finalOrgId || null,
      organization_code: orgCode || organizationCode || null,
      isActive: true,
      email_verified: true
    });

    await newUser.save();

    // Mark as verified and delete
    await VerificationOTP.deleteOne({ _id: verificationRecord._id });

    // Generate JWT token
    const token = jwtUtils.generateToken({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id
    });

    jwtUtils.setTokenCookie(res, token);

    res.success({
      user: newUser.toPublicJSON(),
      organization_code: orgCode, // Return org code for admin
      token
    }, 'Registration successful');

  } catch (error) {
    return res.error(error.message, 'Verification failed', 400);
  }
});

// Resend OTP
router.post('/register/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.error('Email is required', 'Validation failed', 400);
    }

    // Check if user already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.error('Email is already registered. Please login instead.', 'Resend failed', 400);
    }

    const verificationRecord = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false
    });

    if (!verificationRecord) {
      return res.error('No verification request found. Please register again.', 'Resend failed', 400);
    }

    // Generate new OTP
    const otp = generateOTP();

    // Only log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Resend OTP for ${email}: ${otp}`);
    }
    
    verificationRecord.otp = otp;
    verificationRecord.attempts = 0;
    verificationRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await verificationRecord.save();

    // Send OTP email using email service
    const { name, organization_name } = verificationRecord.registrationData;
    console.log(`📧 [AUTH] Sending resend OTP email to ${email}`);
    const emailResult = await emailService.sendOTP(email, otp, name, organization_name);

    if (emailResult.success) {
      console.log(`✅ [AUTH] Resend OTP email sent successfully to ${email}`);
      
      res.success({
        message: 'New verification code sent to your email',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }, 'OTP resent successfully');
      
    } else {
      // Email failed - return OTP in response (graceful degradation)
      console.error(`❌ [AUTH] Failed to resend OTP email: ${emailResult.error}`);
      console.log(`⚠️ [AUTH] Email service unavailable - returning OTP in response for ${email}`);
      
      return res.success({
        message: 'Email service temporarily unavailable. Your verification code is displayed below.',
        otp: otp,
        emailFailed: true
      }, 'OTP generated (email service unavailable)');
    }

  } catch (error) {
    return res.error(error.message, 'Failed to resend verification code', 400);
  }
});

// Student registration endpoint (simplified, no OTP)
router.post('/register/student', authLimiter, async (req, res) => {
  try {
    const { email, password, name, organizationCode } = req.body;

    // Validate required fields
    if (!email || !password || !name || !organizationCode) {
      return res.error('All fields are required', 'Validation failed', 400);
    }

    // Validate password length
    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    // Check if email already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.error('Email is already registered', 'Registration failed', 400);
    }

    // Validate organization code
    const Organization = require('../models/Organization');
    const cleanCode = organizationCode.trim();
    
    let organization = null;
    
    // Check if it's a 6-character code or 24-character ObjectId
    if (cleanCode.length === 6) {
      organization = await Organization.findOne({ 
        code: cleanCode.toUpperCase(), 
        isActive: true 
      });
      
      if (!organization) {
        return res.error('Invalid organization code', 'Registration failed', 400);
      }
    } else if (cleanCode.length === 24) {
      try {
        organization = await Organization.findOne({ 
          _id: cleanCode, 
          isActive: true 
        });
        
        if (!organization) {
          return res.error('Invalid organization code', 'Registration failed', 400);
        }
      } catch (err) {
        return res.error('Invalid organization code format', 'Registration failed', 400);
      }
    } else {
      return res.error('Organization code must be either 6 or 24 characters', 'Registration failed', 400);
    }

    // Create student user
    const newUser = new User({
      email: email.toLowerCase(),
      password_hash: password, // Will be hashed by pre-save hook
      name: name,
      role: 'student',
      organization_id: organization._id,
      organization_code: organization.code,
      isActive: true,
      email_verified: true // Auto-verify for students
    });

    await newUser.save();

    // Generate JWT token with 7-day expiration
    const token = jwtUtils.generateToken({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id
    }, '7d');

    jwtUtils.setTokenCookie(res, token);

    res.success({
      user: newUser.toPublicJSON(),
      token,
      organization: {
        id: organization._id,
        name: organization.name,
        code: organization.code
      }
    }, 'Registration successful');

  } catch (error) {
    console.error('Student registration error:', error);
    return res.error(error.message, 'Registration failed', 400);
  }
});

// Legacy register endpoint (kept for backward compatibility)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, role, organization_code } = req.body;


    // Validate required fields
    if (!email || !password || !name) {
      return res.error('Email, password, and name are required', 'Validation failed', 400);
    }

    // Validate password length
    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    // Check if email already exists
    const User = require('../models/User');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.error('Email is already registered', 'Registration failed', 400);
    }

    let organization_id = null;
    let userRole = role || 'public_student';

    // Handle organization users (student, instructor)
    if (role !== 'public_student') {
      // Organization code is REQUIRED for all non-public users
      if (!organization_code) {
        return res.error('Organization code is required for organization registration', 'Registration failed', 400);
      }

      const Organization = require('../models/Organization');
      let organization = null;

      // Trim whitespace
      const cleanCode = organization_code.trim();

      // Check if it's a 6-character code or 24-character ObjectId
      if (cleanCode.length === 6) {
        // Short code lookup (case-insensitive)
        organization = await Organization.findOne({ 
          code: cleanCode.toUpperCase(), 
          isActive: true 
        });
        
        if (!organization) {
          return res.error('Invalid organization code. Please check the 6-character code with your organization admin.', 'Registration failed', 400);
        }
      } else if (cleanCode.length === 24) {
        // MongoDB ObjectId lookup (exact match)
        try {
          organization = await Organization.findOne({ 
            _id: cleanCode, 
            isActive: true 
          });
          
          if (!organization) {
            return res.error('Invalid organization ID. Please check the 24-character code with your organization admin.', 'Registration failed', 400);
          }
        } catch (err) {
          // Invalid ObjectId format
          return res.error('Invalid organization code format. The 24-character code must be a valid MongoDB ObjectId.', 'Registration failed', 400);
        }
      } else {
        return res.error('Organization code must be either 6 characters or 24 characters', 'Registration failed', 400);
      }

      // Extract domain from email
      const emailDomain = email.split('@')[1].toLowerCase();

      // Removed strict domain validation as per user request ("remove .edu compulsory")
      // We now trust the Organization Code as the primary verification method.
      // If the code is valid, we allow the registration.

      organization_id = organization._id;
    }

    const result = await authService.register({
      email,
      password,
      fullName: name,
      role: userRole,
      organization_id,
      registrationType: organization_id ? 'organization' : 'public'
    });

    if (result.requiresVerification) {
      return res.success({
        email: result.email,
        requiresVerification: true,
        message: result.message
      }, 'Verification code sent');
    }

    jwtUtils.setTokenCookie(res, result.token);

    res.success({
      user: result.user,
      token: result.token
    }, 'Registration successful');

  } catch (error) {
    return res.error(error.message, 'Registration failed', 400);
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required', 'Login failed', 400);
    }

    const result = await authService.login(email, password);

    jwtUtils.setTokenCookie(res, result.token);

    res.success({
      user: result.user,
      token: result.token,  // ADDED: Return token in response
      message: 'Login successful'
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid email or password') {
      return res.error('Invalid email or password. Please check your credentials.', 'Login failed', 401);
    } else if (error.message === 'Account is deactivated') {
      return res.error('Your account has been deactivated. Please contact support.', 'Login failed', 401);
    } else if (error.message === 'Email not verified. Please verify your email.') {
      return res.error('Please verify your email before logging in.', 'Login failed', 401);
    } else {
      return res.error(error.message || 'Login failed. Please try again.', 'Internal server error', 500);
    }
  }
});

// Verify OTP (for both registration and login)
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.error('Email and OTP are required', 'Validation failed', 400);
    }

    // First check if it's a registration OTP
    const VerificationOTP = require('../models/VerificationOTP');
    const verificationRecord = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false
    });

    if (verificationRecord) {
      // This is a registration OTP - redirect to register/verify-otp logic
      
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

      // OTP is valid - create user account
      const { password, name, role, organization_id, organization_name, organizationCode } = verificationRecord.registrationData;

      // Map public_student to student (they're the same, just without org)
      const finalRole = role === 'public_student' ? 'student' : role;

      let finalOrgId = organization_id;
      let orgCode = null;

      // If org_admin, create organization first
      if (role === 'org_admin' && organization_name) {
        const Organization = require('../models/Organization');
        
        // Generate unique organization code
        const generateOrgCode = () => {
          return Math.random().toString(36).substring(2, 8).toUpperCase();
        };
        
        // Generate slug from organization name
        const generateSlug = (name) => {
          return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        
        let uniqueCode = generateOrgCode();
        let codeExists = await Organization.findOne({ code: uniqueCode });
        
        while (codeExists) {
          uniqueCode = generateOrgCode();
          codeExists = await Organization.findOne({ code: uniqueCode });
        }
        
        let slug = generateSlug(organization_name);
        let slugExists = await Organization.findOne({ slug });
        let slugCounter = 1;
        
        while (slugExists) {
          slug = `${generateSlug(organization_name)}-${slugCounter}`;
          slugExists = await Organization.findOne({ slug });
          slugCounter++;
        }
        
        const newOrg = new Organization({
          name: organization_name,
          slug,
          code: uniqueCode,
          emailDomains: [email.split('@')[1]],
          isActive: true
        });
        
        await newOrg.save();
        finalOrgId = newOrg._id;
        orgCode = uniqueCode;
      }

      const User = require('../models/User');
      const newUser = new User({
        email: email.toLowerCase(),
        password_hash: password,
        name: name,
        role: finalRole,
        organization_id: finalOrgId || null,
        organization_code: orgCode || organizationCode || null,
        isActive: true,
        email_verified: true
      });

      await newUser.save();

      // Mark as verified and delete
      await VerificationOTP.deleteOne({ _id: verificationRecord._id });

      // Generate JWT token
      const token = jwtUtils.generateToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        organization_id: newUser.organization_id
      });

      jwtUtils.setTokenCookie(res, token);

      return res.success({
        user: newUser.toPublicJSON(),
        organization_code: orgCode, // Return org code for admin
        token
      }, 'Registration successful');
    }

    // If not registration OTP, try login OTP verification
    const result = await authService.verifyOtp(email, otp);

    jwtUtils.setTokenCookie(res, result.token);

    res.success({
      user: result.user,
      token: result.token,
      message: 'Email verified successfully'
    }, 'Verification successful');

  } catch (error) {
    return res.error(error.message, 'Verification failed', 400);
  }
});

// Resend OTP
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.error('Email is required', 'Validation failed', 400);
    }

    await authService.resendOtp(email);

    res.success(null, 'OTP resent successfully');

  } catch (error) {
    return res.error(error.message, 'Failed to resend OTP', 400);
  }
});

// Logout user
router.post('/logout', (req, res) => {
  try {
    jwtUtils.clearTokenCookie(res);
    res.success(null, 'Logout successful');
  } catch (error) {
    return res.error(error.message, 'Logout failed', 500);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await req.user.populate('organization_id');

    res.success({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id ? user.organization_id._id : null,
      organization_code: user.organization_code || (user.organization_id ? user.organization_id.code : null),
      organizationName: user.organization_id ? user.organization_id.name : null,
      isActive: user.isActive,
      profile: {
        avatar: user.profile?.avatar,
        phone: user.profile?.phone,
        bio: user.profile?.bio
      }
    }, 'User data retrieved');

  } catch (error) {
    return res.error(error.message, 'Failed to get user data', 500);
  }
});

// Update current user
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, bio } = req.body;
    const User = require('../models/User');
    
    const updateData = {};
    if (fullName) updateData['profile.fullName'] = fullName;
    if (phone) updateData['profile.phone'] = phone;
    if (bio) updateData['profile.bio'] = bio;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.success({
      user: user.toPublicJSON()
    }, 'Profile updated successfully');

  } catch (error) {
    return res.error(error.message, 'Failed to update profile', 500);
  }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.error('Email is required', 'Validation failed', 400);
    }

    const User = require('../models/User');
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return res.success(null, 'If email exists, password reset link has been sent');
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const VerificationCode = require('../models/VerificationCode');

    await VerificationCode.create({
      user_id: user._id,
      code: resetToken,
      type: 'password_reset',
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset - Smart LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.success(null, 'If email exists, password reset link has been sent');

  } catch (error) {
    return res.error(error.message, 'Failed to process request', 500);
  }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.error('Token and password are required', 'Validation failed', 400);
    }

    if (password.length < 8) {
      return res.error('Password must be at least 8 characters', 'Validation failed', 400);
    }

    const VerificationCode = require('../models/VerificationCode');
    const verificationCode = await VerificationCode.findOne({
      code: token,
      type: 'password_reset',
      used: false,
      expires_at: { $gt: new Date() }
    });

    if (!verificationCode) {
      return res.error('Invalid or expired reset token', 'Reset failed', 400);
    }

    const User = require('../models/User');
    const user = await User.findById(verificationCode.user_id);

    if (!user) {
      return res.error('User not found', 'Reset failed', 404);
    }

    user.password = password;
    await user.save();

    verificationCode.used = true;
    await verificationCode.save();

    res.success(null, 'Password reset successfully');

  } catch (error) {
    return res.error(error.message, 'Failed to reset password', 500);
  }
});

module.exports = router;