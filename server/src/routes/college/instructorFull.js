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

    const { Subject, Timetable, Batch } = require('../../models');

    const subjectsTeaching = await Subject.find({
      instructorId: userId,
      organizationId: orgId,
      isActive: true
    })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ semester: 1, name: 1 })
      .lean();

    const timetableEntries = await Timetable.find({
      instructorId: userId,
      organizationId: orgId,
      isActive: true
    })
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code year semester')
      .sort({ day: 1, startTime: 1 })
      .lean();

    const assignedBatchIds = [...new Set(timetableEntries.map(e => String(e.batchId?._id || e.batchId)).filter(Boolean))];
    const assignedBatches = assignedBatchIds.length
      ? await Batch.find({ _id: { $in: assignedBatchIds }, organizationId: orgId, isActive: true })
          .populate('programId', 'name code')
          .populate('departmentId', 'name code')
          .lean()
      : [];

    const studentsCount = assignedBatchIds.length
      ? await User.countDocuments({ organization_id: orgId, role: 'student', isActive: true, 'profile.batch': { $in: assignedBatchIds } })
      : 0;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const todayClasses = timetableEntries.filter(e => e.day === todayName);
    const upcomingAcademicClasses = timetableEntries.filter(e => e.day !== todayName).slice(0, 10);

    const [
      coursesTeaching,
      totalStudents,
      upcomingLiveClasses,
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
        upcomingClassesCount: upcomingLiveClasses.length,
        pendingAssignments
      },
      upcomingClasses: upcomingLiveClasses,
      recentQuizzes
      ,
      academic: {
        subjectsTeaching,
        assignedBatches,
        studentsCount,
        todayClasses,
        upcomingClasses: upcomingAcademicClasses
      }
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
    const quizAttempts = await require('../../models').QuizAttempt.find({ student_id: req.params.id })
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

