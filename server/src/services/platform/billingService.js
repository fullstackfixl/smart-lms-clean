const { Enrollment, Course, Organization } = require('../../models');

/**
 * Platform Billing Service
 * Aggregates revenue and transaction flux across the ecosystem
 */
class BillingService {
  /**
   * Get platform-wide financial metrics
   */
  async getStats() {
    try {
      // In a real scenario, we would aggregate from a 'Transactions' model.
      // Here we derive revenue from Course prices and Enrollments.
      const enrollments = await Enrollment.find({ is_deleted: { $ne: true } })
        .populate('course_id', 'price currency');

      let totalRevenue = 0;
      const monthlyRevenue = {};

      enrollments.forEach(enc => {
        if (enc.course_id && enc.course_id.price) {
          totalRevenue += enc.course_id.price;
          
          const month = new Date(enc.created_at).toLocaleString('default', { month: 'short' });
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + enc.course_id.price;
        }
      });

      const revenueTrajectory = Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value }));

      const totalOrgs = await Organization.countDocuments({ is_deleted: { $ne: true } });
      const activeSubscriptions = await Organization.countDocuments({ 
        status: 'active', 
        plan: { $ne: 'free' },
        is_deleted: { $ne: true } 
      });

      const trajectory = Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value }));

      const retentionRate = totalOrgs
        ? Number(((activeSubscriptions / totalOrgs) * 100).toFixed(1))
        : 0;

      return {
        totalRevenue,
        revenueTrajectory: trajectory,
        activeSubscriptions,
        retentionRate,
        recentTransactions: enrollments.slice(0, 10).map(enc => ({
          _id: enc._id,
          amount: enc.course_id?.price || 0,
          status: 'completed',
          date: enc.created_at,
          type: 'course_purchase',
          memo: enc.course_id?.title || 'Unknown Course'
        }))
      };
    } catch (error) {
      throw new Error(`Billing aggregation failure: ${error.message}`);
    }
  }
}

module.exports = new BillingService();
