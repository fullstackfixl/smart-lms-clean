const { 
  Course, 
  User, 
  Enrollment, 
  Organization,
  Department,
  Batch,
  GradeLevel,
  TrainingAssignment
} = require('../../models');

exports.getDashboardData = async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    
    // Get organization type
    const org = await Organization.findById(organization_id);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const orgType = org.type;

    // Common Stats for all types
    const stats = {
      activeCourses: await Course.countDocuments({ organization_id, status: 'published', is_deleted: { $ne: true } }),
      totalUsers: await User.countDocuments({ organization_id, is_deleted: { $ne: true } }),
      activeStudents: await User.countDocuments({ organization_id, role: 'student', status: 'active' }),
      totalEnrollments: await Enrollment.countDocuments({ organization_id })
    };

    // Type-specific data
    let specializedData = {};

    switch (orgType) {
      case 'college':
        specializedData = {
          departments: await Department.countDocuments({ organization_id, isActive: true }),
          activePrograms: await require('../../models/Program').countDocuments({ organization_id, isActive: true }),
          currentSemesters: await require('../../models/Semester').countDocuments({ organization_id, isCurrent: true })
        };
        break;
      case 'school':
        specializedData = {
          totalClasses: await GradeLevel.countDocuments({ organization_id, isActive: true }),
          totalSections: await require('../../models/GradeSection').countDocuments({ organization_id, isActive: true }),
          parentsLinked: await User.countDocuments({ organization_id, role: 'parent' })
        };
        break;
      case 'institute':
        specializedData = {
          activeBatches: await Batch.countDocuments({ organization_id, isActive: true }),
          batchEnrollments: await Enrollment.countDocuments({ organization_id }) // Batch enrollments are standard enrollments here
        };
        break;
      case 'corporate':
        specializedData = {
          trainingAssignments: await TrainingAssignment.countDocuments({ organization_id }),
          pendingAssignments: await TrainingAssignment.countDocuments({ organization_id, status: 'assigned' }),
          skillsTracked: await require('../../models/Skill').countDocuments({ organization_id, isActive: true })
        };
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalStudents: stats.activeStudents,
          totalInstructors: await User.countDocuments({ organization_id, role: 'instructor', is_deleted: { $ne: true } }),
          activeCourses: stats.activeCourses,
          totalRevenue: 0, // Placeholder
          liveClassesCount: 0, 
          trends: {
            students: "+0%",
            revenue: "+0%",
            liveSessions: "+0"
          },
          ...specializedData
        },
        organizationType: orgType.toUpperCase(),
        charts: {
          enrollmentGrowth: [],
          feeCollection: []
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
