const GamificationPoints = require('../models/GamificationPoints');
const UserBadge = require('../models/UserBadge');

/**
 * Gamification Service
 * Handles point awarding, badge unlocking, and leaderboard management
 */
class GamificationService {
  
  /**
   * Award points for lesson completion
   * @param {string} userId - User ID
   * @param {string} lessonId - Lesson ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @param {string} lessonTitle - Lesson title
   * @returns {Promise<Object>} Result object
   */
  static async awardLessonPoints(userId, lessonId, courseId, organizationId, lessonTitle) {
    try {
      const result = await GamificationPoints.awardLessonPoints(
        userId, 
        lessonId, 
        courseId, 
        organizationId, 
        lessonTitle
      );

      if (result.success) {
        // Check for badge unlocks
        const badgeResult = await UserBadge.checkAndUnlockBadges(
          userId,
          organizationId,
          result.total_points
        );

        return {
          success: true,
          points_earned: result.points_earned,
          total_points: result.total_points,
          badges_unlocked: badgeResult.unlocked_badges || [],
          activity_type: 'lesson_completion'
        };
      }

      return result;
    } catch (error) {
      console.error('Lesson points award error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to award lesson points'
      };
    }
  }

  /**
   * Award points for quiz pass
   * @param {string} userId - User ID
   * @param {string} quizId - Quiz ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @param {string} quizTitle - Quiz title
   * @param {number} score - Quiz score
   * @param {number} percentage - Quiz percentage
   * @returns {Promise<Object>} Result object
   */
  static async awardQuizPoints(userId, quizId, courseId, organizationId, quizTitle, score, percentage) {
    try {
      const result = await GamificationPoints.awardQuizPoints(
        userId,
        quizId,
        courseId,
        organizationId,
        quizTitle,
        score,
        percentage
      );

      if (result.success) {
        // Check for badge unlocks
        const badgeResult = await UserBadge.checkAndUnlockBadges(
          userId,
          organizationId,
          result.total_points
        );

        return {
          success: true,
          points_earned: result.points_earned,
          total_points: result.total_points,
          badges_unlocked: badgeResult.unlocked_badges || [],
          activity_type: 'quiz_pass'
        };
      }

      return result;
    } catch (error) {
      console.error('Quiz points award error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to award quiz points'
      };
    }
  }

  /**
   * Award bonus points for special activities
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {string} courseId - Course ID (optional)
   * @param {number} points - Points to award
   * @param {string} activityTitle - Activity title
   * @param {string} activityDescription - Activity description
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Result object
   */
  static async awardBonusPoints(userId, organizationId, courseId, points, activityTitle, activityDescription, metadata = {}) {
    try {
      const GamificationPoints = require('../models/GamificationPoints');
      
      const pointsRecord = new GamificationPoints({
        organization_id: organizationId,
        user_id: userId,
        course_id: courseId || undefined,
        activity_type: 'bonus_activity',
        points_earned: points,
        activity_title: activityTitle,
        activity_description: activityDescription,
        metadata: metadata
      });

      await pointsRecord.save();

      const totalPoints = await GamificationPoints.getUserTotalPoints(userId, organizationId);

      // Check for badge unlocks
      const badgeResult = await UserBadge.checkAndUnlockBadges(
        userId,
        organizationId,
        totalPoints
      );

      return {
        success: true,
        points_earned: points,
        total_points: totalPoints,
        badges_unlocked: badgeResult.unlocked_badges || [],
        activity_type: 'bonus_activity'
      };

    } catch (error) {
      console.error('Bonus points award error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to award bonus points'
      };
    }
  }

  /**
   * Get user's gamification profile
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} User profile data
   */
  static async getUserProfile(userId, organizationId) {
    try {
      const [totalPoints, pointsByActivity, userBadges, recentActivities, nextBadge] = await Promise.all([
        GamificationPoints.getUserTotalPoints(userId, organizationId),
        GamificationPoints.getUserPointsByActivity(userId, organizationId),
        UserBadge.getUserBadges(userId, organizationId),
        GamificationPoints.getUserRecentActivities(userId, organizationId, 10),
        null // Will be calculated after getting total points
      ]);

      const nextBadgeInfo = await UserBadge.getNextBadge(userId, organizationId, totalPoints);
      const badgeProgress = await UserBadge.getUserBadgeProgress(userId, organizationId, totalPoints);

      return {
        success: true,
        data: {
          user_id: userId,
          total_points: totalPoints,
          points_by_activity: pointsByActivity,
          badges: {
            earned: userBadges,
            progress: badgeProgress,
            next_badge: nextBadgeInfo
          },
          recent_activities: recentActivities,
          statistics: {
            lessons_completed: pointsByActivity.lesson_completion.count,
            quizzes_passed: pointsByActivity.quiz_pass.count,
            courses_completed: pointsByActivity.course_completion.count,
            bonus_activities: pointsByActivity.bonus_activity.count
          }
        }
      };

    } catch (error) {
      console.error('User profile fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user profile'
      };
    }
  }

