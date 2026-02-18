const GamificationPoints = require('../models/GamificationPoints');
const QuizAttempt = require('../models/QuizAttempt');
const LiveClass = require('../models/LiveClass');
const Enrollment = require('../models/Enrollment');
const RiskAssessment = require('../models/RiskAssessment');
const notificationService = require('./notificationService');

/**
 * Risk Calculation Service
 * Implements rule-based predictive analytics for student dropout/failure risk
 */
class RiskCalculationService {
  
  constructor() {
    // Risk factor weights (must sum to 1.0)
    this.weights = {
      attendance: 0.3,        // 30% - Live class attendance
      quiz_performance: 0.25, // 25% - Quiz scores and attempts
      lesson_completion: 0.25, // 25% - Lesson completion rate
      engagement: 0.15,       // 15% - Forum posts, time spent
      time_spent: 0.05        // 5% - Overall time in platform
    };
    
    // Risk thresholds
    this.riskThresholds = {
      high: 70,    // >= 70% risk score
      medium: 40,  // 40-69% risk score
      low: 0       // < 40% risk score
    };
    
    // Minimum data points required for reliable assessment
    this.minDataPoints = {
      lessons: 3,
      quizzes: 2,
      live_classes: 1,
      days_enrolled: 7
    };
  }

  /**
   * Calculate comprehensive risk assessment for a student in a course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Risk assessment result
   */
  async calculateRiskAssessment(studentId, courseId, organizationId) {
    try {
      // Get enrollment information
      const enrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        status: 'active'
      });

      if (!enrollment) {
        return {
          success: false,
          error: 'Student not enrolled in course'
        };
      }

      // Calculate days since enrollment
      const daysSinceEnrollment = Math.floor((Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24));

      // If student is too new, return low risk with monitoring flag
      if (daysSinceEnrollment < this.minDataPoints.days_enrolled) {
        return {
          success: true,
          risk_score: 20, // Default low risk for new students
          risk_level: 'low',
          confidence_level: 30,
          factors: [],
          suggestions: [
            'New student - monitor progress closely',
            'Encourage early engagement with course materials',
            'Send welcome message with course expectations'
          ],
          data_points_used: 0,
          insufficient_data: true
        };
      }

      // Calculate individual risk factors
      const factors = await Promise.all([
        this.calculateAttendanceRisk(studentId, courseId, organizationId),
        this.calculateQuizPerformanceRisk(studentId, courseId, organizationId),
        this.calculateLessonCompletionRisk(studentId, courseId, organizationId),
        this.calculateEngagementRisk(studentId, courseId, organizationId),
        this.calculateTimeSpentRisk(studentId, courseId, organizationId)
      ]);

      // Calculate weighted risk score
      let totalRiskScore = 0;
      let totalWeight = 0;
      let dataPointsUsed = 0;

      factors.forEach((factor, index) => {
        if (factor.has_data) {
          const weight = Object.values(this.weights)[index];
          totalRiskScore += factor.score * weight;
          totalWeight += weight;
          dataPointsUsed += factor.data_points || 1;
        }
      });

      // Normalize score if we don't have all factors
      const finalRiskScore = totalWeight > 0 ? Math.round(totalRiskScore / totalWeight) : 20;

      // Calculate confidence level based on data availability
      const confidenceLevel = Math.min(100, Math.round((totalWeight / 1.0) * 100));

      // Determine risk level
      const riskLevel = this.determineRiskLevel(finalRiskScore);

      // Generate suggestions based on factors
      const suggestions = this.generateSuggestions(factors, riskLevel);

