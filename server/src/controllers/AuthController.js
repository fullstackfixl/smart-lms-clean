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
            const result = await authService.loginStrict(email, password, mfaCode, {
                allowedRoles: ['student', 'instructor']
            });

            // Set cookie
            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    role: result.role,
                    redirectUrl: result.redirectUrl,
                    user: result.user,
                    organization: result.organization || null
                }
            });
        } catch (error) {
            res.status(error.statusCode || 401).json({
                success: false,
                message: error.message
            });
        }
    }

    async platformAdminLogin(req, res) {
        try {
            const { error } = authValidation.login.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const { email, password, mfaCode } = req.body;
            const result = await authService.loginStrict(email, password, mfaCode, {
                allowedRoles: ['platform_admin']
            });

            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            return res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    role: result.role,
                    redirectUrl: '/platform-admin/dashboard',
                    user: result.user,
                    organization: result.organization || null
                }
            });
        } catch (error) {
            return res.status(error.statusCode || 401).json({
                success: false,
                message: error.message
            });
        }
    }

    async orgAdminLogin(req, res) {
        try {
            const { error } = authValidation.login.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const { email, password, mfaCode } = req.body;
            const result = await authService.loginStrict(email, password, mfaCode, {
                allowedRoles: ['organization_admin', 'org_admin'],
                normalizeRole: 'organization_admin',
                requireOrganization: true
            });

            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            return res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    role: result.role,
                    redirectUrl: '/org-admin/dashboard',
                    user: result.user,
                    organization: result.organization || null
                }
            });
        } catch (error) {
            return res.status(error.statusCode || 401).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyInviteToken(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }
            const data = await authService.verifyInviteToken(token);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(error.statusCode || 400).json({ success: false, message: error.message });
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
            const org = await Organization.findOne({ 
                $or: [
                    { subdomain: orgSubdomain.toLowerCase() },
                    { code: orgSubdomain.toUpperCase() }
                ]
            });
            if (!org) {
                return res.status(404).json({ success: false, message: 'Organization not found. Please check your code or subdomain.' });
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

            // Populate organization to return type + modules in same response
            let organization = null;
            if (req.user.organization_id) {
                const Organization = require('../models/Organization');
                const orgId = req.user.organization_id?._id || req.user.organization_id;
                const org = await Organization.findById(orgId).select('name type modulesEnabled status plan subdomain branding logo_url');
                if (org) {
                    organization = {
                        _id: org._id,
                        name: org.name,
                        type: org.type,
                        modulesEnabled: org.modulesEnabled || [],
                        status: org.status,
                        plan: org.plan,
                        subdomain: org.subdomain,
                        branding: org.branding || undefined,
                        logo_url: org.logo_url || undefined
                    };
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    user: req.user.toPublicJSON ? req.user.toPublicJSON() : req.user,
                    organization
                }
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

    /**
     * Redirect to Google Auth (Mock/Placeholder)
     */
    async googleLogin(req, res) {
        const { returnUrl } = req.query;
        // In a real implementation with passport or similar, this would redirect to Google
        // For now, we'll redirect to our mock callback with some mock data if no real config is present
        const baseUrl = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
        const callbackUrl = `${baseUrl}/auth/google/callback?email=google_user@example.com&name=Google%20User&providerId=google_123&returnUrl=${encodeURIComponent(returnUrl || '')}`;

        console.log(`🚀 [Auth] Redirecting to Google Auth (Mock): ${callbackUrl}`);
        res.redirect(callbackUrl);
    }

    /**
     * Handle Google Callback
     */
    async googleCallback(req, res) {
        try {
            const { email, name, providerId, returnUrl } = req.query;

            if (!email) {
                return res.status(400).json({ success: false, message: 'Google authentication failed' });
            }

            const result = await authService.socialLogin({
                email,
                name,
                providerId,
                provider: 'google'
            });

            // Set cookie
            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            // Redirect back to frontend
            const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
            const redirectPath = returnUrl || result.redirectUrl || '/dashboard';
            const finalRedirect = `${clientUrl}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}token=${result.token}`;

            console.log(`✅ [Auth] Google Login Success: ${email}. Redirecting to: ${finalRedirect}`);
            res.redirect(finalRedirect);
        } catch (error) {
            console.error('❌ [Auth] Google Callback Error:', error);
            const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
            res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * Handle Firebase Social Login
     */
    async firebaseLogin(req, res) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
            }

            const { verifyIdToken } = require('../utils/firebase');
            const decodedToken = await verifyIdToken(idToken);

            if (!decodedToken || !decodedToken.email) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }

            const result = await authService.socialLogin({
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                providerId: decodedToken.uid,
                provider: decodedToken.firebase?.sign_in_provider || 'google'
            });

            // Set cookie
            const jwtUtils = require('../utils/jwt');
            jwtUtils.setTokenCookie(res, result.token);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('❌ [Auth] Firebase Login Error:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Firebase authentication failed'
            });
        }
    }
}

module.exports = new AuthController();
