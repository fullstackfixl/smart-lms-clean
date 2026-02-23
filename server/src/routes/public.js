const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const GamificationPoints = require('../models/GamificationPoints');
const Enrollment = require('../models/Enrollment');

// Get public courses
router.get('/courses/public', async (req, res) => {
  try {
    const { limit = 12, page = 1, sort = 'popular' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    let sortOption = {};
    if (sort === 'popular') {
      sortOption = { enrollmentCount: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'rating') {
      sortOption = { 'rating.average': -1 };
    }

    // Query for courses that platform admin has globally published
    const query = {
      status: 'published',
      isGloballyPublished: true,
      isActive: true
    };

    const courses = await Course.find(query)
      .populate('instructor_id', 'profile.fullName profile.avatar')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          ...course,
          instructor: course.instructor_id
        })),
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public courses'
    });
  }
});

// Get global leaderboard (public students only)
router.get('/leaderboard/global', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get public students only (role = public_student, organization_id = null)
    const publicStudents = await User.find({
      role: 'public_student',
      organization_id: null,
      isActive: true
    }).select('_id profile.fullName profile.avatar').lean();

    if (publicStudents.length === 0) {
      return res.json({
        success: true,
        data: {
          leaderboard: []
        }
      });
    }

    const studentIds = publicStudents.map(s => s._id);

    // Get gamification points for these students
    const pointsData = await GamificationPoints.aggregate([
      {
        $match: {
          user_id: { $in: studentIds }
        }
      },
      {
        $group: {
          _id: '$user_id',
          totalPoints: { $sum: '$points_earned' }
        }
      },
      {
        $sort: { totalPoints: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get enrollment counts (courses completed)
    const enrollmentCounts = await Enrollment.aggregate([
      {
        $match: {
          student_id: { $in: studentIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$student_id',
          coursesCompleted: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup
    const enrollmentMap = {};
    enrollmentCounts.forEach(item => {
      enrollmentMap[item._id.toString()] = item.coursesCompleted;
    });

    const studentMap = {};
    publicStudents.forEach(student => {
      studentMap[student._id.toString()] = student;
    });

    // Build leaderboard
    const leaderboard = pointsData.map((entry, index) => {
      const userId = entry._id.toString();
      const student = studentMap[userId];

      return {
        rank: index + 1,
        user: {
          id: student._id,
          fullName: student.profile.fullName,
          avatar: student.profile.avatar
        },
        points: entry.totalPoints,
        coursesCompleted: enrollmentMap[userId] || 0,
        badges: 0 // TODO: Implement badges count
      };
    });

    res.json({
      success: true,
      data: {
        leaderboard
      }
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global leaderboard'
    });
  }
});

// Get platform statistics (alias: /api/public/stats)
router.get('/public/stats', async (req, res) => {
  return handleStats(req, res);
});

router.get('/stats/public', async (req, res) => {
  return handleStats(req, res);
});

async function handleStats(req, res) {
  try {
    const [
      totalPublicCourses,
      totalPublicStudents,
      totalOrganizations,
      completedEnrollments
    ] = await Promise.all([
      Course.countDocuments({
        status: 'published',
        isGloballyPublished: true,
        isActive: true
      }),
      User.countDocuments({
        role: 'public_student',
        organization_id: null,
        isActive: true
      }),
      require('../models/Organization').countDocuments({ isActive: true }),
      Enrollment.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      data: {
        totalPublicCourses,
        totalPublicStudents,
        totalOrganizations,
        coursesCompleted: completedEnrollments
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics'
    });
  }
}

module.exports = router;
