const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { Course, Section, Lesson, User, Batch, Enrollment, Attendance, Quiz, QuizAttempt, LiveClass, CollegeEvent, Certificate } = require('../../models');

// All routes require instructor role
router.use(authMiddleware, requireRole(['instructor']));

// ===== DASHBOARD =====
// GET /api/college/instructor/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const [
      coursesTeaching,
      totalStudents,
      upcomingClasses,
      pendingAssignments,
      recentQuizzes
    ] = await Promise.all([
      Course.countDocuments({ instructor_id: userId, isActive: true }),
      Enrollment.countDocuments({ 
        course_id: { $in: await Course.find({ instructor_id: userId }).distinct('_id') }
      }),
      LiveClass.find({
        instructor_id: userId,
        startTime: { $gte: new Date() },
        status: 'scheduled'
      }).sort({ startTime: 1 }).limit(5),
      0, // Placeholder - would need Assignment model
      Quiz.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    res.success({
      stats: {
        coursesTeaching,
        totalStudents,
        upcomingClassesCount: upcomingClasses.length,
        pendingAssignments
      },
      upcomingClasses,
      recentQuizzes
    }, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Instructor dashboard error:', error);
    res.error(error.message, 'Failed to load dashboard', 500);
  }
});

// ===== MY COURSES =====
// GET /api/college/instructor/courses
router.get('/courses', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const courses = await Course.find({ instructor_id: userId, organization_id: orgId, isActive: true })
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code')
      .sort({ createdAt: -1 });

    // Get enrollment count for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ course_id: course._id });
        const moduleCount = await Section.countDocuments({ course_id: course._id, isActive: true });
        return {
          ...course.toObject(),
          enrollmentCount,
          moduleCount
        };
      })
    );

    res.success({ courses: coursesWithStats }, 'Courses retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load courses', 500);
  }
});

// GET /api/college/instructor/courses/:id
router.get('/courses/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({ 
      _id: req.params.id, 
      instructor_id: userId,
      organization_id: orgId 
    })
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code year semester');

    if (!course) {
      return res.error('Course not found', null, 404);
    }

    // Get modules with lessons
    const modules = await Section.find({ course_id: course._id, isActive: true })
      .sort({ order: 1 });

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ section_id: module._id, isActive: true })
          .sort({ order: 1 });
        return { ...module.toObject(), lessons };
      })
    );

    // Get enrolled students with progress
    const enrollments = await Enrollment.find({ course_id: course._id })
      .populate('student_id', 'profile.firstName profile.lastName email profile.rollNumber');

    // Get quizzes for this course
    const quizzes = await Quiz.find({ courseId: course._id }).sort({ createdAt: -1 });

    // Get live classes
    const liveClasses = await LiveClass.find({ course_id: course._id })
      .sort({ startTime: -1 });

    res.success({
      course,
      modules: modulesWithLessons,
      students: enrollments.map(e => ({
        ...e.student_id.toObject(),
        enrollmentDate: e.enrollment_date,
        progress: e.progress
      })),
      quizzes,
      liveClasses
    }, 'Course details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load course', 500);
  }
});

// ===== STUDENTS =====
// GET /api/college/instructor/students
router.get('/students', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Get courses taught by this instructor
    const courses = await Course.find({ instructor_id: userId, isActive: true });
    const courseIds = courses.map(c => c._id);

    // Get enrollments for these courses
    const enrollments = await Enrollment.find({ course_id: { $in: courseIds } })
      .populate('student_id', 'profile.firstName profile.lastName email profile.rollNumber profile.department profile.batch')
      .populate('course_id', 'title');

    const students = enrollments.map(e => ({
      ...e.student_id.toObject(),
      course: e.course_id,
      enrollmentDate: e.enrollment_date,
      progress: e.progress
    }));

    res.success({ students }, 'Students retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load students', 500);
  }
});

// GET /api/college/instructor/students/:id
router.get('/students/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Verify student is in instructor's course
    const courses = await Course.find({ instructor_id: userId, isActive: true });
    const courseIds = courses.map(c => c._id);

    const enrollment = await Enrollment.findOne({
      student_id: req.params.id,
      course_id: { $in: courseIds }
    }).populate('student_id', 'profile.firstName profile.lastName email profile.rollNumber');

    if (!enrollment) {
      return res.error('Student not found or not in your courses', null, 404);
    }

    const student = enrollment.student_id;

    // Get all enrollments for this student
    const allEnrollments = await Enrollment.find({ student_id: req.params.id })
      .populate('course_id', 'title');

    // Get attendance for this student
    const attendance = await Attendance.find({ student_id: req.params.id })
      .populate('course_id', 'title')
      .sort({ date: -1 });

    // Get quiz attempts
    const quizAttempts = await require('../models').QuizAttempt.find({ student_id: req.params.id })
      .populate('quiz_id', 'title')
      .sort({ createdAt: -1 });

    res.success({
      student,
      enrollments: allEnrollments,
      attendance,
      quizAttempts
    }, 'Student details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load student', 500);
  }
});

