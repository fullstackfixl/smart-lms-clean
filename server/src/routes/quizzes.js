const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const GamificationPoints = require('../models/GamificationPoints');
const UserBadge = require('../models/UserBadge');
const notificationService = require('../utils/notificationService');
const moduleGuard = require('../middleware/moduleGuard');
const router = express.Router();

// Apply module guard to all quiz routes
router.use(auth, moduleGuard('EXAMS'));

// Validation middleware
const validateQuizCreation = [
  body('course_id')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('lesson_id')
    .optional()
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Question text is required'),
  body('questions.*.options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Each question must have 2-6 options'),
  body('questions.*.correct_answer')
    .isInt({ min: 0 })
    .withMessage('Correct answer must be a valid option index'),
  body('questions.*.explanation')
    .optional()
    .trim(),
  body('timer_minutes')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Timer must be between 1 and 180 minutes'),
  body('pass_percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Pass percentage must be between 0 and 100'),
  body('max_attempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max attempts must be between 1 and 10')
];

const validateQuizUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Valid quiz ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('questions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('timer_minutes')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Timer must be between 1 and 180 minutes'),
  body('pass_percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Pass percentage must be between 0 and 100'),
  body('max_attempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max attempts must be between 1 and 10')
];

// Middleware to check instructor permissions
const checkInstructorPermission = async (req, res, next) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only instructors and admins can manage quizzes'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Permission check failed'
    });
  }
};

// POST /api/quizzes - Create new quiz
router.post('/', auth, checkInstructorPermission, validateQuizCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const {
      course_id,
      lesson_id,
      title,
      description,
      questions,
      timer_minutes,
      pass_percentage,
      max_attempts
    } = req.body;

    // Verify course exists and belongs to user's organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: req.user.organization_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found or access denied'
      });
    }

    // Validate questions format
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (question.correct_answer >= question.options.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid question format',
          message: `Question ${i + 1}: Correct answer index is out of range`
        });
      }
    }

    // Create quiz
    const quiz = new Quiz({
      organization_id: req.user.organization_id,
      course_id,
      lesson_id: lesson_id || undefined,
      instructor_id: req.user._id,
      title,
      description,
      questions,
      timer_minutes,
      pass_percentage: pass_percentage || 60,
      max_attempts: max_attempts || 3
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully'
    });

  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create quiz'
    });
  }
});

// GET /api/quizzes - List quizzes with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      course_id,
      instructor_id,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query with organization isolation
    const query = {
      organization_id: req.user.organization_id,
      is_active: true
    };

    if (course_id) {
      query.course_id = course_id;
    }

    if (instructor_id) {
      query.instructor_id = instructor_id;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For students, only show quizzes from courses they're enrolled in
    if (req.user.role === 'student') {
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({
        student_id: req.user._id,
        organization_id: req.user.organization_id,
        status: 'active'
      }).select('course_id');

      const enrolledCourseIds = enrollments.map(e => e.course_id);
      query.course_id = { $in: enrolledCourseIds };
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('course_id', 'title')
        .populate('instructor_id', 'full_name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Quiz.countDocuments(query)
    ]);

    // For students, return quiz without correct answers
    const responseQuizzes = req.user.role === 'student'
      ? quizzes.map(quiz => quiz.getStudentVersion())
      : quizzes;

    res.json({
      success: true,
      data: {
        quizzes: responseQuizzes,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Quiz listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch quizzes'
    });
  }
});

// GET /api/quizzes/:id - Get quiz details
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid quiz ID'
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    })
      .populate('course_id', 'title description')
      .populate('instructor_id', 'full_name email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check if user can access this quiz
    const accessCheck = await quiz.canUserAccess(req.user);
    if (!accessCheck.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this quiz'
      });
    }

    // For students, return quiz without correct answers
    const responseQuiz = req.user.role === 'student' && accessCheck.reason === 'enrolled'
      ? quiz.getStudentVersion()
      : quiz;

    res.json({
      success: true,
      data: responseQuiz
    });

  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch quiz'
    });
  }
});

