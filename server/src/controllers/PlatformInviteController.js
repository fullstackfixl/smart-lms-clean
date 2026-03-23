const { Organization, User } = require('../models');
const BaseController = require('../core/BaseController');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class PlatformInviteController extends BaseController {
    async verifyToken(req, res) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.error('Token is required', 'Validation Error', 400);
            }

            // inviteToken has select:false — must use +inviteToken to include it
            const user = await User.findOne({
                inviteToken: token,
                inviteTokenExpiry: { $gt: new Date() }
            })
                .select('+inviteToken +inviteTokenExpiry')
                .populate('organization_id', 'name type modulesEnabled status');

            if (!user) {
                // Check if token exists but is expired
                const expiredUser = await User.findOne({ inviteToken: token }).select('+inviteToken +inviteTokenExpiry');
                if (expiredUser) {
                    return res.error('Invitation link has expired. Please contact the platform administrator.', 'Token Expired', 410);
                }
                return res.error('Invalid invitation link. The link may have already been used.', 'Authentication Error', 401);
            }

            return res.success({
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                organization: {
                    name: user.organization_id?.name || 'Your Organization',
                    type: user.organization_id?.type || 'SCHOOL'
                }
            }, 'Token verified successfully');
        } catch (error) {
            console.error('Verify token error:', error);
            return res.error(error.message, 'Failed to verify token', 500);
        }
    }

    async completeSetup(req, res) {
        try {
            const { token, address, phone, password } = req.body;

            if (!token || !password) {
                return res.error('Token and password are required', 'Validation Error', 400);
            }

            const user = await User.findOne({
                inviteToken: token,
                inviteTokenExpiry: { $gt: new Date() }
            }).select('+inviteToken +inviteTokenExpiry +password_hash');

            if (!user) {
                const expiredUser = await User.findOne({ inviteToken: token }).select('+inviteToken +inviteTokenExpiry');
                if (expiredUser) {
                    return res.error('Invitation link has expired (24h). Please contact the platform administrator.', 'Token Expired', 410);
                }
                return res.error('Invalid or already used invitation link.', 'Authentication Error', 401);
            }

            const organization = await Organization.findById(user.organization_id);
            if (!organization) {
                return res.error('Organization not found', 'Not Found', 404);
            }

            // Update User — activate account
            user.password_hash = password; // Hashed by model hook
            user.status = 'active';
            user.email_verified = true;
            user.inviteToken = undefined;
            user.inviteTokenExpiry = undefined;
            await user.save();

            // Activate Organization
            organization.status = 'active';
            if (address) {
                organization.address = typeof address === 'string' ? { street: address } : address;
            }
            if (phone) organization.phone = phone;
            await organization.save();

            return res.success({
                organization: {
                    name: organization.name,
                    type: organization.type,
                    modulesEnabled: organization.modulesEnabled || []
                },
                redirectUrl: '/login'
            }, 'Organization setup completed successfully. You can now login.');
        } catch (error) {
            console.error('Complete setup error:', error);
            return res.error(error.message, 'Failed to complete setup', 500);
        }
    }

}

module.exports = new PlatformInviteController();
