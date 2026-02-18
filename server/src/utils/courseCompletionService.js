const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Enrollment = require('../models/Enrollment');
const GamificationPoints = require('../models/GamificationPoints');

/**
 * Course Completion Verification Service
 * Handles verification of course completion requirements
 */
class CourseCompletionService {

  /**
   * Check if a student has completed all course requirements
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Completion status and details
   */
  static async checkCourseCompletion(studentId, courseId, organizationId) {
    try {
      // Verify enrollment exists and is active
      const enrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        status: 'active'
      });

      if (!enrollment) {
        return {
          completed: false,
          error: 'Student not enrolled in course',
          details: null
        };
      }

      // Get course details
      const course = await Course.findOne({
        _id: courseId,
        organization_id: organizationId
      }).populate('instructor_id', 'full_name');

      if (!course) {
        return {
          completed: false,
          error: 'Course not found',
          details: null
        };
      }

      // Get all lessons in the course
      const lessons = await Lesson.find({
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      }).sort({ order: 1 });

      // Get all quizzes in the course
      const quizzes = await Quiz.find({
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      });

      // Check lesson completion
      const lessonCompletionStatus = await this.checkLessonCompletion(
        studentId, 
        lessons, 
        organizationId
      );

      // Check quiz completion
      const quizCompletionStatus = await this.checkQuizCompletion(
        studentId, 
        quizzes, 
        organizationId
      );

      // Calculate overall completion
      const allLessonsCompleted = lessonCompletionStatus.completed_count === lessonCompletionStatus.total_count;
      const allQuizzesPassed = quizCompletionStatus.passed_count === quizCompletionStatus.total_count;
      const courseCompleted = allLessonsCompleted && allQuizzesPassed;

      // Calculate final grade (average of quiz scores, or 100% if no quizzes)
      let finalGrade = 100;
      if (quizCompletionStatus.total_count > 0) {
        finalGrade = quizCompletionStatus.average_score;
      }

      const completionDetails = {
        course_id: courseId,
        course_title: course.title,
        instructor_name: course.instructor_id.full_name,
        student_id: studentId,
        enrollment_id: enrollment._id,
        lessons: lessonCompletionStatus,
        quizzes: quizCompletionStatus,
        final_grade_percentage: Math.round(finalGrade),
        completion_date: courseCompleted ? new Date() : null,
        course_duration_hours: this.calculateCourseDuration(lessons),
        requirements_met: {
          all_lessons_completed: allLessonsCompleted,
          all_quizzes_passed: allQuizzesPassed
        }
      };