  /**
   * Get course leaderboard
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @param {number} limit - Number of users to return
   * @returns {Promise<Object>} Leaderboard data
   */
  static async getCourseLeaderboard(courseId, organizationId, limit = 10) {
    try {
      const leaderboard = await GamificationPoints.getCourseLeaderboard(courseId, organizationId, limit);

      return {
        success: true,
        data: {
          leaderboard_type: 'course',
          course_id: courseId,
          users: leaderboard,
          total_users: leaderboard.length
        }
      };

    } catch (error) {
      console.error('Course leaderboard fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch course leaderboard'
      };
    }
  }

  /**
   * Get organization leaderboard
   * @param {string} organizationId - Organization ID
   * @param {number} limit - Number of users to return
   * @returns {Promise<Object>} Leaderboard data
   */
  static async getOrganizationLeaderboard(organizationId, limit = 10) {
    try {
      const leaderboard = await GamificationPoints.getOrganizationLeaderboard(organizationId, limit);

      return {
        success: true,
        data: {
          leaderboard_type: 'organization',
          organization_id: organizationId,
          users: leaderboard,
          total_users: leaderboard.length
        }
      };

    } catch (error) {
      console.error('Organization leaderboard fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch organization leaderboard'
      };
    }
  }

  /**
   * Get user's position in course leaderboard
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} User position data
   */
  static async getUserCoursePosition(userId, courseId, organizationId) {
    try {
      const leaderboard = await GamificationPoints.getCourseLeaderboard(courseId, organizationId, 1000);
      const userPosition = leaderboard.findIndex(user => user.user_id.toString() === userId.toString());

      if (userPosition === -1) {
        return {
          success: true,
          data: {
            position: null,
            total_participants: leaderboard.length,
            user_points: 0,
            message: 'User not found in course leaderboard'
          }
        };
      }

      const userData = leaderboard[userPosition];

      return {
        success: true,
        data: {
          position: userPosition + 1,
          total_participants: leaderboard.length,
          user_points: userData.total_points,
          percentile: Math.round(((leaderboard.length - userPosition) / leaderboard.length) * 100)
        }
      };

    } catch (error) {
      console.error('User course position fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user course position'
      };
    }
  }

  /**
   * Get user's position in organization leaderboard
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} User position data
   */
  static async getUserOrganizationPosition(userId, organizationId) {
    try {
      const leaderboard = await GamificationPoints.getOrganizationLeaderboard(organizationId, 1000);
      const userPosition = leaderboard.findIndex(user => user.user_id.toString() === userId.toString());

      if (userPosition === -1) {
        return {
          success: true,
          data: {
            position: null,
            total_participants: leaderboard.length,
            user_points: 0,
            message: 'User not found in organization leaderboard'
          }
        };
      }

      const userData = leaderboard[userPosition];

      return {
        success: true,
        data: {
          position: userPosition + 1,
          total_participants: leaderboard.length,
          user_points: userData.total_points,
          percentile: Math.round(((leaderboard.length - userPosition) / leaderboard.length) * 100)
        }
      };

    } catch (error) {
      console.error('User organization position fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user organization position'
      };
    }
  }

  /**
   * Get organization gamification statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Organization statistics
   */
  static async getOrganizationStats(organizationId) {
    try {
      const [badgeStats, totalUsers, totalPoints] = await Promise.all([
        UserBadge.getOrganizationBadgeStats(organizationId),
        GamificationPoints.distinct('user_id', { organization_id: organizationId, is_active: true }),
        GamificationPoints.aggregate([
          { $match: { organization_id: require('mongoose').Types.ObjectId(organizationId), is_active: true } },
          { $group: { _id: null, total: { $sum: '$points_earned' } } }
        ])
      ]);

      const recentBadges = await UserBadge.getRecentBadgeUnlocks(organizationId, 5);

      return {
        success: true,
        data: {
          organization_id: organizationId,
          total_active_users: totalUsers.length,
          total_points_awarded: totalPoints[0] ? totalPoints[0].total : 0,
          badge_statistics: badgeStats,
          recent_badge_unlocks: recentBadges,
          engagement_metrics: {
            avg_points_per_user: totalUsers.length > 0 ? 
              Math.round((totalPoints[0] ? totalPoints[0].total : 0) / totalUsers.length) : 0
          }
        }
      };

    } catch (error) {
      console.error('Organization stats fetch error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch organization statistics'
      };
    }
  }

  /**
   * Reset user points (admin only - for testing/debugging)
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Reset result
   */
  static async resetUserPoints(userId, organizationId) {
    try {
      // Deactivate all points
      await GamificationPoints.updateMany(
        { user_id: userId, organization_id: organizationId },
        { is_active: false }
      );

      // Deactivate all badges
      await UserBadge.updateMany(
        { user_id: userId, organization_id: organizationId },
        { is_active: false }
      );

      return {
        success: true,
        message: 'User points and badges reset successfully'
      };

    } catch (error) {
      console.error('User points reset error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to reset user points'
      };
    }
  }
}

module.exports = GamificationService;