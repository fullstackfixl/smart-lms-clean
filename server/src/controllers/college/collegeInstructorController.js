const mongoose = require('mongoose');

const { Course, Section, Quiz, LiveClass, Enrollment, Attendance, User } = require('../../models');
const { createActivityLog } = require('../../services/activityLogService');

function normalizeOrgId(user) {
  return user.organization_id?._id || user.organization_id;
}

exports.getDashboard = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);

    const courses = await Course.find({ organization_id: organizationId, instructor_id: req.user._id, is_deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = courses.map(c => c._id);

    const [enrollments, upcomingLiveClasses, quizzes, attendanceSummary] = await Promise.all([
      Enrollment.find({ organization_id: organizationId, course_id: { $in: courseIds }, status: { $ne: 'cancelled' } })
        .select('student_id course_id status progress enrolledAt')
        .populate('student_id', 'name email profile')
        .lean(),
      LiveClass.find({ organization_id: organizationId, instructor_id: req.user._id, scheduled_date: { $gte: new Date() }, is_active: true })
        .sort({ scheduled_date: 1 })
        .limit(10)
        .populate('course_id', 'title')
        .lean(),
      Quiz.find({ organization_id: organizationId, instructor_id: req.user._id, is_active: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('course_id', 'title')
        .lean(),
      Attendance.aggregate([
        { $match: { organization_id: new mongoose.Types.ObjectId(organizationId), instructor_id: new mongoose.Types.ObjectId(req.user._id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).catch(() => [])
    ]);

    const uniqueStudents = new Set(enrollments.map(e => String(e.student_id?._id || e.student_id)).filter(Boolean));

    const completionRates = enrollments
      .map(e => Number(e.progress?.completionPercentage ?? e.progress?.completion_percentage ?? 0))
      .filter(v => Number.isFinite(v));

    const avgCompletion = completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        courses,
        studentsCount: uniqueStudents.size,
        liveClasses: upcomingLiveClasses,
        quizzes,
        analytics: {
          totalCourses: courses.length,
          totalEnrollments: enrollments.length,
          avgCompletionRate: Number(avgCompletion.toFixed(1)),
          attendance: attendanceSummary
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);

    const courses = await Course.find({ organization_id: organizationId, instructor_id: req.user._id, is_deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createModule = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, instructor_id: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const section = await Section.create({
      organization_id: organizationId,
      course_id: course._id,
      title,
      description: description || ''
    });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor created module',
      metadata: { courseId: course._id, sectionId: section._id, title: section.title }
    });

    return res.status(201).json({ success: true, data: section, message: 'Module created' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;

    const { title, description, questions, pass_percentage, max_attempts, timer_minutes } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'title and questions are required' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, instructor_id: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const quiz = await Quiz.create({
      organization_id: organizationId,
      course_id: course._id,
      instructor_id: req.user._id,
      title,
      description: description || '',
      questions,
      pass_percentage: pass_percentage ?? 60,
      max_attempts: max_attempts ?? 3,
      timer_minutes: timer_minutes ?? null,
      total_marks: questions.length,
      status: 'DRAFT',
      is_active: true
    });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor created quiz',
      metadata: { courseId: course._id, quizId: quiz._id, title: quiz.title }
    });

    return res.status(201).json({ success: true, data: quiz, message: 'Quiz created' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.startLiveClass = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;

    const { title, description, scheduled_date, start_time, duration_minutes, timezone } = req.body;

    if (!title || !scheduled_date || !start_time || !duration_minutes) {
      return res.status(400).json({ success: false, message: 'title, scheduled_date, start_time, duration_minutes are required' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, instructor_id: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const liveClass = await LiveClass.create({
      organization_id: organizationId,
      course_id: course._id,
      instructor_id: req.user._id,
      title,
      description: description || '',
      scheduled_date: new Date(scheduled_date),
      start_time,
      duration_minutes: Number(duration_minutes),
      timezone: timezone || 'UTC',
      status: 'scheduled',
      is_active: true
    });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Live class started',
      metadata: { courseId: course._id, liveClassId: liveClass._id, title: liveClass.title }
    });

    return res.status(201).json({ success: true, data: liveClass, message: 'Live class created' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, instructor_id: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollments = await Enrollment.find({ organization_id: organizationId, course_id: course._id, status: { $ne: 'cancelled' } })
      .populate('student_id', 'name email profile')
      .sort({ enrolledAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;
    const { studentId, status, session_date, start_time, end_time, session_title, liveClassId } = req.body;

    if (!studentId || !status) {
      return res.status(400).json({ success: false, message: 'studentId and status are required' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, instructor_id: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const student = await User.findOne({ _id: studentId, organization_id: organizationId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const date = session_date ? new Date(session_date) : new Date();
    const sTime = start_time || '09:00';
    const eTime = end_time || '10:00';

    const existing = await Attendance.findOne({ organization_id: organizationId, course_id: course._id, session_date: date, start_time: sTime });

    let attendanceDoc = existing;
    if (!attendanceDoc) {
      attendanceDoc = await Attendance.create({
        organization_id: organizationId,
        course_id: course._id,
        instructor_id: req.user._id,
        session_date: date,
        session_type: liveClassId ? 'live_class' : 'regular_class',
        session_title: session_title || `Attendance ${date.toISOString().slice(0, 10)}`,
        start_time: sTime,
        end_time: eTime,
        total_duration_minutes: Math.max(1, 60),
        live_class_id: liveClassId || undefined,
        attendance_records: []
      });
    }

    await attendanceDoc.markStudentAttendance(student._id, status, { marked_by: req.user._id });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Attendance marked',
      metadata: { courseId: course._id, studentId: student._id, status }
    });

    return res.status(200).json({ success: true, data: attendanceDoc, message: 'Attendance marked' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
