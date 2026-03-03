const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const requireOrganization = require('../middleware/orgProtection');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

const router = express.Router();
const Organization = require('../models/Organization');
const GradeLevel = require('../models/GradeLevel');
const GradeSection = require('../models/GradeSection');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const Batch = require('../models/Batch');
const TestSeries = require('../models/TestSeries');
const AcademicYear = require('../models/AcademicYear');
const Invite = require('../models/Invite');
const emailService = require('../services/email.service');
const { generateInvitationTemplate } = emailService;
const { recordOrgEvent, EVENT_TYPES } = require('../utils/orgEvents');


// All routes require org_admin role and organization
router.use(authMiddleware, requireRole(['org_admin']), requireOrganization);

// --- Get enabled modules for this organization ---
router.get('/modules', async (req, res) => {
  try {
    const org = req.user.organization_id;
    if (!org) {
      return res.error('Organization not found', 'Unauthorized', 401);
    }

    const Organization = require('../models/Organization');
    let orgDoc = org;
    // If org is populated, use it directly; otherwise load from DB
    if (!org.modulesEnabled) {
      orgDoc = await Organization.findById(org).select('modulesEnabled type templateVersion').lean();
    }

    res.success({
      modulesEnabled: orgDoc?.modulesEnabled || [],
      organizationType: orgDoc?.type || 'Other'
    }, 'Modules retrieved');
  } catch (error) {
    console.error('Get modules error:', error);
    res.error(error.message, 'Failed to fetch modules', 500);
  }
});

