const express = require('express');
const { authMiddleware: auth } = require('../../middleware/auth');
const { query, validationResult } = require('express-validator');
const Attendance = require('../../models/Attendance');
const Subject = require('../../models/Subject');
const Batch = require('../../models/Batch');
const Program = require('../../models/AcademicProgram');
const User = require('../../models/User');

const router = express.Router();

/**
 * GET /api/college/admin/attendance/dashboard
 * Get attendance dashboard summary for org admin
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;

    if (!['org_admin', 'organization_admin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can access this endpoint'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's attendance count
    const todayAttendance = await Attendance.countDocuments({
      organization_id,
      session_date: { $gte: startOfDay, $lte: endOfDay },
      is_active: true
    });

    // Get monthly attendance stats
    const monthlyAttendance = await Attendance.find({
      organization_id,
      session_date: { $gte: startOfMonth },
      is_active: true
    });

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalStudentsMarked = 0;

    monthlyAttendance.forEach(record => {
      record.attendance_records.forEach(r => {
        totalStudentsMarked++;
        if (r.status === 'present') totalPresent++;
        if (r.status === 'absent') totalAbsent++;
        if (r.status === 'late') totalLate++;
      });
    });

    const monthlyPercentage = totalStudentsMarked > 0
      ? Math.round(((totalPresent + totalLate) / totalStudentsMarked) * 100)
      : 0;

    // Get active batches count
    const activeBatches = await Batch.countDocuments({
      organizationId: organization_id,
      isActive: true
    });

    // Get active subjects count
    const activeSubjects = await Subject.countDocuments({
      organizationId: organization_id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        today_sessions: todayAttendance,
        monthly_stats: {
          total_sessions: monthlyAttendance.length,
          total_students_marked: totalStudentsMarked,
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          percentage: monthlyPercentage
        },
        active_batches: activeBatches,
        active_subjects: activeSubjects
      },
      message: 'Dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('Get attendance dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

/**
 * GET /api/college/admin/attendance/records
 * Get all attendance records with filters
 */
router.get('/records', [
  auth,
  query('batchId').optional().isMongoId(),
  query('subjectId').optional().isMongoId(),
  query('programId').optional().isMongoId(),
  query('instructorId').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
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

    const { organization_id, role } = req.user;

    if (!['org_admin', 'organization_admin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can access this endpoint'
      });
    }

    const {
      batchId,
      subjectId,
      programId,
      instructorId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {
      organization_id,
      is_active: true
    };

    if (batchId) query.batchId = batchId;
    if (subjectId) query.subjectId = subjectId;
    if (programId) query.programId = programId;
    if (instructorId) query.instructor_id = instructorId;

    if (startDate || endDate) {
      query.session_date = {};
      if (startDate) query.session_date.$gte = new Date(startDate);
      if (endDate) query.session_date.$lte = new Date(endDate);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code')
      .populate('programId', 'name')
      .populate('instructor_id', 'full_name email')
      .populate('attendance_records.student_id', 'full_name email roll_number')
      .sort({ session_date: -1, start_time: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    // Format records
    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      date: record.session_date,
      startTime: record.start_time,
      endTime: record.end_time,
      subject: record.subjectId,
      batch: record.batchId,
      program: record.programId,
      instructor: record.instructor_id,
      totalStudents: record.attendance_records.length,
      present: record.attendance_records.filter(r => r.status === 'present').length,
      absent: record.attendance_records.filter(r => r.status === 'absent').length,
      late: record.attendance_records.filter(r => r.status === 'late').length,
      excused: record.attendance_records.filter(r => r.status === 'excused').length,
      topicCovered: record.topic_covered,
      sessionTitle: record.session_title
    }));

    res.json({
      success: true,
      data: {
        records: formattedRecords,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Attendance records retrieved successfully'
    });

  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records'
    });
  }
});

/**
 * GET /api/college/admin/attendance/student-report/:studentId
 * Get detailed attendance report for a specific student
 */