      return {
        success: true,
        risk_score: finalRiskScore,
        risk_level: riskLevel,
        confidence_level: confidenceLevel,
        factors: factors.filter(f => f.has_data),
        suggestions: suggestions,
        data_points_used: dataPointsUsed,
        days_since_enrollment: daysSinceEnrollment,
        insufficient_data: dataPointsUsed < 5
      };

    } catch (error) {
      console.error('Risk calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate attendance risk based on live class participation
   */
  async calculateAttendanceRisk(studentId, courseId, organizationId) {
    try {
      // Get all live classes for the course
      const liveClasses = await LiveClass.find({
        course_id: courseId,
        organization_id: organizationId,
        status: { $in: ['completed', 'live'] },
        is_active: true
      });

      if (liveClasses.length === 0) {
        return {
          factor_type: 'attendance',
          score: 30, // Neutral score when no live classes
          weight: this.weights.attendance,
          has_data: false,
          details: { total_classes: 0, attended: 0, attendance_rate: 0 }
        };
      }

      // Count attended classes
      let attendedClasses = 0;
      let totalDuration = 0;
      let attendedDuration = 0;

      liveClasses.forEach(liveClass => {
        const studentAttendance = liveClass.attendance.find(
          att => att.student_id.toString() === studentId.toString()
        );
        
        if (studentAttendance) {
          attendedClasses++;
          attendedDuration += studentAttendance.duration_minutes || 0;
        }
        
        totalDuration += liveClass.duration_minutes;
      });

      const attendanceRate = attendedClasses / liveClasses.length;
      const durationRate = totalDuration > 0 ? attendedDuration / totalDuration : 0;
      
      // Calculate risk score (higher attendance = lower risk)
      const attendanceScore = Math.round((1 - attendanceRate) * 100);
      const durationScore = Math.round((1 - durationRate) * 100);
      const combinedScore = Math.round((attendanceScore + durationScore) / 2);

      return {
        factor_type: 'attendance',
        score: combinedScore,
        weight: this.weights.attendance,
        has_data: true,
        data_points: liveClasses.length,
        details: {
          total_classes: liveClasses.length,
          attended: attendedClasses,
          attendance_rate: Math.round(attendanceRate * 100),
          avg_duration_rate: Math.round(durationRate * 100)
        }
      };

    } catch (error) {
      console.error('Attendance risk calculation error:', error);
      return {
        factor_type: 'attendance',
        score: 50,
        weight: this.weights.attendance,
        has_data: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate quiz performance risk
   */
  async calculateQuizPerformanceRisk(studentId, courseId, organizationId) {
    try {
      // Get all quiz attempts for the student in this course
      const quizAttempts = await QuizAttempt.find({
        student_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      });

      if (quizAttempts.length === 0) {
        return {
          factor_type: 'quiz_performance',
          score: 60, // Higher risk when no quizzes attempted
          weight: this.weights.quiz_performance,
          has_data: false,
          details: { total_attempts: 0, avg_score: 0, pass_rate: 0 }
        };
      }

      // Group attempts by quiz and get best attempt for each
      const quizBestAttempts = new Map();
      quizAttempts.forEach(attempt => {
        const quizId = attempt.quiz_id.toString();
        const existing = quizBestAttempts.get(quizId);
        
        if (!existing || attempt.percentage > existing.percentage) {
          quizBestAttempts.set(quizId, attempt);
        }
      });

      const bestAttempts = Array.from(quizBestAttempts.values());
      const avgScore = bestAttempts.reduce((sum, att) => sum + att.percentage, 0) / bestAttempts.length;
      const passedQuizzes = bestAttempts.filter(att => att.passed).length;
      const passRate = passedQuizzes / bestAttempts.length;

      // Calculate risk score (higher performance = lower risk)
      const scoreRisk = Math.round((100 - avgScore) * 0.7); // 70% weight on average score
      const passRateRisk = Math.round((1 - passRate) * 100 * 0.3); // 30% weight on pass rate
      const combinedScore = Math.round(scoreRisk + passRateRisk);

      return {
        factor_type: 'quiz_performance',
        score: combinedScore,
        weight: this.weights.quiz_performance,
        has_data: true,
        data_points: bestAttempts.length,
        details: {
          total_attempts: quizAttempts.length,
          unique_quizzes: bestAttempts.length,
          avg_score: Math.round(avgScore),
          pass_rate: Math.round(passRate * 100),
          passed_quizzes: passedQuizzes
        }
      };

    } catch (error) {
      console.error('Quiz performance risk calculation error:', error);
      return {
        factor_type: 'quiz_performance',
        score: 50,
        weight: this.weights.quiz_performance,
        has_data: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate lesson completion risk
   */
  async calculateLessonCompletionRisk(studentId, courseId, organizationId) {
    try {
      // Get lesson completion points
      const lessonPoints = await GamificationPoints.find({
        user_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        activity_type: 'lesson_completion',
        is_active: true
      });

      // Get total lessons in course (approximate from sections/lessons)
      const Course = require('../models/Course');
      const Lesson = require('../models/Lesson');
      
      const totalLessons = await Lesson.countDocuments({
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      });

      if (totalLessons === 0) {
        return {
          factor_type: 'lesson_completion',
          score: 30,
          weight: this.weights.lesson_completion,
          has_data: false,
          details: { total_lessons: 0, completed: 0, completion_rate: 0 }
        };
      }

      const completedLessons = lessonPoints.length;
      const completionRate = completedLessons / totalLessons;

      // Calculate risk score (higher completion = lower risk)
      const riskScore = Math.round((1 - completionRate) * 100);

      return {
        factor_type: 'lesson_completion',
        score: riskScore,
        weight: this.weights.lesson_completion,
        has_data: true,
        data_points: totalLessons,
        details: {
          total_lessons: totalLessons,
          completed: completedLessons,
          completion_rate: Math.round(completionRate * 100)
        }
      };

    } catch (error) {
      console.error('Lesson completion risk calculation error:', error);
      return {
        factor_type: 'lesson_completion',
        score: 50,
        weight: this.weights.lesson_completion,
        has_data: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate engagement risk (simplified - based on gamification activity)
   */
  async calculateEngagementRisk(studentId, courseId, organizationId) {
    try {
      // Get all gamification activities for the student in this course
      const activities = await GamificationPoints.find({
        user_id: studentId,
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      }).sort({ earned_at: -1 });

      if (activities.length === 0) {
        return {
          factor_type: 'engagement',
          score: 70, // High risk when no engagement
          weight: this.weights.engagement,
          has_data: false,
          details: { total_activities: 0, recent_activities: 0, days_since_last: null }
        };
      }

      // Calculate days since last activity
      const lastActivity = activities[0];
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.earned_at) / (1000 * 60 * 60 * 24));

      // Count recent activities (last 7 days)
      const recentActivities = activities.filter(
        activity => (Date.now() - activity.earned_at) <= (7 * 24 * 60 * 60 * 1000)
      );

      // Calculate engagement score
      let engagementScore = 0;
      
      // Factor 1: Days since last activity (0-40 points)
      if (daysSinceLastActivity <= 1) engagementScore += 0;
      else if (daysSinceLastActivity <= 3) engagementScore += 10;
      else if (daysSinceLastActivity <= 7) engagementScore += 25;
      else engagementScore += 40;

      // Factor 2: Recent activity frequency (0-60 points)
      if (recentActivities.length >= 5) engagementScore += 0;
      else if (recentActivities.length >= 3) engagementScore += 20;
      else if (recentActivities.length >= 1) engagementScore += 40;
      else engagementScore += 60;

      return {
        factor_type: 'engagement',
        score: Math.min(100, engagementScore),
        weight: this.weights.engagement,
        has_data: true,
        data_points: activities.length,
        details: {
          total_activities: activities.length,
          recent_activities: recentActivities.length,
          days_since_last: daysSinceLastActivity
        }
      };

    } catch (error) {
      console.error('Engagement risk calculation error:', error);
      return {
        factor_type: 'engagement',
        score: 50,
        weight: this.weights.engagement,
        has_data: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate time spent risk (simplified)
   */
  async calculateTimeSpentRisk(studentId, courseId, organizationId) {
    try {
      // This is a simplified implementation
      // In a real system, you'd track actual time spent in lessons, videos, etc.
      
      // For now, estimate based on activities and attendance
      const [activities, liveClasses] = await Promise.all([
        GamificationPoints.find({
          user_id: studentId,
          course_id: courseId,
          organization_id: organizationId,
          is_active: true
        }),
        LiveClass.find({
          course_id: courseId,
          organization_id: organizationId,
          'attendance.student_id': studentId,
          is_active: true
        })
      ]);

      // Estimate time spent
      let estimatedMinutes = 0;
      
      // Estimate 15 minutes per lesson completion
      const lessonActivities = activities.filter(a => a.activity_type === 'lesson_completion');
      estimatedMinutes += lessonActivities.length * 15;
      
      // Add actual live class attendance time
      liveClasses.forEach(liveClass => {
        const attendance = liveClass.attendance.find(
          att => att.student_id.toString() === studentId.toString()
        );
        if (attendance) {
          estimatedMinutes += attendance.duration_minutes || 0;
        }
      });

      // Estimate expected time (rough calculation)
      const expectedMinutes = lessonActivities.length * 20 + liveClasses.length * 60; // 20 min per lesson + 60 min per live class
      
      if (expectedMinutes === 0) {
        return {
          factor_type: 'time_spent',
          score: 30,
          weight: this.weights.time_spent,
          has_data: false,
          details: { estimated_minutes: 0, expected_minutes: 0, time_ratio: 0 }
        };
      }

      const timeRatio = estimatedMinutes / expectedMinutes;
      const riskScore = Math.round(Math.max(0, (1 - timeRatio) * 100));

      return {
        factor_type: 'time_spent',
        score: Math.min(100, riskScore),
        weight: this.weights.time_spent,
        has_data: true,
        data_points: activities.length + liveClasses.length,
        details: {
          estimated_minutes: estimatedMinutes,
          expected_minutes: expectedMinutes,
          time_ratio: Math.round(timeRatio * 100)
        }
      };

    } catch (error) {
      console.error('Time spent risk calculation error:', error);
      return {
        factor_type: 'time_spent',
        score: 50,
        weight: this.weights.time_spent,
        has_data: false,
        error: error.message
      };
    }
  }

  /**
   * Determine risk level from score
   */
  determineRiskLevel(score) {
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate intervention suggestions based on risk factors
   */
  generateSuggestions(factors, riskLevel) {
    const suggestions = [];

    factors.forEach(factor => {
      if (!factor.has_data) return;

      switch (factor.factor_type) {
        case 'attendance':
          if (factor.score > 60) {
            suggestions.push('Send personalized reminders for upcoming live classes');
            suggestions.push('Schedule one-on-one meeting to discuss attendance barriers');
          }
          break;

        case 'quiz_performance':
          if (factor.score > 60) {
            suggestions.push('Provide additional practice materials and study guides');
            suggestions.push('Offer tutoring sessions for challenging topics');
          }
          break;

        case 'lesson_completion':
          if (factor.score > 60) {
            suggestions.push('Check in about course difficulty and pacing');
            suggestions.push('Provide deadline extensions if needed');
          }
          break;

        case 'engagement':
          if (factor.score > 60) {
            suggestions.push('Encourage participation in discussion forums');
            suggestions.push('Assign peer study partner or mentor');
          }
          break;

        case 'time_spent':
          if (factor.score > 60) {
            suggestions.push('Discuss time management strategies');
            suggestions.push('Provide study schedule template');
          }
          break;
      }
    });

    // General suggestions based on risk level
    if (riskLevel === 'high') {
      suggestions.unshift('URGENT: Contact student within 24 hours');
      suggestions.push('Consider academic intervention plan');
    } else if (riskLevel === 'medium') {
      suggestions.push('Monitor progress weekly');
      suggestions.push('Send encouraging progress updates');
    }

    // Remove duplicates and limit to 6 suggestions
    return [...new Set(suggestions)].slice(0, 6);
  }

  /**
   * Save or update risk assessment in database and trigger notifications
   */
  async saveRiskAssessment(studentId, courseId, organizationId, assessmentData) {
    try {
      const existingAssessment = await RiskAssessment.findOne({
        student_id: studentId,
        course_id: courseId,
        organization_id: organizationId
      });

      let savedAssessment;
      let isNewHighRisk = false;
      let isNewMediumRisk = false;

      if (existingAssessment) {
        // Check if risk level changed to high or medium
        const previousRiskLevel = existingAssessment.risk_level;
        const newRiskLevel = assessmentData.risk_level;
        
        isNewHighRisk = newRiskLevel === 'high' && previousRiskLevel !== 'high';
        isNewMediumRisk = newRiskLevel === 'medium' && previousRiskLevel !== 'medium' && previousRiskLevel !== 'high';

        // Update existing assessment
        Object.assign(existingAssessment, {
          risk_score: assessmentData.risk_score,
          risk_level: assessmentData.risk_level,
          factors: assessmentData.factors,
          suggestions: assessmentData.suggestions,
          confidence_level: assessmentData.confidence_level,
          data_points_used: assessmentData.data_points_used,
          last_calculated: new Date(),
          notification_sent: false, // Reset notification flag for new risk level
          notification_sent_at: null
        });

        savedAssessment = await existingAssessment.save();
      } else {
        // Create new assessment
        const newAssessment = new RiskAssessment({
          organization_id: organizationId,
          student_id: studentId,
          course_id: courseId,
          risk_score: assessmentData.risk_score,
          risk_level: assessmentData.risk_level,
          factors: assessmentData.factors,
          suggestions: assessmentData.suggestions,
          confidence_level: assessmentData.confidence_level,
          data_points_used: assessmentData.data_points_used
        });

        savedAssessment = await newAssessment.save();
        
        // New assessment - trigger notification if high or medium risk
        isNewHighRisk = assessmentData.risk_level === 'high';
        isNewMediumRisk = assessmentData.risk_level === 'medium';
      }

      // Trigger notifications for new high or medium risk students
      if ((isNewHighRisk || isNewMediumRisk) && !savedAssessment.notification_sent) {
        try {
          const notificationResult = await notificationService.processRiskAssessment(
            {
              student_id: studentId,
              course_id: courseId,
              risk_score: assessmentData.risk_score,
              risk_level: assessmentData.risk_level,
              factors: assessmentData.factors,
              suggestions: assessmentData.suggestions
            },
            organizationId
          );

          if (notificationResult.success && notificationResult.notifications_sent > 0) {
            // Mark notification as sent
            savedAssessment.notification_sent = true;
            savedAssessment.notification_sent_at = new Date();
            await savedAssessment.save();
            
            console.log(`Risk notifications sent for student ${studentId}: ${notificationResult.notifications_sent} notifications`);
          }
        } catch (notificationError) {
          console.error('Failed to send risk notifications:', notificationError);
          // Don't fail the entire operation if notifications fail
        }
      }

      return savedAssessment;

    } catch (error) {
      console.error('Save risk assessment error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const riskCalculationService = new RiskCalculationService();

module.exports = riskCalculationService;