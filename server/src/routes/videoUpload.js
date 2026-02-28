const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth').authMiddleware;
const { requireRole } = require('../middleware/auth');
const VideoUploadController = require('../controllers/VideoUploadController');

// All routes require authentication and instructor role
router.use(authMiddleware);
router.use(requireRole(['instructor', 'org_admin', 'teacher', 'admin']));

// Upload video to lecture
router.post(
  '/lectures/:lectureId/upload-video',
  VideoUploadController.getUploadMiddleware(),
  VideoUploadController.uploadVideo
);

// Delete video from lecture
router.delete('/lectures/:lectureId/video', VideoUploadController.deleteVideo);

// Get video upload status
router.get('/lectures/:lectureId/video-status', VideoUploadController.getVideoStatus);

// ─────────────────────────────────────────────────────────────
// GET /api/instructor/quiz-submissions
// Returns all quiz attempts for this instructor's quizzes
// ─────────────────────────────────────────────────────────────
router.get('/quiz-submissions', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Quiz = require('../models/Quiz');
    const QuizAttempt = require('../models/QuizAttempt');

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { page = 1, limit = 50, quizId, courseId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Get all quizzes belonging to this instructor in this org
    const quizQuery = {
      organization_id: orgId,
      is_active: true
    };
    // Restrict to instructor's own quizzes unless admin
    if (!['admin', 'org_admin'].includes(req.user.role)) {
      quizQuery.instructor_id = req.user._id;
    }
    if (quizId && quizId.match(/^[0-9a-fA-F]{24}$/)) quizQuery._id = quizId;
    if (courseId && courseId.match(/^[0-9a-fA-F]{24}$/)) quizQuery.course_id = courseId;

    const instructorQuizzes = await Quiz.find(quizQuery).select('_id title course_id').lean();
    const quizIds = instructorQuizzes.map(q => q._id);
    const quizMap = {};
    instructorQuizzes.forEach(q => { quizMap[q._id.toString()] = q; });

    if (quizIds.length === 0) {
      return res.json({
        success: true,
        data: { submissions: [], pagination: { page: 1, pages: 0, total: 0 } }
      });
    }

    // 2. Fetch all attempts for these quizzes with student and course populated
    const total = await QuizAttempt.countDocuments({ quiz_id: { $in: quizIds }, is_active: true });

    const attempts = await QuizAttempt.find({ quiz_id: { $in: quizIds }, is_active: true })
      .populate('student_id', 'name email profile avatar')
      .populate('course_id', 'title thumbnail')
      .sort({ submitted_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 3. Get the quiz questions for review (needed for question-by-question results)
    const quizzesWithQuestions = await Quiz.find({ _id: { $in: quizIds } })
      .select('_id questions title total_marks pass_percentage')
      .lean();
    const quizWithQMap = {};
    quizzesWithQuestions.forEach(q => { quizWithQMap[q._id.toString()] = q; });

    // 4. Enrich each attempt with all needed fields for the dashboard
    const submissions = attempts.map(attempt => {
      const quizData = quizWithQMap[attempt.quiz_id?.toString()] || {};
      const student = attempt.student_id || {};
      const course = attempt.course_id || {};

      // Build question review if quiz questions available
      const questionReview = quizData.questions
        ? attempt.answers.map((ans, idx) => {
          const q = quizData.questions[ans.question_index] || quizData.questions[idx];
          return {
            questionText: q?.question || `Question ${idx + 1}`,
            options: q?.options || [],
            selectedOption: ans.selected_option,
            correctAnswer: q?.correct_answer,
            selectedText: q?.options?.[ans.selected_option] || `Option ${ans.selected_option + 1}`,
            correctText: q?.options?.[q?.correct_answer] || '',
            isCorrect: ans.is_correct,
            explanation: q?.explanation || ''
          };
        })
        : [];

      return {
        _id: attempt._id,
        // Student info
        studentId: student._id,
        studentName: student.name || 'Unknown Student',
        studentEmail: student.email || '',
        studentAvatar: student.profile?.avatar || student.avatar || null,
        // Quiz info
        quizId: attempt.quiz_id,
        quizTitle: quizData.title || 'Unknown Quiz',
        totalMarks: quizData.total_marks || attempt.total_questions,
        passPercentage: quizData.pass_percentage || 60,
        // Course info
        courseId: course._id,
        courseTitle: course.title || 'Unknown Course',
        // Attempt result
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        percentage: Math.round(attempt.percentage || 0),
        passed: attempt.passed,
        attemptNumber: attempt.attempt_number,
        timeTakenSeconds: attempt.time_taken_seconds,
        submittedAt: attempt.submitted_at,
        // Question-level review
        answersCount: attempt.answers?.length || 0,
        correctCount: attempt.answers?.filter(a => a.is_correct).length || 0,
        questionReview
      };
    });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Quiz submissions fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