router.get('/dashboard/metrics', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return res.error('Organization ID not found', 'Unauthorized', 401);
    }

    // Convert to ObjectId
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Total Students
    const totalStudents = await User.countDocuments({
      organization_id: orgId,
      role: 'student',
      isActive: true
    });

    // Total Instructors
    const totalInstructors = await User.countDocuments({
      organization_id: orgId,
      role: 'instructor',
      isActive: true
    });

    // Active Courses
    const activeCourses = await Course.countDocuments({
      organization_id: orgId,
      isPublished: true
    });

    // Total Revenue (sum of paid fees)
    const revenueData = await Fee.aggregate([
      {
        $match: {
          organization_id: orgId,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Pending Fees
    const pendingFeesData = await Fee.aggregate([
      {
        $match: {
          organization_id: orgId,
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          pendingFees: { $sum: '$amount' }
        }
      }
    ]);
    const pendingFees = pendingFeesData[0]?.pendingFees || 0;

    // Average Attendance %
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          totalRecords: { $sum: 1 }
        }
      }
    ]);
    const attendancePercentage = attendanceData[0]
      ? ((attendanceData[0].totalPresent / attendanceData[0].totalRecords) * 100).toFixed(1)
      : 0;

    // Enrollment Growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollmentGrowth = await Enrollment.aggregate([
      {
        $match: {
          organization_id: orgId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Fee Collection (last 6 months)
    const feeCollection = await Fee.aggregate([
      {
        $match: {
          organization_id: orgId,
          status: 'paid',
          paidAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Course Completion Rate
    const completionData = await Enrollment.aggregate([
      {
        $match: {
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: null,
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);
    const completionRate = completionData[0]
      ? ((completionData[0].completed / completionData[0].total) * 100).toFixed(1)
      : 0;

    // Type-specific metrics
    const org = await Organization.findById(orgId).select('type').lean();
    const orgType = org?.type || 'School';
    const typeSpecific = {};

    if (orgType === 'School') {
      typeSpecific.gradeLevels = await GradeLevel.countDocuments({ organization_id: orgId });
      typeSpecific.sections = await GradeSection.countDocuments({ organization_id: orgId });
      typeSpecific.academicYears = await AcademicYear.countDocuments({ organization_id: orgId });
    } else if (orgType === 'College') {
      typeSpecific.departments = await Department.countDocuments({ organization_id: orgId });
      typeSpecific.semesters = await Semester.countDocuments({ organization_id: orgId });
    } else if (orgType === 'Institute') {
      typeSpecific.batches = await Batch.countDocuments({ organization_id: orgId });
      typeSpecific.testSeries = await TestSeries.countDocuments({ organization_id: orgId });
    }

    res.success({
      metrics: {
        totalStudents,
        totalInstructors,
        activeCourses,
        totalRevenue,
        pendingFees,
        attendancePercentage: parseFloat(attendancePercentage),
        completionRate: parseFloat(completionRate),
        ...typeSpecific
      },
      organizationType: orgType,
      charts: {
        enrollmentGrowth,
        feeCollection
      }
    }, 'Dashboard metrics retrieved');

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.error(error.message, 'Failed to fetch dashboard metrics', 500);
  }
});

// Recent Activities
router.get('/dashboard/activities', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const limit = parseInt(req.query.limit) || 10;

    if (!organizationId) {
      return res.error('Organization ID not found', 'Unauthorized', 401);
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Recent enrollments
    const recentEnrollments = await Enrollment.find({
      organization_id: orgId
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('student_id', 'name email')
      .populate('course_id', 'title');

    // Recent fee payments
    const recentPayments = await Fee.find({
      organization_id: orgId,
      status: 'paid'
    })
      .sort({ paidAt: -1 })
      .limit(limit)
      .populate('student_id', 'name email');

    res.success({
      recentEnrollments,
      recentPayments
    }, 'Recent activities retrieved');

  } catch (error) {
    console.error('Recent activities error:', error);
    res.error(error.message, 'Failed to fetch recent activities', 500);
  }
});

// ==================== USER MANAGEMENT ====================

// List all users
router.get('/users', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { role, search, page = 1, limit = 20, status } = req.query;

    if (!organizationId) {
      return res.error('Organization ID not found', 'Unauthorized', 401);
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { organization_id: orgId };

    if (role) {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status; // User model has status: 'active'|'suspended'|'inactive'
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }  // User model stores `name` directly
      ];
    }

    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.success({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    console.error('List users error:', error);
    res.error(error.message, 'Failed to fetch users', 500);
  }
});

// !! IMPORTANT: All specific /users/... routes MUST come BEFORE the wildcard /users/:id route

// Invite staff/instructor/student
router.post('/users/invite', async (req, res) => {
  try {
    const authService = require('../services/authService');
    const invite = await authService.inviteStaff(req.user.organization_id, req.body);
    res.success({ invite }, 'Invitation sent successfully');



    // Record Event
    await recordOrgEvent(
      req.user.organization_id,
      invite.role === 'student' ? EVENT_TYPES.NEW_STUDENT : EVENT_TYPES.NEW_INSTRUCTOR, // Approximate
      `Administrative invitation sent to ${req.body.email} (${req.body.role})`,
      invite._id
    );

  } catch (error) {
    console.error('Invite staff error:', error);
    res.error(error.message, 'Failed to send invitation', error.statusCode || 500);
  }
});

// List pending invitations for this org
router.get('/users/invites', async (req, res) => {
  try {
    const orgId = new mongoose.Types.ObjectId(String(req.user.organization_id));
    const invites = await Invite.find({
      organization_id: orgId,
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ createdAt: -1 }).lean();
    res.success({ invites }, 'Pending invitations fetched');
  } catch (error) {
    console.error('[Invites] GET /users/invites error:', error.message);
    res.error(error.message, 'Failed to fetch invites', 500);
  }
});

// Resend an invitation email
router.post('/users/resend-invite/:inviteId', async (req, res) => {
  try {
    const orgId = new mongoose.Types.ObjectId(String(req.user.organization_id));
    const invite = await Invite.findOne({
      _id: req.params.inviteId,
      organization_id: orgId,
      used: false,
      expires_at: { $gt: new Date() }
    });
    if (!invite) {
      return res.error('Invite not found or already used/expired', 'Not found', 404);
    }

    const org = await Organization.findById(req.user.organization_id).select('name');
    const baseUrl = (process.env.CLIENT_URL || 'https://smart-lms-clean.vercel.app').replace(/\/$/, '');
    const acceptLink = `${baseUrl}/accept-invite?token=${invite.token}`;
    const roleLabel = invite.role.charAt(0).toUpperCase() + invite.role.slice(1);
    const orgName = org?.name || 'Your Organization';

    try {
      const html = generateInvitationTemplate(orgName, acceptLink);
      await emailService.sendEmail({
        to: invite.email,
        subject: `Reminder: Join ${orgName} as ${roleLabel} — Smart LMS`,
        html
      });
    } catch (mailErr) {
      console.warn('Mail send failed, continuing:', mailErr.message);
    }

    res.success({ invite }, 'Invitation resent successfully');
  } catch (error) {
    console.error('[Resend Invite] Error:', error.message);
    res.error(error.message, 'Failed to resend invite', 500);
  }
});

// Get single user — MUST come AFTER all specific /users/XXX routes
router.get('/users/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.params.id;

    const user = await User.findOne({
      _id: userId,
      organization_id: organizationId
    }).select('-password');

    if (!user) {
      return res.error('User not found', 'Not found', 404);
    }

    res.success({ user }, 'User retrieved successfully');

  } catch (error) {
    console.error('Get user error:', error);
    res.error(error.message, 'Failed to fetch user', 500);
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { email, password, fullName, role, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return res.error('Email, password, full name, and role are required', 'Validation failed', 400);
    }

    // Validate role
    const validRoles = ['student', 'instructor', 'parent'];
    if (!validRoles.includes(role)) {
      return res.error('Invalid role', 'Validation failed', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.error('Email already registered', 'Validation failed', 400);
    }

    // Create user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      profile: { fullName, phone },
      role,
      organization_id: organizationId,
      isActive: true,
      email_verified: true
    });

    await newUser.save();

    res.success({
      user: newUser.toPublicJSON()
    }, 'User created successfully');

  } catch (error) {
    console.error('Create user error:', error);
    res.error(error.message, 'Failed to create user', 500);
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.params.id;
    const { fullName, phone, email } = req.body;

    const user = await User.findOne({
      _id: userId,
      organization_id: organizationId
    });

    if (!user) {
      return res.error('User not found', 'Not found', 404);
    }

    // Update fields
    if (fullName) user.profile.fullName = fullName;
    if (phone) user.profile.phone = phone;
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.error('Email already in use', 'Validation failed', 400);
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    res.success({
      user: user.toPublicJSON()
    }, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    res.error(error.message, 'Failed to update user', 500);
  }
});

// Assign role
router.post('/users/:id/assign-role', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.params.id;
    const { role } = req.body;

    const validRoles = ['student', 'instructor', 'parent'];
    if (!validRoles.includes(role)) {
      return res.error('Invalid role', 'Validation failed', 400);
    }

    const user = await User.findOne({
      _id: userId,
      organization_id: organizationId
    });

    if (!user) {
      return res.error('User not found', 'Not found', 404);
    }

    user.role = role;
    await user.save();

    res.success({
      user: user.toPublicJSON()
    }, 'Role assigned successfully');

  } catch (error) {
    console.error('Assign role error:', error);
    res.error(error.message, 'Failed to assign role', 500);
  }
});

// Disable/Enable user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.params.id;
    const { isActive } = req.body;

    const user = await User.findOne({
      _id: userId,
      organization_id: organizationId
    });

    if (!user) {
      return res.error('User not found', 'Not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    res.success({
      user: user.toPublicJSON()
    }, `User ${isActive ? 'enabled' : 'disabled'} successfully`);

  } catch (error) {
    console.error('Update user status error:', error);
    res.error(error.message, 'Failed to update user status', 500);
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.params.id;

    const user = await User.findOne({
      _id: userId,
      organization_id: organizationId
    });

    if (!user) {
      return res.error('User not found', 'Not found', 404);
    }

    // Soft delete using the model method
    await user.softDelete(req.user._id);

    res.success({}, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    res.error(error.message, 'Failed to delete user', 500);
  }
});

