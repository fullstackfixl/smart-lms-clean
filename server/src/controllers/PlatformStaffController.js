const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');

class PlatformStaffController {
    /**
     * Create a new platform staff member
     * POST /api/platform/staff/create
     * Only platform_admin can create staff
     */
    async createStaff(req, res) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and password are required'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            // Check if email already exists
            const existing = await User.findOne({ email: email.toLowerCase() });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const password_hash = await bcrypt.hash(password, salt);

            // Create staff user
            const staffUser = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password_hash,
                role: 'platform_staff',
                status: 'active',
                email_verified: true
            });

            return res.status(201).json({
                success: true,
                message: 'Platform staff created successfully',
                data: {
                    _id: staffUser._id,
                    name: staffUser.name,
                    email: staffUser.email,
                    role: staffUser.role,
                    status: staffUser.status,
                    createdAt: staffUser.createdAt
                }
            });
        } catch (error) {
            console.error('❌ [PlatformStaffController] createStaff error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to create platform staff',
                error: error.message
            });
        }
    }

    /**
     * List all platform staff members
     * GET /api/platform/staff
     * Only platform_admin can list staff
     */
    async listStaff(req, res) {
        try {
            const staff = await User.find({ role: 'platform_staff' })
                .select('name email status createdAt updatedAt')
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                data: staff
            });
        } catch (error) {
            console.error('❌ [PlatformStaffController] listStaff error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to list platform staff'
            });
        }
    }

    /**
     * Update staff status (activate/deactivate)
     * PATCH /api/platform/staff/:id/status
     * Only platform_admin can change staff status
     */
    async updateStaffStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['active', 'suspended', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Use: active, suspended, or inactive'
                });
            }

            const staff = await User.findById(id);
            if (!staff || staff.role !== 'platform_staff') {
                return res.status(404).json({
                    success: false,
                    message: 'Platform staff member not found'
                });
            }

            staff.status = status;
            await staff.save();

            return res.json({
                success: true,
                message: `Staff member ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: {
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    status: staff.status
                }
            });
        } catch (error) {
            console.error('❌ [PlatformStaffController] updateStaffStatus error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to update staff status'
            });
        }
    }

    /**
     * Get activity logs
     * GET /api/platform/staff/logs
     * Only platform_admin can view logs
     */
    async getActivityLogs(req, res) {
        try {
            const { page = 1, limit = 50, role } = req.query;
            const query = {};
            if (role) query.role = role;

            const logs = await AdminLog.find(query)
                .populate('userId', 'name email role')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await AdminLog.countDocuments(query);

            return res.json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('❌ [PlatformStaffController] getActivityLogs error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch activity logs'
            });
        }
    }
}

module.exports = new PlatformStaffController();
