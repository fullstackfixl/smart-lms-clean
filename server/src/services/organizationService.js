const Organization = require('../models/Organization');
const User = require('../models/User');
const BaseService = require('../core/BaseService');

class OrganizationService extends BaseService {
  constructor() {
    super(Organization);
  }

  /**
   * Create a new organization with default values
   * @param {Object} data - Organization data
   * @returns {Promise<Object>} Created organization
   */
  async create(data) {
    const organization = new Organization({
      ...data,
      status: 'active',
      is_deleted: false,
      admin_count: 0,
      user_count: 0
    });

    await organization.save();
    return organization;
  }

  /**
   * Find all organizations (excludes soft-deleted by default)
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Organizations and pagination info
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, search, status } = pagination;
    const skip = (page - 1) * limit;

    // Build query - soft-deleted are automatically excluded by model middleware
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .lean(),
      Organization.countDocuments(query)
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find organization by ID (excludes soft-deleted by default)
   * @param {String} id - Organization ID
   * @returns {Promise<Object|null>} Organization or null
   */
  async findById(id) {
    return Organization.findById(id).lean();
  }

  /**
   * Update organization
   * @param {String} id - Organization ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated organization
   */
  async update(id, data) {
    const organization = await Organization.findById(id);
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Update fields
    Object.assign(organization, data);
    await organization.save();

    return organization;
  }

  /**
   * Count organizations by status
   * @returns {Promise<Object>} Count by status
   */
  async countByStatus() {
    const counts = await Organization.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      active: 0,
      suspended: 0,
      deleted: 0
    };

    counts.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });

    return result;
  }

  /**
   * Search organizations by name
   * @param {String} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching organizations
   */
  async search(searchTerm, options = {}) {
    const { limit = 20, status } = options;
    
    const query = {
      name: { $regex: searchTerm, $options: 'i' }
    };

    if (status) {
      query.status = status;
    }

    return Organization.find(query)
      .limit(limit)
      .sort({ name: 1 })
      .lean();
  }

  /**
   * Update organization counts (admin_count, user_count)
   * @param {String} organizationId - Organization ID
   * @returns {Promise<Object>} Updated organization
   */
  async updateCounts(organizationId) {
    const [adminCount, userCount] = await Promise.all([
      User.countDocuments({
        organization_id: organizationId,
        role: { $in: ['org_admin', 'organization_admin'] },
        is_deleted: false
      }),
      User.countDocuments({
        organization_id: organizationId,
        is_deleted: false
      })
    ]);

    return Organization.findByIdAndUpdate(
      organizationId,
      { admin_count: adminCount, user_count: userCount },
      { new: true }
    );
  }

  /**
   * Suspend an organization
   * @param {String} id - Organization ID
   * @returns {Promise<Object>} Updated organization
   */
  async suspend(id) {
    const organization = await Organization.findById(id);
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    await organization.suspend();
    return organization;
  }

  /**
   * Activate an organization
   * @param {String} id - Organization ID
   * @returns {Promise<Object>} Updated organization
   */
  async activate(id) {
    const organization = await Organization.findById(id);
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    await organization.activate();
    return organization;
  }

  /**
   * Soft delete an organization
   * @param {String} id - Organization ID
   * @param {String} userId - ID of user performing the deletion
   * @returns {Promise<Object>} Updated organization
   */
  async softDelete(id, userId) {
    const organization = await Organization.findById(id).setOptions({ includeDeleted: true });
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    await organization.softDelete(userId);
    return organization;
  }

  /**
   * Restore a soft-deleted organization
   * @param {String} id - Organization ID
   * @returns {Promise<Object>} Restored organization
   */
  async restore(id) {
    const organization = await Organization.findById(id).setOptions({ includeDeleted: true });
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    await organization.restore();
    return organization;
  }
}

module.exports = new OrganizationService();
