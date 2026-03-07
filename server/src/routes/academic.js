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
    try {
        const { subjectId, instructorId, contentCourseId } = req.body;

        const subject = await Subject.findOneAndUpdate(
            { _id: subjectId, organization_id: req.user.organization_id },
            { instructorId, contentCourseId },
            { new: true }
        );

        if (!subject) return res.error('Subject not found', 'Invalid subject ID', 404);

        res.success({ subject }, 'Instructor assigned to subject successfully');
    } catch (error) {
        res.error(error.message, 'Failed to assign instructor', 500);
    }
});

// Enroll Student in Program
router.post('/enroll-student', requireRole(['org_admin']), async (req, res) => {
    try {
        const { studentId, courseId, departmentId } = req.body;

        // Check for existing enrollment
        const existing = await StudentCourseEnrollment.findOne({
            studentId,
            courseId,
            organizationId: req.user.organization_id
        });
        if (existing) return res.error('Conflict', 'Student already enrolled in this program', 409);

        // Create Course Enrollment
        const enrollment = await StudentCourseEnrollment.create({
            organizationId: req.user.organization_id,
            studentId,
            courseId,
            departmentId,
            enrolledAt: new Date()
        });

        // Auto-assign subjects from this program
        const subjects = await Subject.find({
            program_id: courseId,
            organization_id: req.user.organization_id,
            isActive: true
        });

        const subjectEnrollments = subjects.map(subject => ({
            organizationId: req.user.organization_id,
            studentId,
            subjectId: subject._id,
            courseId,
            departmentId,
            enrolledAt: new Date()
        }));

        if (subjectEnrollments.length > 0) {
            await StudentSubjectEnrollment.insertMany(subjectEnrollments);
        }

        res.success({ enrollment, subjectCount: subjects.length }, 'Student enrolled in program and assigned subjects successfully');
    } catch (error) {
        res.error(error.message, 'Failed to enroll student', 500);
    }
});

// --- Instructor Endpoints ---

// Get Instructor Subjects
router.get('/instructor/subjects', requireRole(['instructor']), async (req, res) => {
    try {
        const subjects = await Subject.find({
            instructor_id: req.user._id,
            organization_id: req.user.organization_id,
            isActive: true
        }).populate('program_id', 'name code');

        res.success({ subjects }, 'Instructor subjects retrieved');
    } catch (error) {
        res.error(error.message, 'Failed to get subjects', 500);
    }
});

// Get Students in Subject
router.get('/subject/students', requireRole(['instructor', 'org_admin']), async (req, res) => {
    try {
        const { subjectId } = req.query;
        if (!subjectId) return res.error('Missing field', 'subjectId is required', 400);

        const enrollments = await StudentSubjectEnrollment.find({
            subjectId,
            organizationId: req.user.organization_id
        }).populate('studentId', 'name email profile');

        const students = enrollments.map(e => e.studentId);
        res.success({ students }, 'Subject students retrieved');
    } catch (error) {
        res.error(error.message, 'Failed to get subject students', 500);
    }
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
    try {
        const enrollments = await StudentSubjectEnrollment.find({
            studentId: req.user._id,
            organizationId: req.user.organization_id
        }).populate({
            path: 'subjectId',
            populate: [
                { path: 'instructorId', select: 'name profile pic_url' },
                { path: 'contentCourseId', select: 'title description thumbnail' }
            ]
        });

        const subjects = enrollments.map(e => e.subjectId).filter(s => s !== null);
        res.success({ subjects }, 'Student subjects retrieved');
    } catch (error) {
        res.error(error.message, 'Failed to get subjects', 500);
    }
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
