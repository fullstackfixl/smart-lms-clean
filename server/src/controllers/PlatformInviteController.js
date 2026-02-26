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

            const user = await User.findOne({
                inviteToken: token,
                inviteTokenExpiry: { $gt: new Date() }
            }).populate('organization_id');

            if (!user) {
                return res.error('Invalid or expired invitation token', 'Authentication Error', 401);
            }

            return res.success({
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                organization: {
                    name: user.organization_id.name,
                    type: user.organization_id.type
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
            }).select('+inviteToken +inviteTokenExpiry');

            if (!user) {
                return res.error('Invalid or expired invitation token', 'Authentication Error', 401);
            }

            const organization = await Organization.findById(user.organization_id);
            if (!organization) {
                return res.error('Organization not found', 'Not Found', 404);
            }

            // Update User
            user.password_hash = password; // Will be hashed by pre-save hook
            user.status = 'active';
            user.email_verified = true;
            user.inviteToken = undefined;
            user.inviteTokenExpiry = undefined;
            await user.save();

            // Update Organization
            organization.status = 'active';
            if (address) {
                if (typeof address === 'string') {
                    organization.address = { street: address };
                } else {
                    organization.address = address;
                }
            }
            organization.phone = phone || organization.phone;
            await organization.save();

            return res.success(null, 'Organization setup completed successfully. You can now login.');
        } catch (error) {
            console.error('Complete setup error:', error);
            return res.error(error.message, 'Failed to complete setup', 500);
        }
    }
}

module.exports = new PlatformInviteController();
