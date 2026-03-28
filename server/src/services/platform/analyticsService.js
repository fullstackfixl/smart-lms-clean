const {
  Organization,
  Course,
  User,
  Enrollment,
  Lesson,
  LectureProgress,
  Assignment,
  Attendance,
  PlatformAuditLog,
  Conversation,
  Message
} = require('../../models');

function monthSeries(months = 6) {
  const points = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    points.push(d);
  }
  return points;
}

async function countCreatedBetween(model, start, end, query = {}, dateField = 'created_at') {
  return model.countDocuments({
    ...query,
    [dateField]: { $gte: start, $lt: end },
    is_deleted: { $ne: true }
  });
}

exports.getOverview = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const activeWindowStart = new Date(Date.now() - 15 * 60 * 1000);

  const [
    totalOrganizations,
    totalCourses,
    totalStudents,
    totalInstructors,
    totalLessons,
    totalAssignments,
    activeSessions,
    activeUsersToday,
    totalEnrollmentRows
  ] = await Promise.all([
    Organization.countDocuments({ is_deleted: { $ne: true } }),
    Course.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'student', is_deleted: { $ne: true } }),
    User.countDocuments({ role: 'instructor', is_deleted: { $ne: true } }),
    Lesson.countDocuments({ is_deleted: { $ne: true } }),
    Assignment.countDocuments({ is_active: true }),
    User.countDocuments({ lastActive: { $gte: activeWindowStart }, is_deleted: { $ne: true } }),
    User.countDocuments({ lastLogin: { $gte: todayStart }, is_deleted: { $ne: true } }),
    Enrollment.countDocuments({})
  ]);

  const progressAggregation = await Enrollment.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        avgProgress: { $avg: '$progress.completionPercentage' },
        completionRate: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              100,
              '$progress.completionPercentage'
            ]
          }
        }
      }
    }
  ]);

  const avgProgress = progressAggregation[0]?.avgProgress || 0;
  const completionRate = progressAggregation[0]?.completionRate || 0;

  const topNodes = await Organization.find({ is_deleted: { $ne: true } })
    .select('name type status created_at')
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  const orgIds = topNodes.map((org) => org._id);
  const [studentCounts, courseCounts, instructorCounts] = await Promise.all([
    User.aggregate([
      { $match: { organization_id: { $in: orgIds }, role: 'student', is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ]),
    Course.aggregate([
      { $match: { organization_id: { $in: orgIds }, is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ]),
    User.aggregate([
      { $match: { organization_id: { $in: orgIds }, role: 'instructor', is_deleted: { $ne: true } } },
      { $group: { _id: '$organization_id', count: { $sum: 1 } } }
    ])
  ]);

  const countMap = (rows) => rows.reduce((acc, row) => {
    acc[String(row._id)] = row.count;
    return acc;
  }, {});

  const studentMap = countMap(studentCounts);
  const courseMap = countMap(courseCounts);
  const instructorMap = countMap(instructorCounts);

  const organizationSummaries = topNodes.map((org) => ({
    ...org,
    stats: {
      totalStudents: studentMap[String(org._id)] || 0,
      totalCourses: courseMap[String(org._id)] || 0,
      totalInstructors: instructorMap[String(org._id)] || 0
    }
  }));

  const sixMonthPoints = monthSeries(6);
  const enrollmentTrend = await Promise.all(
    sixMonthPoints.map(async (start) => {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const value = await Enrollment.countDocuments({
        enrolledAt: { $gte: start, $lt: end },
        is_deleted: { $ne: true }
      });
      return {
        date: start.toISOString().slice(0, 10),
        value
      };
    })
  );

  const regionalDistribution = await Organization.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    {
      $group: {
        _id: { $ifNull: ['$address.country', 'Unknown'] },
        value: { $sum: 1 }
      }
    },
    { $sort: { value: -1 } },
    { $limit: 6 }
  ]);

  const totalRevenue = await Enrollment.aggregate([
    { $match: { 'payment.paymentStatus': 'completed' } },
    { $group: { _id: null, total: { $sum: '$payment.amount' } } }
  ]);

  return {
    totalOrganizations,
    totalUsers: totalStudents + totalInstructors,
    totalStudents,
    totalInstructors,
    totalCourses,
    totalLessons,
    totalAssignments,
    activeSessions,
    activeUsersToday,
    totalEnrollments: totalEnrollmentRows,
    avgProgress: Number(avgProgress.toFixed(1)),
    completionRate: Number(completionRate.toFixed(1)),
    totalRevenue: totalRevenue[0]?.total || 0,
    enrollmentTrend,
    topNodes: organizationSummaries,
    regionalDistribution: regionalDistribution.map((row) => ({
      name: row._id || 'Unknown',
      region: row._id || 'Unknown',
      percent: row.value
    }))
  };
};

exports.getGrowth = async () => {
  const points = monthSeries(6);

  const buildSeries = async (model, extraQuery = {}, dateField = 'created_at') => Promise.all(
    points.map(async (start) => {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = await countCreatedBetween(model, start, end, extraQuery, dateField);
      return {
        month: start.toLocaleString('default', { month: 'short' }),
        count
      };
    })
  );

  const [userGrowth, organizationGrowth, courseGrowth, enrollmentGrowth] = await Promise.all([
    buildSeries(User, {}, 'created_at'),
    buildSeries(Organization, {}, 'created_at'),
    buildSeries(Course, {}, 'createdAt'),
    buildSeries(Enrollment, { enrolledAt: { $exists: true } }, 'enrolledAt')
  ]);

  return {
    userGrowth,
    organizationGrowth,
    courseGrowth,
    enrollmentGrowth
  };
};

exports.getActivity = async () => {
  const [recentActions, activeConversations, recentMessages] = await Promise.all([
    PlatformAuditLog.find({})
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(20)
      .lean(),
    Conversation.find({})
      .populate('participants', 'name email role profilePicture')
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .lean(),
    Message.find({})
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean()
  ]);

  const feed = [
    ...recentActions.map((item) => ({
      id: item._id,
      type: 'audit',
      title: item.action,
      actor: item.actorId,
      timestamp: item.timestamp,
      details: item.details || null
    })),
    ...recentMessages.map((item) => ({
      id: item._id,
      type: 'message',
      title: item.text,
      actor: item.senderId,
      timestamp: item.createdAt,
      details: { conversationId: item.conversationId }
    }))
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 25);

  return {
    feed,
    activeConversations: activeConversations.map((conversation) => ({
      _id: conversation._id,
      name: conversation.name,
      type: conversation.type,
      contextType: conversation.contextType,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      participants: conversation.participants || []
    }))
  };
};

exports.getEngagement = async () => {
  const [courseEngagement, assignmentCompletion, instructorPerformance] = await Promise.all([
    Course.aggregate([
      { $match: { is_deleted: { $ne: true } } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course_id',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          organization_id: 1,
          enrollmentCount: { $size: '$enrollments' }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 }
    ]),
    Assignment.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'assignment_id',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          organization_id: 1,
          totalSubmissions: { $size: '$submissions' },
          completedSubmissions: {
            $size: {
              $filter: {
                input: '$submissions',
                as: 'submission',
                cond: { $eq: ['$$submission.status', 'submitted'] }
              }
            }
          }
        }
      },
      { $sort: { totalSubmissions: -1 } },
      { $limit: 10 }
    ]),
    User.aggregate([
      { $match: { role: 'instructor', is_deleted: { $ne: true } } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor_id',
          as: 'courses'
        }
      },
      {
        $lookup: {
          from: 'enrollments',
          localField: 'courses._id',
          foreignField: 'course_id',
          as: 'enrollments'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          courseCount: { $size: '$courses' },
          learnerReach: { $size: '$enrollments' }
        }
      },
      { $sort: { learnerReach: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    courseEngagement,
    assignmentCompletion,
    instructorPerformance
  };
};
