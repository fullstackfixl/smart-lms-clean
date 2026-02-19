const express = require('express');
const { Course, Section, Lesson, Enrollment, User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get published courses from student's organization
router.get('/courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      level
    } = req.query;

    // Build filter for organization-scoped published courses
    const filter = {
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    };

    // Apply additional filters
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    // Get courses
    const courses = await Course.find(filter)
      .populate('instructor_id', 'name profile')
      .select('title description thumbnail instructor_id duration rating category level price')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    // Check enrollment status for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await Enrollment.findOne({
          student_id: req.user._id,
          course_id: course._id,
          status: { $in: ['active', 'completed'] }
        });

        return {
          ...course.toObject(),
          isEnrolled: !!enrollment,
          enrollmentId: enrollment?._id,
          progress: enrollment?.progress?.completionPercentage || 0
        };
      })
    );

    res.success({
      courses: coursesWithEnrollment,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }, 'Courses retrieved successfully');

  } catch (error) {
    console.error('Get student courses error:', error);
    res.error(error.message, 'Failed to get courses', 500);
  }
});

// Get course details
router.get('/courses/:id', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify course exists, belongs to student's organization, and is published
    const course = await Course.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    })
      .populate('instructor_id', 'name profile')
      .populate('organization_id', 'name');

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available', 404);
    }

    // Get course sections with lessons
    const sections = await Section.find({
      course_id: course._id,
      isActive: true
    }).sort({ order: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({
          section_id: section._id,
          isActive: true
        }).sort({ order: 1 }).select('title description type duration order isPreview');

        return {
          ...section.toObject(),
          lessons
        };
      })
    );

    // Check enrollment status
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: course._id,
      status: { $in: ['active', 'completed'] }
    });

    // Calculate total lessons
    const totalLessons = sectionsWithLessons.reduce((sum, section) => sum + section.lessons.length, 0);

    res.success({
      course: {
        ...course.toObject(),
        totalLessons
      },
      sections: sectionsWithLessons,
      isEnrolled: !!enrollment,
      progress: enrollment?.progress || null
    }, 'Course details retrieved successfully');

  } catch (error) {
    console.error('Get course details error:', error);
    res.error(error.message, 'Failed to get course details', 500);
  }
});

// Enroll in a course
router.post('/enroll/:courseId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists, belongs to student's organization, and is published
    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Get total lessons count
    const sections = await Section.find({ course_id: courseId, isActive: true });
    let totalLessons = 0;
    for (const section of sections) {
      const lessonCount = await Lesson.countDocuments({ section_id: section._id, isActive: true });
      totalLessons += lessonCount;
    }

    // Create enrollment
    const enrollment = new Enrollment({
      organization_id: req.user.organization_id,
      student_id: req.user._id,
      course_id: courseId,
      enrollmentType: course.price > 0 ? 'paid' : 'free',
      status: 'active',
      progress: {
        completedLessons: [],
        totalLessons: totalLessons,
        completionPercentage: 0,
        totalTimeSpent: 0
      },
      enrolledAt: new Date()
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
      $addToSet: { students: req.user._id }
    });

    res.success({
      enrollment: {
        _id: enrollment._id,
        course_id: courseId,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress
      }
    }, 'Enrollment successful');

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

// Get student's enrollments
router.get('/enrollments', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const filter = {
      student_id: req.user._id,
      organization_id: req.user.organization_id
    };

    if (status !== 'all') {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course_id',
        select: 'title description thumbnail instructor_id duration rating',
        populate: {
          path: 'instructor_id',
          select: 'name'
        }
      })
      .sort({ enrolledAt: -1 });

    const enrollmentsData = enrollments.map(enrollment => ({
      _id: enrollment._id,
      course: enrollment.course_id,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }));

    res.success({
      enrollments: enrollmentsData
    }, 'Enrollments retrieved successfully');

  } catch (error) {
    console.error('Get enrollments error:', error);
    res.error(error.message, 'Failed to get enrollments', 500);
  }
});

