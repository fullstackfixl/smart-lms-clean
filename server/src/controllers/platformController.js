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
          const bcrypt = require('bcryptjs');
          const hash = await bcrypt.hash(password, 10);
          existingUser.password_hash = hash;
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

      // Create new admin (hash password ourselves — don't rely on pre-save hook)
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 10);
      const newAdmin = new User({
        name,
        email: email.toLowerCase(),
        password_hash: hash,
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