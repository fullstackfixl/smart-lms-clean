const { Organization } = require('../../models');
const { paginate, getSortOptions } = require('../../utils/pagination');

exports.listOrganizations = async (params) => {
  const { search, status, plan, page, limit, sort } = params;
  
  const query = { is_deleted: { $ne: true } };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (plan) query.plan = plan;
  
  const sortOptions = getSortOptions(sort);
  
  return paginate(Organization, query, { page, limit, sort: sortOptions });
};

exports.createOrganization = async (data, creatorId) => {
  const organization = new Organization({
    ...data,
    created_by: creatorId,
    status: 'active'
  });
  
  await organization.save();
  return organization;
};

exports.getOrganizationById = async (orgId) => {
  const organization = await Organization.findById(orgId).populate('created_by', 'name email');
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  return organization;
};

exports.updateOrganization = async (orgId, data) => {
  const organization = await Organization.findByIdAndUpdate(
    orgId,
    { $set: data },
    { new: true, runValidators: true }
  );
  
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  return organization;
};

exports.suspendOrganization = async (orgId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  organization.status = 'suspended';
  await organization.save();
  return organization;
};

exports.deleteOrganization = async (orgId, deleterId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || organization.is_deleted) {
    throw new Error('Organization not found');
  }
  
  await organization.softDelete(deleterId);
  return { success: true, message: 'Organization soft-deleted successfully' };
};
