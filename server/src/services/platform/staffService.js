const crypto = require('crypto');
const { User, PlatformAuditLog } = require('../../models');
const emailService = require('../email.service');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listStaff = async (params) => {
  const { search, page, limit, sort } = params;
  
  const query = { 
    role: 'platform_staff',
    is_deleted: { $ne: true } 
  };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOptions = getSortOptions(sort);
  
  const result = await paginate(User, query, { page, limit, sort: sortOptions });
  
  return result;
};

exports.createStaff = async (data, actor = null) => {
  const { name, email, password, status = 'active' } = data;

  const staff = new User({
    name,
    email: String(email).toLowerCase().trim(),
    password_hash: password,
    role: 'platform_staff',
    status,
    email_verified: true,
    inviteToken: undefined,
    inviteTokenExpiry: undefined
  });

  await staff.save();

  if (actor?._id) {
    await PlatformAuditLog.create({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'platform_staff_created',
      entityType: 'User',
      entityId: staff._id,
      details: { email: staff.email, mode: 'direct_create' }
    });
  }

  return staff;
};

exports.updateStaff = async (staffId, data) => {
  const staff = await User.findOneAndUpdate(
    { _id: staffId, role: 'platform_staff' },
    { $set: data },
    { new: true, runValidators: true }
  );
  
  if (!staff || staff.is_deleted) {
    throw new Error('Staff not found');
  }
  
  return staff;
};

exports.disableStaff = async (staffId) => {
  const staff = await User.findOneAndUpdate(
    { _id: staffId, role: 'platform_staff' },
    { $set: { status: 'inactive' } },
    { new: true }
  );
  
  if (!staff || staff.is_deleted) {
    throw new Error('Staff not found');
  }

  return staff;
};

exports.enableStaff = async (staffId) => {
  const staff = await User.findOneAndUpdate(
    { _id: staffId, role: 'platform_staff' },
    { $set: { status: 'active' } },
    { new: true }
  );
  
  if (!staff || staff.is_deleted) {
    throw new Error('Staff not found');
  }

  return staff;
};

exports.inviteStaff = async (data, actor = null) => {
  const { name, email } = data || {};
  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).select('+inviteToken +inviteTokenExpiry');

  if (existingUser && existingUser.role !== 'platform_staff') {
    throw new Error('A user with this email already exists with a different role');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  const acceptLink = `${baseUrl}/platform-staff/accept-invite?token=${token}`;

  let staff;
  if (existingUser) {
    existingUser.name = name.trim();
    existingUser.status = 'pending';
    existingUser.isActive = true;
    existingUser.email_verified = false;
    existingUser.inviteToken = token;
    existingUser.inviteTokenExpiry = inviteTokenExpiry;
    staff = await existingUser.save();
  } else {
    staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      role: 'platform_staff',
      status: 'pending',
      isActive: true,
      email_verified: false,
      inviteToken: token,
      inviteTokenExpiry
    });
  }

  try {
    await emailService.sendEmail({
      to: normalizedEmail,
      subject: 'You have been invited to join the platform staff team',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:16px;">
          <h2 style="margin:0 0 12px;color:#0f172a;">Platform Staff Invitation</h2>
          <p style="color:#334155;line-height:1.7;margin:0 0 12px;">Hello ${name},</p>
          <p style="color:#334155;line-height:1.7;margin:0 0 20px;">You have been invited to join the platform staff workspace. Your invitation expires in 24 hours.</p>
          <a href="${acceptLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;">Accept Invitation</a>
          <p style="margin-top:20px;color:#64748b;font-size:12px;">If the button does not work, copy this link: ${acceptLink}</p>
        </div>
      `
    });
  } catch (error) {
    console.warn('[staffService] Failed to send staff invitation email:', error.message);
  }

  if (actor?._id) {
    await PlatformAuditLog.create({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'platform_staff_invited',
      entityType: 'User',
      entityId: staff._id,
      details: { email: normalizedEmail, expiresAt: inviteTokenExpiry, inviteLink: acceptLink }
    });
  }

  return {
    staff: staff.toPublicJSON ? staff.toPublicJSON() : staff.toObject(),
    inviteLink: acceptLink,
    expiresAt: inviteTokenExpiry
  };
};

exports.verifyInvite = async (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  const user = await User.findOne({
    role: 'platform_staff',
    inviteToken: token,
    inviteTokenExpiry: { $gt: new Date() }
  }).select('+inviteToken +inviteTokenExpiry');

  if (!user) {
    const expired = await User.findOne({ role: 'platform_staff', inviteToken: token }).select('+inviteToken +inviteTokenExpiry');
    if (expired) {
      const err = new Error('Invitation link has expired');
      err.statusCode = 410;
      throw err;
    }
    const err = new Error('Invalid invitation link');
    err.statusCode = 404;
    throw err;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

exports.acceptInvite = async (data) => {
  const { token, name, password } = data || {};
  if (!token || !password) {
    throw new Error('Token and password are required');
  }

  const user = await User.findOne({
    role: 'platform_staff',
    inviteToken: token,
    inviteTokenExpiry: { $gt: new Date() }
  }).select('+inviteToken +inviteTokenExpiry +password_hash');

  if (!user) {
    const expired = await User.findOne({ role: 'platform_staff', inviteToken: token }).select('+inviteToken +inviteTokenExpiry');
    if (expired) {
      const err = new Error('Invitation link has expired');
      err.statusCode = 410;
      throw err;
    }
    const err = new Error('Invalid invitation link');
    err.statusCode = 404;
    throw err;
  }

  user.name = name ? String(name).trim() : user.name;
  user.password_hash = password;
  user.status = 'active';
  user.isActive = true;
  user.email_verified = true;
  user.inviteToken = undefined;
  user.inviteTokenExpiry = undefined;
  await user.save();

  await PlatformAuditLog.create({
    actorId: user._id,
    actorRole: user.role,
    action: 'platform_staff_invite_accepted',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email }
  });

  return user.toPublicJSON ? user.toPublicJSON() : user.toObject();
};

exports.deactivateStaff = async (staffId, actor = null) => {
  const staff = await User.findOne({ _id: staffId, role: 'platform_staff' });
  if (!staff) {
    throw new Error('Staff not found');
  }

  staff.status = 'inactive';
  staff.isActive = false;
  await staff.save();

  if (actor?._id) {
    await PlatformAuditLog.create({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'platform_staff_deactivated',
      entityType: 'User',
      entityId: staff._id,
      details: { email: staff.email }
    });
  }

  return staff;
};