// ==================== COURSE MANAGEMENT ====================

// List all courses
router.get('/courses', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { search, status, page = 1, limit = 20 } = req.query;

    if (!organizationId) {
      return res.error('Organization ID not found', 'Unauthorized', 401);
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { organization_id: orgId };

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get courses
    const courses = await Course.find(query)
      .populate('instructor_id', 'profile.fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Course.countDocuments(query);

    res.success({
      courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Courses retrieved successfully');

  } catch (error) {
    console.error('List courses error:', error);
    res.error(error.message, 'Failed to fetch courses', 500);
  }
});

// Get single course
router.get('/courses/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const courseId = req.params.id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: organizationId
    }).populate('instructor_id', 'profile.fullName email');

    if (!course) {
      return res.error('Course not found', 'Not found', 404);
    }

    // Get enrollment count
    const enrollmentCount = await Enrollment.countDocuments({
      course_id: courseId
    });

    res.success({
      course,
      enrollmentCount
    }, 'Course retrieved successfully');

  } catch (error) {
    console.error('Get course error:', error);
    res.error(error.message, 'Failed to fetch course', 500);
  }
});

// Publish/Unpublish course
router.put('/courses/:id/publish', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const courseId = req.params.id;
    const { isPublished } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: organizationId
    });

    if (!course) {
      return res.error('Course not found', 'Not found', 404);
    }

    course.isPublished = isPublished;
    await course.save();

    res.success({
      course
    }, `Course ${isPublished ? 'published' : 'unpublished'} successfully`);

  } catch (error) {
    console.error('Publish course error:', error);
    res.error(error.message, 'Failed to update course status', 500);
  }
});