// PUT /api/quizzes/:id - Update quiz
router.put('/:id', auth, checkInstructorPermission, validateQuizUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check if user can modify this quiz (instructor or admin)
    if (req.user.role !== 'admin' && quiz.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify your own quizzes'
      });
    }

    // Validate questions if provided
    if (req.body.questions) {
      for (let i = 0; i < req.body.questions.length; i++) {
        const question = req.body.questions[i];
        if (question.correct_answer >= question.options.length) {
          return res.status(400).json({
            success: false,
            error: 'Invalid question format',
            message: `Question ${i + 1}: Correct answer index is out of range`
          });
        }
      }
    }

    // Update quiz
    const updateFields = {};
    const allowedFields = ['title', 'description', 'questions', 'timer_minutes', 'pass_percentage', 'max_attempts'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    Object.assign(quiz, updateFields);
    await quiz.save();

    res.json({
      success: true,
      data: quiz,
      message: 'Quiz updated successfully'
    });

  } catch (error) {
    console.error('Quiz update error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update quiz'
    });
  }
});

// DELETE /api/quizzes/:id - Delete quiz (soft delete)
router.delete('/:id', auth, checkInstructorPermission, [
  param('id').isMongoId().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid quiz ID'
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check if user can delete this quiz (instructor or admin)
    if (req.user.role !== 'admin' && quiz.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own quizzes'
      });
    }

    // Check if quiz has attempts
    const QuizAttempt = require('../models/QuizAttempt');
    const attemptCount = await QuizAttempt.countDocuments({
      quiz_id: quiz._id,
      is_active: true
    });

    if (attemptCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete quiz',
        message: 'Quiz cannot be deleted as it has student attempts'
      });
    }

    // Soft delete
    quiz.is_active = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Quiz deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete quiz'
    });
  }
});

// GET /api/quizzes/:id/statistics - Get quiz statistics (instructor/admin only)
router.get('/:id/statistics', auth, checkInstructorPermission, [
  param('id').isMongoId().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid quiz ID'
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check if user can view statistics (instructor or admin)
    if (req.user.role !== 'admin' && quiz.instructor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view statistics for your own quizzes'
      });
    }

    const QuizAttempt = require('../models/QuizAttempt');
    const statistics = await QuizAttempt.getQuizStatistics(quiz._id, req.user.organization_id);

    res.json({
      success: true,
      data: {
        quiz_info: {
          title: quiz.title,
          total_questions: quiz.total_questions,
          pass_percentage: quiz.pass_percentage,
          max_attempts: quiz.max_attempts
        },
        statistics
      }
    });

  } catch (error) {
    console.error('Quiz statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch quiz statistics'
    });
  }
});

