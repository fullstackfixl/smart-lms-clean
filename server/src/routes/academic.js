const express = require('express');
const router = express.Router();
const {
    Department,
    Program,
    Subject,
    StudentCourseEnrollment,
    StudentSubjectEnrollment,
    Attendance,
    User,
    Course
} = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Apply auth to all routes
router.use(authMiddleware);

// --- Admin Endpoints ---

// Create Department
router.post('/departments', requireRole(['org_admin']), async (req, res) => {
    try {
        const { name, code, description } = req.body;
        const department = await Department.create({
            organization_id: req.user.organization_id,
            name,
            code,
            description,
            createdBy: req.user._id
        });
        res.success({ department }, 'Department created successfully', 201);
    } catch (error) {
        res.error(error.message, 'Failed to create department', 500);
    }
});

// Get Departments
router.get('/departments', async (req, res) => {
    try {
        const departments = await Department.find({ organization_id: req.user.organization_id, isActive: true });
        res.success({ departments }, 'Departments retrieved successfully');
    } catch (error) {
        res.error(error.message, 'Failed to get departments', 500);
    }
});

// Create Program (Course in reqs)
router.post('/courses', requireRole(['org_admin']), async (req, res) => {
    try {
        const { departmentId, name, code, duration } = req.body;
        const program = await Program.create({
            organization_id: req.user.organization_id,
            department_id: departmentId,
            name,
            code,
            duration,
            createdBy: req.user._id
        });
        res.success({ program }, 'Program created successfully', 201);
    } catch (error) {
        res.error(error.message, 'Failed to create program', 500);
    }
});

// Get Programs
router.get('/courses', async (req, res) => {
    try {
        const programs = await Program.find({ organization_id: req.user.organization_id, isActive: true })
            .populate('department_id', 'name');
        res.success({ programs }, 'Programs retrieved successfully');
    } catch (error) {
        res.error(error.message, 'Failed to get programs', 500);
    }
});

// Create Subject
router.post('/subjects', requireRole(['org_admin']), async (req, res) => {
    try {
        const { departmentId, courseId, name, code, description } = req.body;
        const subject = await Subject.create({
            organization_id: req.user.organization_id,
            department_id: departmentId,
            program_id: courseId, // referred to as courseId in reqs
            name,
            code,
            description,
            createdBy: req.user._id
        });
        res.success({ subject }, 'Subject created successfully', 201);
    } catch (error) {
        res.error(error.message, 'Failed to create subject', 500);
    }
});

// Get Subjects
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({ organization_id: req.user.organization_id, isActive: true })
            .populate('department_id', 'name')
            .populate('program_id', 'name')
            .populate('instructorId', 'name email')
            .populate('contentCourseId', 'title');
        res.success({ subjects }, 'Subjects retrieved successfully');
    } catch (error) {
        res.error(error.message, 'Failed to get subjects', 500);
    }
});

// Assign Instructor to Subject
router.post('/assign-instructor', requireRole(['org_admin']), async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Manual instructor assignment is disabled. Use the Program+Batch enrollment engine (subjects should carry instructorId, and enrollments are auto-generated).'
    });
});

// Enroll Student in Program
router.post('/enroll-student', requireRole(['org_admin']), async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Manual enrollment is disabled. Use POST /api/admin/learners/assign with studentId + programId + batchId.'
    });
});

// --- Instructor Endpoints ---

// Get Instructor Subjects
router.get('/instructor/subjects', requireRole(['instructor']), async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Legacy instructor subjects endpoint is disabled. Use /instructor/subjects (non-legacy) which reads from AcademicEnrollment.'
    });
});

// Get Students in Subject
router.get('/subject/students', requireRole(['instructor', 'org_admin']), async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Legacy subject->students endpoint is disabled. Use AcademicEnrollment as the source of truth.'
    });
});

// Post Attendance
router.post('/attendance', requireRole(['instructor']), async (req, res) => {
    try {
        const { subjectId, courseId, students, date, session_type, start_time, end_time } = req.body;

        // session_date from date or current
        const sessionDate = date ? new Date(date) : new Date();

        const attendance = new Attendance({
            organization_id: req.user.organization_id,
            subjectId,
            programId: courseId, // Program ID
            instructor_id: req.user._id,
            session_date: sessionDate,
            session_type: session_type || 'regular_class',
            start_time,
            end_time,
            attendance_records: students.map(s => ({
                student_id: s.studentId,
                status: s.status,
                marked_by: req.user._id
            }))
        });

        await attendance.save();
        res.success({ attendance }, 'Attendance recorded successfully', 201);
    } catch (error) {
        res.error(error.message, 'Failed to record attendance', 500);
    }
});

// --- Student Endpoints ---

// Get Student Subjects
router.get('/student/subjects', requireRole(['student']), async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Legacy student subjects endpoint is disabled. Use /student/subjects (non-legacy) which reads from AcademicEnrollment.'
    });
});

// Get Student Attendance
router.get('/student/attendance', requireRole(['student']), async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find({
            organization_id: req.user.organization_id,
            'attendance_records.student_id': req.user._id
        }).populate('subjectId', 'name code');

        const studentAttendance = attendanceRecords.map(record => {
            const myRecord = record.attendance_records.find(
                r => r.student_id.toString() === req.user._id.toString()
            );
            return {
                sessionDate: record.session_date,
                subject: record.subjectId,
                status: myRecord.status,
                startTime: record.start_time,
                endTime: record.end_time
            };
        });

        res.success({ attendance: studentAttendance }, 'Student attendance retrieved');
    } catch (error) {
        res.error(error.message, 'Failed to get attendance', 500);
    }
});

module.exports = router;
