const { User } = require('../models');

class PlatformController {
  /**
   * Create the first platform admin (One-time use)
   * SAFE: force=true only resets if same email already exists,
   * never overwrites a different admin's email.
   */
  async createSuperAdmin(req, res) {
    try {
      const { name, email, password, secret, force } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      // If force-resetting, require secret
      if (force) {
        const adminSecret = process.env.SUPER_ADMIN_SECRET || 'super-secret-admin-key-2024';
        if (secret !== adminSecret) {
          return res.status(403).json({ success: false, message: 'Invalid secret' });
        }
      }

      // Check if a user with THIS email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        if (force) {
          // Force-reset: only update THIS user (same email) — never touches other admins
          existingUser.password_hash = password; // Hashed by model hook
          existingUser.name = name;
          existingUser.role = 'platform_admin';
          existingUser.status = 'active';
          existingUser.email_verified = true;
          await existingUser.save();
          return res.status(200).json({
            success: true,
            message: 'Platform admin reset successfully',
            data: { email: existingUser.email }
          });
        }
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }

      // Guard: don't allow creating another admin without force
      const existingAdmin = await User.findOne({ role: 'platform_admin' });
      if (existingAdmin && !force) {
        return res.status(403).json({
          success: false,
          message: 'Platform admin already exists. Use force=true with secret to create another.'
        });
      }

      // Create new admin (let pre-save hook handle hashing)
      const newAdmin = new User({
        name,
        email: email.toLowerCase(),
        password_hash: password, // Hashed by model hook
        role: 'platform_admin',
        organization_id: null,
        status: 'active',
        email_verified: true
      });

      await newAdmin.save();

      res.status(201).json({
        success: true,
        message: 'Platform admin created successfully',
        data: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role !== 'all') {
        query.role = role;
      }

      const users = await User.find(query)
        .populate('organization_id', 'name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserStats(req, res) {
    try {
      const [total, activeStudents, platformAdmins, pending] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'student', status: 'active' }),
        User.countDocuments({ role: 'platform_admin' }),
        User.countDocuments({ status: 'pending' })
      ]);

      res.json({
        success: true,
        data: {
          total,
          activeStudents,
          platformAdmins,
          pending
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.isActive = isActive;
      user.status = isActive ? 'active' : 'suspended';
      await user.save();

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
        data: user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PlatformController();