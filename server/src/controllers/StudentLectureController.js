const Lesson = require('../models/Lesson');
const LectureProgress = require('../models/LectureProgress');
const QuizResult = require('../models/QuizResult');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

class StudentLectureController {
  /**
   * GET /student/lectures/:lectureId
   * Get lecture details for student
   */
  async getLecture(req, res) {
    try {
      const { lectureId } = req.params;
      const user = req.user;

      // Fetch full lecture details with organization isolation
      const lecture = await Lesson.findOne({
        _id: lectureId,
        organization_id: user.organization_id
      })
        .select('-content.questions.correctAnswer -content.questions.explanation')
        .lean();

      if (!lecture) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Lecture not found'
        });
      }

      // Get user's progress for this lecture
      const progress = await LectureProgress.findOne({
        user_id: user._id,
        lecture_id: lectureId
      }).lean();

      // Check if quiz is available
      const quizAvailable = lecture.type === 'quiz' &&
        lecture.content.questions &&
        lecture.content.questions.length > 0;

      // Get quiz attempts if quiz lecture
      let quizAttempts = [];
      let bestScore = null;
      if (quizAvailable) {
        quizAttempts = await QuizResult.find({
          user_id: user._id,
          lecture_id: lectureId
        }).sort({ submitted_at: -1 }).limit(5).lean();

        if (quizAttempts.length > 0) {
          bestScore = Math.max(...quizAttempts.map(a => a.score));
        }
      }

      // Get next and previous lectures
      const nextLecture = await lecture.getNextLesson ?
        await Lesson.findOne({
          section_id: lecture.section_id,
          order: { $gt: lecture.order },
          isActive: true
        }).select('_id title type').lean() : null;

      const previousLecture = await Lesson.findOne({
        section_id: lecture.section_id,
        order: { $lt: lecture.order },
        isActive: true
      }).sort({ order: -1 }).select('_id title type').lean();

      // Prepare response data
      const responseData = {
        _id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        type: lecture.type,
        duration: lecture.duration,
        order: lecture.order,
        quiz_available: quizAvailable,
        progress: progress ? {
          watched_seconds: progress.watched_seconds,
          completion_percentage: progress.completion_percentage,
          completed: progress.completed,
          last_watched_at: progress.last_watched_at
        } : null,
        next_lecture: nextLecture,
        previous_lecture: previousLecture
      };

      // Add type-specific content
      if (lecture.type === 'video') {
        responseData.video_url = lecture.content.videoUrl;
        responseData.video_duration = lecture.content.videoDuration;
      } else if (lecture.type === 'text') {
        responseData.text_content = lecture.content.textContent;
      } else if (lecture.type === 'pdf') {
        responseData.pdf_url = lecture.content.pdfUrl;
      } else if (lecture.type === 'quiz') {
        // Return questions without correct answers
        responseData.questions = lecture.content.questions.map((q, index) => ({
          index,
          question: q.question,
          options: q.options,
          points: q.points
        }));
        responseData.passing_score = lecture.content.passingScore;
        responseData.total_questions = lecture.content.questions.length;
        responseData.quiz_attempts = quizAttempts;
        responseData.best_score = bestScore;
      }

      return res.status(200).json({
        success: true,
        data: responseData,
        message: 'Lecture retrieved successfully'
      });
    } catch (error) {
      console.error('Get lecture error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve lecture'
      });
    }
  }

  /**
   * POST /student/lectures/:lectureId/progress
   * Update lecture progress
   */
  async updateProgress(req, res) {
    try {
      const { lectureId } = req.params;
      const { watched_seconds } = req.body;
      const user = req.user;
      const lecture = req.lecture;

      // Validate watched_seconds
      if (typeof watched_seconds !== 'number' || watched_seconds < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'watched_seconds must be a positive number'
        });
      }

      // Get lecture duration
      const totalDuration = lecture.type === 'video' ?
        (await Lesson.findById(lectureId).select('content.videoDuration').lean()).content.videoDuration :
        lecture.duration * 60; // Convert minutes to seconds

      if (!totalDuration) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Lecture',
          message: 'Lecture duration not set'
        });
      }

      // Find or create progress record
      let progress = await LectureProgress.findOne({
        user_id: user._id,
        lecture_id: lectureId
      });

      if (progress) {
        // Update existing progress
        progress.watched_seconds = Math.min(watched_seconds, totalDuration);
        progress.total_duration = totalDuration;
        progress.last_watched_at = new Date();
        progress.watch_count += 1;
      } else {
        // Create new progress record
        progress = new LectureProgress({
          organization_id: user.organization_id,
          user_id: user._id,
          course_id: lecture.course_id,
          lecture_id: lectureId,
          watched_seconds: Math.min(watched_seconds, totalDuration),
          total_duration: totalDuration,
          last_watched_at: new Date()
        });
      }

      await progress.save();

      // Check if lecture is now completed (>= 90%)
      const wasCompleted = progress.completed;
      const isNowCompleted = progress.completion_percentage >= 90;

      // If newly completed, update enrollment
      if (!wasCompleted && isNowCompleted) {
        await this.checkCourseCompletion(user._id, lecture.course_id, lectureId);
      }

      return res.status(200).json({
        success: true,
        data: {
          watched_seconds: progress.watched_seconds,
          completion_percentage: progress.completion_percentage,
          completed: progress.completed,
          completed_at: progress.completed_at,
          course_completed: false // Will be updated by checkCourseCompletion
        },
        message: 'Progress updated successfully'
      });
    } catch (error) {
      console.error('Update progress error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update progress'
      });
    }
  }

  /**
   * POST /student/lectures/:lectureId/quiz/submit
   * Submit quiz answers
   */
  async submitQuiz(req, res) {
    try {
      const { lectureId } = req.params;
      const { answers } = req.body;
      const user = req.user;

      // Validate answers
      if (!Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'answers must be an array'
        });
      }

      // Fetch lecture with quiz questions and organization isolation
      const lecture = await Lesson.findOne({
        _id: lectureId,
        organization_id: user.organization_id
      }).lean();

      if (!lecture || lecture.type !== 'quiz') {
        return res.status(400).json({
          success: false,
          error: 'Invalid Lecture',
          message: 'This is not a quiz lecture'
        });
      }

      const questions = lecture.content.questions;
      const passingScore = lecture.content.passingScore || 70;

      // Validate answers length
      if (answers.length !== questions.length) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Expected ${questions.length} answers, got ${answers.length}`
        });
      }

      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      const processedAnswers = [];

      answers.forEach((answer, index) => {
        const question = questions[index];
        const isCorrect = answer === question.correctAnswer;
        const points = question.points || 1;

        totalPoints += points;
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += points;
        }

        processedAnswers.push({
          question_index: index,
          selected_answer: answer,
          is_correct: isCorrect,
          points_earned: isCorrect ? points : 0
        });
      });

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= passingScore;

      // Get attempt number
      const previousAttempts = await QuizResult.countDocuments({
        user_id: user._id,
        lecture_id: lectureId
      });

      // Save quiz result
      const quizResult = new QuizResult({
        organization_id: user.organization_id,
        user_id: user._id,
        course_id: lecture.course_id,
        lecture_id: lectureId,
        answers: processedAnswers,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        score,
        total_points: totalPoints,
        earned_points: earnedPoints,
        passing_score: passingScore,
        passed,
        attempt_number: previousAttempts + 1
      });

      await quizResult.save();

      // If passed, mark lecture as completed
      if (passed) {
        let progress = await LectureProgress.findOne({
          user_id: user._id,
          lecture_id: lectureId,
          organization_id: user.organization_id
        });

        if (!progress) {
          progress = new LectureProgress({
            organization_id: user.organization_id,
            user_id: user._id,
            course_id: lecture.course_id,
            lecture_id: lectureId,
            watched_seconds: 0,
            total_duration: 1,
            completed: true,
            completed_at: new Date()
          });
        } else if (!progress.completed) {
          progress.completed = true;
          progress.completed_at = new Date();
        }

        await progress.save();

        // Check course completion
        await this.checkCourseCompletion(user._id, lecture.course_id, lectureId);
      }

      return res.status(200).json({
        success: true,
        data: {
          score,
          passed,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          earned_points: earnedPoints,
          total_points: totalPoints,
          passing_score: passingScore,
          attempt_number: quizResult.attempt_number,
          answers: processedAnswers.map((a, index) => ({
            question_index: a.question_index,
            selected_answer: a.selected_answer,
            is_correct: a.is_correct,
            correct_answer: questions[index].correctAnswer,
            explanation: questions[index].explanation
          }))
        },
        message: passed ? 'Quiz passed successfully!' : 'Quiz submitted. Try again to improve your score.'
      });
    } catch (error) {
      console.error('Submit quiz error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to submit quiz'
      });
    }
  }

  /**
   * Helper method to check if course is completed
   */
  async checkCourseCompletion(userId, courseId, currentLectureId) {
    try {
      // Get all lectures in the course with organization isolation
      const totalLectures = await Lesson.countDocuments({
        course_id: courseId,
        organization_id: (await User.findById(userId)).organization_id, // Safer lookup
        isActive: true
      });

      // Get completed lectures
      const completedLectures = await LectureProgress.countDocuments({
        user_id: userId,
        course_id: courseId,
        completed: true
      });

      // Check if all lectures are completed
      if (completedLectures >= totalLectures) {
        // Update enrollment status with organization isolation
        const enrollment = await Enrollment.findOne({
          student_id: userId,
          course_id: courseId,
          organization_id: (await User.findById(userId)).organization_id
        });

        if (enrollment && enrollment.status !== 'completed') {
          enrollment.status = 'completed';
          enrollment.completedAt = new Date();
          enrollment.progress.completionPercentage = 100;
          await enrollment.save();

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Check course completion error:', error);
      return false;
    }
  }

  /**
   * GET /student/courses/:courseId/lectures
   * Get all lectures for a course with progress
   */
  async getCourseLectures(req, res) {
    try {
      const { courseId } = req.params;
      const user = req.user;

      // Check enrollment
      const enrollment = await Enrollment.findOne({
        student_id: user._id,
        course_id: courseId,
        status: { $in: ['active', 'completed'] }
      }).lean();

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not enrolled in this course'
        });
      }

      // Get all lectures with sections and organization isolation
      const lectures = await Lesson.find({
        course_id: courseId,
        organization_id: user.organization_id,
        isActive: true
      })
        .select('title description type duration order section_id isPreview')
        .sort({ section_id: 1, order: 1 })
        .lean();

      // Get user's progress for all lectures
      const progressRecords = await LectureProgress.find({
        user_id: user._id,
        course_id: courseId
      }).lean();

      const progressMap = {};
      progressRecords.forEach(p => {
        progressMap[p.lecture_id.toString()] = p;
      });

      // Combine lectures with progress
      const lecturesWithProgress = lectures.map(lecture => ({
        ...lecture,
        progress: progressMap[lecture._id.toString()] || null
      }));

      return res.status(200).json({
        success: true,
        data: {
          lectures: lecturesWithProgress,
          total_lectures: lectures.length,
          completed_lectures: progressRecords.filter(p => p.completed).length,
          completion_percentage: enrollment.progress.completionPercentage
        },
        message: 'Course lectures retrieved successfully'
      });
    } catch (error) {
      console.error('Get course lectures error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve course lectures'
      });
    }
  }
}

module.exports = new StudentLectureController();
