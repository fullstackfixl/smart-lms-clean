const authService = require('../services/authService');
const { authValidation } = require('../middleware/validation');

class AuthController {
    /**
     * Unified login for all roles
     */
    async login(req, res) {
        try {
            const { error } = authValidation.login.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const { email, password, mfaCode } = req.body;
            const result = await authService.login(email, password, mfaCode);

            // Set cookie
            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    role: result.role,
                    redirectUrl: result.redirectUrl,
                    user: result.user
                }
            });
        } catch (error) {
            res.status(error.statusCode || 401).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Submit an organization application
     */
    async applyOrganization(req, res) {
        try {
            const { error } = authValidation.applyOrganization.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const result = await authService.applyOrganization(req.body);
            res.status(201).json({
                success: true,
                message: 'Application submitted. Awaiting approval.',
                data: result
            });
        } catch (error) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Complete organization registration (Set Password)
     */
    async completeOrganizationRegistration(req, res) {
        try {
            const { error } = authValidation.completeOrganizationRegistration.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const result = await authService.completeOrganizationRegistration(req.body);

            // Set cookie for automatic login
            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            res.status(200).json({
                success: true,
                message: 'Organization registration complete. Welcome!',
                data: result
            });
        } catch (error) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Register a user (Student/Parent) via school subdomain
     */
    async registerUser(req, res) {
        try {
            const { error } = authValidation.registerUser.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const result = await authService.registerUser(req.body);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please verify your email.',
                data: result
            });
        } catch (error) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message
            });
        }
    }

    async requestRegistrationOtp(req, res) {
        try {
            const { role, name, email, password, orgSubdomain } = req.body;
            if (!['student', 'parent'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role for self-signup' });
            }
            if (!name || !email || !password || !orgSubdomain) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            }
            const Organization = require('../models/Organization');
            const User = require('../models/User');
            const VerificationOTP = require('../models/VerificationOTP');
            const { generateOTP } = require('../utils/otp');
            const emailService = require('../services/email.service');
            const { generateOtpTemplate } = emailService;
            const org = await Organization.findOne({ subdomain: orgSubdomain.toLowerCase() });
            if (!org) {
                return res.status(404).json({ success: false, message: 'Organization not found' });
            }
            const existingUser = await User.findOne({ email: email.toLowerCase(), organization_id: org._id });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already registered in this organization' });
            }
            const otp = generateOTP();
            await VerificationOTP.findOneAndDelete({ email: email.toLowerCase(), verified: false, 'registrationData.type': 'user' });
            const verificationRecord = new VerificationOTP({
                email: email.toLowerCase(),
                otp,
                registrationData: {
                    type: 'user',
                    role,
                    name,
                    email: email.toLowerCase(),
                    password,
                    orgSubdomain
                }
            });
            await verificationRecord.save();
            const subject = 'Verify Your Registration - Smart LMS';
            const html = generateOtpTemplate(otp);

            const emailSent = await emailService.sendEmail({
                to: email,
                subject,
                html
            });
            res.status(200).json({
                success: true,
                message: 'Verification code sent to your email',
                data: emailSent ? { requiresOTP: true } : { requiresOTP: true, otp, emailFailed: true }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyRegistrationOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required' });
            }
            const VerificationOTP = require('../models/VerificationOTP');
            const User = require('../models/User');
            const jwtUtils = require('../utils/jwt');
            const record = await VerificationOTP.findOne({
                email: email.toLowerCase(),
                verified: false,
                'registrationData.type': 'user'
            });
            if (!record) {
                return res.status(400).json({ success: false, message: 'No verification request found' });
            }
            if (new Date() > record.expiresAt) {
                await VerificationOTP.deleteOne({ _id: record._id });
                return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one' });
            }
            if (record.attempts >= 5) {
                await VerificationOTP.deleteOne({ _id: record._id });
                return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code' });
            }
            if (record.otp !== otp) {
                record.attempts += 1;
                await record.save();
                return res.status(400).json({ success: false, message: `Invalid verification code. ${5 - record.attempts} attempts remaining` });
            }
            const { role, name, orgSubdomain, password } = record.registrationData;
            const resultUser = await authService.registerUser({
                role,
                name,
                email: email.toLowerCase(),
                password,
                orgSubdomain
            });
            record.verified = true;
            await record.save();
            await VerificationOTP.deleteOne({ _id: record._id });
            const Organization = require('../models/Organization');
            const org = await Organization.findOne({ subdomain: orgSubdomain.toLowerCase() });
            const createdUser = await User.findOne({ email: email.toLowerCase(), organization_id: org?._id }).select('-password_hash');
            const token = jwtUtils.generateToken({
                user_id: createdUser._id,
                role: createdUser.role,
                organization_id: createdUser.organization_id || null
            });
            jwtUtils.setTokenCookie(res, token);
            res.status(200).json({
                success: true,
                data: {
                    token,
                    user: createdUser
                },
                message: 'Registration verified successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async resendRegistrationOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }
            const VerificationOTP = require('../models/VerificationOTP');
            const { generateOTP } = require('../utils/otp');
            const emailService = require('../services/email.service');
            const { generateOtpTemplate } = emailService;
            const record = await VerificationOTP.findOne({
                email: email.toLowerCase(),
                verified: false,
                'registrationData.type': 'user'
            });
            if (!record) {
                return res.status(400).json({ success: false, message: 'No verification request found' });
            }
            const otp = generateOTP();
            record.otp = otp;
            record.attempts = 0;
            record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await record.save();
            const subject = 'Your new verification code - Smart LMS';
            const html = generateOtpTemplate(otp);
            const emailSent = await emailService.sendEmail({
                to: email,
                subject,
                html
            });
            res.status(200).json({
                success: true,
                data: emailSent ? {} : { otp, emailFailed: true },
                message: 'New verification code sent'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Accept an invitation (Staff/Instructor)
     */
    async acceptInvite(req, res) {
        try {
            const { error } = authValidation.acceptInvite.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const result = await authService.acceptInvite(req.body);
            const user = result.user;

            if (user && user.role === 'instructor') {
                const OrganizationEvent = require('../models/OrganizationEvent');
                const event = await OrganizationEvent.create({
                    organizationId: user.organization_id,
                    type: 'NEW_INSTRUCTOR',
                    message: `New instructor joined: ${user.name}`,
                    relatedId: user._id
                });

                if (global.io) {
                    global.io.to(`organization_${user.organization_id}`).emit('new_event', event);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Invitation accepted. Your account is now active.',
                data: result
            });
        } catch (error) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Logout user
     */
    async logout(req, res) {
        const jwtUtils = require('../utils/jwt');
        jwtUtils.clearTokenCookie(res);
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    /**
     * Refresh auth token
     */
    async refresh(req, res) {
        try {
            const jwtUtils = require('../utils/jwt');
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const token = jwtUtils.generateToken({
                user_id: user._id,
                role: user.role,
                organization_id: user.organization_id || null
            });

            jwtUtils.setTokenCookie(res, token);

            res.status(200).json({
                success: true,
                data: { token }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get current authenticated user
     */
    async me(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            res.status(200).json({
                success: true,
                data: { user: req.user.toPublicJSON ? req.user.toPublicJSON() : req.user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Forgot password request
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }
            await authService.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a password reset link has been sent.'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Reset password using token
     */
    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password } = req.body;
            if (!token || !password) {
                return res.status(400).json({ success: false, message: 'Token and password are required' });
            }
            await authService.resetPassword(token, password);
            res.status(200).json({
                success: true,
                message: 'Password reset successful. You can now login.'
            });
        } catch (error) {
            res.status(error.statusCode || 400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();
