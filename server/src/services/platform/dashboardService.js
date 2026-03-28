const {
  Organization,
  Course,
  User,
  Enrollment,
  PlatformAuditLog,
  Conversation,
  Message
} = require('../../models');

exports.getStats = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const activeWindowStart = new Date(Date.now() - 15 * 60 * 1000);

  const [
    totalOrganizations,
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    activeUsersToday,
    activeSessions,
    totalEnrollments,
    recentOrganizations,
    recentUsers,
    recentCourses,
    recentAuditLogs,
    recentConversations,
    recentMessages
  ] = await Promise.all([
    Organization.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'student', is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'instructor', is_deleted: { $ne: true } }),
    Course.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ lastLogin: { $gte: todayStart }, is_deleted: { $ne: true } }),
    User.countDocuments({ lastActive: { $gte: activeWindowStart }, is_deleted: { $ne: true } }),
    Enrollment.countDocuments({}),
    Organization.find({ is_deleted: { $ne: true } })
      .select('name type status email subdomain created_at')
      .sort({ created_at: -1 })
      .limit(6)
      .lean(),
    User.find({ is_deleted: { $ne: true } })
      .select('name email role status organization_id created_at lastLogin')
      .populate('organization_id', 'name')
      .sort({ created_at: -1 })
      .limit(6)
      .lean(),
    Course.find({ is_deleted: { $ne: true } })
      .select('title status organization_id instructor_id created_at enrollmentCount')
      .populate('organization_id', 'name')
      .populate('instructor_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    PlatformAuditLog.find({})
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(8)
      .lean(),
    Conversation.find({})
      .populate('participants', 'name email role profilePicture')
      .sort({ lastMessageAt: -1 })
      .limit(6)
      .lean(),
    Message.find({})
      .populate('senderId', 'name email role profilePicture')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  const totalRevenueData = await Enrollment.aggregate([
    { $match: { 'payment.paymentStatus': 'completed' } },
    { $group: { _id: null, total: { $sum: '$payment.amount' } } }
  ]);

  const enrollmentFlux = await Promise.all(
    Array.from({ length: 7 }).map(async (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const value = await Enrollment.countDocuments({
        enrolledAt: { $gte: day, $lt: nextDay }
      });

      return {
        name: day.toLocaleDateString(undefined, { weekday: 'short' }),
        value
      };
    })
  );

  const recentActivity = {
    organizations: recentOrganizations,
    users: recentUsers,
    courses: recentCourses,
    auditLogs: recentAuditLogs,
    conversations: recentConversations,
    messages: recentMessages
  };

  return {
    totalOrganizations,
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    totalEnrollments,
    activeUsersToday,
    activeSessions,
    totalRevenue: totalRevenueData[0]?.total || 0,
    enrollmentFlux,
    recentActivity
  };
};
