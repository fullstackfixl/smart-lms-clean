const PlatformOrganization = require('../models/PlatformOrganization');
const User = require('../models/User');
const Course = require('../models/Course');
const BaseController = require('../core/BaseController');

class PlatformOrganizationController extends BaseController {
  async createOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.create(req.body);
      return res.success(organization, 'Organization created successfully', 201);
    } catch (error) {
      console.error('Create organization error:', error);
      return res.error(error.message, 'Failed to create organization', 400);
    }
  }

  async getOrganizations(req, res) {
    try {
      const { page = 1, limit = 10, search, status, plan, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      const query = {};
      
      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Status filter
      if (status) {
        query.status = status;
      }
      
      // Plan filter
      if (plan) {
        query.plan = plan;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const organizations = await PlatformOrganization.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      const total = await PlatformOrganization.countDocuments(query);

      // Get user counts for each organization
      const orgsWithCounts = await Promise.all(
        organizations.map(async (org) => {
          const userCount = await User.countDocuments({ organization_id: org._id });
          const courseCount = await Course.countDocuments({ organization_id: org._id });
          return {
            ...org,
            userCount,
            courseCount
          };
        })
      );

      return res.success({
        organizations: orgsWithCounts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }, 'Organizations retrieved successfully');
    } catch (error) {
      console.error('Get organizations error:', error);
      return res.error(error.message, 'Failed to retrieve organizations', 500);
    }
  }

  async getOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.findById(req.params.id).lean();
      
      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      // Get additional stats
      const userCount = await User.countDocuments({ organization_id: organization._id });
      const courseCount = await Course.countDocuments({ organization_id: organization._id });

      return res.success({
        ...organization,
        userCount,
        courseCount
      }, 'Organization retrieved successfully');
    } catch (error) {
      console.error('Get organization error:', error);
      return res.error(error.message, 'Failed to retrieve organization', 500);
    }
  }

  async updateOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, 'Organization updated successfully');
    } catch (error) {
      console.error('Update organization error:', error);
      return res.error(error.message, 'Failed to update organization', 400);
    }
  }

  async suspendOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.findByIdAndUpdate(
        req.params.id,
        { status: 'suspended', updated_at: new Date() },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, 'Organization suspended successfully');
    } catch (error) {
      console.error('Suspend organization error:', error);
      return res.error(error.message, 'Failed to suspend organization', 400);
    }
  }

  async activateOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.findByIdAndUpdate(
        req.params.id,
        { status: 'active', updated_at: new Date() },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, 'Organization activated successfully');
    } catch (error) {
      console.error('Activate organization error:', error);
      return res.error(error.message, 'Failed to activate organization', 400);
    }
  }

  async deleteOrganization(req, res) {
    try {
      const organization = await PlatformOrganization.findById(req.params.id);

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      // Soft delete
      organization.is_deleted = true;
      organization.deleted_at = new Date();
      organization.deleted_by = req.user._id;
      await organization.save();

      return res.success(organization, 'Organization deleted successfully');
    } catch (error) {
      console.error('Delete organization error:', error);
      return res.error(error.message, 'Failed to delete organization', 400);
    }
  }
}

module.exports = new PlatformOrganizationController();
