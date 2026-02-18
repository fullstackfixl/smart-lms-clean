const BaseService = require('../core/BaseService');

class PlatformService extends BaseService {
  async createOrganization(orgData) {
    const Organization = require('../models/Organization');
    const org = new Organization(orgData);
    return await org.save();
  }

  async getAllOrganizations() {
    const Organization = require('../models/Organization');
    return await Organization.find({});
  }

  async getOrganizationById(orgId) {
    const Organization = require('../models/Organization');
    return await Organization.findById(orgId);
  }

  async updateOrganizationStatus(orgId, status) {
    const Organization = require('../models/Organization');
    return await Organization.findByIdAndUpdate(orgId, { status }, { new: true });
  }

  async getPlatformAnalytics() {
    const Organization = require('../models/Organization');
    const User = require('../models/User');
    const Course = require('../models/Course');
    
    const totalOrgs = await Organization.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    
    return {
      total_organizations: totalOrgs,
      total_users: totalUsers,
      total_courses: totalCourses,
      active_organizations: await Organization.countDocuments({ status: 'active' })
    };
  }

  async getRevenueReports() {
    return {
      total_revenue: 0,
      monthly_revenue: 0,
      revenue_by_org: []
    };
  }
}

module.exports = new PlatformService();
