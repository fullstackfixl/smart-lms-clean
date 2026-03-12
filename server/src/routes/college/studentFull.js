const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { Course, Section, Lesson, User, Batch, Enrollment, Attendance, Quiz, QuizAttempt, LiveClass, CollegeEvent, Certificate } = require('../../models');

// All routes require student role
router.use(authMiddleware, requireRole(['student']));

// ===== DASHBOARD =====
// GET /api/college/student/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const [
      enrolledCourses,
      upcomingClasses,
      upcomingEvents,
      recentAssignments,
      certificates
    ] = await Promise.all([
      Enrollment.find({ student_id: userId })
        .populate('course_id', 'title category level status thumbnail')
        .sort({ enrollment_date: -1 }),
      LiveClass.find({
        course_id: { $in: await Enrollment.find({ student_id: userId }).distinct('course_id') },
        startTime: { $gte: new Date() },
        status: 'scheduled'
      }).sort({ startTime: 1 }).limit(5),
      CollegeEvent.find({
        organization_id: orgId,
        date: { $gte: new Date() },
        isActive: true
      }).sort({ date: 1 }).limit(5),
      [], // Placeholder for assignments
      Certificate.find({ studentId: userId }).sort({ issueDate: -1 }).limit(5)
    ]);

    // Calculate attendance rate
    const attendanceStats = await Attendance.aggregate([
      { $match: { student_id: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const totalAttendance = attendanceStats.reduce((acc, curr) => acc + curr.count, 0);
    const presentCount = attendanceStats.find(s => s._id === 'present')?.count || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    res.success({
      enrolledCourses,
      attendanceRate,
      upcomingClasses,
      upcomingEvents,
      recentAssignments,
      certificates
    }, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.error(error.message, 'Failed to load dashboard', 500);
  }
});

// ===== MY COURSES =====
// GET /api/college/student/courses
router.get('/courses', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const enrollments = await Enrollment.find({ student_id: userId })
      .populate({
        path: 'course_id',
        populate: [
          { path: 'instructor_id', select: 'profile.firstName profile.lastName' },
          { path: 'departmentId', select: 'name code' }
        ]
      })
      .sort({ enrollment_date: -1 });

    const courses = enrollments.map(e => ({
      ...e.course_id.toObject(),
      enrollmentDate: e.enrollment_date,
      progress: e.progress,
      lastAccessed: e.last_accessed,
      status: e.status
    }));

    res.success({ courses }, 'Courses retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load courses', 500);
  }
});

// GET /api/college/student/courses/:id
router.get('/courses/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: userId,
      course_id: req.params.id
    });

    if (!enrollment) {
      return res.error('Not enrolled in this course', null, 403);
    }

    const course = await Course.findById(req.params.id)
      .populate('instructor_id', 'profile.firstName profile.lastName email bio')
      .populate('departmentId', 'name code');

    if (!course) {
      return res.error('Course not found', null, 404);
    }

    // Get modules with lessons
    const modules = await Section.find({ course_id: course._id, isActive: true })
      .sort({ order: 1 });

    const modulesWithContent = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ section_id: module._id, isActive: true })
          .sort({ order: 1 })
          .select('title description type duration order isPreview');
        
        // Get progress for each lesson
        const lessonIds = lessons.map(l => l._id.toString());
        const progress = await require('../models').LectureProgress.find({
          studentId: userId,
          lessonId: { $in: lessonIds }
        });

        const lessonsWithProgress = lessons.map(l => ({
          ...l.toObject(),
          completed: progress.some(p => p.lessonId.toString() === l._id.toString() && p.completed)
        }));

        return { ...module.toObject(), lessons: lessonsWithProgress };
      })
    );

    // Get quizzes for this course
    const quizzes = await Quiz.find({ courseId: course._id })
      .select('title description duration passingScore')
      .sort({ createdAt: -1 });

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({
      student_id: userId,
      quiz_id: { $in: quizzes.map(q => q._id) }
    });

    // Get upcoming live classes
    const liveClasses = await LiveClass.find({
      course_id: course._id,
      startTime: { $gte: new Date() },
      status: 'scheduled'
    }).sort({ startTime: 1 });

    res.success({
      course,
      modules: modulesWithContent,
      quizzes: quizzes.map(q => ({
        ...q.toObject(),
        attempted: quizAttempts.some(a => a.quiz_id.toString() === q._id.toString()),
        bestScore: quizAttempts
          .filter(a => a.quiz_id.toString() === q._id.toString())
          .sort((a, b) => b.score - a.score)[0]?.score || 0
      })),
      liveClasses,
      enrollment: {
        enrollmentDate: enrollment.enrollment_date,
        progress: enrollment.progress,
        status: enrollment.status
      }
    }, 'Course details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load course', 500);
  }
});

