const { Organization, User, Course, Enrollment } = require('../../models');

/**
 * Platform Analytics Service
 * Provides deep ecosystem intelligence and growth trajectories
 */
class AnalyticsService {
  /**
   * Get ecosystem architecture snapshot
   */
  async getOverview() {
    const [orgs, courses, users, activeSessions] = await Promise.all([
      Organization.countDocuments({ is_deleted: { $ne: true } }),
      Course.countDocuments({ is_deleted: { $ne: true } }),
      User.countDocuments({ is_deleted: { $ne: true } }),
      User.countDocuments({ status: 'active', is_deleted: { $ne: true } })
    ]);

    const [students, instructors] = await Promise.all([
      User.countDocuments({ role: 'student', is_deleted: { $ne: true } }),
      User.countDocuments({ role: 'instructor', is_deleted: { $ne: true } })
    ]);

    return {
      organizationsCount: orgs,
      coursesCount: courses,
      usersCount: users,
      studentsCount: students,
      instructorsCount: instructors,
      activeSessions,
      revenue: 0 // Placeholder until Payment integration
    };
  }

  /**
   * Calculate growth vectors over time
   */
  async getGrowthMetrics() {
    // Current simple implementation: returning static trajectories. 
    // High-fidelity implementation would use Mongo Aggregation on 'created_at'.
    return {
      userGrowth: [
        { month: 'Jan', count: 1200 }, { month: 'Feb', count: 1800 }, { month: 'Mar', count: 2400 }
      ],
      organizationGrowth: [
        { month: 'Jan', count: 5 }, { month: 'Feb', count: 8 }, { month: 'Mar', count: 12 }
      ],
      courseGrowth: [
        { month: 'Jan', count: 45 }, { month: 'Feb', count: 72 }, { month: 'Mar', count: 98 }
      ],
      enrollmentGrowth: [
        { month: 'Jan', count: 320 }, { month: 'Feb', count: 580 }, { month: 'Mar', count: 890 }
      ]
    };
  }
}

module.exports = new AnalyticsService();
