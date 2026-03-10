const { Organization, User, Course, Enrollment } = require('../../models');

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

  const recentOrganizations = await Organization.find({ is_deleted: { $ne: true } })
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  const recentEnrollments = await Enrollment.find({ is_deleted: { $ne: true } })
    .populate('student_id', 'name email')
    .populate('course_id', 'title')
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  return {
    totalOrganizations,
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    activeUsersToday,
    recentOrganizations,
    recentEnrollments
  };
};