// POST /api/college/student/courses/:id/enroll
router.post('/courses/:id/enroll', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.error('Course not found', null, 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: userId,
      course_id: req.params.id
    });

    if (existingEnrollment) {
      return res.error('Already enrolled in this course', null, 400);
    }

    const enrollment = new Enrollment({
      student_id: userId,
      course_id: req.params.id,
      organization_id: orgId,
      enrollment_date: new Date(),
      status: 'active',
      progress: 0
    });

    await enrollment.save();

    res.success({ enrollment }, 'Enrolled successfully');
  } catch (error) {
    res.error(error.message, 'Failed to enroll', 500);
  }
});

// ===== ATTENDANCE =====
// GET /api/college/student/attendance
router.get('/attendance', async (req, res) => {
  try {
    const userId = req.user._id;
    const { course } = req.query;

    let query = { student_id: userId };
    if (course) query.course_id = course;

    const attendance = await Attendance.find(query)
      .populate('course_id', 'title')
      .sort({ date: -1 });

    // Group by course
    const courseIds = [...new Set(attendance.map(a => a.course_id?._id?.toString()))];
    const summary = await Promise.all(
      courseIds.map(async (courseId) => {
        const courseAttendance = attendance.filter(a => 
          a.course_id?._id?.toString() === courseId
        );
        const total = courseAttendance.length;
        const present = courseAttendance.filter(a => a.status === 'present').length;
        const absent = courseAttendance.filter(a => a.status === 'absent').length;
        const late = courseAttendance.filter(a => a.status === 'late').length;
        
        return {
          course: courseAttendance[0]?.course_id,
          totalClasses: total,
          present,
          absent,
          late,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
        };
      })
    );

    res.success({ 
      attendance,
      summary
    }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// ===== QUIZZES =====
// GET /api/college/student/quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get enrolled course IDs
    const enrollments = await Enrollment.find({ student_id: userId });
    const courseIds = enrollments.map(e => e.course_id);

    const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    // Get attempts
    const attempts = await QuizAttempt.find({
      student_id: userId,
      quiz_id: { $in: quizzes.map(q => q._id) }
    });

    const quizzesWithAttempts = quizzes.map(q => ({
      ...q.toObject(),
      attempts: attempts.filter(a => a.quiz_id.toString() === q._id.toString()),
      bestScore: attempts
        .filter(a => a.quiz_id.toString() === q._id.toString())
        .sort((a, b) => b.score - a.score)[0]?.score || 0
    }));

    res.success({ quizzes: quizzesWithAttempts }, 'Quizzes retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load quizzes', 500);
  }
});

// ===== LIVE CLASSES =====
// GET /api/college/student/live-classes
router.get('/live-classes', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get enrolled course IDs
    const enrollments = await Enrollment.find({ student_id: userId });
    const courseIds = enrollments.map(e => e.course_id);

    const liveClasses = await LiveClass.find({
      course_id: { $in: courseIds }
    })
      .populate('course_id', 'title')
      .populate('instructor_id', 'profile.firstName profile.lastName')
      .sort({ startTime: -1 });

    res.success({ liveClasses }, 'Live classes retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load live classes', 500);
  }
});

// ===== EVENTS =====
// GET /api/college/student/events
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

// ===== CERTIFICATES =====
// GET /api/college/student/certificates
router.get('/certificates', async (req, res) => {
  try {
    const userId = req.user._id;

    const certificates = await Certificate.find({ studentId: userId })
      .populate('courseId', 'title category')
      .sort({ issueDate: -1 });

    res.success({ certificates }, 'Certificates retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load certificates', 500);
  }
});