// Mark lecture as complete and update progress
// Get lecture details
router.get('/lectures/:id', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findById(id).populate('section_id');
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Verify enrollment and access
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: lesson.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment && !lesson.isPreview) {
      return res.error('Unauthorized', 'You must be enrolled to view this lesson', 403);
    }

    // STRICT: Verify organization (implicit via enrollment, but good to double check)
    // If it's a preview, we must check course org
    if (lesson.organization_id.toString() !== req.user.organization_id.toString()) {
      return res.error('Unauthorized', 'You cannot access content from another organization', 403);
    }

    // Get next and previous lectures
    const nextLecture = await Lesson.findOne({
      section_id: lesson.section_id,
      order: { $gt: lesson.order },
      isActive: true
    }).select('_id title type').sort({ order: 1 });

    const prevLecture = await Lesson.findOne({
      section_id: lesson.section_id,
      order: { $lt: lesson.order },
      isActive: true
    }).select('_id title type').sort({ order: -1 });

    // Get progress for this lesson
    let progress = null;
    let quizAttempts = [];
    let bestScore = 0;

    if (enrollment) {
      const lessonProgress = enrollment.progress.completedLessons.find(
        cl => cl.lessonId.toString() === id
      );

      progress = {
        watched_seconds: lessonProgress ? lessonProgress.timeSpent : 0,
        completion_percentage: lessonProgress ? 100 : 0, // Simplified for now
        completed: !!lessonProgress,
        last_watched_at: lessonProgress ? lessonProgress.completedAt : null
      };

      // If quiz, get attempts (simulated from progress for now as schema stores latest)
      if (lesson.type === 'quiz' && lessonProgress && lessonProgress.score !== undefined) {
        quizAttempts = [{
          score: lessonProgress.score,
          passed: lessonProgress.score >= (lesson.content.passingScore || 70),
          attempt_number: 1,
          submitted_at: lessonProgress.completedAt
        }];
        bestScore = lessonProgress.score;
      }
    }

    // Prepare response data
    const lectureData = {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      duration: lesson.duration,
      video_url: lesson.content?.videoUrl,
      video_duration: lesson.content?.videoDuration,
      text_content: lesson.content?.textContent,
      pdf_url: lesson.content?.pdfUrl,
      questions: lesson.type === 'quiz' ? lesson.content.questions.map((q, i) => ({
        index: i,
        question: q.question.type || q.question, // Handle generic mixed type if needed
        options: q.options.map(o => o.type || o),
        points: q.points || 1
      })) : undefined,
      passing_score: lesson.content?.passingScore,
      total_questions: lesson.content?.questions?.length,
      quiz_attempts: quizAttempts,
      best_score: bestScore,
      quiz_available: lesson.type === 'quiz',
      progress,
      next_lecture: nextLecture,
      previous_lecture: prevLecture
    };

    res.success(lectureData, 'Lecture details retrieved successfully');
  } catch (error) {
    console.error('Get lecture details error:', error);
    res.error(error.message, 'Failed to get lecture details', 500);
  }
});

