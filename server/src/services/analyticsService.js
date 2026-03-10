const Organization = require('../models/Organization');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

class AnalyticsService {
  /**
   * Get overview statistics for platform dashboard
   * @returns {Promise<Object>} Overview statistics
   */
  async getOverviewStats() {
    try {
      console.log('📊 [AnalyticsService] Starting getOverviewStats...');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get current counts with error handling for each query
      let totalOrganizations = 0;
      let activeOrganizations = 0;
      let totalUsers = 0;
      let totalCourses = 0;
      let totalEnrollments = 0;
      let usersByRole = {};

      try {
        console.log('📊 [AnalyticsService] Fetching organization counts...');
        [totalOrganizations, activeOrganizations] = await Promise.all([
          Organization.countDocuments({ is_deleted: false }).catch(err => {
            console.error('❌ [AnalyticsService] Error counting organizations:', err);
            return 0;
          }),
          Organization.countDocuments({ is_deleted: false, status: 'active' }).catch(err => {
            console.error('❌ [AnalyticsService] Error counting active organizations:', err);
            return 0;
          })
        ]);
        console.log('📊 [AnalyticsService] Organizations:', { total: totalOrganizations, active: activeOrganizations });
      } catch (error) {
        console.error('❌ [AnalyticsService] Error in organization queries:', error);
      }

      try {
        console.log('📊 [AnalyticsService] Fetching user counts...');
        totalUsers = await this._countUsersExcludingDeletedOrgs();
        console.log('📊 [AnalyticsService] Total users:', totalUsers);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error counting users:', error);
        totalUsers = 0;
      }

      try {
        console.log('📊 [AnalyticsService] Fetching course counts...');
        totalCourses = await this._countCoursesExcludingDeletedOrgs();
        console.log('📊 [AnalyticsService] Total courses:', totalCourses);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error counting courses:', error);
        totalCourses = 0;
      }

      try {
        console.log('📊 [AnalyticsService] Fetching enrollment counts...');
        totalEnrollments = await Enrollment.countDocuments({});
        console.log('📊 [AnalyticsService] Total enrollments:', totalEnrollments);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error counting enrollments:', error);
        totalEnrollments = 0;
      }

      try {
        console.log('📊 [AnalyticsService] Fetching users by role...');
        usersByRole = await this._getUsersByRoleBreakdown();
        console.log('📊 [AnalyticsService] Users by role:', usersByRole);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error getting users by role:', error);
        usersByRole = {
          platform_admin: 0,
          org_admin: 0,
          instructor: 0,
          student: 0,
          parent: 0,
          support_staff: 0
        };
      }

      // Get historical stats for growth calculation
      let historicalStats = { organizations: 0, users: 0, courses: 0 };
      try {
        console.log('📊 [AnalyticsService] Fetching historical stats...');
        historicalStats = await this.getHistoricalStats(30);
        console.log('📊 [AnalyticsService] Historical stats:', historicalStats);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error getting historical stats:', error);
      }

      // Get enrollment trends for chart
      let enrollmentTrends = [];
      try {
        console.log('📊 [AnalyticsService] Fetching enrollment trends...');
        enrollmentTrends = await this.getEnrollmentTrends(7);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error getting enrollment trends:', error);
      }

      // Get top performing courses
      let topCourses = [];
      try {
        console.log('📊 [AnalyticsService] Fetching top courses...');
        topCourses = await this.getTopPerformingCourses(4);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error getting top courses:', error);
      }

      // Calculate global completion rate
      let globalCompletionRate = 0;
      try {
        console.log('📊 [AnalyticsService] Calculating global completion rate...');
        const completionStats = await Enrollment.aggregate([
          { $group: { _id: null, avg: { $avg: '$progress.completionPercentage' } } }
        ]);
        globalCompletionRate = completionStats.length > 0 ? Number(completionStats[0].avg.toFixed(1)) : 0;
      } catch (error) {
        console.error('❌ [AnalyticsService] Error calculating completion rate:', error);
      }

      // Get revenue metrics
      let revenue = { total: 0, currency: 'INR' };
      try {
        console.log('📊 [AnalyticsService] Fetching revenue metrics...');
        const revenueStats = await Enrollment.aggregate([
          { $match: { 'payment.paymentStatus': 'completed' } },
          { $group: { _id: null, total: { $sum: '$payment.amount' } } }
        ]);
        revenue.total = revenueStats.length > 0 ? revenueStats[0].total : 0;
      } catch (error) {
        console.error('❌ [AnalyticsService] Error fetching revenue:', error);
      }

      // Get market distribution
      let marketDistribution = [];
      try {
        console.log('📊 [AnalyticsService] Fetching market distribution...');
        marketDistribution = await this.getMarketDistribution();
      } catch (error) {
        console.error('❌ [AnalyticsService] Error getting market distribution:', error);
      }

      // Calculate growth percentages
      let growth = { organizations: 0, users: 0, courses: 0 };
      try {
        growth = this.calculateGrowthPercentages(
          {
            organizations: totalOrganizations,
            users: totalUsers,
            courses: totalCourses
          },
          historicalStats
        );
        console.log('📊 [AnalyticsService] Growth percentages:', growth);
      } catch (error) {
        console.error('❌ [AnalyticsService] Error calculating growth:', error);
      }

      const result = {
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations,
          inactive: totalOrganizations - activeOrganizations,
          new: Math.max(0, totalOrganizations - (historicalStats.organizations || 0))
        },
        users: {
          total: totalUsers,
          byRole: usersByRole
        },
        courses: {
          total: totalCourses
        },
        enrollments: {
          total: totalEnrollments
        },
        charts: {
          enrollmentTrends,
          marketDistribution,
          revenueTrends: await this.getRevenueTrends(7)
        },
        topCourses,
        completionRate: globalCompletionRate,
        revenue,
        recentTransactions: await this.getRecentTransactions(5),
        growth
      };

      console.log('✅ [AnalyticsService] getOverviewStats completed successfully');
      return result;
    } catch (error) {
      console.error('❌ [AnalyticsService] Fatal error in getOverviewStats:', error);
      console.error('❌ [AnalyticsService] Error stack:', error.stack);
      
      // Return default structure even on error
      return {
        organizations: { total: 0, active: 0, inactive: 0, new: 0 },
        users: { total: 0, byRole: {} },
        courses: { total: 0 },
        enrollments: { total: 0 },
        charts: { enrollmentTrends: [] },
        topCourses: [],
        completionRate: 0,
        revenue: { total: 0, currency: 'INR' },
        growth: { organizations: 0, users: 0, courses: 0 }
      };
    }
  }

  /**
   * Get enrollment trends for the last N days
   * @param {Number} days - Number of days to look back
   */
  async getEnrollmentTrends(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = trends.find(t => t._id === dateStr);
      
      // Use short day name for frontend
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        name: dayName,
        date: dateStr,
        enrollments: match ? match.enrollments : 0
      });
    }

    return result;
  }

  /**
   * Get top performing courses based on enrollment count
   * @param {Number} limit - Number of courses to return
   */
  async getTopPerformingCourses(limit = 4) {
    return Enrollment.aggregate([
      {
        $group: {
          _id: '$course_id',
          enrollments: { $sum: 1 },
          avgCompletion: { $avg: '$progress.completionPercentage' }
        }
      },
      { $sort: { enrollments: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          title: '$course.title',
          category: '$course.category',
          enrollments: 1,
          completion: { $round: ['$avgCompletion', 1] }
        }
      }
    ]);
  }

  /**
   * Get users breakdown by role
   * @private
   */
  async _getUsersByRoleBreakdown() {
    try {
      const roles = ['platform_admin', 'org_admin', 'instructor', 'student', 'parent', 'support_staff'];
      const breakdown = {};

      await Promise.all(roles.map(async (role) => {
        try {
          breakdown[role] = await User.countDocuments({ role, is_deleted: false });
        } catch (error) {
          console.error(`❌ [AnalyticsService] Error counting ${role}:`, error);
          breakdown[role] = 0;
        }
      }));

      return breakdown;
    } catch (error) {
      console.error('❌ [AnalyticsService] Error in _getUsersByRoleBreakdown:', error);
      return {
        platform_admin: 0,
        org_admin: 0,
        instructor: 0,
        student: 0,
        parent: 0,
        support_staff: 0
      };
    }
  }

  /**
   * Get historical statistics from N days ago
   * @param {Number} daysAgo - Number of days in the past
   * @returns {Promise<Object>} Historical statistics
   */
  async getHistoricalStats(daysAgo) {
    try {
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
        }).catch(err => {
          console.error('❌ [AnalyticsService] Error counting historical organizations:', err);
          return 0;
        }),

        this._countUsersExcludingDeletedOrgs({ created_at: { $lt: targetDate } }).catch(err => {
          console.error('❌ [AnalyticsService] Error counting historical users:', err);
          return 0;
        }),

        this._countCoursesExcludingDeletedOrgs({ createdAt: { $lt: targetDate } }).catch(err => {
          console.error('❌ [AnalyticsService] Error counting historical courses:', err);
          return 0;
        })
      ]);

      return {
        organizations,
        users,
        courses
      };
    } catch (error) {
      console.error('❌ [AnalyticsService] Error in getHistoricalStats:', error);
      return {
        organizations: 0,
        users: 0,
        courses: 0
      };
    }
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
   * Get distribution of organizations by type
   */
  async getMarketDistribution() {
    const stats = await Organization.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: '$type', value: { $sum: 1 } } }
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.value, 0);
    const colors = {
      'SCHOOL': '#2563EB',
      'COLLEGE': '#10B981',
      'INSTITUTE': '#F59E0B',
      'ONLINE_ACADEMY': '#EF4444'
    };

    return stats.map(s => ({
      name: s._id || 'UNSPECIFIED',
      value: total > 0 ? Number(((s.value / total) * 100).toFixed(1)) : 0,
      count: s.value,
      color: colors[s._id] || '#64748b'
    }));
  }

  /**
   * Get revenue trends for the last N days
   */
  async getRevenueTrends(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Enrollment.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$payment.amount' }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = trends.find(t => t._id === dateStr);
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        name: dayName,
        date: dateStr,
        revenue: match ? match.revenue : 0
      });
    }

    return result;
  }

  /**
   * Get recent completed transactions
   */
  async getRecentTransactions(limit = 5) {
    return Enrollment.find({ 'payment.paymentStatus': 'completed' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('student_id', 'name email profile')
      .populate('course_id', 'title category')
      .populate('organization_id', 'name code')
      .lean();
  }

  /**
   * Count users excluding those from soft-deleted organizations
   * @param {Object} additionalQuery - Additional query conditions
   * @returns {Promise<Number>} User count
   * @private
   */
  async _countUsersExcludingDeletedOrgs(additionalQuery = {}) {
    try {
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
    } catch (error) {
      console.error('❌ [AnalyticsService] Error in _countUsersExcludingDeletedOrgs:', error);
      return 0;
    }
  }

  /**
   * Count courses excluding those from soft-deleted organizations
   * @param {Object} additionalQuery - Additional query conditions
   * @returns {Promise<Number>} Course count
   * @private
   */
  async _countCoursesExcludingDeletedOrgs(additionalQuery = {}) {
    try {
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
    } catch (error) {
      console.error('❌ [AnalyticsService] Error in _countCoursesExcludingDeletedOrgs:', error);
      return 0;
    }
  }
}

module.exports = new AnalyticsService();