router.get('/student-report/:studentId', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    const { studentId } = req.params;

    if (!['org_admin', 'organization_admin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can access this endpoint'
      });
    }

    // Get student info
    const student = await User.findOne({
      _id: studentId,
      organization_id,
      role: 'student'
    }).select('full_name email roll_number');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      organization_id,
      'attendance_records.student_id': studentId,
      is_active: true
    })
      .populate('subjectId', 'name code credits')
      .populate('batchId', 'name code')
      .populate('programId', 'name')
      .populate('instructor_id', 'full_name')
      .sort({ session_date: -1 });

    // Process records
    const processedRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendance_records.find(
        r => r.student_id.toString() === studentId.toString()
      );

      return {
        _id: record._id,
        date: record.session_date,
        subject: record.subjectId,
        batch: record.batchId,
        program: record.programId,
        status: studentRecord?.status || 'unknown',
        lateMinutes: studentRecord?.late_minutes || 0,
        notes: studentRecord?.notes || ''
      };
    });

    // Summary by subject
    const subjectSummary = {};
    processedRecords.forEach(record => {
      if (!record.subject) return;

      const subjectId = record.subject._id.toString();
      if (!subjectSummary[subjectId]) {
        subjectSummary[subjectId] = {
          subject: record.subject,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0
        };
      }

      subjectSummary[subjectId].total++;
      subjectSummary[subjectId][record.status]++;
    });

    // Calculate percentages
    Object.values(subjectSummary).forEach(summary => {
      if (summary.total > 0) {
        summary.percentage = Math.round(
          ((summary.present + summary.late) / summary.total) * 100
        );
      }
    });

    // Overall summary
    const totalClasses = processedRecords.length;
    const overallSummary = {
      totalClasses,
      present: processedRecords.filter(r => r.status === 'present').length,
      absent: processedRecords.filter(r => r.status === 'absent').length,
      late: processedRecords.filter(r => r.status === 'late').length,
      excused: processedRecords.filter(r => r.status === 'excused').length,
      overallPercentage: totalClasses > 0
        ? Math.round(((processedRecords.filter(r => r.status === 'present').length +
                       processedRecords.filter(r => r.status === 'late').length) / totalClasses) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        student,
        records: processedRecords,
        subject_summary: Object.values(subjectSummary),
        overall_summary: overallSummary
      },
      message: 'Student attendance report retrieved successfully'
    });

  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student report'
    });
  }
});

/**
 * GET /api/college/admin/attendance/batch-summary/:batchId
 * Get attendance summary for a specific batch
 */
router.get('/batch-summary/:batchId', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    const { batchId } = req.params;

    if (!['org_admin', 'organization_admin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can access this endpoint'
      });
    }

    // Get batch info
    const batch = await Batch.findOne({
      _id: batchId,
      organizationId: organization_id
    }).populate('students', 'full_name email roll_number');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get all attendance for this batch
    const attendanceRecords = await Attendance.find({
      organization_id,
      batchId,
      is_active: true
    })
      .populate('subjectId', 'name code')
      .sort({ session_date: -1 });

    // Calculate student-wise attendance
    const studentAttendance = {};
    batch.students.forEach(student => {
      studentAttendance[student._id.toString()] = {
        student,
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0
      };
    });

    attendanceRecords.forEach(record => {
      record.attendance_records.forEach(r => {
        const studentId = r.student_id.toString();
        if (studentAttendance[studentId]) {
          studentAttendance[studentId].totalClasses++;
          studentAttendance[studentId][r.status]++;
        }
      });
    });

    // Calculate percentages
    Object.values(studentAttendance).forEach(summary => {
      if (summary.totalClasses > 0) {
        summary.percentage = Math.round(
          ((summary.present + summary.late) / summary.totalClasses) * 100
        );
      }
    });

    // Subject-wise summary
    const subjectSummary = {};
    attendanceRecords.forEach(record => {
      if (!record.subjectId) return;

      const subjectId = record.subjectId._id.toString();
      if (!subjectSummary[subjectId]) {
        subjectSummary[subjectId] = {
          subject: record.subjectId,
          totalClasses: 0,
          totalStudents: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }

      subjectSummary[subjectId].totalClasses++;
      const presentCount = record.attendance_records.filter(r => r.status === 'present').length;
      const absentCount = record.attendance_records.filter(r => r.status === 'absent').length;
      const lateCount = record.attendance_records.filter(r => r.status === 'late').length;

      subjectSummary[subjectId].totalStudents += record.attendance_records.length;
      subjectSummary[subjectId].present += presentCount;
      subjectSummary[subjectId].absent += absentCount;
      subjectSummary[subjectId].late += lateCount;
    });

    res.json({
      success: true,
      data: {
        batch: {
          _id: batch._id,
          name: batch.name,
          code: batch.code
        },
        total_sessions: attendanceRecords.length,
        student_attendance: Object.values(studentAttendance),
        subject_summary: Object.values(subjectSummary)
      },
      message: 'Batch attendance summary retrieved successfully'
    });

  } catch (error) {
    console.error('Get batch summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batch summary'
    });
  }
});

module.exports = router;