// POST /api/quizzes/:id/submit - Submit quiz attempt
router.post('/:id/submit', auth, [
  param('id').isMongoId().withMessage('Valid quiz ID is required'),
  body('answers').isArray({ min: 1 }).withMessage('Answers array is required'),
  body('answers.*.question_index').isInt({ min: 0 }).withMessage('Valid question index is required'),
  body('answers.*.selected_option').isInt({ min: 0 }).withMessage('Valid selected option is required'),
  body('answers.*.time_spent_seconds').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative'),
  body('started_at').isISO8601().withMessage('Valid start time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your submission data',
        details: errors.array()
      });
    }

    // Only students can submit quizzes
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only students can submit quizzes'
      });
    }

    const { answers, started_at } = req.body;

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    }).populate('course_id', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: quiz.course_id,
      organization_id: req.user.organization_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Enrollment required',
        message: 'You must be enrolled in this course to submit the quiz'
      });
    }

    // Check attempt limit
    const existingAttempts = await QuizAttempt.find({
      quiz_id: quiz._id,
      student_id: req.user._id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (existingAttempts.length >= quiz.max_attempts) {
      return res.status(400).json({
        success: false,
        error: 'Attempt limit reached',
        message: `You have reached the maximum number of attempts (${quiz.max_attempts}) for this quiz`
      });
    }

    // Validate answers count
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid submission',
        message: 'Number of answers must match number of questions'
      });
    }

    // Validate timer if set
    const startTime = new Date(started_at);
    const submitTime = new Date();
    const timeTakenMinutes = (submitTime - startTime) / (1000 * 60);

    if (quiz.timer_minutes && timeTakenMinutes > quiz.timer_minutes + 1) { // 1 minute grace period
      return res.status(400).json({
        success: false,
        error: 'Time limit exceeded',
        message: 'Quiz submission time limit has been exceeded'
      });
    }

    // Create quiz attempt (auto-grading happens in pre-save middleware)
    const quizAttempt = new QuizAttempt({
      organization_id: req.user.organization_id,
      quiz_id: quiz._id,
      student_id: req.user._id,
      course_id: quiz.course_id,
      attempt_number: existingAttempts.length + 1,
      answers: answers,
      started_at: startTime,
      submitted_at: submitTime,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await quizAttempt.save();

    // Award gamification points if quiz passed
    let pointsAwarded = null;
    let badgesUnlocked = [];

    if (quizAttempt.passed) {
      try {
        // Award quiz points
        const pointsResult = await GamificationPoints.awardQuizPoints(
          req.user._id,
          quiz._id,
          quiz.course_id,
          req.user.organization_id,
          quiz.title,
          quizAttempt.score,
          quizAttempt.percentage
        );

        if (pointsResult.success) {
          pointsAwarded = {
            points_earned: pointsResult.points_earned,
            total_points: pointsResult.total_points
          };

          // Check for badge unlocks
          const badgeResult = await UserBadge.checkAndUnlockBadges(
            req.user._id,
            req.user.organization_id,
            pointsResult.total_points
          );

          if (badgeResult.success && badgeResult.unlocked_badges.length > 0) {
            badgesUnlocked = badgeResult.unlocked_badges.map(badge => ({
              badge_type: badge.badge_type,
              badge_name: badge.badge_name,
              badge_description: badge.badge_description,
              points_at_unlock: badge.points_at_unlock
            }));
          }
        }
      } catch (gamificationError) {
        console.error('Gamification error:', gamificationError);
        // Don't fail the quiz submission if gamification fails
      }
    }

    // Get detailed results
    const detailedResults = await quizAttempt.getDetailedResults();

    // Send quiz completion notification if passed
    if (quizAttempt.passed) {
      try {
        await notificationService.sendQuizPassedNotification({
          studentId: req.user._id,
          quizId: quiz._id,
          courseId: quiz.course_id,
          score: quizAttempt.percentage,
          organizationId: req.user.organization_id,
          organizationName: 'Smart LMS' // This should come from organization data
        });
      } catch (notificationError) {
        console.error('Failed to send quiz passed notification:', notificationError);
        // Don't fail the quiz submission if notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: {
        attempt: {
          id: quizAttempt._id,
          attempt_number: quizAttempt.attempt_number,
          score: quizAttempt.score,
          total_questions: quizAttempt.total_questions,
          percentage: quizAttempt.percentage,
          passed: quizAttempt.passed,
          time_taken_seconds: quizAttempt.time_taken_seconds,
          submitted_at: quizAttempt.submitted_at
        },
        detailed_results: detailedResults,
        gamification: {
          points_awarded: pointsAwarded,
          badges_unlocked: badgesUnlocked
        }
      },
      message: quizAttempt.passed ?
        `Congratulations! You passed with ${quizAttempt.percentage}%` :
        `Quiz completed. You scored ${quizAttempt.percentage}% (${quiz.pass_percentage}% required to pass)`
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to submit quiz'
    });
  }
});

// GET /api/quizzes/:id/start - Start quiz attempt
router.get('/:id/start', auth, [
  param('id').isMongoId().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid quiz ID'
      });
    }

    // Only students can take quizzes
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only students can take quizzes'
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    }).populate('course_id', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        message: 'Quiz not found or access denied'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: quiz.course_id,
      organization_id: req.user.organization_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Enrollment required',
        message: 'You must be enrolled in this course to take the quiz'
      });
    }

    // Check attempt limit
    const existingAttempts = await QuizAttempt.find({
      quiz_id: quiz._id,
      student_id: req.user._id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (existingAttempts.length >= quiz.max_attempts) {
      return res.status(400).json({
        success: false,
        error: 'Attempt limit reached',
        message: `You have reached the maximum number of attempts (${quiz.max_attempts}) for this quiz`
      });
    }

    // Return quiz for student (without correct answers)
    const studentQuiz = quiz.getStudentVersion();

    res.json({
      success: true,
      data: {
        quiz: studentQuiz,
        attempt_info: {
          attempt_number: existingAttempts.length + 1,
          max_attempts: quiz.max_attempts,
          remaining_attempts: quiz.max_attempts - existingAttempts.length,
          timer_minutes: quiz.timer_minutes,
          pass_percentage: quiz.pass_percentage
        },
        previous_attempts: existingAttempts.map(attempt => ({
          attempt_number: attempt.attempt_number,
          score: attempt.score,
          percentage: attempt.percentage,
          passed: attempt.passed,
          submitted_at: attempt.submitted_at
        }))
      }
    });

  } catch (error) {
    console.error('Quiz start error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to start quiz'
    });
  }
});

module.exports = router;