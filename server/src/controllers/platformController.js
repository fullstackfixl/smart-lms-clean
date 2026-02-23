const { User } = require('../models');

class PlatformController {
  /**
   * Create the first platform admin (One-time use)
   */
  async createSuperAdmin(req, res) {
    try {
      // Check if any platform admin already exists
      const existingAdmin = await User.findOne({ role: 'platform_admin' });
      if (existingAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Platform admin already exists'
        });
      }

      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      const newAdmin = new User({
        name,
        email: email.toLowerCase(),
        password_hash: password, // Will be hashed by pre-save hook
        role: 'platform_admin',
        organization_id: null,
        status: 'active',
        email_verified: true
      });

      await newAdmin.save();

      res.status(201).json({
        success: true,
        message: 'Platform admin created successfully',
        data: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PlatformController();
