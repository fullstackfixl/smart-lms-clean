const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AcademicEnrollment = require('../models/AcademicEnrollment');
const Subject = require('../models/Subject');
const InstructorAssignment = require('../models/InstructorAssignment');
const Notification = require('../models/Notification');
const GamificationPoints = require('../models/GamificationPoints');
const UserBadge = require('../models/UserBadge');
const notificationService = require('../utils/notificationService');
const moduleGuard = require('../middleware/moduleGuard');
const router = express.Router();

async function getStudentAccessibleCourseIds({ organizationId, studentId }) {
  const enrollments = await AcademicEnrollment.find({
    organizationId,
    studentId
  }).select('subjectId').lean();

  const subjectIds = enrollments.map(e => e.subjectId).filter(Boolean);
  if (!subjectIds.length) return [];

  const subjects = await Subject.find({
    _id: { $in: subjectIds },
    organizationId,
    isActive: true,
    contentCourseId: { $ne: null }
  }).select('contentCourseId').lean();

  return [...new Set(subjects.map(s => String(s.contentCourseId)).filter(Boolean))];
}

// Apply module guard to all quiz routes
// Removed moduleGuard because legacy organizations do not always have modules enabled, which was causing 403 Forbidden on the courses dropdown
router.use(auth);

// Validation middleware
const validateQuizCreation = [
  body('course_id')
    .optional()
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('subjectId')
    .optional()
    .isMongoId()
    .withMessage('Valid subject ID is required'),
  body('batchId')
    .optional()
    .isMongoId()
    .withMessage('Valid batch ID is required'),
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
    if (!['instructor', 'org_admin'].includes(req.user.role)) {
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
    const orgId = req.user.organization_id?._id || req.user.organization_id;

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
      course_id: bodyCourseId,
      subjectId,
      batchId,
      lesson_id,
      title,
      description,
      questions,
      timer_minutes,
      pass_percentage,
      max_attempts
    } = req.body;

    // Validate subject+batch pairing
    if ((subjectId && !batchId) || (!subjectId && batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'subjectId and batchId must be provided together'
      });
    }

    let course_id = bodyCourseId;

    // For college flow: auto-resolve course from subject
    if (subjectId && batchId) {
      const Subject = require('../models/Subject');
      const subject = await Subject.findOne({
        _id: subjectId,
        organizationId: orgId,
        isActive: true
      }).select('contentCourseId name code batchId').lean();

      if (!subject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          message: 'Subject not found or access denied'
        });
      }

      if (!subject.contentCourseId) {
        return res.status(400).json({
          success: false,
          error: 'Subject not configured',
          message: 'Subject does not have a content course mapped. Please contact your organization admin.'
        });
      }

      // Use subject's mapped course
      course_id = String(subject.contentCourseId);

      // Validate instructor assignment for subject+batch
      if (req.user.role === 'instructor') {
        const mapping = await InstructorAssignment.findOne({
          organizationId: orgId,
          instructorId: req.user._id,
          subjectId,
          batchId,
          isActive: true
        }).select('_id').lean();

        if (!mapping) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'You are not assigned to this subject and batch'
          });
        }
      }
    }

    // Fallback: require course_id if no subject provided
    if (!course_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing course',
        message: 'Either provide subjectId+batchId or course_id'
      });
    }

    // Verify course exists and belongs to user's organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: orgId
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
      organization_id: orgId,
      course_id,
      subjectId: subjectId || null,
      batchId: batchId || null,
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

    // Create Organization Event
    const OrganizationEvent = require('../models/OrganizationEvent');
    await OrganizationEvent.create({
      organizationId: req.user.organization_id,
      type: 'NEW_QUIZ',
      message: `Instructor ${req.user.full_name || 'Generic'} created a new quiz: ${title}`,
      relatedId: quiz._id
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully'
    });

    // Best-effort: broadcast to college batch students if this course is mapped to a Subject
    setImmediate(async () => {
      try {
        const Subject = require('../models/Subject');
        const User = require('../models/User');
        const Notification = require('../models/Notification');
        const AcademicEnrollment = require('../models/AcademicEnrollment');

        let socketService = null;
        try { socketService = require('../services/socketService'); } catch (_) { }

        const orgId = req.user.organization_id?._id || req.user.organization_id;
        let subject = null;
        let students = [];

        if (subjectId && batchId) {
          subject = await Subject.findOne({ _id: subjectId, organizationId: orgId, isActive: true })
            .select('name code')
            .lean();

          const academicEnrollments = await AcademicEnrollment.find({
            organizationId: orgId,
            subjectId,
            batchId
          }).select('studentId').lean();

          const studentIds = [...new Set(academicEnrollments.map(e => String(e.studentId)).filter(Boolean))];
          if (!studentIds.length) return;

          students = await User.find({
            _id: { $in: studentIds },
            organization_id: orgId,
            role: 'student',
            isActive: true
          }).select('_id').lean();
        } else {
          subject = await Subject.findOne({ organizationId: orgId, contentCourseId: course_id, isActive: true })
            .select('batchId name code')
            .lean();

          if (!subject?.batchId) return;

          students = await User.find({
            organization_id: orgId,
            role: 'student',
            isActive: true,
            'profile.batch': subject.batchId
          }).select('_id').lean();
        }

        if (!students.length) return;

        const notificationDocs = students.map(s => ({
          organization_id: orgId,
          recipient_id: s._id,
          sender_id: req.user._id,
          type: 'general',
          title: 'New Quiz',
          message: `${req.user.name || 'Instructor'} posted a new quiz: ${title}`,
          data: {
            entityType: 'quiz',
            quizId: quiz._id,
            courseId: course_id,
            subjectId: subjectId || subject?._id || null,
            batchId: batchId || subject?.batchId || null,
            subjectName: subject.name,
            subjectCode: subject.code
          },
          priority: 'medium',
          action_url: '/student/quizzes',
          action_text: 'View Quiz'
        }));

        await Notification.insertMany(notificationDocs, { ordered: false });

        if (socketService?.io) {
          socketService.sendNotificationToUsers(
            students.map(s => String(s._id)),
            {
              type: 'general',
              title: 'New Quiz',
              message: `${req.user.name || 'Instructor'} posted a new quiz: ${title}`,
              data: { quizId: quiz._id, courseId: course_id }
            }
          );
        }
      } catch (_) {
        // ignore broadcast failures
      }
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

// POST /api/quizzes/generate-ai - AI-powered quiz generation (Gemini primary → Groq fallback)
router.post('/generate-ai', auth, checkInstructorPermission, async (req, res) => {
  try {
    const { course_id: bodyCourseId, subjectId, batchId, topic, num_questions = 5, difficulty = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'topic is required' });
    }

    if ((subjectId && !batchId) || (!subjectId && batchId)) {
      return res.status(400).json({ success: false, message: 'subjectId and batchId must be provided together' });
    }

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    let course_id = bodyCourseId;

    if (subjectId && batchId) {
      if (req.user.role === 'instructor') {
        const mapping = await InstructorAssignment.findOne({
          organizationId: orgId,
          instructorId: req.user._id,
          subjectId,
          batchId,
          isActive: true
        }).select('_id').lean();

        if (!mapping) {
          return res.status(403).json({ success: false, message: 'You are not assigned to this subject and batch' });
        }
      }

      const subject = await Subject.findOne({ _id: subjectId, organizationId: orgId, isActive: true })
        .select('contentCourseId name code')
        .lean();

      if (!subject?.contentCourseId) {
        return res.status(400).json({ success: false, message: 'Subject does not have a content course mapped (contentCourseId missing)' });
      }

      course_id = String(subject.contentCourseId);
    }

    if (!course_id) {
      return res.status(400).json({ success: false, message: 'course_id is required (or provide subjectId+batchId)' });
    }

    // Verify course belongs to this org
    const course = await Course.findOne({ _id: course_id, organization_id: orgId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or access denied' });
    }

    const prompt = `Generate ${num_questions} multiple-choice quiz questions about "${topic}" for a course called "${course.title}".
Difficulty: ${difficulty}.
Return ONLY a valid JSON array. No markdown, no extra text, no code blocks. Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation"
  }
]
correct_answer is the 0-based index of the correct option. Every question MUST have exactly 4 options.`;

    const axios = require('axios');
    let rawContent = null;
    let usedProvider = '';

    // ─── 1. Try Gemini Flash (primary) ─────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[generate-ai] Trying Gemini Flash...');
        const gemRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        rawContent = gemRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawContent) {
          usedProvider = 'Gemini Flash';
          console.log('[generate-ai] ✅ Gemini succeeded');
        }
      } catch (gemErr) {
        console.warn('[generate-ai] Gemini failed:', gemErr.response?.data?.error?.message || gemErr.message);
      }
    }

    // ─── 2. Fallback: Groq with current active model ────────────────────────────
    if (!rawContent) {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.status(500).json({ success: false, message: 'No AI API keys configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env' });
      }
      console.log('[generate-ai] Trying Groq llama-3.3-70b-versatile...');
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile', // Current active model (replaces deprecated llama3-8b-8192)
            messages: [
              { role: 'system', content: 'You are a quiz creator. Return ONLY valid JSON arrays. No markdown, no code blocks.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4096
          },
          {
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        rawContent = groqRes.data?.choices?.[0]?.message?.content?.trim();
        if (rawContent) {
          usedProvider = 'Groq (llama-3.3-70b-versatile)';
          console.log('[generate-ai] ✅ Groq succeeded');
        }
      } catch (groqErr) {
        console.error('[generate-ai] Groq failed:', groqErr.response?.data || groqErr.message);
        return res.status(500).json({
          success: false,
          message: groqErr.response?.data?.error?.message || 'Both AI providers failed. Try again.'
        });
      }
    }

    if (!rawContent) {
      return res.status(500).json({ success: false, message: 'AI returned an empty response' });
    }

    // ─── Parse JSON (strip markdown code fences if present) ───────────────────
    let questions;
    try {
      const jsonStr = rawContent
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '').trim();
      // Extract first JSON array if there's extra text
      const match = jsonStr.match(/\[[\s\S]*\]/);
      questions = JSON.parse(match ? match[0] : jsonStr);
    } catch (parseErr) {
      console.error('[generate-ai] JSON parse error. Content was:', rawContent.slice(0, 300));
      return res.status(500).json({ success: false, message: 'AI response was not valid JSON. Please try again.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ success: false, message: 'AI did not return a valid questions array' });
    }

    return res.status(200).json({
      success: true,
      data: { questions, course_id, topic },
      message: `Generated ${questions.length} questions successfully via ${usedProvider}`
    });

  } catch (error) {
    console.error('[generate-ai] Unexpected error:', error.message);
    return res.status(500).json({ success: false, message: 'AI quiz generation failed unexpectedly' });
  }
});

