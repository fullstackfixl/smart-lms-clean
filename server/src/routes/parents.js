const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Fee = require('../models/Fee');
const Event = require('../models/Event');
const Course = require('../models/Course');

// Parent access control middleware
const parentAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only parents can access this resource'
      });
    }

    // Get student ID from params or query
    const studentId = req.params.student_id || req.query.student_id;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID required',
        message: 'Please provide a student ID'
      });
    }

    // Verify parent-student relationship
    const student = await User.findOne({
      _id: studentId,
      organization_id: req.user.organization_id,
      parent_id: req.user._id,
      role: 'student'
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access data for your linked students'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error verifying parent access'
    });
  }
};

// Get parent dashboard overview
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only parents can access this resource'
      });
    }

    // Get all linked students
    const students = await User.find({
      parent_id: req.user._id,
      organization_id: req.user.organization_id,
      role: 'student',
      is_active: true
    }).select('full_name email profile_picture');

    const dashboardData = {
      students: [],
      summary: {
        total_students: students.length,
        total_courses: 0,
        pending_fees: 0,
        upcoming_events: 0
      }
    };

    // Get data for each student
    for (const student of students) {
      // Get enrollments
      const enrollments = await Enrollment.find({
        student_id: student._id,
        organization_id: req.user.organization_id,
        status: 'active'
      }).populate('course_id', 'title');

      // Get pending fees
      const pendingFees = await Fee.find({
        student_id: student._id,
        organization_id: req.user.organization_id,
        status: 'pending'
      });

      // Get recent attendance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentAttendance = await Attendance.find({
        student_id: student._id,
        organization_id: req.user.organization_id,
        date: { $gte: sevenDaysAgo }
      });

      const attendanceRate = recentAttendance.length > 0 ? 
        (recentAttendance.filter(a => a.status === 'present').length / recentAttendance.length) * 100 : 0;

      // Get recent grades
      const recentGrades = await Grade.find({
        student_id: student._id,
        organization_id: req.user.organization_id
      }).sort({ created_at: -1 }).limit(5)
        .populate('course_id', 'title');

      const studentData = {
        student_id: student._id,
        name: student.full_name,
        email: student.email,
        profile_picture: student.profile_picture,
        courses: enrollments.map(e => ({
          id: e.course_id._id,
          title: e.course_id.title,
          enrolled_at: e.enrolled_at
        })),
        attendance_rate: Math.round(attendanceRate),
        pending_fees: pendingFees.reduce((sum, fee) => sum + fee.amount, 0),
        recent_grades: recentGrades.map(g => ({
          course: g.course_id.title,
          assignment: g.assignment_name,
          score: g.score,
          max_score: g.max_score,
          percentage: Math.round((g.score / g.max_score) * 100),
          date: g.created_at
        }))
      };

      dashboardData.students.push(studentData);
      dashboardData.summary.total_courses += enrollments.length;
      dashboardData.summary.pending_fees += studentData.pending_fees;
    }

    // Get upcoming events
    const upcomingEvents = await Event.find({
      organization_id: req.user.organization_id,
      event_date: { $gte: new Date() },
      status: 'scheduled',
      $or: [
        { target_audience: 'all' },
        { target_audience: 'parents' },
        { target_audience: 'students' }
      ]
    }).limit(5).sort({ event_date: 1 });

    dashboardData.summary.upcoming_events = upcomingEvents.length;
    dashboardData.upcoming_events = upcomingEvents.map(event => ({
      id: event._id,
      title: event.title,
      date: event.event_date,
      time: event.all_day ? 'All Day' : `${event.start_time} - ${event.end_time}`,
      location: event.location || event.virtual_link,
      type: event.event_type
    }));

    res.json({
      success: true,
      data: dashboardData,
      message: 'Parent dashboard data retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving parent dashboard data'
    });
  }
});