// ===== COURSE ATTENDANCE (Udemy-style) =====
// POST /api/college/instructor/course-attendance
router.post('/course-attendance', async (req, res) => {
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

// GET /api/college/instructor/course-attendance
router.get('/course-attendance', async (req, res) => {
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

// GET /api/college/instructor/course-attendance/course/:courseId
router.get('/course-attendance/course/:courseId', async (req, res) => {
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

    const quizzes = await Quiz.find({
      organization_id: orgId,
      instructor_id: userId,
      is_active: true
    })
      .populate('course_id', 'title')
      .sort({ created_at: -1 });

    // Get attempt counts
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const { QuizAttempt } = require('../../models');
        const attemptCount = await QuizAttempt.countDocuments({ quiz_id: quiz._id });
        const avgScore = await QuizAttempt.aggregate([
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

    const quizPerformance = await require('../../models').QuizAttempt.aggregate([
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

// ===== MY SUBJECTS (Academic) =====
// GET /api/college/instructor/subjects
router.get('/subjects', async (req, res) => {
  try {
    const { Subject, AcademicProgram, Batch, Timetable } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Get subjects where instructor is directly assigned
    const directSubjects = await Subject.find({ 
      instructorId: userId, 
      organizationId: orgId,
      isActive: true 
    })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code year semester')
      .sort({ semester: 1, name: 1 })
      .lean();

    // Get subjects from timetable assignments
    const timetableEntries = await Timetable.find({
      instructorId: userId,
      organizationId: orgId,
      isActive: true
    })
      .populate('subjectId', 'name code programId departmentId batchId semester credits')
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code year semester')
      .lean();

    // Extract unique subjects from timetable
    const timetableSubjectMap = new Map();
    timetableEntries.forEach(entry => {
      if (entry.subjectId && entry.subjectId._id) {
        const sid = String(entry.subjectId._id);
        if (!timetableSubjectMap.has(sid)) {
          timetableSubjectMap.set(sid, {
            ...entry.subjectId,
            programId: entry.programId || entry.subjectId.programId,
            departmentId: entry.departmentId || entry.subjectId.departmentId,
            batchId: entry.batchId || entry.subjectId.batchId
          });
        }
      }
    });

    // Combine direct and timetable subjects (avoid duplicates)
    const subjectMap = new Map();
    [...directSubjects, ...timetableSubjectMap.values()].forEach(s => {
      subjectMap.set(String(s._id), s);
    });
    const subjects = Array.from(subjectMap.values());

    const subjectIds = subjects.map(s => s._id);

    const timetable = subjectIds.length
      ? await Timetable.find({
          organizationId: orgId,
          instructorId: userId,
          subjectId: { $in: subjectIds },
          isActive: true
        })
          .populate('batchId', 'name code year semester')
          .sort({ day: 1, startTime: 1 })
          .lean()
      : [];

    const batchesBySubject = new Map();
    const upcomingBySubject = new Map();
    timetable.forEach(t => {
      const sid = String(t.subjectId);
      const arr = batchesBySubject.get(sid) || [];
      if (t.batchId && !arr.some(b => String(b._id) === String(t.batchId._id))) arr.push(t.batchId);
      batchesBySubject.set(sid, arr);

      const up = upcomingBySubject.get(sid) || [];
      up.push({
        _id: t._id,
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room,
        meetingLink: t.meetingLink,
        batch: t.batchId
      });
      upcomingBySubject.set(sid, up);
    });

    const batchIds = [...new Set(timetable.map(t => String(t.batchId?._id || t.batchId)).filter(Boolean))];
    const studentsByBatch = batchIds.length
      ? await User.aggregate([
          { $match: { organization_id: orgId, role: 'student', isActive: true, 'profile.batch': { $in: batchIds.map(id => new (require('mongoose').Types.ObjectId)(id)) } } },
          { $group: { _id: '$profile.batch', count: { $sum: 1 } } }
        ])
      : [];
    const studentCountMap = new Map(studentsByBatch.map(x => [String(x._id), x.count]));

    const cards = subjects.map(s => {
      const sid = String(s._id);
      const batches = batchesBySubject.get(sid) || (s.batchId ? [s.batchId] : []);
      const studentsCount = batches.reduce((acc, b) => acc + (studentCountMap.get(String(b._id)) || 0), 0);
      const upcomingClasses = upcomingBySubject.get(sid) || [];
      return {
        ...s,
        batches,
        studentsCount,
        upcomingClasses
      };
    });

    res.success({ subjects: cards }, 'My subjects retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load my subjects', 500);
  }
});

// GET /api/college/instructor/my-subjects
router.get('/my-subjects', async (req, res) => {
  try {
    const { Subject, Timetable, User } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const subjects = await Subject.find({
      instructorId: userId,
      organizationId: orgId,
      isActive: true
    })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code year semester')
      .sort({ semester: 1, name: 1 })
      .lean();

    const subjectIds = subjects.map(s => s._id);
    const timetable = subjectIds.length
      ? await Timetable.find({
          organizationId: orgId,
          instructorId: userId,
          subjectId: { $in: subjectIds },
          isActive: true
        })
          .populate('batchId', 'name code year semester')
          .sort({ day: 1, startTime: 1 })
          .lean()
      : [];

    const batchesBySubject = new Map();
    const upcomingBySubject = new Map();
    timetable.forEach(t => {
      const sid = String(t.subjectId);
      const arr = batchesBySubject.get(sid) || [];
      if (t.batchId && !arr.some(b => String(b._id) === String(t.batchId._id))) arr.push(t.batchId);
      batchesBySubject.set(sid, arr);

      const up = upcomingBySubject.get(sid) || [];
      up.push({
        _id: t._id,
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room,
        meetingLink: t.meetingLink,
        batch: t.batchId
      });
      upcomingBySubject.set(sid, up);
    });

    const mongoose = require('mongoose');
    const batchIds = [...new Set(timetable.map(t => String(t.batchId?._id || t.batchId)).filter(Boolean))];
    const studentsByBatch = batchIds.length
      ? await User.aggregate([
          {
            $match: {
              organization_id: orgId,
              role: 'student',
              isActive: true,
              'profile.batch': { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) }
            }
          },
          { $group: { _id: '$profile.batch', count: { $sum: 1 } } }
        ])
      : [];
    const studentCountMap = new Map(studentsByBatch.map(x => [String(x._id), x.count]));

    const cards = subjects.map(s => {
      const sid = String(s._id);
      const batches = batchesBySubject.get(sid) || (s.batchId ? [s.batchId] : []);
      const studentsCount = batches.reduce((acc, b) => acc + (studentCountMap.get(String(b._id)) || 0), 0);
      const upcomingClasses = upcomingBySubject.get(sid) || [];
      return {
        ...s,
        batches,
        studentsCount,
        upcomingClasses
      };
    });

    res.success({ subjects: cards }, 'My subjects retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load my subjects', 500);
  }
});

// GET /api/college/instructor/subjects/:id/students
router.get('/subjects/:id/students', async (req, res) => {
  try {
    const { Subject, Batch, User } = require('../../models');
    const subject = await Subject.findById(req.params.id)
      .populate('programId', 'name code');
    
    if (!subject) return res.error('Subject not found', 'Not found', 404);

    // Find batches for this program
    const batches = await Batch.find({ 
      programId: subject.programId, 
      isActive: true 
    });

    // Get students from all batches
    const studentIds = batches.flatMap(b => b.students);
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      isActive: true
    }).select('profile.firstName profile.lastName email profile.rollNumber');

    res.success({ subject, students, batches }, 'Subject students retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load students', 500);
  }
});

// ===== TIMETABLE =====
// GET /api/college/instructor/timetable
router.get('/timetable', async (req, res) => {
  try {
    const { Timetable, Subject, Batch, AcademicProgram } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { day } = req.query;

    let query = { instructorId: userId, organizationId: orgId, isActive: true };
    if (day) query.day = day;

    const entries = await Timetable.find(query)
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code')
      .populate('programId', 'name code')
      .sort({ day: 1, startTime: 1 });

    res.success({ entries }, 'Timetable retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load timetable', 500);
  }
});

// ===== ATTENDANCE (Academic Subject) =====
// POST /api/college/instructor/attendance
router.post('/attendance', async (req, res) => {
  try {
    const { Attendance, Timetable, Subject } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const orgType = String(req.user.organization_type || req.user.organizationType || 'college').toLowerCase();
    const { subjectId, batchId, studentId, date, status, startTime, endTime } = req.body;

    if (!subjectId || !studentId || !date || !status) {
      return res.error('Missing required fields', 'subjectId, studentId, date, status are required', 400);
    }

    const subject = await Subject.findOne({ _id: subjectId, organizationId: orgId, isActive: true });
    if (!subject) {
      return res.error('Subject not found', 'Subject not found', 404);
    }

    // Try to derive times from timetable if not provided
    let resolvedStart = startTime;
    let resolvedEnd = endTime;
    if (!resolvedStart || !resolvedEnd) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const d = new Date(date);
      const dayName = dayNames[d.getDay()];
      const tt = await Timetable.findOne({
        organizationId: orgId,
        subjectId,
        ...(batchId ? { batchId } : {}),
        instructorId: userId,
        day: dayName,
        isActive: true
      }).sort({ startTime: 1 });
      resolvedStart = resolvedStart || tt?.startTime || '10:00';
      resolvedEnd = resolvedEnd || tt?.endTime || '11:00';
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const [sh, sm] = String(resolvedStart).split(':').map(n => parseInt(n, 10));
    const [eh, em] = String(resolvedEnd).split(':').map(n => parseInt(n, 10));
    const duration = Math.max(1, ((eh * 60 + em) - (sh * 60 + sm)) || 60);

    let session = await Attendance.findOne({
      organization_id: orgId,
      subjectId,
      session_date: sessionDate,
      start_time: resolvedStart,
      is_active: true
    });

    if (!session) {
      session = new Attendance({
        organization_id: orgId,
        organizationType: orgType,
        subjectId,
        instructor_id: userId,
        session_date: sessionDate,
        start_time: resolvedStart,
        end_time: resolvedEnd,
        total_duration_minutes: duration,
        attendance_records: []
      });
    }

    const saved = await session.markStudentAttendance(studentId, status, { marked_by: userId });
    res.success({ attendance: saved }, 'Attendance marked successfully');
  } catch (error) {
    res.error(error.message, 'Failed to mark attendance', 500);
  }
});

 // GET /api/college/instructor/attendance
 router.get('/attendance', async (req, res) => {
  try {
    const { Attendance, Subject } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { subjectId, batchId, startDate, endDate } = req.query;

    const match = {
      organization_id: orgId,
      is_active: true,
      instructor_id: userId
    };

    if (subjectId) match.subjectId = subjectId;
    if (batchId) match.batchId = batchId;

    if (startDate || endDate) {
      match.session_date = {};
      if (startDate) match.session_date.$gte = new Date(startDate);
      if (endDate) match.session_date.$lte = new Date(endDate);
    }

    const sessions = await Attendance.find(match)
      .populate('subjectId', 'name code')
      .sort({ session_date: -1, start_time: -1 })
      .limit(200)
      .lean();

    const subjectIds = [...new Set(sessions.map(s => String(s.subjectId?._id || s.subjectId)).filter(Boolean))];
    const subjects = subjectIds.length
      ? await Subject.find({ _id: { $in: subjectIds }, organizationId: orgId, isActive: true })
          .select('_id batchId')
          .lean()
      : [];
    const batchMap = new Map(subjects.map(s => [String(s._id), s.batchId]));

    const normalized = sessions.map(s => ({
      ...s,
      batchId: s.batchId || batchMap.get(String(s.subjectId?._id || s.subjectId)) || null
    }));

    res.success({ sessions: normalized }, 'Attendance sessions retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance sessions', 500);
  }
 });

// GET /api/college/instructor/attendance/batch/:batchId/subject/:subjectId
router.get('/attendance/batch/:batchId/subject/:subjectId', async (req, res) => {
  try {
    const { Attendance, User } = require('../../models');
    const { batchId, subjectId } = req.params;
    const { date } = req.query;

    let query = { batchId, subjectId };
    if (date) query.date = new Date(date);

    const records = await Attendance.find(query)
      .populate('studentId', 'profile.firstName profile.lastName email profile.rollNumber')
      .sort({ date: -1 });

    res.success({ records }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// GET /api/college/instructor/students
// Returns students in batches that match subjects taught by instructor
router.get('/students', async (req, res) => {
  try {
    const { Subject, User } = require('../../models');
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { subjectId, batchId } = req.query;

    // Get subjects taught by this instructor
    let subjectQuery = { 
      instructorId: userId, 
      organizationId: orgId, 
      isActive: true 
    };
    if (subjectId) subjectQuery._id = subjectId;
    
    const instructorSubjects = await Subject.find(subjectQuery)
      .populate('batchId', 'name code')
      .populate('programId', 'name code')
      .lean();

    // Get batch IDs from these subjects
    const batchIds = [...new Set(instructorSubjects.map(s => String(s.batchId?._id || s.batchId)).filter(Boolean))];
    
    if (batchIds.length === 0) {
      return res.success({ students: [], count: 0 }, 'No batches assigned to instructor');
    }

    // Find students in these batches
    let studentQuery = { 
      organization_id: orgId, 
      role: 'student', 
      'profile.batch': { $in: batchIds }
    };
    if (batchId) {
      // If specific batch requested, filter to that batch
      studentQuery['profile.batch'] = batchId;
    }

    const students = await User.find(studentQuery)
      .select('firstName lastName email profile rollNumber status')
      .lean();

    // Enrich student data with batch and subject info
    const enrichedStudents = students.map(student => {
      const studentBatchId = String(student.profile?.batch);
      const matchingSubjects = instructorSubjects.filter(s => 
        String(s.batchId?._id || s.batchId) === studentBatchId
      );
      
      return {
        _id: student._id,
        firstName: student.firstName || student.profile?.firstName,
        lastName: student.lastName || student.profile?.lastName,
        email: student.email,
        rollNumber: student.rollNumber || student.profile?.rollNumber,
        batch: matchingSubjects[0]?.batchId,
        program: matchingSubjects[0]?.programId,
        subjects: matchingSubjects.map(s => ({ _id: s._id, name: s.name, code: s.code })),
        status: student.status,
        enrolledSubjects: student.profile?.enrolledSubjects || []
      };
    });

    res.success({ 
      students: enrichedStudents, 
      count: enrichedStudents.length,
      batches: batchIds.length 
    }, 'Students retrieved successfully');
  } catch (error) {
    console.error('Instructor students error:', error);
    res.error(error.message, 'Failed to load students', 500);
  }
});

// GET /api/college/instructor/users
router.get('/users', async (req, res) => {
  try {
    const { organization_id, _id: instructorId } = req.user;
    const orgIdStr = typeof organization_id === 'object' && organization_id._id ? organization_id._id : organization_id;
    
    const User = require('../../models/User');
    const InstructorAssignment = require('../../models/InstructorAssignment');
    const Enrollment = require('../../models/Enrollment');

    // 1. Get Org Admins
    const admins = await User.find({
      organization_id: orgIdStr,
      role: { $in: ['org_admin', 'organization_admin'] },
      status: 'active'
    }).select('full_name first_name last_name email role profileImageUrl');

    // 2. Get students in active batches
    const assignments = await InstructorAssignment.find({
      instructorId,
      organizationId: orgIdStr,
      isActive: true
    }).select('batchId');
    const batchIds = assignments.map(a => a.batchId);

    const enrollments = await Enrollment.find({
      batchId: { $in: batchIds },
      status: 'active'
    }).populate('studentId', 'full_name first_name last_name email role profileImageUrl');

    // Extract unique students
    const studentMap = new Map();
    enrollments.forEach(e => {
      if (e.studentId && !studentMap.has(e.studentId._id.toString())) {
        studentMap.set(e.studentId._id.toString(), e.studentId);
      }
    });
    
    const students = Array.from(studentMap.values());

    res.status(200).json({
      success: true,
      data: [...admins, ...students]
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

module.exports = router;
