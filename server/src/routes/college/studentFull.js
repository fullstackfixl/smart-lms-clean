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

    const { Subject, Timetable } = require('../../models');

    const studentDoc = await User.findById(userId).select('profile.batch').lean();
    const batchId = studentDoc?.profile?.batch;

    let academicSubjects = [];
    let academicTimetable = [];
    if (batchId) {
      const batch = await Batch.findById(batchId).populate('programId').lean();
      if (batch?.programId) {
        academicSubjects = await Subject.find({
          organizationId: orgId,
          isActive: true,
          $or: [
            { batchId },
            { batchId: { $exists: false }, programId: batch.programId._id || batch.programId, semester: batch.semester },
            { batchId: null, programId: batch.programId._id || batch.programId, semester: batch.semester }
          ]
        })
          .populate('instructorId', 'name email profile.pic_url')
          .populate('departmentId', 'name code')
          .populate('programId', 'name code')
          .populate('batchId', 'name code year semester')
          .lean();
      }

      academicTimetable = await Timetable.find({
        batchId,
        organizationId: orgId,
        isActive: true
      })
        .populate('subjectId', 'name code')
        .populate('instructorId', 'profile.firstName profile.lastName email')
        .sort({ day: 1, startTime: 1 })
        .lean();
    }

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
      certificates,
      academic: {
        subjects: academicSubjects,
        timetable: academicTimetable
      }
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
        const progress = await require('../../models').LectureProgress.find({
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

// ===== COURSE ATTENDANCE (Udemy-style) =====
// GET /api/college/student/course-attendance
router.get('/course-attendance', async (req, res) => {
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
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const { AcademicEnrollment, Subject, User, Batch } = require('../../models');

    // First try: Get quizzes from AcademicEnrollment records
    const academicEnrollments = await AcademicEnrollment.find({ organizationId: orgId, studentId: userId })
      .select('subjectId batchId')
      .lean();

    let enrolledSubjectIds = [...new Set(academicEnrollments.map(e => String(e.subjectId)).filter(Boolean))];
    let enrolledBatchIds = [...new Set(academicEnrollments.map(e => String(e.batchId)).filter(Boolean))];

    // Second try: If no AcademicEnrollments, get subjects from student's batch
    if (!enrolledSubjectIds.length) {
      const student = await User.findById(userId).populate('profile.batch');
      const batchId = student?.profile?.batch;
      
      if (batchId) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          // Get all subjects for this batch
          const batchSubjects = await Subject.find({
            organizationId: orgId,
            isActive: true,
            $or: [
              { batchId },
              { batchId: { $exists: false }, programId: batch.programId, semester: batch.semester },
              { batchId: null, programId: batch.programId, semester: batch.semester }
            ]
          }).select('_id');
          
          enrolledSubjectIds = batchSubjects.map(s => String(s._id));
          enrolledBatchIds = [String(batchId)];
        }
      }
    }

    if (enrolledSubjectIds.length && enrolledBatchIds.length) {
      const quizzes = await Quiz.find({
        organization_id: orgId,
        subjectId: { $in: enrolledSubjectIds },
        batchId: { $in: enrolledBatchIds },
        status: 'PUBLISHED',
        is_active: true
      })
        .populate('course_id', 'title thumbnail')
        .populate('instructor_id', 'name profile.firstName profile.lastName')
        .populate('subjectId', 'name code')
        .sort({ created_at: -1 });

      const attempts = await QuizAttempt.find({
        student_id: userId,
        quiz_id: { $in: quizzes.map(q => q._id) }
      });

      const quizzesWithAttempts = quizzes.map(q => {
        const qAttempts = attempts.filter(a => a.quiz_id.toString() === q._id.toString());
        const bestAttempt = qAttempts.sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];
        const bestPercentage = bestAttempt?.percentage ?? null;
        const hasPassed = qAttempts.some(a => a.passed);

        return {
          _id: q._id,
          title: q.title,
          description: q.description,
          total_marks: q.total_marks,
          max_attempts: q.max_attempts,
          timer_minutes: q.timer_minutes,
          pass_percentage: q.pass_percentage,
          questions_count: Array.isArray(q.questions) ? q.questions.length : 0,
          questions: (q.questions || []).map(qq => ({ question: qq.question, options: qq.options })),
          created_at: q.created_at,
          attemptsCount: qAttempts.length,
          attemptsLeft: Math.max(0, (q.max_attempts || 0) - qAttempts.length),
          bestScore: bestAttempt?.score ?? null,
          bestPercentage,
          hasPassed,
          course: q.course_id
            ? { _id: q.course_id._id, title: q.course_id.title, thumbnail: q.course_id.thumbnail }
            : null,
          instructor: q.instructor_id
            ? {
                _id: q.instructor_id._id,
                name:
                  q.instructor_id.name ||
                  `${q.instructor_id.profile?.firstName || ''} ${q.instructor_id.profile?.lastName || ''}`.trim()
              }
            : null,
          subject: q.subjectId
            ? { _id: q.subjectId._id, name: q.subjectId.name, code: q.subjectId.code }
            : null,
          batchId: q.batchId || null
        };
      });

      return res.success({ quizzes: quizzesWithAttempts }, 'Quizzes retrieved');
    }

    // Get enrolled course IDs
    const enrollments = await Enrollment.find({
      student_id: userId,
      ...(orgId ? { organization_id: orgId } : {})
    });
    const courseIds = enrollments.map(e => e.course_id);

    const quizQuery = {
      course_id: { $in: courseIds },
      ...(orgId ? { organization_id: orgId } : {}),
      status: 'PUBLISHED',
      is_active: true
    };

    const quizzes = await Quiz.find(quizQuery)
      .populate('course_id', 'title thumbnail')
      .populate('instructor_id', 'name profile.firstName profile.lastName')
      .sort({ created_at: -1 });

    // Get attempts
    const attempts = await QuizAttempt.find({
      student_id: userId,
      quiz_id: { $in: quizzes.map(q => q._id) }
    });

    const quizzesWithAttempts = quizzes.map(q => {
      const qAttempts = attempts.filter(a => a.quiz_id.toString() === q._id.toString());
      const bestAttempt = qAttempts.sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];
      const bestPercentage = bestAttempt?.percentage ?? null;
      const hasPassed = qAttempts.some(a => a.passed);

      return {
        _id: q._id,
        title: q.title,
        description: q.description,
        total_marks: q.total_marks,
        max_attempts: q.max_attempts,
        timer_minutes: q.timer_minutes,
        pass_percentage: q.pass_percentage,
        questions_count: Array.isArray(q.questions) ? q.questions.length : 0,
        questions: (q.questions || []).map(qq => ({ question: qq.question, options: qq.options })),
        created_at: q.created_at,
        attemptsCount: qAttempts.length,
        attemptsLeft: Math.max(0, (q.max_attempts || 0) - qAttempts.length),
        bestScore: bestAttempt?.score ?? null,
        bestPercentage,
        hasPassed,
        course: q.course_id
          ? { _id: q.course_id._id, title: q.course_id.title, thumbnail: q.course_id.thumbnail }
          : null,
        instructor: q.instructor_id
          ? {
              _id: q.instructor_id._id,
              name:
                q.instructor_id.name ||
                `${q.instructor_id.profile?.firstName || ''} ${q.instructor_id.profile?.lastName || ''}`.trim()
            }
          : null
      };
    });

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
        const completedLessons = await require('../../models').LectureProgress.countDocuments({
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

    // Subject visibility rule:
    // - Prefer strict batch match
    // - Fallback to legacy subjects without batchId using program+semester
    const subjects = await Subject.find({
      organizationId: orgId,
      isActive: true,
      $or: [
        { batchId },
        { batchId: { $exists: false }, programId: batch.programId, semester: batch.semester },
        { batchId: null, programId: batch.programId, semester: batch.semester }
      ]
    })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code year semester')
      .populate('instructorId', 'name email profile.pic_url')
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

    const match = {
      organization_id: orgId,
      is_active: true,
      'attendance_records.student_id': userId
    };

    if (subjectId) match.subjectId = subjectId;

    if (startDate || endDate) {
      match.session_date = {};
      if (startDate) match.session_date.$gte = new Date(startDate);
      if (endDate) match.session_date.$lte = new Date(endDate);
    }

    const sessions = await Attendance.find(match)
      .populate('subjectId', 'name code')
      .populate('instructor_id', 'profile.firstName profile.lastName email')
      .sort({ session_date: -1, start_time: -1 })
      .lean();

    const records = sessions.map(s => {
      const rec = (s.attendance_records || []).find(r => String(r.student_id) === String(userId));
      return {
        _id: s._id,
        subjectId: s.subjectId,
        instructor: s.instructor_id,
        date: s.session_date,
        startTime: s.start_time,
        endTime: s.end_time,
        status: rec?.status || null,
        markedAt: rec?.marked_at || null
      };
    });

    const summaryAgg = await Attendance.aggregate([
      { $match: match },
      { $unwind: '$attendance_records' },
      { $match: { 'attendance_records.student_id': userId } },
      { $group: { _id: '$attendance_records.status', count: { $sum: 1 } } }
    ]);

    const total = summaryAgg.reduce((acc, curr) => acc + curr.count, 0);
    const present = summaryAgg.find(s => s._id === 'present')?.count || 0;
    const absent = summaryAgg.find(s => s._id === 'absent')?.count || 0;
    const late = summaryAgg.find(s => s._id === 'late')?.count || 0;

    res.success({
      records,
      summary: { total, present, absent, late },
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0
    }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// ===== MY GRADES =====
// GET /api/college/student/grades
router.get('/grades', async (req, res) => {
  try {
    const { Grade, Subject, Enrollment } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Get student's enrollments
    const enrollments = await Enrollment.find({
      student_id: userId,
      organization_id: orgId,
      status: 'active'
    }).populate('course_id', 'title');

    const courseIds = enrollments.map(e => e.course_id?._id || e.course_id);

    // Get grades for enrolled courses
    const grades = await Grade.find({
      student_id: userId,
      organization_id: orgId
    })
      .populate('course_id', 'title')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate GPA
    const totalCredits = grades.reduce((acc, g) => acc + (g.credits || 0), 0);
    const weightedSum = grades.reduce((acc, g) => acc + ((g.marks || 0) * (g.credits || 0)), 0);
    const gpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : '0.00';

    res.success({
      grades,
      gpa,
      summary: {
        totalGrades: grades.length,
        totalCredits,
        highestMarks: grades.length > 0 ? Math.max(...grades.map(g => g.marks || 0)) : 0,
        lowestMarks: grades.length > 0 ? Math.min(...grades.map(g => g.marks || 0)) : 0,
        averageMarks: grades.length > 0 ? Math.round(grades.reduce((acc, g) => acc + (g.marks || 0), 0) / grades.length) : 0
      }
    }, 'Grades retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load grades', 500);
  }
});

// ===== ANNOUNCEMENTS =====
// GET /api/college/student/announcements
router.get('/announcements', async (req, res) => {
  try {
    const { Announcement } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const courseIds = await Enrollment.find({ student_id: userId })
      .distinct('course_id');

    if (!courseIds.length) {
      return res.success({ announcements: [] }, 'Announcements retrieved');
    }

    const announcements = await Announcement.find({
      organization_id: orgId,
      course_id: { $in: courseIds },
      is_active: true
    })
      .populate('course_id', 'title')
      .populate('instructor_id', 'name email profile.firstName profile.lastName')
      .sort({ is_pinned: -1, createdAt: -1 })
      .lean();

    res.success({ announcements }, 'Announcements retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load announcements', 500);
  }
});

// ===== RESULTS =====
// GET /api/college/student/results
router.get('/results', async (req, res) => {
  try {
    const { QuizResult } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const [attempts, quizResults] = await Promise.all([
      QuizAttempt.find({ student_id: userId, is_active: true })
        .populate('quiz_id', 'title course_id')
        .sort({ submitted_at: -1 })
        .limit(200)
        .lean()
        .catch(() => []),
      QuizResult.find({ user_id: userId, organization_id: orgId })
        .populate('course_id', 'title')
        .populate('lecture_id', 'title')
        .sort({ submitted_at: -1 })
        .limit(200)
        .lean()
        .catch(() => [])
    ]);

    res.success({
      quizAttempts: attempts,
      lectureQuizResults: quizResults
    }, 'Results retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load results', 500);
  }
});

// ===== EXAMS =====
// GET /api/college/student/exams
router.get('/exams', async (req, res) => {
  try {
    res.success({ exams: [] }, 'Exams retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load exams', 500);
  }
});

// ===== ASSIGNMENTS =====
// GET /api/college/student/assignments
router.get('/assignments', async (req, res) => {
  try {
    const { Assignment } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    console.log('[StudentAssignments] Loading for user:', userId, 'org:', orgId);

    const { AcademicEnrollment } = require('../../models');
    const academicEnrollments = await AcademicEnrollment.find({ organizationId: orgId, studentId: userId })
      .select('subjectId batchId')
      .lean();

    console.log('[StudentAssignments] Academic enrollments:', academicEnrollments.length, academicEnrollments);

    const enrolledPairs = academicEnrollments.map(e => ({ 
      subjectId: String(e.subjectId), 
      batchId: String(e.batchId) 
    })).filter(p => p.subjectId && p.batchId);

    console.log('[StudentAssignments] Enrolled pairs:', enrolledPairs);

    if (enrolledPairs.length) {
      // Build $or query to match exact subject+batch pairs
      const pairQueries = enrolledPairs.map(p => ({
        subjectId: p.subjectId,
        batchId: p.batchId
      }));

      console.log('[StudentAssignments] Query:', { organization_id: orgId, $or: pairQueries, is_active: true });

      const assignments = await Assignment.find({
        organization_id: orgId,
        $or: pairQueries,
        is_active: true
        // Note: Removed due_date filter temporarily to show all assignments
      })
        .populate('course_id', 'title')
        .populate('created_by', 'name email profile.firstName profile.lastName')
        .populate('subjectId', 'name code')
        .sort({ due_date: 1, createdAt: -1 })
        .lean();

      console.log('[StudentAssignments] Found assignments:', assignments.length, assignments.map(a => ({ _id: a._id, title: a.title, subjectId: a.subjectId, batchId: a.batchId })));

      return res.success({ assignments }, 'Assignments retrieved');
    }

    const courseIds = await Enrollment.find({ student_id: userId })
      .distinct('course_id');

    if (!courseIds.length) {
      return res.success({ assignments: [] }, 'Assignments retrieved');
    }

    const assignments = await Assignment.find({
      organization_id: orgId,
      course_id: { $in: courseIds },
      is_active: true,
      $or: [
        { due_date: { $gte: new Date() } },
        { due_date: { $exists: false } },
        { due_date: null }
      ]
    })
      .populate('course_id', 'title')
      .populate('created_by', 'name email profile.firstName profile.lastName')
      .sort({ due_date: 1, createdAt: -1 })
      .lean();

    res.success({ assignments }, 'Assignments retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load assignments', 500);
  }
});

// GET /api/college/student/users
router.get('/users', async (req, res) => {
  try {
    const { organization_id, _id: studentId } = req.user;
    const orgIdStr = typeof organization_id === 'object' && organization_id._id ? organization_id._id : organization_id;
    
    const User = require('../../models/User');
    const Enrollment = require('../../models/Enrollment');
    const InstructorAssignment = require('../../models/InstructorAssignment');

    // 1. Get Org Admins
    const admins = await User.find({
      organization_id: orgIdStr,
      role: { $in: ['org_admin', 'organization_admin'] },
      status: 'active'
    }).select('full_name first_name last_name email role profileImageUrl');

    // 2. Get assigned instructors
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active'
    }).select('batchId');
    const batchIds = enrollments.map(e => e.batchId);

    const assignments = await InstructorAssignment.find({
      organizationId: orgIdStr,
      batchId: { $in: batchIds },
      isActive: true
    }).populate('instructorId', 'full_name first_name last_name email role profileImageUrl');

    // Extract unique instructors
    const instructorMap = new Map();
    assignments.forEach(a => {
      if (a.instructorId && !instructorMap.has(a.instructorId._id.toString())) {
        instructorMap.set(a.instructorId._id.toString(), a.instructorId);
      }
    });
    
    const instructors = Array.from(instructorMap.values());

    res.status(200).json({
      success: true,
      data: [...admins, ...instructors]
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

module.exports = router;
