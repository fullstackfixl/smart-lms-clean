const { User } = require('../models');

class PlatformController {
  /**
   * Create the first platform admin (One-time use)
   */
  async createSuperAdmin(req, res) {
    try {
      const { name, email, password, secret, force } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      // Check if any platform admin already exists
      const existingAdmin = await User.findOne({ role: 'platform_admin' });

      if (existingAdmin && !force) {
        return res.status(403).json({
          success: false,
          message: 'Platform admin already exists. Use force=true with secret to reset.'
        });
      }

      // If force-resetting, require secret
      if (force) {
        const adminSecret = process.env.SUPER_ADMIN_SECRET || 'super-secret-admin-key-2024';
        if (secret !== adminSecret) {
          return res.status(403).json({ success: false, message: 'Invalid secret' });
        }
      }

      if (existingAdmin && force) {
        // Reset existing admin
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(password, 10);
        await User.updateOne(
          { role: 'platform_admin' },
          { $set: { email: email.toLowerCase(), password_hash: hash, name, status: 'active', email_verified: true } }
        );
        return res.status(200).json({
          success: true,
          message: 'Platform admin reset successfully',
          data: { email: email.toLowerCase() }
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
        data: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PlatformController();