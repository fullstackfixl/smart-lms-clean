const { User } = require('../../models');
const AuditLog = require('../../models/AuditLog');

/**
 * Platform Staff Service
 * Manages the platform's internal operational team
 */
class StaffService {
  /**
   * Provision a new platform staff node
   */
  async createStaff(data, actor) {
    const { name, email, password, role = 'platform_staff' } = data;

    // Email collision check across platform-level users
    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: null });
    if (existing) throw new Error('Identity conflict: Email already registered in platform cluster');

    const staffMember = new User({
      name,
      email: email.toLowerCase(),
      password_hash: password, // Hashed via pre-save hook
      role: 'platform_staff',
      organization_id: null, // Critical: No organization binding
      status: 'active'
    });

    await staffMember.save();

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: 'CREATE',
      resource: 'admin', // Using 'admin' resource for staff management
      resource_id: staffMember._id.toString(),
      details: { name, email, role }
    });

    return staffMember;
  }

  /**
   * List all platform internal staff
   */
  async listStaff() {
    return User.find({ 
      role: 'platform_staff', 
      organization_id: null,
      is_deleted: { $ne: true } 
    }).select('-password_hash').lean();
  }

  /**
   * Update staff identity or status
   */
  async updateStaff(staffId, data, actor) {
    const staff = await User.findOneAndUpdate(
      { _id: staffId, role: 'platform_staff', organization_id: null },
      { ...data, updated_at: new Date() },
      { new: true }
    ).select('-password_hash');

    if (!staff) throw new Error('Staff member not found or non-platform node');

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: 'UPDATE',
      resource: 'admin',
      resource_id: staffId,
      details: data
    });

    return staff;
  }

  /**
   * Deactivate staff access
   */
  async updateStatus(staffId, status, actor) {
    const staff = await User.findOneAndUpdate(
      { _id: staffId, role: 'platform_staff', organization_id: null },
      { status, updated_at: new Date() },
      { new: true }
    );

    if (!staff) throw new Error('Staff member not found');

    await AuditLog.create({
      user_id: actor._id,
      user_email: actor.email,
      user_role: actor.role,
      action: status === 'active' ? 'ACTIVATE' : 'SUSPEND',
      resource: 'admin',
      resource_id: staffId
    });

    return staff;
  }
}

module.exports = new StaffService();
