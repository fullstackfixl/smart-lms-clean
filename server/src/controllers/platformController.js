const User = require('../models/User');
const Organization = require('../models/Organization');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const PlatformOrganization = require('../models/PlatformOrganization');
const SystemConfig = require('../models/SystemConfig');

class PlatformController {
  // Dashboard Stats
  async getDashboardStats(req, res) {
    try {
      const [
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalCourses,
        totalEnrollments
      ] = await Promise.all([
        PlatformOrganization.countDocuments(),
        PlatformOrganization.countDocuments({ status: 'active' }),
        User.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments()
      ]);

      // Get user breakdown by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get organizations created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newOrganizations = await PlatformOrganization.countDocuments({
        created_at: { $gte: thirtyDaysAgo }
      });

      const stats = {
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations,
          inactive: totalOrganizations - activeOrganizations,
          new: newOrganizations
        },
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        courses: {
          total: totalCourses
        },
        enrollments: {
          total: totalEnrollments
        }
      };

      return res.success(stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return res.error(error.message, 'Failed to get dashboard stats', 500);
    }
  }

  // Global Analytics
  async getGlobalAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;

      let startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      } else if (period === '1y') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // User growth over time
      const userGrowth = await User.aggregate([
        {
          $match: {
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Organization growth
      const orgGrowth = await PlatformOrganization.aggregate([
        {
          $match: {
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Enrollment trends
      const enrollmentTrends = await Enrollment.aggregate([
        {
          $match: {
            enrolled_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$enrolled_at' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const analytics = {
        period,
        userGrowth,
        orgGrowth,
        enrollmentTrends
      };

      return res.success(analytics, 'Global analytics retrieved successfully');
    } catch (error) {
      console.error('Get global analytics error:', error);
      return res.error(error.message, 'Failed to get global analytics', 500);
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics(req, res) {
    try {
      const organizations = await PlatformOrganization.find({
        'billing.subscription_start': { $exists: true }
      }).select('name billing plan');

      const revenueStats = {
        total: 0,
        monthly: 0,
        yearly: 0,
        byOrganization: organizations.map(org => ({
          name: org.name,
          plan: org.plan,
          lastPayment: org.billing.last_payment_date
        }))
      };

      // Basic aggregation (placeholder for real transaction data)
      organizations.forEach(org => {
        const amount = org.plan === 'premium' ? 99 : 29; // Example pricing
        revenueStats.total += amount;
        revenueStats.monthly += amount;
      });

      return res.success(revenueStats, 'Revenue analytics retrieved successfully');
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      return res.error(error.message, 'Failed to get revenue analytics', 500);
    }
  }

  // Get All Organizations
  async getAllOrganizations(req, res) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        query.status = status;
      }

      const organizations = await PlatformOrganization.find(query)
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
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
          pages: Math.ceil(total / limit)
        }
      }, 'Organizations retrieved successfully');
    } catch (error) {
      console.error('Get all organizations error:', error);
      return res.error(error.message, 'Failed to get organizations', 500);
    }
  }

  // Get Organization By ID
  async getOrganizationById(req, res) {
    try {
      const { id } = req.params;

      const organization = await PlatformOrganization.findById(id).lean();
      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      // Get detailed stats
      const [userCount, courseCount, enrollmentCount, adminCount] = await Promise.all([
        User.countDocuments({ organization_id: id }),
        Course.countDocuments({ organization_id: id }),
        Enrollment.countDocuments({ organization_id: id }),
        User.countDocuments({ organization_id: id, role: 'org_admin' })
      ]);

      const orgWithStats = {
        ...organization,
        stats: {
          users: userCount,
          courses: courseCount,
          enrollments: enrollmentCount,
          admins: adminCount
        }
      };

      return res.success(orgWithStats, 'Organization retrieved successfully');
    } catch (error) {
      console.error('Get organization by ID error:', error);
      return res.error(error.message, 'Failed to get organization', 500);
    }
  }

  // Create Organization
  async createOrganization(req, res) {
    try {
      const { name, domain, emailDomains, adminEmail, adminName, adminPassword } = req.body;

      if (!name || !adminEmail || !adminName || !adminPassword) {
        return res.error('Name, admin email, name, and password are required', 'Validation failed', 400);
      }

      // Generate unique code
      const generateOrgCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };

      let uniqueCode = generateOrgCode();
      let codeExists = await PlatformOrganization.findOne({ code: uniqueCode });

      while (codeExists) {
        uniqueCode = generateOrgCode();
        codeExists = await PlatformOrganization.findOne({ code: uniqueCode });
      }

      // Generate slug
      const generateSlug = (name) => {
        return name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      let slug = generateSlug(name);
      let slugExists = await PlatformOrganization.findOne({ slug });
      let slugCounter = 1;

      while (slugExists) {
        slug = `${generateSlug(name)}-${slugCounter}`;
        slugExists = await PlatformOrganization.findOne({ slug });
        slugCounter++;
      }

      // Create organization
      const organization = new PlatformOrganization({
        name,
        slug,
        code: uniqueCode,
        domain: domain || adminEmail.split('@')[1],
        status: 'active'
      });

      await organization.save();

      // Create admin user
      const admin = new User({
        email: adminEmail.toLowerCase(),
        password_hash: adminPassword,
        name: adminName,
        role: 'org_admin',
        organization_id: organization._id,
        organization_code: uniqueCode,
        isActive: true,
        email_verified: true
      });

      await admin.save();

      return res.success({
        organization: organization.toObject(),
        admin: admin.toPublicJSON(),
        organizationCode: uniqueCode
      }, 'Organization created successfully');
    } catch (error) {
      console.error('Create organization error:', error);
      return res.error(error.message, 'Failed to create organization', 500);
    }
  }

  // Update Organization
  async updateOrganization(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Don't allow code or slug changes
      delete updates.code;
      delete updates.slug;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, 'Organization updated successfully');
    } catch (error) {
      console.error('Update organization error:', error);
      return res.error(error.message, 'Failed to update organization', 500);
    }
  }

  // Delete Organization
  async deleteOrganization(req, res) {
    try {
      const { id } = req.params;

      // Check if organization has users
      const userCount = await User.countDocuments({ organization_id: id });
      if (userCount > 0) {
        return res.error(
          `Cannot delete organization with ${userCount} users. Please remove all users first.`,
          'Delete failed',
          400
        );
      }

      const organization = await PlatformOrganization.findByIdAndDelete(id);
      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(null, 'Organization deleted successfully');
    } catch (error) {
      console.error('Delete organization error:', error);
      return res.error(error.message, 'Failed to delete organization', 500);
    }
  }

  // Toggle Organization Status
  async toggleOrganizationStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        id,
        { $set: { status: isActive ? 'active' : 'suspended' } },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(organization, `Organization ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Toggle organization status error:', error);
      return res.error(error.message, 'Failed to update organization status', 500);
    }
  }

  // Subscription Management
  async getAllSubscriptions(req, res) {
    try {
      const subscriptions = await PlatformOrganization.find()
        .select('name email plan status billing created_at')
        .lean();

      return res.success({ subscriptions }, 'Subscriptions retrieved successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to get subscriptions', 500);
    }
  }

  async getSubscriptionById(req, res) {
    try {
      const { id } = req.params;
      const organization = await PlatformOrganization.findById(id)
        .select('name billing plan status')
        .lean();

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success({ subscription: organization }, 'Subscription retrieved successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to get subscription', 500);
    }
  }

  async createSubscription(req, res) {
    try {
      const { organizationId, plan, billing } = req.body;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        organizationId,
        {
          $set: {
            plan,
            billing: {
              ...billing,
              subscription_start: new Date()
            }
          }
        },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success({ subscription: organization }, 'Subscription created successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to create subscription', 500);
    }
  }

  async updateSubscription(req, res) {
    try {
      const { id } = req.params;
      const { plan, billing } = req.body;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        id,
        { $set: { plan, billing } },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success({ subscription: organization }, 'Subscription updated successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to update subscription', 500);
    }
  }

  async cancelSubscription(req, res) {
    try {
      const { id } = req.params;

      const organization = await PlatformOrganization.findByIdAndUpdate(
        id,
        { $unset: { 'billing.subscription_end': 1 }, $set: { status: 'suspended' } },
        { new: true }
      );

      if (!organization) {
        return res.error('Organization not found', 'Not found', 404);
      }

      return res.success(null, 'Subscription cancelled successfully');
    } catch (error) {
      return res.error(error.message, 'Failed to cancel subscription', 500);
    }
  }

  // System Configuration
  async getSystemConfig(req, res) {
    try {
      const config = await SystemConfig.getOrCreate();
      return res.success(config, 'System configuration retrieved successfully');
    } catch (error) {
      console.error('Get system config error:', error);
      return res.error(error.message, 'Failed to get system configuration', 500);
    }
  }

  async updateSystemConfig(req, res) {
    try {
      const updates = req.body;
      const config = await SystemConfig.findOneAndUpdate(
        {},
        { $set: updates, updatedBy: req.user._id },
        { new: true, upsert: true }
      );
      return res.success(config, 'System configuration updated successfully');
    } catch (error) {
      console.error('Update system config error:', error);
      return res.error(error.message, 'Failed to update system configuration', 500);
    }
  }

  // Platform-wide User Management
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role, organization } = req.query;

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) {
        query.role = role;
      }
      if (organization) {
        query.organization_id = organization;
      }

      const users = await User.find(query)
        .populate('organization_id', 'name code')
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-password_hash')
        .lean();

      const total = await User.countDocuments(query);

      return res.success({
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }, 'Users retrieved successfully');
    } catch (error) {
      console.error('Get all users error:', error);
      return res.error(error.message, 'Failed to get users', 500);
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .populate('organization_id', 'name code')
        .select('-password_hash')
        .lean();

      if (!user) {
        return res.error('User not found', 'Not found', 404);
      }

      return res.success(user, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.error(error.message, 'Failed to get user', 500);
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true }
      ).select('-password_hash');

      if (!user) {
        return res.error('User not found', 'Not found', 404);
      }

      return res.success(user, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Toggle user status error:', error);
      return res.error(error.message, 'Failed to update user status', 500);
    }
  }

  // Reports
  async getOrganizationReport(req, res) {
    try {
      const organizations = await PlatformOrganization.find().lean();

      const report = await Promise.all(
        organizations.map(async (org) => {
          const [users, courses, enrollments] = await Promise.all([
            User.countDocuments({ organization_id: org._id }),
            Course.countDocuments({ organization_id: org._id }),
            Enrollment.countDocuments({ organization_id: org._id })
          ]);

          return {
            organization: org.name,
            code: org.code,
            users,
            courses,
            enrollments,
            status: org.status === 'active' ? 'Active' : 'Suspended',
            createdAt: org.created_at
          };
        })
      );

      return res.success(report, 'Organization report generated successfully');
    } catch (error) {
      console.error('Get organization report error:', error);
      return res.error(error.message, 'Failed to generate organization report', 500);
    }
  }

  async getRevenueReport(req, res) {
    try {
      const report = await PlatformOrganization.aggregate([
        {
          $match: { 'billing.subscription_start': { $exists: true } }
        },
        {
          $project: {
            name: 1,
            plan: 1,
            status: 1,
            revenue: {
              $cond: { if: { $eq: ['$plan', 'premium'] }, then: 99, else: 29 }
            },
            joinedAt: '$created_at'
          }
        }
      ]);
      return res.success({ report }, 'Revenue report generated successfully');
    } catch (error) {
      console.error('Get revenue report error:', error);
      return res.error(error.message, 'Failed to generate revenue report', 500);
    }
  }

  async getUserReport(req, res) {
    try {
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const usersByOrg = await User.aggregate([
        {
          $group: {
            _id: '$organization_id',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'organizations',
            localField: '_id',
            foreignField: '_id',
            as: 'organization'
          }
        },
        {
          $unwind: '$organization'
        },
        {
          $project: {
            organizationName: '$organization.name',
            count: 1
          }
        }
      ]);

      return res.success({
        byRole: usersByRole,
        byOrganization: usersByOrg
      }, 'User report generated successfully');
    } catch (error) {
      console.error('Get user report error:', error);
      return res.error(error.message, 'Failed to generate user report', 500);
    }
  }
}

module.exports = new PlatformController();