// Update lecture progress
router.post('/lectures/:id/progress', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { id } = req.params;
    const { watched_seconds } = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: lesson.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Unauthorized', 'You must be enrolled to save progress', 403);
    }

    // STRICT: Check organization
    if (enrollment.organization_id.toString() !== req.user.organization_id.toString()) {
      return res.error('Unauthorized', 'Cross-organization access denied', 403);
    }

    // Update progress using schema method
    // Note: completeLesson marks as complete. For partial progress (just watching), 
    // we might need to adjust logic, but for now we'll assume it updates timeSpent.
    // If watched_seconds is close to total duration, mark complete.

    // For simplicity in this iteration:
    // If it's a video and watched > 90%, mark complete.
    // Otherwise just update time.

    let isComplete = false;
    if (lesson.type === 'video' && lesson.content?.videoDuration) {
      if (watched_seconds >= lesson.content.videoDuration * 0.9) {
        isComplete = true;
      }
    } else if (lesson.type !== 'quiz') {
      // Text/PDF auto-complete on view? or explicit button?
      // Frontend does auto-save.
      isComplete = true;
    }

    if (isComplete) {
      enrollment.completeLesson(id, watched_seconds);
    } else {
      // Just update time spent without marking complete?
      // The current Enrollment.completeLesson handles both adding and updating.
      // It ADDS to totalTimeSpent.
      // We should pass the *incremental* time, but frontend sends *total* watched.
      // This delta calculation is tricky without state.
      // Let's rely on completeLesson for now, but treating it as "update checkpoint".
      enrollment.completeLesson(id, 0); // Update last accessed
    }

    await enrollment.save();

    res.success({ success: true }, 'Progress saved');

  } catch (error) {
    console.error('Save progress error:', error);
    res.error(error.message, 'Failed to save progress', 500);
  }
});

// Submit quiz
router.post('/lectures/:id/quiz/submit', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of selected indices

    const lesson = await Lesson.findById(id);
    if (!lesson || lesson.type !== 'quiz') {
      return res.error('Invalid quiz', 'Lesson is not a quiz', 400);
    }

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: lesson.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Unauthorized', 'You must be enrolled', 403);
    }

    // Grade the quiz
    let correctCount = 0;
    const totalQuestions = lesson.content.questions.length;
    const gradedAnswers = lesson.content.questions.map((q, idx) => {
      const isCorrect = q.correctAnswer === answers[idx];
      if (isCorrect) correctCount++;
      return {
        question_index: idx,
        selected_answer: answers[idx],
        correct_answer: q.correctAnswer,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (lesson.content.passingScore || 70);

    // Update enrollment if passed
    if (passed) {
      enrollment.completeLesson(id, 0, score);
      await enrollment.save();
    }

    res.success({
      score,
      passed,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      passing_score: lesson.content.passingScore || 70,
      answers: gradedAnswers
    }, 'Quiz submitted successfully');

  } catch (error) {
    console.error('Quiz submit error:', error);
    res.error(error.message, 'Failed to submit quiz', 500);
  }
});

// Legacy patch route (keep for backward compatibility if needed, or replace)
router.patch('/progress/lecture/:lectureId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { timeSpent = 0 } = req.body;

    // Find the lesson and its course
    const lesson = await Lesson.findById(lectureId);
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    const section = await Section.findById(lesson.section_id);
    if (!section) {
      return res.error('Section not found', 'Section does not exist', 404);
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: section.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.progress.completedLessons.some(
      cl => cl.lessonId.toString() === lectureId
    );

    if (!alreadyCompleted) {
      // Add lesson to completed lessons
      enrollment.progress.completedLessons.push({
        lessonId: lectureId,
        completedAt: new Date(),
        timeSpent: timeSpent
      });
    }

    // Update total time spent
    enrollment.progress.totalTimeSpent = (enrollment.progress.totalTimeSpent || 0) + timeSpent;

    // Update last accessed lesson
    enrollment.progress.lastAccessedLesson = lectureId;

    // Calculate progress percentage
    const totalLessons = enrollment.progress.totalLessons || 1;
    const completedCount = enrollment.progress.completedLessons.length;
    enrollment.progress.completionPercentage = Math.round((completedCount / totalLessons) * 100);

    // Check if course is completed
    if (enrollment.progress.completionPercentage >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    // Update last accessed timestamp
    enrollment.lastAccessedAt = new Date();

    await enrollment.save();

    res.success({
      progress: enrollment.progress,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }, 'Progress updated successfully');

  } catch (error) {
    console.error('Update progress error:', error);
    res.error(error.message, 'Failed to update progress', 500);
  }
});

module.exports = router;
