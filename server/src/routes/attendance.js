const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const moduleGuard = require('../middleware/moduleGuard');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const MeetingAttendance = require('../models/MeetingAttendance');
const LiveClass = require('../models/LiveClass');
const notificationService = require('../utils/notificationService');

const router = express.Router();

// All attendance routes require ATTENDANCE module to be enabled
router.use(auth, moduleGuard('ATTENDANCE'));

/**
 * POST /api/attendance/mark
 * Mark attendance for a class session
 */
router.post('/mark', [
  auth,
  body('course_id').isMongoId().withMessage('Valid course ID is required'),
  body('session_date').isISO8601().withMessage('Valid session date is required'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
  body('session_type').optional().isIn(['regular_class', 'live_class', 'lab_session', 'exam', 'tutorial', 'seminar', 'other']),
  body('session_title').optional().trim().isLength({ max: 200 }).withMessage('Session title max 200 characters'),
  body('attendance_records').isArray({ min: 1 }).withMessage('Attendance records are required'),
  body('attendance_records.*.student_id').isMongoId().withMessage('Valid student ID required'),
  body('attendance_records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid attendance status required'),
  body('attendance_records.*.notes').optional().trim().isLength({ max: 500 }).withMessage('Notes max 500 characters'),
  body('attendance_records.*.late_minutes').optional().isInt({ min: 0 }).withMessage('Late minutes must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can mark attendance
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can mark attendance'
      });
    }

    const {
      course_id,
      session_date,
      start_time,
      end_time,
      session_type = 'regular_class',
      session_title,
      attendance_records,
      location,
      topic_covered,
      homework_assigned,
      live_class_id
    } = req.body;

    // Verify course exists and belongs to organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check if instructor is assigned to this course (unless org_admin)
    if (role === 'instructor' && course.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only mark attendance for your assigned courses'
      });
    }

    // Check if attendance already exists for this session
    const existingAttendance = await Attendance.findOne({
      course_id: course_id,
      session_date: new Date(session_date),
      start_time: start_time,
      organization_id: organization_id
    });

    let attendance;
    const sessionDateTime = new Date(session_date);
    const now = new Date();
    const isLateMarking = sessionDateTime < now;

    if (existingAttendance) {
      // Update existing attendance
      attendance = existingAttendance;

      // Update session details
      attendance.end_time = end_time;
      attendance.session_type = session_type;
      attendance.session_title = session_title;
      attendance.location = location;
      attendance.topic_covered = topic_covered;
      attendance.homework_assigned = homework_assigned;

      if (isLateMarking && !attendance.late_marking_reason) {
        attendance.late_marking_reason = req.body.late_marking_reason || 'Marked after session end time';
      }

      // Update attendance records
      await attendance.bulkMarkAttendance(attendance_records, userId);
    } else {
      // Create new attendance record
      const startMinutes = attendance.timeToMinutes ? attendance.timeToMinutes(start_time) :
        parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
      const endMinutes = attendance.timeToMinutes ? attendance.timeToMinutes(end_time) :
        parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);

      attendance = new Attendance({
        organization_id,
        course_id,
        instructor_id: userId,
        session_date: sessionDateTime,
        session_type,
        session_title,
        start_time,
        end_time,
        total_duration_minutes: endMinutes - startMinutes,
        location,
        topic_covered,
        homework_assigned,
        live_class_id,
        late_marking_reason: isLateMarking ? (req.body.late_marking_reason || 'Marked after session end time') : null
      });

      // Add attendance records
      attendance_records.forEach(record => {
        attendance.attendance_records.push({
          student_id: record.student_id,
          status: record.status,
          notes: record.notes || '',
          late_minutes: record.status === 'late' ? (record.late_minutes || 0) : 0,
          marked_by: userId,
          auto_marked: false
        });
      });

      await attendance.save();
    }

    // Populate for response
    await attendance.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name' },
      { path: 'attendance_records.student_id', select: 'full_name email' }
    ]);

    // Check for low attendance and send notifications
    try {
      const lowAttendanceThreshold = 75; // Can be configurable

      for (const record of attendance_records) {
        if (record.status === 'absent') {
          const attendanceSummary = await Attendance.getStudentAttendanceSummary(
            record.student_id,
            organization_id,
            { course_id: course_id }
          );

          if (attendanceSummary.attendance_percentage < lowAttendanceThreshold) {
            // Send low attendance notification
            const student = await User.findById(record.student_id).select('full_name parent_id');

            // Notify student
            await notificationService.createNotification({
              organization_id: organization_id,
              recipient_id: record.student_id,
              type: 'general',
              title: 'Low Attendance Alert',
              message: `Your attendance in "${course.title}" has dropped to ${attendanceSummary.attendance_percentage}%. Please attend classes regularly.`,
              data: {
                course_id: course_id,
                attendance_percentage: attendanceSummary.attendance_percentage
              },
              priority: 'medium'
            });

            // Notify parent if linked
            if (student.parent_id) {
              await notificationService.createNotification({
                organization_id: organization_id,
                recipient_id: student.parent_id,
                type: 'general',
                title: 'Student Low Attendance Alert',
                message: `${student.full_name}'s attendance in "${course.title}" has dropped to ${attendanceSummary.attendance_percentage}%.`,
                data: {
                  student_id: record.student_id,
                  student_name: student.full_name,
                  course_id: course_id,
                  attendance_percentage: attendanceSummary.attendance_percentage
                },
                priority: 'medium'
              });
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to send attendance notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark attendance'
    });
  }
});

