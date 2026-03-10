const { Organization, Course, User, Enrollment } = require('../../models');

exports.getOverview = async () => {
  const [
    organizationsCount,
    coursesCount,
    studentsCount,
    instructorsCount
  ] = await Promise.all([
    Organization.countDocuments({ is_deleted: { $ne: true } }),
    Course.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'student', is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'instructor', is_deleted: { $ne: true } })
  ]);

  // activeSessions is a bit tricky without a dedicated session model, 
  // we count users active in the last 15 minutes as a proxy.
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const activeSessions = await User.countDocuments({
    lastActive: { $gte: fifteenMinutesAgo },
    is_deleted: { $ne: true }
  });

  return {
    organizationsCount,
    coursesCount,
    studentsCount,
    instructorsCount,
    activeSessions
  };
};

exports.getGrowth = async () => {
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    last6Months.push(d);
  }

  const getGrowthForModel = async (model) => {
    return Promise.all(last6Months.map(async (date) => {
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const count = await model.countDocuments({
        created_at: { $lt: nextMonth },
        is_deleted: { $ne: true }
      });
      
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        count
      };
    }));
  };

  const [
    userGrowth,
    organizationGrowth,
    courseGrowth,
    enrollmentGrowth
  ] = await Promise.all([
    getGrowthForModel(User),
    getGrowthForModel(Organization),
    getGrowthForModel(Course),
    getGrowthForModel(Enrollment)
  ]);

  return {
    userGrowth,
    organizationGrowth,
    courseGrowth,
    enrollmentGrowth
  };
};
