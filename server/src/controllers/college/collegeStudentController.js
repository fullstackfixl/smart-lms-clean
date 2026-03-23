const mongoose = require('mongoose');

const { Course, Enrollment, LiveClass, Quiz, QuizAttempt, Attendance, Certificate } = require('../../models');
const { createActivityLog } = require('../../services/activityLogService');

function normalizeOrgId(user) {
  return user.organization_id?._id || user.organization_id;
}

exports.getDashboard = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);

    const enrollments = await Enrollment.find({ organization_id: organizationId, student_id: req.user._id, status: { $ne: 'cancelled' } })
      .populate('course_id', 'title description instructor_id')
      .lean();

    const courseIds = enrollments.map(e => e.course_id?._id).filter(Boolean);

    const [upcomingLiveClasses, certificates] = await Promise.all([
      LiveClass.find({ organization_id: organizationId, course_id: { $in: courseIds }, scheduled_date: { $gte: new Date() }, is_active: true })
        .sort({ scheduled_date: 1 })
        .limit(10)
        .populate('course_id', 'title')
        .populate('instructor_id', 'name email')
        .lean(),
      Certificate.find({ organization_id: organizationId, user_id: req.user._id }).populate('course_id', 'title').lean().catch(() => [])
    ]);

    const attendance = await Attendance.getStudentAttendanceSummary(req.user._id, organizationId).catch(() => null);

    const courses = enrollments.map(e => ({
      enrollmentId: e._id,
      course: e.course_id,
      progress: e.progress?.completionPercentage || 0,
      status: e.status
    }));

    return res.status(200).json({
      success: true,
      data: {
        courses,
        attendance,
        progress: courses.map(c => ({ courseId: c.course?._id, completion: c.progress })),
        certificates,
        upcomingLiveClasses
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);

    const enrollments = await Enrollment.find({ 
      organization_id: organizationId, 
      student_id: req.user._id, 
      status: { $ne: 'cancelled' } 
    })
      .populate('course_id', 'title description instructor_id cover_image category')
      .lean();

    const courses = enrollments.map(e => ({
      enrollmentId: e._id,
      course: e.course_id,
      progress: e.progress?.completionPercentage || 0,
      status: e.status
    }));

    return res.status(200).json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: courseId } = req.params;

    const enrollment = await Enrollment.findOne({ organization_id: organizationId, student_id: req.user._id, course_id: courseId, status: { $ne: 'cancelled' } });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId })
      .populate('instructor_id', 'name email')
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const [quizzes, liveClasses] = await Promise.all([
      Quiz.find({ organization_id: organizationId, course_id: courseId, is_active: true }).lean(),
      LiveClass.find({ organization_id: organizationId, course_id: courseId, is_active: true }).sort({ scheduled_date: 1 }).lean()
    ]);

    return res.status(200).json({
      success: true,
      data: { course, enrollment, quizzes, liveClasses }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinLiveClass = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: liveClassId } = req.params;

    const liveClass = await LiveClass.findOne({ _id: liveClassId, organization_id: organizationId, is_active: true });
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    const enrollment = await Enrollment.findOne({ organization_id: organizationId, student_id: req.user._id, course_id: liveClass.course_id, status: 'active' });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const canJoin = liveClass.canJoinNow();
    if (!canJoin) {
      return res.status(400).json({ success: false, message: 'Live class not open for joining right now' });
    }

    liveClass.addAttendance(req.user._id, new Date());
    await liveClass.save();

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Student joined live class',
      metadata: { liveClassId: liveClass._id, courseId: liveClass.course_id }
    });

    return res.status(200).json({
      success: true,
      data: { meeting_url: liveClass.meeting_url, liveClassId: liveClass._id },
      message: 'Joined live class'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const organizationId = req.collegeOrganizationId || normalizeOrgId(req.user);
    const { id: quizId } = req.params;
    const { answers, started_at } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'answers are required' });
    }

    const QuizModel = mongoose.model('Quiz');
    const quiz = await QuizModel.findOne({ _id: quizId, organization_id: organizationId, is_active: true });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const enrollment = await Enrollment.findOne({ organization_id: organizationId, student_id: req.user._id, course_id: quiz.course_id, status: { $in: ['active', 'completed'] } });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const attemptNumber = (await QuizAttempt.countDocuments({ organization_id: organizationId, quiz_id: quiz._id, student_id: req.user._id })) + 1;
    if (attemptNumber > quiz.max_attempts) {
      return res.status(400).json({ success: false, message: 'Max attempts reached' });
    }

    const attempt = await QuizAttempt.create({
      organization_id: organizationId,
      quiz_id: quiz._id,
      student_id: req.user._id,
      course_id: quiz.course_id,
      attempt_number: attemptNumber,
      answers,
      started_at: started_at ? new Date(started_at) : new Date(),
      submitted_at: new Date(),
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Quiz attempted',
      metadata: { quizId: quiz._id, attemptId: attempt._id, percentage: attempt.percentage, passed: attempt.passed }
    });

    return res.status(201).json({ success: true, data: attempt, message: 'Quiz submitted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