/**
 * GET /api/attendance/course/:course_id
 * Get attendance records for a course
 */
router.get('/course/:course_id', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('start_date').optional().isISO8601().withMessage('Valid start date required'),
  query('end_date').optional().isISO8601().withMessage('Valid end date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { course_id } = req.params;
    const { organization_id, role, _id: userId } = req.user;
    const { page = 1, limit = 20, start_date, end_date } = req.query;

    // Verify course access
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check permissions
    if (role === 'instructor' && course.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view attendance for your assigned courses'
      });
    }

    if (role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Students cannot view course attendance records'
      });
    }

    // Build filters
    const filters = { course_id: course_id };
    if (start_date) {
      filters.session_date = { $gte: new Date(start_date) };
    }
    if (end_date) {
      filters.session_date = filters.session_date || {};
      filters.session_date.$lte = new Date(end_date);
    }

    // Get attendance records with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const attendanceRecords = await Attendance.findByOrganization(organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const totalRecords = await Attendance.countDocuments({
      organization_id: organization_id,
      is_active: true,
      ...filters
    });

    // Get course attendance statistics
    const dateRange = {};
    if (start_date) dateRange.start = new Date(start_date);
    if (end_date) dateRange.end = new Date(end_date);

    const courseStats = await Attendance.getCourseAttendanceStats(course_id, organization_id, dateRange);

    res.json({
      success: true,
      data: {
        attendance_records: attendanceRecords,
        course_statistics: courseStats,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / parseInt(limit)),
          total_items: totalRecords,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Course attendance retrieved successfully'
    });

  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve course attendance'
    });
  }
});

/**
 * GET /api/attendance/student/:student_id
 * Get attendance summary for a student
 */
router.get('/student/:student_id', [
  auth,
  query('course_id').optional().isMongoId().withMessage('Valid course ID required'),
  query('start_date').optional().isISO8601().withMessage('Valid start date required'),
  query('end_date').optional().isISO8601().withMessage('Valid end date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { student_id } = req.params;
    const { organization_id, role, _id: userId } = req.user;
    const { course_id, start_date, end_date } = req.query;

    // Check access permissions
    if (role === 'student' && student_id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own attendance'
      });
    }

    if (role === 'parent') {
      const isLinkedStudent = await User.findOne({
        _id: student_id,
        parent_id: userId,
        organization_id: organization_id
      });

      if (!isLinkedStudent) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view attendance for your linked students'
        });
      }
    }

    // Verify student exists
    const student = await User.findOne({
      _id: student_id,
      organization_id: organization_id,
      role: 'student',
      is_active: true
    }).select('full_name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'Student not found in your organization'
      });
    }

    // Build filters
    const filters = {};
    if (course_id) filters.course_id = course_id;
    if (start_date) {
      filters.session_date = { $gte: new Date(start_date) };
    }
    if (end_date) {
      filters.session_date = filters.session_date || {};
      filters.session_date.$lte = new Date(end_date);
    }

    // Get attendance summary
    const attendanceSummary = await Attendance.getStudentAttendanceSummary(
      student_id,
      organization_id,
      filters
    );

    // Get detailed attendance records
    const detailedRecords = await Attendance.find({
      organization_id: organization_id,
      'attendance_records.student_id': student_id,
      is_active: true,
      ...filters
    })
      .populate('course_id', 'title')
      .sort({ session_date: -1 })
      .limit(50); // Limit to recent 50 records

    // Extract student's attendance from each session
    const studentAttendanceRecords = detailedRecords.map(session => {
      const studentRecord = session.attendance_records.find(
        record => record.student_id.toString() === student_id.toString()
      );

      return {
        session_id: session._id,
        course: session.course_id,
        session_date: session.session_date,
        session_title: session.session_title,
        session_type: session.session_type,
        start_time: session.start_time,
        end_time: session.end_time,
        status: studentRecord?.status,
        late_minutes: studentRecord?.late_minutes || 0,
        notes: studentRecord?.notes,
        marked_at: studentRecord?.marked_at
      };
    });

    res.json({
      success: true,
      data: {
        student: student,
        attendance_summary: attendanceSummary,
        recent_attendance: studentAttendanceRecords
      },
      message: 'Student attendance retrieved successfully'
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve student attendance'
    });
  }
});