      return {
        completed: courseCompleted,
        error: null,
        details: completionDetails
      };

    } catch (error) {
      console.error('Course completion check error:', error);
      return {
        completed: false,
        error: error.message,
        details: null
      };
    }
  }

  /**
   * Check lesson completion status
   * @param {string} studentId - Student ID
   * @param {Array} lessons - Array of lesson objects
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Lesson completion details
   */
  static async checkLessonCompletion(studentId, lessons, organizationId) {
    try {
      // Get all lesson completion points for the student
      const lessonPoints = await GamificationPoints.find({
        user_id: studentId,
        organization_id: organizationId,
        activity_type: 'lesson_completion',
        is_active: true
      });

      const completedLessonIds = lessonPoints.map(point => point.lesson_id.toString());
      
      const lessonDetails = lessons.map(lesson => ({
        lesson_id: lesson._id,
        title: lesson.title,
        order: lesson.order,
        completed: completedLessonIds.includes(lesson._id.toString()),
        completion_date: lessonPoints.find(p => p.lesson_id.toString() === lesson._id.toString())?.earned_at || null
      }));

      return {
        total_count: lessons.length,
        completed_count: completedLessonIds.length,
        completion_percentage: lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 100,
        lessons: lessonDetails
      };

    } catch (error) {
      console.error('Lesson completion check error:', error);
      throw error;
    }
  }

  /**
   * Check quiz completion status
   * @param {string} studentId - Student ID
   * @param {Array} quizzes - Array of quiz objects
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Quiz completion details
   */
  static async checkQuizCompletion(studentId, quizzes, organizationId) {
    try {
      if (quizzes.length === 0) {
        return {
          total_count: 0,
          passed_count: 0,
          completion_percentage: 100,
          average_score: 100,
          quizzes: []
        };
      }

      const quizDetails = [];
      let totalScore = 0;
      let passedCount = 0;

      for (const quiz of quizzes) {
        // Get best attempt for this quiz
        const bestAttempt = await QuizAttempt.getBestAttempt(
          quiz._id,
          studentId,
          organizationId
        );

        const quizDetail = {
          quiz_id: quiz._id,
          title: quiz.title,
          pass_percentage: quiz.pass_percentage,
          max_attempts: quiz.max_attempts,
          attempted: !!bestAttempt,
          passed: bestAttempt ? bestAttempt.passed : false,
          best_score: bestAttempt ? bestAttempt.score : 0,
          best_percentage: bestAttempt ? bestAttempt.percentage : 0,
          attempts_count: 0,
          last_attempt_date: bestAttempt ? bestAttempt.submitted_at : null
        };

        if (bestAttempt) {
          // Get total attempts count
          const totalAttempts = await QuizAttempt.countDocuments({
            quiz_id: quiz._id,
            student_id: studentId,
            organization_id: organizationId,
            is_active: true
          });
          
          quizDetail.attempts_count = totalAttempts;
          totalScore += bestAttempt.percentage;
          
          if (bestAttempt.passed) {
            passedCount++;
          }
        }

        quizDetails.push(quizDetail);
      }

      const averageScore = quizzes.length > 0 ? totalScore / quizzes.length : 0;

      return {
        total_count: quizzes.length,
        passed_count: passedCount,
        completion_percentage: Math.round((passedCount / quizzes.length) * 100),
        average_score: Math.round(averageScore),
        quizzes: quizDetails
      };

    } catch (error) {
      console.error('Quiz completion check error:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated course duration in hours
   * @param {Array} lessons - Array of lesson objects
   * @returns {number} Duration in hours
   */
  static calculateCourseDuration(lessons) {
    // Estimate based on lesson count and type
    // This is a simple estimation - in a real system, lessons would have duration fields
    let totalMinutes = 0;

    lessons.forEach(lesson => {
      switch (lesson.type) {
        case 'video':
          totalMinutes += 15; // Assume 15 minutes per video lesson
          break;
        case 'text':
          totalMinutes += 10; // Assume 10 minutes per text lesson
          break;
        case 'pdf':
          totalMinutes += 20; // Assume 20 minutes per PDF lesson
          break;
        default:
          totalMinutes += 15;
      }
    });

    return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get course completion statistics for instructor/admin
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Course completion statistics
   */
  static async getCourseCompletionStats(courseId, organizationId) {
    try {
      // Get all active enrollments for the course
      const enrollments = await Enrollment.find({
        course_id: courseId,
        organization_id: organizationId,
        status: 'active'
      }).populate('student_id', 'full_name email');

      if (enrollments.length === 0) {
        return {
          success: true,
          data: {
            total_students: 0,
            completed_students: 0,
            completion_rate: 0,
            student_details: []
          }
        };
      }

      const studentDetails = [];
      let completedCount = 0;

      for (const enrollment of enrollments) {
        const completionStatus = await this.checkCourseCompletion(
          enrollment.student_id._id,
          courseId,
          organizationId
        );

        const studentDetail = {
          student_id: enrollment.student_id._id,
          student_name: enrollment.student_id.full_name,
          student_email: enrollment.student_id.email,
          enrollment_date: enrollment.enrolled_at,
          completed: completionStatus.completed,
          completion_date: completionStatus.details?.completion_date || null,
          final_grade: completionStatus.details?.final_grade_percentage || 0,
          lessons_completed: completionStatus.details?.lessons.completed_count || 0,
          lessons_total: completionStatus.details?.lessons.total_count || 0,
          quizzes_passed: completionStatus.details?.quizzes.passed_count || 0,
          quizzes_total: completionStatus.details?.quizzes.total_count || 0
        };

        if (completionStatus.completed) {
          completedCount++;
        }

        studentDetails.push(studentDetail);
      }

      const completionRate = Math.round((completedCount / enrollments.length) * 100);

      return {
        success: true,
        data: {
          course_id: courseId,
          total_students: enrollments.length,
          completed_students: completedCount,
          completion_rate: completionRate,
          student_details: studentDetails
        }
      };

    } catch (error) {
      console.error('Course completion stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if student is eligible for certificate
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Eligibility status
   */
  static async checkCertificateEligibility(studentId, courseId, organizationId) {
    try {
      const completionStatus = await this.checkCourseCompletion(studentId, courseId, organizationId);

      if (!completionStatus.completed) {
        return {
          eligible: false,
          reason: 'Course not completed',
          requirements: {
            lessons_completed: completionStatus.details?.lessons.completed_count || 0,
            lessons_required: completionStatus.details?.lessons.total_count || 0,
            quizzes_passed: completionStatus.details?.quizzes.passed_count || 0,
            quizzes_required: completionStatus.details?.quizzes.total_count || 0
          }
        };
      }

      // Check if certificate already exists
      const Certificate = require('../models/Certificate');
      const existingCertificate = await Certificate.findOne({
        student_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      });

      if (existingCertificate) {
        return {
          eligible: false,
          reason: 'Certificate already issued',
          existing_certificate: {
            certificate_id: existingCertificate.certificate_id,
            issued_date: existingCertificate.issued_date
          }
        };
      }

      return {
        eligible: true,
        completion_details: completionStatus.details
      };

    } catch (error) {
      console.error('Certificate eligibility check error:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility',
        error: error.message
      };
    }
  }
}

module.exports = CourseCompletionService;