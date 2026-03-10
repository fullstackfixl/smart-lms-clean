const { User } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listUsers = async (params) => {
  const { role, organization, status, search, page, limit, sort } = params;
  
  const query = { is_deleted: { $ne: true } };
  
  if (role) query.role = role;
  if (organization) query.organization_id = organization;
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sortOptions = getSortOptions(sort);
  
  return paginate(User, query, { 
    page, 
    limit, 
    sort: sortOptions,
    populate: { path: 'organization_id', select: 'name' } 
  });
};

exports.getUserDetails = async (userId) => {
  const user = await User.findById(userId).populate('organization_id', 'name');
  if (!user || user.is_deleted) {
    throw new Error('User not found');
  }
  return user;
};

exports.suspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.is_deleted) {
    throw new Error('User not found');
  }
  
  user.status = 'suspended';
  await user.save();
  return user;
};

exports.activateUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.is_deleted) {
    throw new Error('User not found');
  }

  user.status = 'active';
  await user.save();
  return user;
};

exports.resetUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user || user.is_deleted) {
    throw new Error('User not found');
  }
  
  user.password_hash = newPassword; // Pre-save hook will hash it
  await user.save();
  return { success: true, message: 'Password reset successfully' };
};
