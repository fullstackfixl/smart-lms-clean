const { User } = require('../../models');
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
  
  // Return data directly as array for frontend compatibility
  return result.data;
};

exports.createStaff = async (data) => {
  const staff = new User({
    ...data,
    role: 'platform_staff',
    status: 'active'
  });
  
  await staff.save();
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