// ===== PROGRESS =====
// GET /api/college/student/progress
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all enrollments with course progress
    const enrollments = await Enrollment.find({ student_id: userId })
      .populate('course_id', 'title category');

    // Get completed lessons count for each course
    const progressWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id._id;
        
        // Get total lessons
        const modules = await Section.find({ course_id: courseId });
        const moduleIds = modules.map(m => m._id);
        const totalLessons = await Lesson.countDocuments({ section_id: { $in: moduleIds } });
        
        // Get completed lessons
        const completedLessons = await require('../models').LectureProgress.countDocuments({
          studentId: userId,
          courseId: courseId,
          completed: true
        });

        // Get quiz scores
        const quizAttempts = await QuizAttempt.find({
          student_id: userId,
          course_id: courseId
        });
        const avgScore = quizAttempts.length > 0 
          ? quizAttempts.reduce((acc, a) => acc + a.score, 0) / quizAttempts.length 
          : 0;

        return {
          course: enrollment.course_id,
          enrollmentDate: enrollment.enrollment_date,
          progress: enrollment.progress,
          totalLessons,
          completedLessons,
          quizAttempts: quizAttempts.length,
          averageQuizScore: Math.round(avgScore)
        };
      })
    );

    res.success({ progress: progressWithDetails }, 'Progress retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load progress', 500);
  }
});

// ===== MY ACADEMIC SUBJECTS =====
// GET /api/college/student/subjects
router.get('/subjects', async (req, res) => {
  try {
    const { Subject, AcademicProgram, Batch, User } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Find student's batch
    const student = await User.findById(userId).populate('profile.batch');
    const batchId = student?.profile?.batch;

    if (!batchId) {
      return res.success({ subjects: [] }, 'No batch assigned to student');
    }

    const batch = await Batch.findById(batchId).populate('programId');
    if (!batch) {
      return res.success({ subjects: [] }, 'Batch not found');
    }

    // Get subjects for student's program and current semester
    const subjects = await Subject.find({
      programId: batch.programId,
      semester: batch.semester,
      organizationId: orgId,
      isActive: true
    })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('instructorId', 'profile.firstName profile.lastName email')
      .sort({ name: 1 });

    res.success({ subjects, batch }, 'Subjects retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load subjects', 500);
  }
});

// ===== TIMETABLE =====
// GET /api/college/student/timetable
router.get('/timetable', async (req, res) => {
  try {
    const { Timetable, Subject, Batch, User } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { day } = req.query;

    // Find student's batch
    const student = await User.findById(userId).populate('profile.batch');
    const batchId = student?.profile?.batch;

    if (!batchId) {
      return res.success({ entries: [] }, 'No batch assigned');
    }

    let query = { batchId, organizationId: orgId, isActive: true };
    if (day) query.day = day;

    const entries = await Timetable.find(query)
      .populate('subjectId', 'name code')
      .populate('instructorId', 'profile.firstName profile.lastName')
      .populate('batchId', 'name code')
      .sort({ day: 1, startTime: 1 });

    res.success({ entries }, 'Timetable retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load timetable', 500);
  }
});

// ===== BROWSE COURSES (Published Instructor Courses) =====
// GET /api/college/student/browse-courses
router.get('/browse-courses', async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { category, search, page = 1, limit = 10 } = req.query;

    let query = { 
      organization_id: orgId, 
      status: 'published',
      isActive: true 
    };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor_id', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);

    // Check enrollment status for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await Enrollment.findOne({
          student_id: userId,
          course_id: course._id
        });
        return {
          ...course.toObject(),
          isEnrolled: !!enrollment,
          enrollmentStatus: enrollment?.status || null
        };
      })
    );

    res.success({ 
      courses: coursesWithEnrollment, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Courses retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load courses', 500);
  }
});

// ===== MY ATTENDANCE =====
// GET /api/college/student/attendance
router.get('/attendance', async (req, res) => {
  try {
    const { Attendance, Subject } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { subjectId, startDate, endDate } = req.query;

    let query = { studentId: userId, organizationId: orgId };
    if (subjectId) query.subjectId = subjectId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate('subjectId', 'name code')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });

    // Calculate statistics
    const summary = await Attendance.aggregate([
      { $match: { studentId: userId, organizationId: orgId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const total = summary.reduce((acc, curr) => acc + curr.count, 0);
    const present = summary.find(s => s._id === 'present')?.count || 0;
    const absent = summary.find(s => s._id === 'absent')?.count || 0;
    const late = summary.find(s => s._id === 'late')?.count || 0;

    res.success({
      records,
      summary: { total, present, absent, late },
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0
    }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

module.exports = router;