/**
 * PUT /api/attendance/:id
 * Update attendance record
 */
router.put('/:id', [
  auth,
  body('attendance_records').optional().isArray().withMessage('Attendance records must be array'),
  body('session_title').optional().trim().isLength({ max: 200 }).withMessage('Session title max 200 characters'),
  body('topic_covered').optional().trim().isLength({ max: 1000 }).withMessage('Topic covered max 1000 characters'),
  body('homework_assigned').optional().trim().isLength({ max: 1000 }).withMessage('Homework max 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    // Only instructors and org_admin can update attendance
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can update attendance'
      });
    }

    const attendance = await Attendance.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        message: 'Attendance record not found'
      });
    }

    // Check if instructor owns this attendance record
    if (role === 'instructor' && attendance.instructor_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own attendance records'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['session_title', 'topic_covered', 'homework_assigned', 'attendance_records'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'attendance_records') {
          // Update attendance records
          attendance.bulkMarkAttendance(req.body[field], userId);
        } else {
          attendance[field] = req.body[field];
        }
      }
    });

    await attendance.save();

    await attendance.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name' },
      { path: 'attendance_records.student_id', select: 'full_name email' }
    ]);

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update attendance'
    });
  }
});

/**
 * GET /api/attendance/reports/summary
 * Get attendance summary report
 */
router.get('/reports/summary', [
  auth,
  query('course_id').optional().isMongoId().withMessage('Valid course ID required'),
  query('start_date').optional().isISO8601().withMessage('Valid start date required'),
  query('end_date').optional().isISO8601().withMessage('Valid end date required'),
  query('threshold').optional().isFloat({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { organization_id, role } = req.user;
    const { course_id, start_date, end_date, threshold = 75 } = req.query;

    // Only instructors and org_admin can view reports
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can view reports'
      });
    }

    // Build date range filter
    const dateRange = {};
    if (start_date) dateRange.start = new Date(start_date);
    if (end_date) dateRange.end = new Date(end_date);

    // Get low attendance students
    const lowAttendanceStudents = await Attendance.findLowAttendanceStudents(
      organization_id,
      parseFloat(threshold),
      dateRange
    );

    // Filter by course if specified
    let filteredStudents = lowAttendanceStudents;
    if (course_id) {
      filteredStudents = lowAttendanceStudents.filter(
        student => student.course_id.toString() === course_id
      );
    }

    // Get overall statistics
    const overallStats = {
      total_students_below_threshold: filteredStudents.length,
      average_attendance_of_low_performers: filteredStudents.length > 0 ?
        Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance_percentage, 0) / filteredStudents.length) : 0,
      courses_affected: [...new Set(filteredStudents.map(s => s.course_id.toString()))].length
    };

    res.json({
      success: true,
      data: {
        threshold_used: parseFloat(threshold),
        overall_statistics: overallStats,
        low_attendance_students: filteredStudents,
        date_range: dateRange
      },
      message: 'Attendance summary report generated successfully'
    });

  } catch (error) {
    console.error('Attendance summary report error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate attendance summary report'
    });
  }
});

/**
 * POST /api/attendance/auto-mark-from-live-class
 * Auto-mark attendance from live class participation
 */
router.post('/auto-mark-from-live-class', [
  auth,
  body('live_class_id').isMongoId().withMessage('Valid live class ID required'),
  body('course_id').isMongoId().withMessage('Valid course ID required'),
  body('session_date').isISO8601().withMessage('Valid session date required'),
  body('session_title').optional().trim().isLength({ max: 200 }).withMessage('Session title max 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;
    const { live_class_id, course_id, session_date, session_title } = req.body;

    // Only instructors and org_admin can auto-mark attendance
    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and administrators can auto-mark attendance'
      });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      course_id: course_id,
      session_date: new Date(session_date),
      live_class_id: live_class_id,
      organization_id: organization_id
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked',
        message: 'Attendance has already been auto-marked for this live class'
      });
    }

    // Get live class details
    const LiveClass = require('../models/LiveClass');
    const liveClass = await LiveClass.findOne({
      _id: live_class_id,
      organization_id: organization_id,
      course_id: course_id
    });

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'Live class not found',
        message: 'Live class not found'
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      organization_id,
      course_id,
      instructor_id: userId,
      session_date: new Date(session_date),
      session_type: 'live_class',
      session_title: session_title || liveClass.title,
      start_time: liveClass.start_time,
      end_time: liveClass.end_time || liveClass.start_time, // Fallback if end_time not available
      total_duration_minutes: liveClass.duration_minutes,
      live_class_id: live_class_id,
      auto_marked: true
    });

    // Auto-mark from live class
    await attendance.autoMarkFromLiveClass(live_class_id);

    await attendance.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name' },
      { path: 'attendance_records.student_id', select: 'full_name email' }
    ]);

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance auto-marked from live class successfully'
    });

  } catch (error) {
    console.error('Auto-mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to auto-mark attendance from live class'
    });
  }
});


