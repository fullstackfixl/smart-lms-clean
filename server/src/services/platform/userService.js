const { User } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listUsers = async (params) => {
  const { role, organization, status, search, page, limit, sort } = params;
  
  console.log('[DEBUG] listUsers called with params:', { role, organization, status, search, page, limit });
  
  const query = {}; // is_deleted filter is handled by User model pre-find middleware
  
  if (role) query.role = role;
  if (organization) query.organization_id = organization;
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  console.log('[DEBUG] MongoDB query:', JSON.stringify(query));
  
  const sortOptions = getSortOptions(sort);
  
  const result = await paginate(User, query, { 
    page, 
    limit, 
    sort: sortOptions,
    populate: { path: 'organization_id', select: 'name' } 
  });

  console.log('[DEBUG] paginate result count:', result.data.length);
  console.log('[DEBUG] sample user:', result.data[0] ? { _id: result.data[0]._id, name: result.data[0].name, role: result.data[0].role } : 'No users found');

  // Calculate stats for the query
  const totalCount = await User.countDocuments(query);
  const activeCount = await User.countDocuments({ ...query, status: 'active' });
  const suspendedCount = await User.countDocuments({ ...query, status: 'suspended' });
  
  console.log('[DEBUG] stats:', { total: totalCount, active: activeCount, suspended: suspendedCount });
  
  return {
    users: result.data,
    stats: {
      total: totalCount,
      active: activeCount,
      suspended: suspendedCount
    },
    pagination: result.pagination
  };
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