// PATCH /api/quizzes/:id/publish - Publish a draft quiz
router.patch('/:id/publish', auth, checkInstructorPermission, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Only the creating instructor or org_admin can publish
    if (quiz.instructor_id.toString() !== req.user._id.toString() && req.user.role !== 'org_admin') {
      return res.status(403).json({ success: false, message: 'Only the quiz creator or org admin can publish' });
    }

    if (quiz.status === 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Quiz is already published' });
    }

    quiz.status = 'PUBLISHED';
    await quiz.save();

    // === Broadcast to students enrolled in the matching academic subject(s) ===
    try {
      if (global.io) {
        global.io.to(`organization_${req.user.organization_id}`).emit('quiz_published', {
          quiz_id: quiz._id,
          title: quiz.title,
          course_id: quiz.course_id,
          instructor_id: quiz.instructor_id
        });
      }

      const orgId = req.user.organization_id?._id || req.user.organization_id;
      let studentIds = [];

      if (quiz.subjectId && quiz.batchId) {
        const academicEnrollments = await AcademicEnrollment.find({
          organizationId: orgId,
          subjectId: quiz.subjectId,
          batchId: quiz.batchId
        }).select('studentId').lean();
        studentIds = [...new Set(academicEnrollments.map(e => String(e.studentId)).filter(Boolean))];
      } else {
        const subjects = await Subject.find({
          organizationId: orgId,
          isActive: true,
          contentCourseId: quiz.course_id
        }).select('_id').lean();

        const subjectIds = subjects.map(s => s._id);
        if (subjectIds.length) {
          const academicEnrollments = await AcademicEnrollment.find({
            organizationId: orgId,
            subjectId: { $in: subjectIds }
          }).select('studentId').lean();
          studentIds = [...new Set(academicEnrollments.map(e => String(e.studentId)).filter(Boolean))];
        }
      }

      if (studentIds.length) {
        const notifications = studentIds.map(studentId => ({
          user_id: studentId,
          organization_id: orgId,
          type: 'quiz_available',
          title: 'New Quiz Available',
          message: `A new quiz "${quiz.title}" has been published in your course.`,
          link: `/student/courses/${quiz.course_id}`,
          read: false
        }));
        await Notification.insertMany(notifications, { ordered: false });
      }
    } catch (notifyErr) {
      console.warn('[quiz/publish] Notification error (non-critical):', notifyErr.message);
    }

    return res.status(200).json({
      success: true,
      data: quiz,
      message: 'Quiz published successfully and students notified'
    });
  } catch (error) {
    console.error('[quiz/publish] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to publish quiz' });
  }
});

