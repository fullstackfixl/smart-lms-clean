const express = require('express');
const { authMiddleware: auth } = require('../../middleware/auth');
const Attendance = require('../../models/Attendance');
const Subject = require('../../models/Subject');
const Batch = require('../../models/Batch');
const User = require('../../models/User');

const router = express.Router();

/**
 * GET /api/college/student/my-attendance
 * Get current student's attendance across all subjects
 */
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const { organization_id, _id: studentId, role } = req.user;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access this endpoint'
      });
    }

    // Get student's attendance records
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

    // Process attendance data
    const processedRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendance_records.find(
        r => r.student_id.toString() === studentId.toString()
      );

      return {
        _id: record._id,
        subject: record.subjectId,
        batch: record.batchId,
        program: record.programId,
        date: record.session_date,
        startTime: record.start_time,
        endTime: record.end_time,
        status: studentRecord?.status || 'unknown',
        lateMinutes: studentRecord?.late_minutes || 0,
        notes: studentRecord?.notes || '',
        markedBy: record.instructor_id,
        topicCovered: record.topic_covered,
        sessionTitle: record.session_title
      };
    });

    // Calculate summary by subject
    const subjectSummary = {};
    processedRecords.forEach(record => {
      if (!record.subject) return;

      const subjectId = record.subject._id.toString();
      if (!subjectSummary[subjectId]) {
        subjectSummary[subjectId] = {
          subject: record.subject,
          batch: record.batch,
          totalClasses: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0
        };
      }

      subjectSummary[subjectId].totalClasses++;
      subjectSummary[subjectId][record.status]++;
    });

    // Calculate percentages
    Object.values(subjectSummary).forEach(summary => {
      if (summary.totalClasses > 0) {
        summary.percentage = Math.round(
          ((summary.present + summary.late) / summary.totalClasses) * 100
        );
      }
    });

    // Overall summary
    const overallSummary = {
      totalSubjects: Object.keys(subjectSummary).length,
      totalClasses: processedRecords.length,
      present: processedRecords.filter(r => r.status === 'present').length,
      absent: processedRecords.filter(r => r.status === 'absent').length,
      late: processedRecords.filter(r => r.status === 'late').length,
      excused: processedRecords.filter(r => r.status === 'excused').length,
      overallPercentage: 0
    };

    if (overallSummary.totalClasses > 0) {
      overallSummary.overallPercentage = Math.round(
        ((overallSummary.present + overallSummary.late) / overallSummary.totalClasses) * 100
      );
    }

    res.json({
      success: true,
      data: {
        attendance_records: processedRecords,
        subject_summary: Object.values(subjectSummary),
        overall_summary: overallSummary
      },
      message: 'Attendance retrieved successfully'
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance'
    });
  }
});

/**
 * GET /api/college/student/attendance-by-subject/:subjectId
 * Get attendance for a specific subject
 */
router.get('/attendance-by-subject/:subjectId', auth, async (req, res) => {
  try {
    const { organization_id, _id: studentId, role } = req.user;
    const { subjectId } = req.params;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access this endpoint'
      });
    }

    // Get attendance for specific subject
    const attendanceRecords = await Attendance.find({
      organization_id,
      subjectId,
      'attendance_records.student_id': studentId,
      is_active: true
    })
      .populate('subjectId', 'name code credits')
      .populate('batchId', 'name code')
      .populate('instructor_id', 'full_name')
      .sort({ session_date: -1 });

    const processedRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendance_records.find(
        r => r.student_id.toString() === studentId.toString()
      );

      return {
        _id: record._id,
        date: record.session_date,
        startTime: record.start_time,
        endTime: record.end_time,
        status: studentRecord?.status || 'unknown',
        lateMinutes: studentRecord?.late_minutes || 0,
        notes: studentRecord?.notes || '',
        markedBy: record.instructor_id,
        topicCovered: record.topic_covered
      };
    });

    // Calculate summary
    const summary = {
      totalClasses: processedRecords.length,
      present: processedRecords.filter(r => r.status === 'present').length,
      absent: processedRecords.filter(r => r.status === 'absent').length,
      late: processedRecords.filter(r => r.status === 'late').length,
      excused: processedRecords.filter(r => r.status === 'excused').length,
      percentage: 0
    };

    if (summary.totalClasses > 0) {
      summary.percentage = Math.round(
        ((summary.present + summary.late) / summary.totalClasses) * 100
      );
    }

    res.json({
      success: true,
      data: {
        subject: attendanceRecords[0]?.subjectId || null,
        batch: attendanceRecords[0]?.batchId || null,
        records: processedRecords,
        summary
      },
      message: 'Subject attendance retrieved successfully'
    });

  } catch (error) {
    console.error('Get subject attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance'
    });
  }
});

module.exports = router;
