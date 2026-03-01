const { Organization, User } = require('../models');
const VerificationOTP = require('../models/VerificationOTP');
const { generateOTP } = require('../utils/otp');
const emailService = require('./email.service');
const bcrypt = require('bcryptjs');
const jwtUtils = require('../utils/jwt');

class StudentRegistrationService {
  async validateOrganization(codeRaw) {
    const code = (codeRaw || '').trim().toUpperCase();
    if (!code) {
      const err = new Error('organization_code is required');
      err.statusCode = 400;
      throw err;
    }
    const org = await Organization.findOne({ code });
    if (!org) {
      const err = new Error('Organization not found');
      err.statusCode = 404;
      throw err;
    }
    if (org.status !== 'active') {
      const err = new Error('Organization is not active');
      err.statusCode = 403;
      throw err;
    }
    return { _id: org._id, name: org.name, code: org.code };
  }

  async sendVerification({ name, email, organization_code }) {
    if (!name || !email || !organization_code) {
      const err = new Error('name, email and organization_code are required');
      err.statusCode = 400;
      throw err;
    }
    // Validate org
    const { _id: orgId } = await this.validateOrganization(organization_code);

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: orgId });
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    // Generate and store OTP
    const otp = generateOTP();
    await VerificationOTP.findOneAndDelete({
      email: email.toLowerCase(),
      verified: false,
      'registrationData.type': 'student_registration'
    });

    const verification = new VerificationOTP({
      email: email.toLowerCase(),
      otp,
      registrationData: {
        type: 'student_registration',
        name,
        email: email.toLowerCase(),
        organization_code: organization_code.toUpperCase()
      }
    });
    await verification.save();

    const emailService = require('./email.service');
    const { generateOtpTemplate } = emailService;

    // Send email using new centralized system
    const subject = 'Verify Your Student Registration - Smart LMS';
    const html = generateOtpTemplate(otp);

    const emailSent = await emailService.sendEmail({
      to: email,
      subject,
      html
    });

    return emailSent ? {} : { otp, emailFailed: true };
  }

  async completeRegistration({ name, email, password, organization_code, otp }) {
    if (!name || !email || !password || !organization_code || !otp) {
      const err = new Error('name, email, password, organization_code, otp are required');
      err.statusCode = 400;
      throw err;
    }

    // Validate org
    const { _id: orgId } = await this.validateOrganization(organization_code);

    // Validate OTP
    const record = await VerificationOTP.findOne({
      email: email.toLowerCase(),
      verified: false,
      'registrationData.type': 'student_registration'
    });
    if (!record) {
      const err = new Error('No verification request found');
      err.statusCode = 400;
      throw err;
    }
    if (new Date() > record.expiresAt) {
      await VerificationOTP.deleteOne({ _id: record._id });
      const err = new Error('Verification code expired');
      err.statusCode = 400;
      throw err;
    }
    if (record.attempts >= 5) {
      await VerificationOTP.deleteOne({ _id: record._id });
      const err = new Error('Too many failed attempts');
      err.statusCode = 400;
      throw err;
    }
    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      const err = new Error(`Invalid verification code. ${Math.max(0, 5 - record.attempts)} attempts remaining`);
      err.statusCode = 400;
      throw err;
    }

    // Ensure email still unique in org
    const exists = await User.findOne({ email: email.toLowerCase(), organization_id: orgId });
    if (exists) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    // Hash password
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create student
    const user = new User({
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: 'student',
      organization_id: orgId,
      organization_code: (organization_code || '').toString().toUpperCase(),
      status: 'active',
      email_verified: true
    });
    await user.save();

    // Cleanup OTP
    record.verified = true;
    await record.save();
    await VerificationOTP.deleteOne({ _id: record._id });

    // Generate JWT
    const token = jwtUtils.generateToken({
      user_id: user._id,
      role: user.role,
      organization_id: user.organization_id
    });

    return { token, user: user.toPublicJSON() };
  }
}

module.exports = new StudentRegistrationService();
