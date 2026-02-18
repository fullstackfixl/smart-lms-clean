const User = require('../models/User');
const bcrypt = require('bcryptjs');

class PlatformAdminsController {
  // Get all platform admins
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const query = { role: 'platform_admin' };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const admins = await User.find(query)
        .select('-password_hash -mfa_secret')
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await User.countDocuments(query);

      return res.success({
        admins,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }, 'Platform admins retrieved successfully');
    } catch (error) {
      console.error('Get platform admins error:', error);
      return res.error(error.message, 'Failed to get platform admins', 500);
    }
  }

  // Create platform admin
  async create(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.error('Email, password, and name are required', 'Validation failed', 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.error('User with this email already exists', 'Duplicate email', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create platform admin
      const admin = new User({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        name,
        role: 'platform_admin',
        email_verified: true,
        isActive: true
      });

      await admin.save();

      return res.success(
        admin.toPublicJSON ? admin.toPublicJSON() : admin.toObject(),
        'Platform admin created successfully'
      );
    } catch (error) {
      console.error('Create platform admin error:', error);
      return res.error(error.message, 'Failed to create platform admin', 500);
    }
  }

  // Update platform admin status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.error('isActive must be a boolean', 'Validation failed', 400);
      }

      const admin = await User.findOne({ _id: id, role: 'platform_admin' });
      if (!admin) {
        return res.error('Platform admin not found', 'Not found', 404);
      }

      // Prevent deactivating yourself
      if (req.user._id.toString() === id && !isActive) {
        return res.error('Cannot deactivate your own account', 'Operation not allowed', 400);
      }

      admin.isActive = isActive;
      await admin.save();

      return res.success(
        admin.toPublicJSON ? admin.toPublicJSON() : admin.toObject(),
        `Platform admin ${isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Update platform admin status error:', error);
      return res.error(error.message, 'Failed to update platform admin status', 500);
    }
  }
}

module.exports = new PlatformAdminsController();