// Get detailed student progress
router.get('/student/:student_id/progress', auth, parentAccess, async (req, res) => {
  try {
    const studentId = req.student._id;

    // Get all enrollments with course details
    const enrollments = await Enrollment.find({
      student_id: studentId,
      organization_id: req.user.organization_id
    }).populate({
      path: 'course_id',
      select: 'title description total_lessons'
    });

    const progressData = {
      student: {
        id: req.student._id,
        name: req.student.full_name,
        email: req.student.email
      },
      courses: []
    };

    for (const enrollment of enrollments) {
      const course = enrollment.course_id;
      
      // Get attendance for this course (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendance = await Attendance.find({
        student_id: studentId,
        course_id: course._id,
        organization_id: req.user.organization_id,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });

      const attendanceRate = attendance.length > 0 ? 
        (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 0;

      // Get grades for this course
      const grades = await Grade.find({
        student_id: studentId,
        course_id: course._id,
        organization_id: req.user.organization_id
      }).sort({ created_at: -1 });

      const averageGrade = grades.length > 0 ? 
        grades.reduce((sum, grade) => sum + (grade.score / grade.max_score) * 100, 0) / grades.length : 0;

      // Get pending fees for this course
      const pendingFees = await Fee.find({
        student_id: studentId,
        course_id: course._id,
        organization_id: req.user.organization_id,
        status: 'pending'
      });

      const courseProgress = {
        course_id: course._id,
        course_title: course.title,
        enrollment_status: enrollment.status,
        enrolled_at: enrollment.enrolled_at,
        progress_percentage: enrollment.progress_percentage || 0,
        attendance: {
          rate: Math.round(attendanceRate),
          total_sessions: attendance.length,
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          late: attendance.filter(a => a.status === 'late').length,
          recent_attendance: attendance.slice(0, 10).map(a => ({
            date: a.date,
            status: a.status,
            session_type: a.session_type
          }))
        },
        grades: {
          average: Math.round(averageGrade),
          total_assignments: grades.length,
          recent_grades: grades.slice(0, 5).map(g => ({
            assignment: g.assignment_name,
            score: g.score,
            max_score: g.max_score,
            percentage: Math.round((g.score / g.max_score) * 100),
            date: g.created_at,
            feedback: g.feedback
          }))
        },
        fees: {
          pending_amount: pendingFees.reduce((sum, fee) => sum + fee.amount, 0),
          pending_count: pendingFees.length,
          pending_fees: pendingFees.map(f => ({
            id: f._id,
            description: f.description,
            amount: f.amount,
            due_date: f.due_date,
            fee_type: f.fee_type
          }))
        }
      };

      progressData.courses.push(courseProgress);
    }

    res.json({
      success: true,
      data: progressData,
      message: 'Student progress retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving student progress'
    });
  }
});

// Get student attendance details
router.get('/student/:student_id/attendance', auth, parentAccess, async (req, res) => {
  try {
    const { course_id, start_date, end_date, limit = 50, page = 1 } = req.query;
    const studentId = req.student._id;

    const query = {
      student_id: studentId,
      organization_id: req.user.organization_id
    };

    if (course_id) query.course_id = course_id;
    
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .populate('course_id', 'title')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Attendance.countDocuments(query);

    // Calculate statistics
    const stats = {
      total_sessions: totalRecords,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length
    };

    stats.attendance_rate = stats.total_sessions > 0 ? 
      Math.round((stats.present / stats.total_sessions) * 100) : 0;

    res.json({
      success: true,
      data: {
        student: {
          id: req.student._id,
          name: req.student.full_name
        },
        attendance: attendance.map(a => ({
          id: a._id,
          course: a.course_id.title,
          date: a.date,
          status: a.status,
          session_type: a.session_type,
          marked_at: a.marked_at,
          notes: a.notes
        })),
        statistics: stats,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Student attendance retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving student attendance'
    });
  }
});

// Get student grades details
router.get('/student/:student_id/grades', auth, parentAccess, async (req, res) => {
  try {
    const { course_id, assignment_type, limit = 50, page = 1 } = req.query;
    const studentId = req.student._id;

    const query = {
      student_id: studentId,
      organization_id: req.user.organization_id
    };

    if (course_id) query.course_id = course_id;
    if (assignment_type) query.assignment_type = assignment_type;

    const skip = (page - 1) * limit;
    
    const grades = await Grade.find(query)
      .populate('course_id', 'title')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Grade.countDocuments(query);

    // Calculate statistics by course
    const courseStats = {};
    for (const grade of grades) {
      const courseId = grade.course_id._id.toString();
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          course_title: grade.course_id.title,
          total_assignments: 0,
          total_score: 0,
          total_max_score: 0,
          grades: []
        };
      }
      
      courseStats[courseId].total_assignments++;
      courseStats[courseId].total_score += grade.score;
      courseStats[courseId].total_max_score += grade.max_score;
      courseStats[courseId].grades.push(grade);
    }

    // Calculate averages
    Object.keys(courseStats).forEach(courseId => {
      const stats = courseStats[courseId];
      stats.average_percentage = stats.total_max_score > 0 ? 
        Math.round((stats.total_score / stats.total_max_score) * 100) : 0;
    });

    res.json({
      success: true,
      data: {
        student: {
          id: req.student._id,
          name: req.student.full_name
        },
        grades: grades.map(g => ({
          id: g._id,
          course: g.course_id.title,
          assignment_name: g.assignment_name,
          assignment_type: g.assignment_type,
          score: g.score,
          max_score: g.max_score,
          percentage: Math.round((g.score / g.max_score) * 100),
          weight: g.weight,
          feedback: g.feedback,
          graded_at: g.created_at
        })),
        course_statistics: Object.values(courseStats),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Student grades retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving student grades'
    });
  }
});

