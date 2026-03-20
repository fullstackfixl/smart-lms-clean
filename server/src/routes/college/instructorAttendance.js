const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const { authMiddleware: auth } = require('../../middleware/auth');
const Attendance = require('../../models/Attendance');
const Subject = require('../../models/Subject');
const Batch = require('../../models/Batch');
const User = require('../../models/User');
const InstructorAssignment = require('../../models/InstructorAssignment');
const Timetable = require('../../models/Timetable');
const notificationService = require('../../utils/notificationService');

const router = express.Router();

/**
 * GET /api/college/instructor/assigned-sessions
 * Get instructor's assigned sessions from timetable for today
 */
router.get('/assigned-sessions', auth, async (req, res) => {
  try {
    const { organization_id, _id: instructorId, role } = req.user;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can view assigned sessions'
      });
    }

    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[today.getDay()];

    // Get today's timetable entries for this instructor
    const sessions = await Timetable.find({
      organizationId: organization_id,
      instructorId: instructorId,
      day: currentDay,
      isActive: true
    })
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code')
      .populate('programId', 'name')
      .sort({ startTime: 1 });

    // Check if attendance already marked for each session
    const sessionsWithStatus = await Promise.all(
      sessions.map(async (session) => {
        const attendance = await Attendance.findOne({
          organization_id,
          subjectId: session.subjectId._id,
          batchId: session.batchId._id,
          session_date: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        });

        return {
          _id: session._id,
          subject: session.subjectId,
          batch: session.batchId,
          program: session.programId,
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime,
          room: session.room,
          meetingLink: session.meetingLink,
          attendanceMarked: !!attendance,
          attendanceId: attendance?._id || null
        };
      })
    );

    res.json({
      success: true,
      data: sessionsWithStatus,
      message: 'Assigned sessions retrieved successfully'
    });

  } catch (error) {
    console.error('Get assigned sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assigned sessions'
    });
  }
});

/**
 * GET /api/college/instructor/students-for-attendance/:subjectId/:batchId
 * Get students for attendance marking (enrolled in batch + subject)
 */
router.get('/students-for-attendance/:subjectId/:batchId', auth, async (req, res) => {
  try {
    const { organization_id, _id: instructorId, role } = req.user;
    const { subjectId, batchId } = req.params;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can view students for attendance'
      });
    }

    // Verify instructor is assigned to this subject + batch
    const assignment = await InstructorAssignment.findOne({
      organizationId: organization_id,
      instructorId: instructorId,
      subjectId: subjectId,
      batchId: batchId,
      isActive: true
    });

    if (!assignment && role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this subject and batch'
      });
    }

    // Get batch with populated students
    const batch = await Batch.findById(batchId)
      .populate('students', 'full_name email roll_number');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId).select('name code');

    res.json({
      success: true,
      data: {
        subject,
        batch: {
          _id: batch._id,
          name: batch.name,
          code: batch.code
        },
        students: batch.students || []
      },
      message: 'Students retrieved successfully'
    });

  } catch (error) {
    console.error('Get students for attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students'
    });
  }
});

/**
 * POST /api/college/instructor/mark-attendance
 * Mark attendance for a subject + batch + date
 */