// Assign instructor to course
router.put('/courses/:id/assign-instructor', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const courseId = req.params.id;
    const { instructorId } = req.body;

    if (!instructorId) {
      return res.error('Instructor ID is required', 'Validation failed', 400);
    }

    // Verify instructor exists and belongs to organization
    const instructor = await User.findOne({
      _id: instructorId,
      organization_id: organizationId,
      role: 'instructor'
    });

    if (!instructor) {
      return res.error('Instructor not found', 'Not found', 404);
    }

    const course = await Course.findOne({
      _id: courseId,
      organization_id: organizationId
    });

    if (!course) {
      return res.error('Course not found', 'Not found', 404);
    }

    course.instructor_id = instructorId;
    await course.save();

    await course.populate('instructor_id', 'profile.fullName email');

    res.success({
      course
    }, 'Instructor assigned successfully');

  } catch (error) {
    console.error('Assign instructor error:', error);
    res.error(error.message, 'Failed to assign instructor', 500);
  }
});

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================

// Get attendance summary
router.get('/attendance/summary', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Overall attendance statistics
    const overallStats = await Attendance.aggregate([
      {
        $match: {
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRecords = overallStats.reduce((sum, stat) => sum + stat.count, 0);
    const presentCount = overallStats.find(s => s._id === 'present')?.count || 0;
    const absentCount = overallStats.find(s => s._id === 'absent')?.count || 0;
    const lateCount = overallStats.find(s => s._id === 'late')?.count || 0;

    const attendancePercentage = totalRecords > 0
      ? ((presentCount / totalRecords) * 100).toFixed(1)
      : 0;

    // Attendance by course
    const byCourse = await Attendance.aggregate([
      {
        $match: {
          organization_id: orgId
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $group: {
          _id: '$course_id',
          courseName: { $first: '$course.title' },
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          courseName: 1,
          totalRecords: 1,
          presentCount: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      },
      {
        $sort: { attendanceRate: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.success({
      overall: {
        totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      byCourse
    }, 'Attendance summary retrieved');

  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.error(error.message, 'Failed to get attendance summary', 500);
  }
});

// Get student attendance history
router.get('/attendance/student/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const studentId = req.params.id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Verify student belongs to organization
    const student = await User.findOne({
      _id: studentId,
      organization_id: orgId,
      role: 'student'
    });

    if (!student) {
      return res.error('Student not found', 'Not found', 404);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student_id: studentId,
      organization_id: orgId
    })
      .populate('course_id', 'title')
      .populate('session_id', 'title date')
      .sort({ date: -1 })
      .limit(100);

    // Calculate statistics
    const stats = await Attendance.aggregate([
      {
        $match: {
          student_id: new mongoose.Types.ObjectId(studentId),
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);
    const presentCount = stats.find(s => s._id === 'present')?.count || 0;
    const attendanceRate = totalRecords > 0
      ? ((presentCount / totalRecords) * 100).toFixed(1)
      : 0;

    res.success({
      student: {
        id: student._id,
        name: student.profile.fullName,
        email: student.email
      },
      statistics: {
        totalRecords,
        present: presentCount,
        absent: stats.find(s => s._id === 'absent')?.count || 0,
        late: stats.find(s => s._id === 'late')?.count || 0,
        attendanceRate: parseFloat(attendanceRate)
      },
      records: attendanceRecords
    }, 'Student attendance retrieved');

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.error(error.message, 'Failed to get student attendance', 500);
  }
});

// Get instructor-wise attendance
router.get('/attendance/instructor/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const instructorId = req.params.id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Verify instructor belongs to organization
    const instructor = await User.findOne({
      _id: instructorId,
      organization_id: orgId,
      role: 'instructor'
    });

    if (!instructor) {
      return res.error('Instructor not found', 'Not found', 404);
    }

    // Get courses taught by instructor
    const courses = await Course.find({
      instructor_id: instructorId,
      organization_id: orgId
    });

    const courseIds = courses.map(c => c._id);

    // Get attendance for instructor's courses
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          course_id: { $in: courseIds },
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: '$course_id',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $project: {
          courseId: '$_id',
          courseName: '$course.title',
          totalRecords: 1,
          presentCount: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      }
    ]);

    const totalRecords = attendanceStats.reduce((sum, stat) => sum + stat.totalRecords, 0);
    const totalPresent = attendanceStats.reduce((sum, stat) => sum + stat.presentCount, 0);
    const overallRate = totalRecords > 0
      ? ((totalPresent / totalRecords) * 100).toFixed(1)
      : 0;

    res.success({
      instructor: {
        id: instructor._id,
        name: instructor.profile.fullName,
        email: instructor.email
      },
      overall: {
        totalRecords,
        presentCount: totalPresent,
        attendanceRate: parseFloat(overallRate)
      },
      courses: attendanceStats
    }, 'Instructor attendance retrieved');

  } catch (error) {
    console.error('Get instructor attendance error:', error);
    res.error(error.message, 'Failed to get instructor attendance', 500);
  }
});

// ============================================
// GRADE MANAGEMENT
// ============================================

// Get all grades with filters
router.get('/grades', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { courseId, studentId, minGrade, maxGrade } = req.query;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = { organization_id: orgId };

    if (courseId) filter.course_id = new mongoose.Types.ObjectId(courseId);
    if (studentId) filter.student_id = new mongoose.Types.ObjectId(studentId);
    if (minGrade) filter.grade = { ...filter.grade, $gte: parseFloat(minGrade) };
    if (maxGrade) filter.grade = { ...filter.grade, $lte: parseFloat(maxGrade) };

    const grades = await Grade.find(filter)
      .populate('student_id', 'profile.fullName email')
      .populate('course_id', 'title')
      .populate('assignment_id', 'title')
      .populate('graded_by', 'profile.fullName')
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate statistics
    const stats = await Grade.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: null,
          averageGrade: { $avg: '$grade' },
          highestGrade: { $max: '$grade' },
          lowestGrade: { $min: '$grade' },
          totalGrades: { $sum: 1 }
        }
      }
    ]);

    res.success({
      grades,
      statistics: stats[0] || {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalGrades: 0
      }
    }, 'Grades retrieved');

  } catch (error) {
    console.error('Get grades error:', error);
    res.error(error.message, 'Failed to get grades', 500);
  }
});