// Get student fees details
router.get('/student/:student_id/fees', auth, parentAccess, async (req, res) => {
  try {
    const { status, fee_type, limit = 50, page = 1 } = req.query;
    const studentId = req.student._id;

    const query = {
      student_id: studentId,
      organization_id: req.user.organization_id
    };

    if (status) query.status = status;
    if (fee_type) query.fee_type = fee_type;

    const skip = (page - 1) * limit;
    
    const fees = await Fee.find(query)
      .populate('course_id', 'title')
      .sort({ due_date: 1, created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Fee.countDocuments(query);

    // Calculate statistics
    const stats = {
      total_fees: totalRecords,
      total_amount: 0,
      paid_amount: 0,
      pending_amount: 0,
      overdue_amount: 0,
      pending_count: 0,
      overdue_count: 0
    };

    const allFees = await Fee.find({
      student_id: studentId,
      organization_id: req.user.organization_id
    });

    allFees.forEach(fee => {
      stats.total_amount += fee.amount;
      if (fee.status === 'paid') {
        stats.paid_amount += fee.amount;
      } else if (fee.status === 'pending') {
        stats.pending_amount += fee.amount;
        stats.pending_count++;
        
        if (fee.due_date && new Date() > fee.due_date) {
          stats.overdue_amount += fee.amount;
          stats.overdue_count++;
        }
      }
    });

    res.json({
      success: true,
      data: {
        student: {
          id: req.student._id,
          name: req.student.full_name
        },
        fees: fees.map(f => ({
          id: f._id,
          description: f.description,
          amount: f.amount,
          fee_type: f.fee_type,
          status: f.status,
          due_date: f.due_date,
          paid_date: f.paid_date,
          course: f.course_id ? f.course_id.title : null,
          payment_method: f.payment_method,
          transaction_id: f.transaction_id,
          late_fee: f.late_fee,
          created_at: f.created_at
        })),
        statistics: stats,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Student fees retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving student fees'
    });
  }
});

// Get parent notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only parents can access this resource'
      });
    }

    const { limit = 20, page = 1, unread_only = false } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      organization_id: req.user.organization_id,
      $or: [
        { recipient_id: req.user._id },
        { recipient_type: 'parent' },
        { recipient_type: 'all' }
      ]
    };

    if (unread_only === 'true') {
      query.read = false;
    }

    const Notification = require('../models/Notification');
    
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          read: n.read,
          created_at: n.created_at,
          data: n.data
        })),
        unread_count: unreadCount,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Notifications retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving notifications'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:notification_id/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only parents can access this resource'
      });
    }

    const Notification = require('../models/Notification');
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notification_id,
        organization_id: req.user.organization_id,
        $or: [
          { recipient_id: req.user._id },
          { recipient_type: 'parent' },
          { recipient_type: 'all' }
        ]
      },
      { read: true, read_at: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        message: 'Notification not found or access denied'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating notification'
    });
  }
});

module.exports = router;

// Mark notification as read
router.patch('/notifications/:notification_id/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only parents can access this resource'
      });
    }

    const Notification = require('../models/Notification');
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notification_id,
        organization_id: req.user.organization_id,
        $or: [
          { recipient_id: req.user._id },
          { recipient_type: 'parent' },
          { recipient_type: 'all' }
        ]
      },
      { read: true, read_at: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        message: 'Notification not found or access denied'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating notification'
    });
  }
});

module.exports = router;