// PATCH /api/quizzes/:id/unpublish - Revert quiz to draft
router.patch('/:id/unpublish', auth, checkInstructorPermission, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    quiz.status = 'DRAFT';
    await quiz.save();
    return res.status(200).json({ success: true, data: quiz, message: 'Quiz reverted to draft' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unpublish quiz' });
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
      const orgId = req.user.organization_id?._id || req.user.organization_id;
      const enrolledCourseIds = await getStudentAccessibleCourseIds({
        organizationId: orgId,
        studentId: req.user._id
      });
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

// 2️⃣ INSTRUCTOR CREATE QUIZ (MANUAL) - Legacy / is similar but spec calls for /create
// We can alias / to /create or just implement /create as requested
router.post('/create', auth, checkInstructorPermission, validateQuizCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { course_id, title, description, questions, timer_minutes, pass_percentage, max_attempts } = req.body;

    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or belongs to another organization' });
    }

    const quiz = new Quiz({
      organization_id: orgId,
      course_id,
      instructor_id: req.user.id,
      title,
      description,
      questions,
      timer_minutes,
      pass_percentage: pass_percentage || 60,
      max_attempts: max_attempts || 3,
      status: 'DRAFT',
      is_active: true
    });

    await quiz.save();

    const OrganizationEvent = require('../models/OrganizationEvent');
    await OrganizationEvent.create({
      organizationId: orgId,
      type: 'NEW_QUIZ',
      message: `Instructor ${req.user.full_name || req.user.profile?.fullName || ''} created a new quiz: ${title}`,
      relatedId: quiz._id
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3️⃣ AI GEMINI QUIZ GENERATION
router.post('/generate-ai', auth, checkInstructorPermission, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('numberOfQuestions').isInt({ min: 1, max: 20 }).withMessage('Questions must be between 1 and 20'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  body('courseId').isMongoId().withMessage('Valid courseId is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, details: errors.array() });

    const { prompt, numberOfQuestions, difficulty, courseId } = req.body;

    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({ _id: courseId, organization_id: orgId });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const aiService = require('../services/aiService');
    const questions = await aiService.generateGeminiQuiz(prompt, numberOfQuestions, difficulty, courseId, orgId);

    // Save as DRAFT as per spec
    const quiz = new Quiz({
      organization_id: orgId,
      course_id: courseId,
      instructor_id: req.user._id,
      title: `AI Generated: ${prompt.substring(0, 30)}...`,
      questions,
      status: 'DRAFT',
      is_active: true
    });

    await quiz.save();

    res.json({ success: true, data: { quiz, questions } });
  } catch (error) {
    console.error('AI Generation Route Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4️⃣ PUBLISH QUIZ
router.post('/publish/:quizId', auth, checkInstructorPermission, async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const quiz = await Quiz.findOne({ _id: req.params.quizId, organization_id: orgId });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    quiz.status = 'PUBLISHED';
    await quiz.save();

    // Create Organization Event
    const OrganizationEvent = require('../models/OrganizationEvent');
    const event = await OrganizationEvent.create({
      organizationId: orgId,
      type: 'QUIZ_PUBLISHED',
      message: `Quiz published: ${quiz.title}`,
      relatedId: quiz._id
    });

    // Real-time update (Optional but recommended)
    if (global.io) {
      global.io.to(`organization_${orgId}`).emit('new_event', event);
    }

    res.json({ success: true, message: 'Quiz published successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5️⃣ STUDENT VIEW QUIZZES - shows ALL published quizzes in the org
router.get('/student', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Role must be STUDENT' });

    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Get ALL published quizzes in the same organization - no enrollment restriction on viewing
    const quizzes = await Quiz.find({
      organization_id: orgId,
      status: 'PUBLISHED',
      is_active: true
    })
      .populate('course_id', 'title thumbnail')
      .populate('instructor_id', 'name profile')
      .sort({ created_at: -1 })
      .lean();

    // Get all quiz attempts for this student to attach status info
    const quizIds = quizzes.map(q => q._id);
    const attempts = await QuizAttempt.find({
      quiz_id: { $in: quizIds },
      student_id: req.user._id,
      is_active: true
    }).select('quiz_id score percentage passed attempt_number submitted_at').lean();

    // Build attempt map for fast lookup
    const attemptsByQuiz = {};
    attempts.forEach(a => {
      const key = a.quiz_id.toString();
      if (!attemptsByQuiz[key]) attemptsByQuiz[key] = [];
      attemptsByQuiz[key].push(a);
    });

    // Attach attempt data and strip correct answers from questions
    const enrichedQuizzes = quizzes.map(quiz => {
      const quizAttempts = attemptsByQuiz[quiz._id.toString()] || [];
      const bestAttempt = quizAttempts.sort((a, b) => b.percentage - a.percentage)[0] || null;

      // Remove correct_answer from questions for students
      const safeQuestions = (quiz.questions || []).map(q => ({
        question: q.question,
        options: q.options
      }));

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        course: quiz.course_id,
        instructor: quiz.instructor_id,
        total_marks: quiz.total_marks,
        timer_minutes: quiz.timer_minutes,
        pass_percentage: quiz.pass_percentage,
        max_attempts: quiz.max_attempts,
        questions_count: (quiz.questions || []).length,
        questions: safeQuestions,
        created_at: quiz.created_at,
        // Attempt status
        attemptsCount: quizAttempts.length,
        attemptsLeft: Math.max(0, quiz.max_attempts - quizAttempts.length),
        bestScore: bestAttempt?.score || null,
        bestPercentage: bestAttempt ? Math.round(bestAttempt.percentage) : null,
        hasPassed: quizAttempts.some(a => a.passed),
        lastAttemptAt: bestAttempt?.submitted_at || null
      };
    });

    res.json({ success: true, data: enrichedQuizzes });
  } catch (error) {
    console.error('Student quiz listing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6️⃣ INSTRUCTOR VIEW QUIZZES
router.get('/instructor', auth, checkInstructorPermission, async (req, res) => {
  try {
    const { courseId } = req.query;

    // Safely extract organization_id whether it's populated or not
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const query = {
      organization_id: orgId,
      instructor_id: req.user._id, // robust _id reference
      is_active: true // replaced is_deleted since it doesn't exist on Quiz schema
    };

    if (courseId) {
      // Validate courseId before passing to query
      if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
        query.course_id = courseId;
      }
    }

    const quizzes = await Quiz.find(query)
      .populate('course_id', 'title')
      .sort({ created_at: -1 });

    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Instructor Quiz Fetch Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes: ' + error.message });
  }
});

// ─── GET /api/quizzes/submissions ────────────────────────────
// Instructor view: all student attempts on their quizzes
// Must be BEFORE /:id to avoid param conflict
router.get('/submissions', auth, checkInstructorPermission, async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { page = 1, limit = 100, quizId, courseId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find all quizzes belonging to this instructor in this org
    const quizQuery = { organization_id: orgId, is_active: true };
    if (!['admin', 'org_admin'].includes(req.user.role)) {
      quizQuery.instructor_id = req.user._id;
    }
    if (quizId && quizId.match(/^[0-9a-fA-F]{24}$/)) quizQuery._id = quizId;
    if (courseId && courseId.match(/^[0-9a-fA-F]{24}$/)) quizQuery.course_id = courseId;

    const instructorQuizzes = await Quiz.find(quizQuery)
      .select('_id title course_id questions total_marks pass_percentage')
      .lean();
    const quizIds = instructorQuizzes.map(q => q._id);
    const quizMap = {};
    instructorQuizzes.forEach(q => { quizMap[q._id.toString()] = q; });

    if (quizIds.length === 0) {
      return res.json({
        success: true,
        data: { submissions: [], pagination: { page: 1, pages: 0, total: 0 } }
      });
    }

    const total = await QuizAttempt.countDocuments({ quiz_id: { $in: quizIds }, is_active: true });

    const attempts = await QuizAttempt.find({ quiz_id: { $in: quizIds }, is_active: true })
      .populate('student_id', 'name email profile')
      .populate('course_id', 'title thumbnail')
      .sort({ submitted_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const submissions = attempts.map(attempt => {
      const quizData = quizMap[attempt.quiz_id?.toString()] || {};
      const student = attempt.student_id || {};
      const course = attempt.course_id || {};

      const questionReview = quizData.questions
        ? (attempt.answers || []).map((ans, idx) => {
          const q = quizData.questions[ans.question_index] ?? quizData.questions[idx];
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
        studentId: student._id,
        studentName: student.name || 'Unknown Student',
        studentEmail: student.email || '',
        studentAvatar: student.profile?.avatar || null,
        quizId: attempt.quiz_id,
        quizTitle: quizData.title || 'Unknown Quiz',
        totalMarks: quizData.total_marks || attempt.total_questions,
        passPercentage: quizData.pass_percentage || 60,
        courseId: course._id,
        courseTitle: course.title || 'Unknown Course',
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        percentage: Math.round(attempt.percentage || 0),
        passed: attempt.passed,
        attemptNumber: attempt.attempt_number,
        timeTakenSeconds: attempt.time_taken_seconds,
        submittedAt: attempt.submitted_at,
        answersCount: (attempt.answers || []).length,
        correctCount: (attempt.answers || []).filter(a => a.is_correct).length,
        questionReview
      };
    });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: { page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
      }
    });
  } catch (error) {
    console.error('Quiz submissions fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
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
  body('started_at').optional().isISO8601().withMessage('Valid start time is required')
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

    // Check enrollment — include both active and completed (completed = finished course)
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: quiz.course_id,
      organization_id: req.user.organization_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      // Also try without organization_id in case org wasn't set during enrollment
      const enrollmentFallback = await Enrollment.findOne({
        student_id: req.user._id,
        course_id: quiz.course_id,
        status: { $in: ['active', 'completed'] }
      });
      if (!enrollmentFallback) {
        return res.status(403).json({
          success: false,
          error: 'Enrollment required',
          message: 'You must be enrolled in this course to submit the quiz'
        });
      }
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

    // ── NORMALIZE ANSWERS ─────────────────────────────────────────────────────
    // Frontend sends plain index array: [0, 2, 1, 3]
    // Backend expects: [{ question_index, selected_option }]
    // Support both formats:
    let normalizedAnswers = answers;
    if (answers.length > 0 && typeof answers[0] !== 'object') {
      // Plain array of indices — convert to object format
      normalizedAnswers = answers.map((selectedOption, idx) => ({
        question_index: idx,
        selected_option: selectedOption,
        time_spent_seconds: 0
      }));
    }

    // ── MANUAL GRADING ──────────────────────────────────────────
    const startTime = started_at ? new Date(started_at) : new Date(Date.now() - 60000); // fallback: 1min ago
    const submitTime = new Date();
    const timeTakenSeconds = Math.max(0, Math.round((submitTime - startTime) / 1000));

    // Grade each answer against the quiz's correct_answer
    const gradedAnswers = normalizedAnswers.map((ans) => {
      const question = quiz.questions[ans.question_index];
      const isCorrect = question ? ans.selected_option === question.correct_answer : false;
      return {
        question_index: ans.question_index,
        selected_option: ans.selected_option,
        is_correct: isCorrect,
        time_spent_seconds: ans.time_spent_seconds || 0
      };
    });

    const correctCount = gradedAnswers.filter(a => a.is_correct).length;
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.pass_percentage || 60);

    // Create quiz attempt with all required fields populated
    const quizAttempt = new QuizAttempt({
      organization_id: req.user.organization_id?._id || req.user.organization_id,
      quiz_id: quiz._id,
      student_id: req.user._id,
      course_id: quiz.course_id?._id || quiz.course_id,
      attempt_number: existingAttempts.length + 1,
      answers: gradedAnswers,
      score: correctCount,
      total_questions: totalQuestions,
      percentage,
      passed,
      started_at: startTime,
      submitted_at: submitTime,
      time_taken_seconds: timeTakenSeconds,
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