/**
 * POST /api/attendance/join
 * Track student join event
 */
router.post('/join', [
  auth,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('joinTime').isISO8601().withMessage('Valid join time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { studentId, classId, courseId, joinTime } = req.body;
    const { organization_id } = req.user;

    // Import models here to ensure they are available for these new routes
    const MeetingAttendance = require('../models/MeetingAttendance');
    const Enrollment = require('../models/Enrollment');

    // Security: ensure student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student_id: studentId,
      course_id: courseId,
      organization_id: organization_id,
      status: 'active'
    });

    if (!enrollment && req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Find or create attendance record
    let attendance = await MeetingAttendance.findOne({ studentId, classId });

    if (!attendance) {
      attendance = new MeetingAttendance({
        studentId,
        classId,
        courseId,
        organizationId: organization_id,
        joinTime: new Date(joinTime),
        date: new Date(),
        status: 'absent'
      });
    } else {
      // Keep earliest join time
      if (new Date(joinTime) < attendance.joinTime) {
        attendance.joinTime = new Date(joinTime);
      }
    }

    attendance.lastUpdate = new Date();
    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Join event recorded'
    });
  } catch (error) {
    console.error('Attendance join error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/attendance/leave
 * Track student leave event and calculate status
 */
router.post('/leave', [
  auth,
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('leaveTime').isISO8601().withMessage('Valid leave time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { studentId, classId, leaveTime } = req.body;
    const { organization_id } = req.user;

    // Security: Find record and ensure it belongs to the organization
    let attendance = await MeetingAttendance.findOne({
      studentId,
      classId,
      organizationId: organization_id
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found. Participant must join before leaving.'
      });
    }

    // Update leave time (keep latest)
    const newLeaveTime = new Date(leaveTime);
    if (!attendance.leaveTime || newLeaveTime > attendance.leaveTime) {
      attendance.leaveTime = newLeaveTime;
    }

    // Calculate duration
    const duration = Math.round((attendance.leaveTime - attendance.joinTime) / (1000 * 60));
    attendance.duration = duration;

    // Calculate status based on 60% rule
    const liveClass = await LiveClass.findById(classId);
    if (liveClass) {
      const classDuration = liveClass.duration_minutes || 60; // Default if not set
      if (duration >= (0.6 * classDuration)) {
        attendance.status = 'present';
      } else {
        attendance.status = 'absent';
      }
    }

    attendance.lastUpdate = new Date();
    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Leave event recorded and attendance calculated'
    });
  } catch (error) {
    console.error('Attendance leave error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/attendance/class/:classId
 * Get attendance for a specific class (Instructors only)
 */
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    // Import models here to ensure they are available for these new routes
    const MeetingAttendance = require('../models/MeetingAttendance');
    const LiveClass = require('../models/LiveClass');

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Security: Check organization isolation
    if (liveClass.organization_id.toString() !== organization_id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const attendance = await MeetingAttendance.find({
      classId,
      organizationId: organization_id
    })
      .populate('studentId', 'full_name email avatar')
      .sort({ studentId: 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/attendance/student/course/:courseId
 * Course-wise attendance for students
 */
router.get('/student/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    const { organization_id } = req.user;

    // Import models here to ensure they are available for these new routes
    const MeetingAttendance = require('../models/MeetingAttendance');
    const LiveClass = require('../models/LiveClass');

    const attendanceRecords = await MeetingAttendance.find({
      studentId,
      courseId,
      organizationId: organization_id
    }).populate('classId', 'title scheduled_date start_time');

    const totalClasses = await LiveClass.countDocuments({
      course_id: courseId,
      status: 'completed'
    });

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    res.json({
      success: true,
      data: {
        records: attendanceRecords,
        summary: {
          totalClasses,
          presentCount,
          attendancePercentage
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/attendance/:id/override
 * Manual override for instructors
 */
router.patch('/:id/override', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, organization_id } = req.user;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const attendance = await MeetingAttendance.findOne({
      _id: id,
      organizationId: organization_id
    });
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    attendance.status = status;
    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance status overridden successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;