router.post('/mark-attendance', [
  auth,
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('batchId').isMongoId().withMessage('Valid batch ID is required'),
  body('session_date').isISO8601().withMessage('Valid session date is required'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
  body('attendance_records').isArray({ min: 1 }).withMessage('Attendance records are required'),
  body('attendance_records.*.student_id').isMongoId().withMessage('Valid student ID required'),
  body('attendance_records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { organization_id, _id: instructorId, role } = req.user;
    const {
      subjectId,
      batchId,
      programId,
      session_date,
      start_time,
      end_time,
      session_title,
      topic_covered,
      attendance_records
    } = req.body;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can mark attendance'
      });
    }

    // Verify instructor assignment (unless org_admin)
    if (role !== 'org_admin') {
      const assignment = await InstructorAssignment.findOne({
        organizationId: organization_id,
        instructorId: instructorId,
        subjectId: subjectId,
        batchId: batchId,
        isActive: true
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this subject and batch'
        });
      }
    }

    // Get subject and batch details
    const [subject, batch] = await Promise.all([
      Subject.findById(subjectId).select('name code programId'),
      Batch.findById(batchId).select('name code programId')
    ]);

    if (!subject || !batch) {
      return res.status(404).json({
        success: false,
        message: 'Subject or batch not found'
      });
    }

    // Check if attendance already exists for this session
    const existingAttendance = await Attendance.findOne({
      organization_id,
      subjectId,
      batchId,
      session_date: new Date(session_date),
      start_time
    });

    let attendance;
    const sessionDateTime = new Date(session_date);

    if (existingAttendance) {
      // Update existing attendance
      attendance = existingAttendance;
      attendance.attendance_records = attendance_records.map(record => ({
        student_id: record.student_id,
        status: record.status,
        notes: record.notes || '',
        late_minutes: record.status === 'late' ? (record.late_minutes || 0) : 0,
        marked_by: instructorId,
        marked_at: new Date()
      }));

      if (topic_covered) attendance.topic_covered = topic_covered;
      if (session_title) attendance.session_title = session_title;

      await attendance.save();
    } else {
      // Calculate duration
      const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
      const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);

      // Create new attendance record
      attendance = new Attendance({
        organization_id,
        organizationType: 'college',
        subjectId,
        batchId,
        programId: programId || subject.programId,
        instructor_id: instructorId,
        session_date: sessionDateTime,
        session_type: 'regular_class',
        session_title: session_title || `${subject.name} - ${batch.name}`,
        start_time,
        end_time,
        total_duration_minutes: endMinutes - startMinutes,
        topic_covered,
        attendance_records: attendance_records.map(record => ({
          student_id: record.student_id,
          status: record.status,
          notes: record.notes || '',
          late_minutes: record.status === 'late' ? (record.late_minutes || 0) : 0,
          marked_by: instructorId,
          marked_at: new Date()
        }))
      });

      await attendance.save();
    }

    // Populate for response
    await attendance.populate([
      { path: 'subjectId', select: 'name code' },
      { path: 'batchId', select: 'name code' },
      { path: 'attendance_records.student_id', select: 'full_name email roll_number' }
    ]);

    // Send notifications for absent students
    try {
      for (const record of attendance_records.filter(r => r.status === 'absent')) {
        const student = await User.findById(record.student_id).select('full_name parent_id');
        if (student) {
          // Notify student
          await notificationService.createNotification({
            organization_id,
            recipient_id: record.student_id,
            type: 'general',
            title: 'Attendance Marked: Absent',
            message: `You were marked absent for ${subject.name} on ${new Date(session_date).toLocaleDateString()}.`,
            data: { subjectId, batchId, session_date },
            priority: 'medium'
          });

          // Notify parent if linked
          if (student.parent_id) {
            await notificationService.createNotification({
              organization_id,
              recipient_id: student.parent_id,
              type: 'general',
              title: 'Student Absence Alert',
              message: `${student.full_name} was marked absent for ${subject.name} on ${new Date(session_date).toLocaleDateString()}.`,
              data: { student_id: record.student_id, subjectId, batchId },
              priority: 'medium'
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: attendance,
      message: existingAttendance ? 'Attendance updated successfully' : 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

/**
 * GET /api/college/instructor/attendance-history
 * Get instructor's attendance history
 */
router.get('/attendance-history', [
  auth,
  query('subjectId').optional().isMongoId(),
  query('batchId').optional().isMongoId(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { organization_id, _id: instructorId, role } = req.user;
    const { subjectId, batchId, start_date, end_date, page = 1, limit = 20 } = req.query;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can view attendance history'
      });
    }

    // Build query
    const query = {
      organization_id,
      instructor_id: instructorId,
      is_active: true
    };

    if (subjectId) query.subjectId = subjectId;
    if (batchId) query.batchId = batchId;

    if (start_date || end_date) {
      query.session_date = {};
      if (start_date) query.session_date.$gte = new Date(start_date);
      if (end_date) query.session_date.$lte = new Date(end_date);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code')
      .populate('attendance_records.student_id', 'full_name email roll_number')
      .sort({ session_date: -1, start_time: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    // Calculate summary
    const summary = {
      total_sessions: total,
      total_students_marked: attendanceRecords.reduce((sum, record) => sum + record.attendance_records.length, 0),
      average_attendance: 0
    };

    if (summary.total_students_marked > 0) {
      const presentCount = attendanceRecords.reduce((sum, record) =>
        sum + record.attendance_records.filter(r => r.status === 'present').length, 0);
      summary.average_attendance = Math.round((presentCount / summary.total_students_marked) * 100);
    }

    res.json({
      success: true,
      data: {
        records: attendanceRecords,
        summary,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Attendance history retrieved successfully'
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance history'
    });
  }
});

module.exports = router;
