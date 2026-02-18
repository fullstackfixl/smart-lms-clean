const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const GamificationService = require('../utils/gamificationService');
const router = express.Router();

// GET /api/gamification/profile - Get user's gamification profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await GamificationService.getUserProfile(
      req.user._id,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Gamification profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch gamification profile'
    });
  }
});

// GET /api/gamification/leaderboard/course/:courseId - Get course leaderboard
router.get('/leaderboard/course/:courseId', auth, [
  param('courseId').isMongoId().withMessage('Valid course ID is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid parameters',
        details: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    // Verify course belongs to user's organization
    const Course = require('../models/Course');
    const course = await Course.findOne({
      _id: req.params.courseId,
      organization_id: req.user.organization_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found or access denied'
      });
    }

    const result = await GamificationService.getCourseLeaderboard(
      req.params.courseId,
      req.user.organization_id,
      limit
    );

    if (result.success) {
      // Get user's position in the leaderboard
      const userPosition = await GamificationService.getUserCoursePosition(
        req.user._id,
        req.params.courseId,
        req.user.organization_id
      );

      res.json({
        success: true,
        data: {
          ...result.data,
          course_title: course.title,
          user_position: userPosition.success ? userPosition.data : null
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Course leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch course leaderboard'
    });
  }
});

// GET /api/gamification/leaderboard/organization - Get organization leaderboard
router.get('/leaderboard/organization', auth, [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid parameters',
        details: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    const result = await GamificationService.getOrganizationLeaderboard(
      req.user.organization_id,
      limit
    );

    if (result.success) {
      // Get user's position in the leaderboard
      const userPosition = await GamificationService.getUserOrganizationPosition(
        req.user._id,
        req.user.organization_id
      );

      res.json({
        success: true,
        data: {
          ...result.data,
          user_position: userPosition.success ? userPosition.data : null
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Organization leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch organization leaderboard'
    });
  }
});

// GET /api/gamification/badges - Get badge definitions and user progress
router.get('/badges', auth, async (req, res) => {
  try {
    const UserBadge = require('../models/UserBadge');
    const GamificationPoints = require('../models/GamificationPoints');

    const [badgeDefinitions, userBadges, totalPoints] = await Promise.all([
      UserBadge.getBadgeDefinitions(),
      UserBadge.getUserBadges(req.user._id, req.user.organization_id),
      GamificationPoints.getUserTotalPoints(req.user._id, req.user.organization_id)
    ]);

    const badgeProgress = await UserBadge.getUserBadgeProgress(
      req.user._id,
      req.user.organization_id,
      totalPoints
    );

    const nextBadge = await UserBadge.getNextBadge(
      req.user._id,
      req.user.organization_id,
      totalPoints
    );

    res.json({
      success: true,
      data: {
        badge_definitions: badgeDefinitions,
        user_badges: userBadges,
        badge_progress: badgeProgress,
        next_badge: nextBadge,
        user_total_points: totalPoints
      }
    });

  } catch (error) {
    console.error('Badges fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch badge information'
    });
  }
});

// GET /api/gamification/statistics - Get organization gamification statistics (admin/teacher only)
router.get('/statistics', auth, async (req, res) => {
  try {
    // Only admins and teachers can view organization statistics
    if (!['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and teachers can view organization statistics'
      });
    }

    const result = await GamificationService.getOrganizationStats(req.user.organization_id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Organization statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch organization statistics'
    });
  }
});

// POST /api/gamification/award-bonus - Award bonus points (admin only)
router.post('/award-bonus', auth, [
  param('userId').optional().isMongoId().withMessage('Valid user ID is required'),
  query('points').isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000'),
  query('title').isLength({ min: 1, max: 200 }).withMessage('Title is required and must be under 200 characters'),
  query('description').optional().isLength({ max: 500 }).withMessage('Description must be under 500 characters')
], async (req, res) => {
  try {
    // Only admins can award bonus points
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can award bonus points'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid parameters',
        details: errors.array()
      });
    }

    const {
      userId = req.user._id,
      courseId,
      points,
      title,
      description = `Bonus points awarded by ${req.user.full_name}`
    } = req.body;

    // Verify target user belongs to same organization
    const User = require('../models/User');
    const targetUser = await User.findOne({
      _id: userId,
      organization_id: req.user.organization_id
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found in your organization'
      });
    }

    const result = await GamificationService.awardBonusPoints(
      userId,
      req.user.organization_id,
      courseId,
      parseInt(points),
      title,
      description,
      {
        awarded_by: req.user._id,
        awarded_by_name: req.user.full_name,
        awarded_at: new Date()
      }
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: `${points} bonus points awarded to ${targetUser.full_name}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Bonus points award error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to award bonus points'
    });
  }
});

// GET /api/gamification/activities - Get user's recent activities
router.get('/activities', auth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const GamificationPoints = require('../models/GamificationPoints');
    const activities = await GamificationPoints.getUserRecentActivities(
      req.user._id,
      req.user.organization_id,
      limit
    );

    res.json({
      success: true,
      data: {
        activities: activities,
        total_activities: activities.length
      }
    });

  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch user activities'
    });
  }
});

// DELETE /api/gamification/reset/:userId - Reset user points (admin only, for testing)
router.delete('/reset/:userId', auth, [
  param('userId').isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    // Only admins can reset points
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can reset user points'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user ID'
      });
    }

    // Verify target user belongs to same organization
    const User = require('../models/User');
    const targetUser = await User.findOne({
      _id: req.params.userId,
      organization_id: req.user.organization_id
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found in your organization'
      });
    }

    const result = await GamificationService.resetUserPoints(
      req.params.userId,
      req.user.organization_id
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Points and badges reset for ${targetUser.full_name}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Points reset error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to reset user points'
    });
  }
});

module.exports = router;