// Get grades by course
router.get('/grades/course/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const courseId = req.params.id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Verify course belongs to organization
    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Course not found', 'Not found', 404);
    }

    const grades = await Grade.find({
      course_id: courseId,
      organization_id: orgId
    })
      .populate('student_id', 'profile.fullName email')
      .populate('assignment_id', 'title')
      .populate('graded_by', 'profile.fullName')
      .sort({ createdAt: -1 });

    // Grade distribution
    const distribution = await Grade.aggregate([
      {
        $match: {
          course_id: new mongoose.Types.ObjectId(courseId),
          organization_id: orgId
        }
      },
      {
        $bucket: {
          groupBy: '$grade',
          boundaries: [0, 50, 60, 70, 80, 90, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: '$student_id' }
          }
        }
      }
    ]);

    // Average by student
    const studentAverages = await Grade.aggregate([
      {
        $match: {
          course_id: new mongoose.Types.ObjectId(courseId),
          organization_id: orgId
        }
      },
      {
        $group: {
          _id: '$student_id',
          averageGrade: { $avg: '$grade' },
          totalAssignments: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          studentId: '$_id',
          studentName: '$student.profile.fullName',
          studentEmail: '$student.email',
          averageGrade: { $round: ['$averageGrade', 2] },
          totalAssignments: 1
        }
      },
      {
        $sort: { averageGrade: -1 }
      }
    ]);

    res.success({
      course: {
        id: course._id,
        title: course.title
      },
      grades,
      distribution,
      studentAverages
    }, 'Course grades retrieved');

  } catch (error) {
    console.error('Get course grades error:', error);
    res.error(error.message, 'Failed to get course grades', 500);
  }
});

