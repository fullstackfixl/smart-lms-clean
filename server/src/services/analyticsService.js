const Organization = require('../models/Organization');
const User = require('../models/User');
const Course = require('../models/Course');

class AnalyticsService {
  /**
   * Get overview statistics for platform dashboard
   * @returns {Promise<Object>} Overview statistics
   */
  async getOverviewStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get current counts
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalCourses
    ] = await Promise.all([
      // Total organizations (excluding soft-deleted)
      Organization.countDocuments({ is_deleted: false }),
      
      // Active organizations
      Organization.countDocuments({ 
        is_deleted: false, 
        status: 'active' 
      }),
      
      // Total users (excluding those from soft-deleted orgs)
      this._countUsersExcludingDeletedOrgs(),
      
      // Total courses (excluding those from soft-deleted orgs)
      this._countCoursesExcludingDeletedOrgs()
    ]);

    // Get historical stats for growth calculation
    const historicalStats = await this.getHistoricalStats(30);

    // Calculate growth percentages
    const growth = this.calculateGrowthPercentages(
      {
        organizations: totalOrganizations,
        users: totalUsers,
        courses: totalCourses
      },
      historicalStats
    );

    return {
      total_organizations: totalOrganizations,
      active_organizations: activeOrganizations,
      total_users: totalUsers,
      total_courses: totalCourses,
      growth
    };
  }

  /**
   * Get historical statistics from N days ago
   * @param {Number} daysAgo - Number of days in the past
   * @returns {Promise<Object>} Historical statistics
   */
  async getHistoricalStats(daysAgo) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);

    // For simplicity, we'll count records created before the target date
    // In a production system, you'd want to store daily snapshots
    const [
      organizations,
      users,
      courses
    ] = await Promise.all([
      Organization.countDocuments({
        is_deleted: false,
        created_at: { $lt: targetDate }
      }),
      
      this._countUsersExcludingDeletedOrgs({ created_at: { $lt: targetDate } }),
      
      this._countCoursesExcludingDeletedOrgs({ createdAt: { $lt: targetDate } })
    ]);

    return {
      organizations,
      users,
      courses
    };
  }

  /**
   * Calculate growth percentages
   * @param {Object} currentStats - Current statistics
   * @param {Object} previousStats - Previous statistics
   * @returns {Object} Growth percentages
   */
  calculateGrowthPercentages(currentStats, previousStats) {
    const calculatePercentage = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    return {
      organizations: calculatePercentage(
        currentStats.organizations,
        previousStats.organizations
      ),
      users: calculatePercentage(
        currentStats.users,
        previousStats.users
      ),
      courses: calculatePercentage(
        currentStats.courses,
        previousStats.courses
      )
    };
  }

  /**
   * Count users excluding those from soft-deleted organizations
   * @param {Object} additionalQuery - Additional query conditions
   * @returns {Promise<Number>} User count
   * @private
   */
  async _countUsersExcludingDeletedOrgs(additionalQuery = {}) {
    const result = await User.aggregate([
      {
        $match: {
          is_deleted: false,
          ...additionalQuery
        }
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization_id',
          foreignField: '_id',
          as: 'org'
        }
      },
      {
        $match: {
          $or: [
            { organization_id: null }, // Platform admins without org
            { 'org.is_deleted': false }
          ]
        }
      },
      {
        $count: 'total'
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Count courses excluding those from soft-deleted organizations
   * @param {Object} additionalQuery - Additional query conditions
   * @returns {Promise<Number>} Course count
   * @private
   */
  async _countCoursesExcludingDeletedOrgs(additionalQuery = {}) {
    const result = await Course.aggregate([
      {
        $match: {
          is_deleted: false,
          ...additionalQuery
        }
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization_id',
          foreignField: '_id',
          as: 'org'
        }
      },
      {
        $match: {
          $or: [
            { organization_id: null }, // Public courses without org
            { 'org.is_deleted': false }
          ]
        }
      },
      {
        $count: 'total'
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}

module.exports = new AnalyticsService();
