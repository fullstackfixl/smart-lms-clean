const { Organization, User, Course, Enrollment, Fee } = require('../../models');

exports.getStats = async () => {
  const [
    totalOrganizations,
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    activeUsersToday
  ] = await Promise.all([
    Organization.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'student', is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'instructor', is_deleted: { $ne: true } }),
    Course.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ 
      lastLogin: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      },
      is_deleted: { $ne: true } 
    })
  ]);

  // Organization type breakdown (real data)
  const orgTypeBreakdown = await Organization.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: { $toLower: '$type' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Per-organization stats (real instructor & student counts)
  const orgsWithStats = await Organization.find({ is_deleted: { $ne: true }, status: 'active' })
    .select('name type status email subdomain createdAt')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Batch-fetch user counts per org
  const orgIds = orgsWithStats.map(o => o._id);
  const [instructorCounts, studentCounts, courseCounts] = await Promise.all([
    User.aggregate([
      { $match: { organization_id: { $in: orgIds }, role: 'instructor', is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ]),
    User.aggregate([
      { $match: { organization_id: { $in: orgIds }, role: 'student', is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ]),
    Course.aggregate([
      { $match: { organization_id: { $in: orgIds }, is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ])
  ]);

  const countMap = (arr) => {
    const m = {};
    arr.forEach(r => { m[String(r._id)] = r.count; });
    return m;
  };

  const iMap = countMap(instructorCounts);
  const sMap = countMap(studentCounts);
  const cMap = countMap(courseCounts);

  const organizationSummaries = orgsWithStats.map(o => ({
    _id: o._id,
    name: o.name,
    type: o.type,
    status: o.status,
    createdAt: o.createdAt,
    stats: {
      totalInstructors: iMap[String(o._id)] || 0,
      totalStudents: sMap[String(o._id)] || 0,
      totalCourses: cMap[String(o._id)] || 0
    }
  }));

  // Recent enrollments (real)
  const recentEnrollments = await Enrollment.find({ is_deleted: { $ne: true } })
    .populate('student_id', 'name email profile.fullName')
    .populate('course_id', 'title')
    .populate('organization_id', 'name type')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Revenue summary (real)
  let totalRevenue = 0;
  try {
    const revData = await Fee.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    totalRevenue = revData[0]?.total || 0;
  } catch (e) {
    // Fee model may not exist yet, that's fine
  }

  return {
    totalOrganizations,
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    activeUsersToday,
    totalRevenue,
    orgTypeBreakdown: orgTypeBreakdown.map(r => ({ type: r._id || 'unknown', count: r.count })),
    organizationSummaries,
    recentEnrollments
  };
};