// Export grades report
router.post('/grades/export', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { courseId, format = 'json' } = req.body;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = { organization_id: orgId };
    if (courseId) filter.course_id = new mongoose.Types.ObjectId(courseId);

    const grades = await Grade.find(filter)
      .populate('student_id', 'profile.fullName email')
      .populate('course_id', 'title')
      .populate('assignment_id', 'title')
      .populate('graded_by', 'profile.fullName')
      .sort({ createdAt: -1 });

    // Format data for export
    const exportData = grades.map(grade => ({
      studentName: grade.student_id?.profile?.fullName || 'N/A',
      studentEmail: grade.student_id?.email || 'N/A',
      courseName: grade.course_id?.title || 'N/A',
      assignmentName: grade.assignment_id?.title || 'N/A',
      grade: grade.grade,
      maxGrade: grade.maxGrade,
      percentage: ((grade.grade / grade.maxGrade) * 100).toFixed(2),
      feedback: grade.feedback || '',
      gradedBy: grade.graded_by?.profile?.fullName || 'N/A',
      gradedAt: grade.createdAt
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=grades-export.csv');
      return res.send(csv);
    }

    // Default JSON format
    res.success({
      exportData,
      totalRecords: exportData.length,
      exportedAt: new Date()
    }, 'Grades exported successfully');

  } catch (error) {
    console.error('Export grades error:', error);
    res.error(error.message, 'Failed to export grades', 500);
  }
});

// ============================================
// FEES & PAYMENTS MANAGEMENT
// ============================================

// Set fees for a course or student
router.post('/fees/set', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { studentId, courseId, amount, dueDate, description, type } = req.body;

    if (!amount || !dueDate) {
      return res.error('Amount and due date are required', 'Validation failed', 400);
    }

    const fee = new Fee({
      student_id: studentId,
      course_id: courseId,
      organization_id: organizationId,
      amount,
      dueDate,
      description,
      type: type || 'tuition',
      status: 'pending'
    });

    await fee.save();

    await fee.populate([
      { path: 'student_id', select: 'profile.fullName email' },
      { path: 'course_id', select: 'title' }
    ]);

    res.success({ fee }, 'Fee set successfully');

  } catch (error) {
    console.error('Set fee error:', error);
    res.error(error.message, 'Failed to set fee', 500);
  }
});

