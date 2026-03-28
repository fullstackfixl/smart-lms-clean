const { User, PlatformAuditLog } = require('../../models');

exports.getOverview = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [recentLogins, recentAuditLogs, highRiskActions, activeUsersToday] = await Promise.all([
    User.find({ lastLogin: { $ne: null } })
      .select('name email role status organization_id lastLogin lastActive')
      .populate('organization_id', 'name')
      .sort({ lastLogin: -1 })
      .limit(15)
      .lean(),
    PlatformAuditLog.find({})
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(25)
      .lean(),
    PlatformAuditLog.countDocuments({
      action: { $in: ['organization_deleted', 'organization_suspended', 'user_deleted', 'user_suspended', 'settings_updated'] }
    }),
    User.countDocuments({
      lastLogin: { $gte: todayStart },
      is_deleted: { $ne: true }
    })
  ]);

  const suspiciousActions = recentAuditLogs.filter((log) => {
    const action = String(log.action || '').toLowerCase();
    return action.includes('delete') || action.includes('suspend') || action.includes('reset') || action.includes('settings');
  });

  return {
    activeUsersToday,
    highRiskActions,
    recentLogins,
    recentAuditLogs,
    suspiciousActions
  };
};