// ===== ATTENDANCE =====
// POST /api/college/instructor/attendance
router.post('/attendance', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { courseId, studentId, date, status, notes } = req.body;

    // Verify course belongs to instructor
    const course = await Course.findOne({ _id: courseId, instructor_id: userId });
    if (!course) {
      return res.error('Course not found or access denied', null, 403);
    }

    // Get student batch
    const student = await User.findById(studentId);
    const batchId = student?.profile?.batch;

    let attendance = await Attendance.findOne({
      student_id: studentId,
      course_id: courseId,
      date: new Date(date)
    });

    if (attendance) {
      attendance.status = status;
      attendance.markedBy = userId;
      attendance.notes = notes;
    } else {
      attendance = new Attendance({
        student_id: studentId,
        course_id: courseId,
        batchId,
        date: new Date(date),
        status,
        markedBy: userId,
        notes,
        organization_id: orgId
      });
    }

    await attendance.save();

    res.success({ attendance }, 'Attendance marked successfully');
  } catch (error) {
    res.error(error.message, 'Failed to mark attendance', 500);
  }
});

// GET /api/college/instructor/attendance
router.get('/attendance', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { courseId, date, batchId } = req.query;

    // Get courses taught by instructor
    const courses = await Course.find({ instructor_id: userId, isActive: true });
    const courseIds = courses.map(c => c._id);

    let query = { 
      course_id: courseId ? courseId : { $in: courseIds }
    };

    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }

    if (batchId) query.batchId = batchId;

    const attendance = await Attendance.find(query)
      .populate('student_id', 'profile.firstName profile.lastName profile.rollNumber')
      .populate('course_id', 'title')
      .sort({ date: -1 });

    res.success({ attendance }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// GET /api/college/instructor/attendance/course/:courseId
router.get('/attendance/course/:courseId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const { date } = req.query;

    // Verify course belongs to instructor
    const course = await Course.findOne({ _id: courseId, instructor_id: userId });
    if (!course) {
      return res.error('Course not found or access denied', null, 403);
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({ course_id: courseId })
      .populate('student_id', 'profile.firstName profile.lastName email profile.rollNumber');

    const studentIds = enrollments.map(e => e.student_id._id);

    // Get attendance for date
    let dateQuery = {};
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      dateQuery = { date: { $gte: startOfDay, $lt: endOfDay } };
    }

    const attendance = await Attendance.find({
      course_id: courseId,
      student_id: { $in: studentIds },
      ...dateQuery
    });

    // Merge students with attendance
    const studentsWithAttendance = enrollments.map(e => {
      const studentAttendance = attendance.find(a => 
        a.student_id.toString() === e.student_id._id.toString()
      );
      return {
        student: e.student_id,
        status: studentAttendance?.status || null,
        notes: studentAttendance?.notes || ''
      };
    });

    res.success({
      course,
      students: studentsWithAttendance,
      attendanceDate: date || new Date().toISOString().split('T')[0]
    }, 'Course attendance retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load course attendance', 500);
  }
});

// ===== LIVE CLASSES =====
// GET /api/college/instructor/live-classes
router.get('/live-classes', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const liveClasses = await LiveClass.find({ instructor_id: userId })
      .populate('course_id', 'title')
      .sort({ startTime: -1 });

    res.success({ liveClasses }, 'Live classes retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load live classes', 500);
  }
});

// ===== QUIZZES =====
// GET /api/college/instructor/quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const quizzes = await Quiz.find({ createdBy: userId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    // Get attempt counts
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await require('../models').QuizAttempt.countDocuments({ quiz_id: quiz._id });
        const avgScore = await require('../models').QuizAttempt.aggregate([
          { $match: { quiz_id: quiz._id } },
          { $group: { _id: null, avg: { $avg: '$score' } } }
        ]);
        return {
          ...quiz.toObject(),
          attemptCount,
          averageScore: avgScore[0]?.avg || 0
        };
      })
    );

    res.success({ quizzes: quizzesWithStats }, 'Quizzes retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load quizzes', 500);
  }
});

// ===== EVENTS =====
// GET /api/college/instructor/events
router.get('/events', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { upcoming } = req.query;

    let query = { organization_id: orgId, isActive: true };
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await CollegeEvent.find(query)
      .populate('departmentId', 'name code')
      .sort({ date: 1 });

    res.success({ events }, 'Events retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load events', 500);
  }
});

// ===== ANALYTICS =====
// GET /api/college/instructor/analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Get courses taught
    const courses = await Course.find({ instructor_id: userId, isActive: true });
    const courseIds = courses.map(c => c._id);

    // Enrollment stats per course
    const enrollmentStats = await Promise.all(
      courses.map(async (course) => {
        const count = await Enrollment.countDocuments({ course_id: course._id });
        return { course: course.title, enrollments: count };
      })
    );

    // Quiz performance across all courses
    const quizzes = await Quiz.find({ createdBy: userId });
    const quizIds = quizzes.map(q => q._id);

    const quizPerformance = await require('../models').QuizAttempt.aggregate([
      { $match: { quiz_id: { $in: quizIds } } },
      { $group: { 
        _id: '$quiz_id', 
        avgScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 }
      }}
    ]);

    // Attendance rate across all courses
    const attendanceStats = await Attendance.aggregate([
      { $match: { course_id: { $in: courseIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const totalAttendance = attendanceStats.reduce((acc, curr) => acc + curr.count, 0);
    const presentCount = attendanceStats.find(s => s._id === 'present')?.count || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    res.success({
      enrollmentStats,
      quizPerformance,
      attendanceRate,
      totalStudents: await Enrollment.countDocuments({ course_id: { $in: courseIds } }),
      totalCourses: courses.length
    }, 'Analytics retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load analytics', 500);
  }
});

module.exports = router;