// Get pending fees
router.get('/fees/pending', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const pendingFees = await Fee.find({
      organization_id: orgId,
      status: { $in: ['pending', 'overdue'] }
    })
      .populate('student_id', 'profile.fullName email')
      .populate('course_id', 'title')
      .sort({ dueDate: 1 })
      .limit(100);

    // Calculate total pending
    const totalPending = await Fee.aggregate([
      {
        $match: {
          organization_id: orgId,
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.success({
      fees: pendingFees,
      summary: totalPending[0] || { total: 0, count: 0 }
    }, 'Pending fees retrieved');

  } catch (error) {
    console.error('Get pending fees error:', error);
    res.error(error.message, 'Failed to get pending fees', 500);
  }
});

// Get fee payment history
router.get('/fees/history', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { startDate, endDate, status } = req.query;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = { organization_id: orgId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const fees = await Fee.find(filter)
      .populate('student_id', 'profile.fullName email')
      .populate('course_id', 'title')
      .sort({ createdAt: -1 })
      .limit(200);

    // Revenue statistics
    const stats = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.success({
      fees,
      statistics: stats
    }, 'Fee history retrieved');

  } catch (error) {
    console.error('Get fee history error:', error);
    res.error(error.message, 'Failed to get fee history', 500);
  }
});

// Send fee reminder
router.post('/fees/reminder', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { feeId } = req.body;

    if (!feeId) {
      return res.error('Fee ID is required', 'Validation failed', 400);
    }

    const fee = await Fee.findOne({
      _id: feeId,
      organization_id: organizationId
    }).populate('student_id', 'profile.fullName email');

    if (!fee) {
      return res.error('Fee not found', 'Not found', 404);
    }

    // Send reminder email (implement email service)
    const emailService = require('../utils/emailService');
    const { sendEmail } = emailService;
    await sendEmail({
      to: fee.student_id.email,
      subject: 'Fee Payment Reminder - Smart LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Fee Payment Reminder</h2>
          <p>Hello ${fee.student_id.profile.fullName},</p>
          <p>This is a reminder that you have a pending fee payment:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> $${fee.amount}</p>
            <p><strong>Due Date:</strong> ${new Date(fee.dueDate).toLocaleDateString()}</p>
            <p><strong>Description:</strong> ${fee.description || 'N/A'}</p>
          </div>
          <p>Please make the payment at your earliest convenience.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">Smart LMS - Learning Management System</p>
        </div>
      `
    });

    res.success({ message: 'Reminder sent successfully' }, 'Reminder sent');

  } catch (error) {
    console.error('Send reminder error:', error);
    res.error(error.message, 'Failed to send reminder', 500);
  }
});

// ============================================
// EVENTS MANAGEMENT
// ============================================

// Create event
router.post('/events', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { title, description, type, startDate, endDate, location, participants } = req.body;

    if (!title || !type || !startDate) {
      return res.error('Title, type, and start date are required', 'Validation failed', 400);
    }

    const Event = require('../models/Event');
    const event = new Event({
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      participants,
      organization_id: organizationId,
      createdBy: req.user._id
    });

    await event.save();

    res.success({ event }, 'Event created successfully');

  } catch (error) {
    console.error('Create event error:', error);
    res.error(error.message, 'Failed to create event', 500);
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { type, startDate, endDate } = req.query;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = { organization_id: orgId };
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const Event = require('../models/Event');
    const events = await Event.find(filter)
      .populate('createdBy', 'profile.fullName')
      .sort({ startDate: 1 })
      .limit(100);

    // Group by type
    const eventsByType = await Event.aggregate([
      { $match: { organization_id: orgId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.success({
      events,
      statistics: eventsByType
    }, 'Events retrieved');

  } catch (error) {
    console.error('Get events error:', error);
    res.error(error.message, 'Failed to get events', 500);
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const eventId = req.params.id;
    const updates = req.body;

    const Event = require('../models/Event');
    const event = await Event.findOne({
      _id: eventId,
      organization_id: organizationId
    });

    if (!event) {
      return res.error('Event not found', 'Not found', 404);
    }

    Object.assign(event, updates);
    await event.save();

    res.success({ event }, 'Event updated successfully');

  } catch (error) {
    console.error('Update event error:', error);
    res.error(error.message, 'Failed to update event', 500);
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const eventId = req.params.id;

    const Event = require('../models/Event');
    const event = await Event.findOneAndDelete({
      _id: eventId,
      organization_id: organizationId
    });

    if (!event) {
      return res.error('Event not found', 'Not found', 404);
    }

    res.success({ message: 'Event deleted successfully' }, 'Event deleted');

  } catch (error) {
    console.error('Delete event error:', error);
    res.error(error.message, 'Failed to delete event', 500);
  }
});

// ============================================
// REPORTS & ANALYTICS
// ============================================

// Get analytics overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Student performance
    const studentPerformance = await Grade.aggregate([
      {
        $match: { organization_id: orgId }
      },
      {
        $group: {
          _id: '$student_id',
          averageGrade: { $avg: '$grade' },
          totalAssignments: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          overallAverage: { $avg: '$averageGrade' },
          totalStudents: { $sum: 1 }
        }
      }
    ]);

    // Course success rate
    const courseSuccess = await Enrollment.aggregate([
      {
        $match: { organization_id: orgId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Financial summary
    const financialSummary = await Fee.aggregate([
      {
        $match: { organization_id: orgId }
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          organization_id: orgId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.success({
      studentPerformance: studentPerformance[0] || { overallAverage: 0, totalStudents: 0 },
      courseSuccess,
      financialSummary,
      enrollmentTrends
    }, 'Analytics overview retrieved');

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.error(error.message, 'Failed to get analytics', 500);
  }
});

// Get attendance analytics
router.get('/analytics/attendance', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Attendance trends over time
    const attendanceTrends = await Attendance.aggregate([
      {
        $match: { organization_id: orgId }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Attendance by course
    const attendanceByCourse = await Attendance.aggregate([
      {
        $match: { organization_id: orgId }
      },
      {
        $group: {
          _id: {
            course: '$course_id',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $project: {
          courseName: '$course.title',
          status: '$_id.status',
          count: 1
        }
      }
    ]);

    res.success({
      trends: attendanceTrends,
      byCourse: attendanceByCourse
    }, 'Attendance analytics retrieved');

  } catch (error) {
    console.error('Get attendance analytics error:', error);
    res.error(error.message, 'Failed to get attendance analytics', 500);
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { startDate, endDate } = req.query;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = { organization_id: orgId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Revenue by month
    const revenueByMonth = await Fee.aggregate([
      {
        $match: { ...filter, status: 'paid' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Revenue by type
    const revenueByType = await Fee.aggregate([
      {
        $match: { ...filter, status: 'paid' }
      },
      {
        $group: {
          _id: '$type',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total revenue
    const totalRevenue = await Fee.aggregate([
      {
        $match: { ...filter, status: 'paid' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.success({
      byMonth: revenueByMonth,
      byType: revenueByType,
      total: totalRevenue[0] || { total: 0, count: 0 }
    }, 'Revenue analytics retrieved');

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.error(error.message, 'Failed to get revenue analytics', 500);
  }
});

// ============================================
// BRANDING & SETTINGS
// ============================================

// Get organization settings
router.get('/settings', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const Organization = require('../models/Organization');
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.error('Organization not found', 'Not found', 404);
    }

    res.success({
      settings: {
        name: organization.name,
        domain: organization.domain,
        code: organization.code, // 6-character code
        organizationId: organization._id.toString(), // 24-character ObjectId
        logo: organization.branding?.logo || null,
        primaryColor: organization.branding?.primaryColor || '#3b82f6',
        secondaryColor: organization.branding?.secondaryColor || '#06b6d4',
        preferences: organization.settings || {}
      }
    }, 'Settings retrieved');

  } catch (error) {
    console.error('Get settings error:', error);
    res.error(error.message, 'Failed to get settings', 500);
  }
});

// Update organization settings
router.put('/settings', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { logo, primaryColor, secondaryColor, preferences } = req.body;

    const Organization = require('../models/Organization');
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.error('Organization not found', 'Not found', 404);
    }

    // Update branding
    if (!organization.branding) {
      organization.branding = {};
    }
    if (logo !== undefined) organization.branding.logo = logo;
    if (primaryColor) organization.branding.primaryColor = primaryColor;
    if (secondaryColor) organization.branding.secondaryColor = secondaryColor;

    // Update preferences
    if (preferences) {
      organization.settings = { ...organization.settings, ...preferences };
    }

    await organization.save();

    res.success({
      settings: {
        name: organization.name,
        domain: organization.domain,
        logo: organization.branding.logo,
        primaryColor: organization.branding.primaryColor,
        secondaryColor: organization.branding.secondaryColor,
        preferences: organization.settings
      }
    }, 'Settings updated successfully');

  } catch (error) {
    console.error('Update settings error:', error);
    res.error(error.message, 'Failed to update settings', 500);
  }
});

module.exports = router;


