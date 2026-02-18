const express = require('express');
const { authMiddleware: auth } = require('../middleware/auth');
const riskCalculationService = require('../utils/riskCalculationService');
const RiskAssessment = require('../models/RiskAssessment');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

/**
 * GET /api/analytics/risk/:student_id/:course_id
 * Get risk assessment for a specific student in a course
 */
router.get('/risk/:student_id/:course_id', auth, async (req, res) => {
  try {
    const { student_id, course_id } = req.params;
    const { organization_id } = req.user;

    // Validate that the student belongs to the same organization
    const student = await User.findOne({
      _id: student_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'Student not found in your organization'
      });
    }

    // Validate that the course belongs to the same organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student_id: student_id,
      course_id: course_id,
      organization_id: organization_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
        message: 'Student is not enrolled in this course'
      });
    }

    // Check for existing recent assessment (within last 24 hours for high risk, 3 days for medium, 7 days for low)
    const existingAssessment = await RiskAssessment.findOne({
      student_id: student_id,
      course_id: course_id,
      organization_id: organization_id
    });

    let shouldRecalculate = true;
    if (existingAssessment && !existingAssessment.needsUpdate()) {
      shouldRecalculate = false;
    }

    let riskData;
    if (shouldRecalculate) {
      // Calculate new risk assessment
      riskData = await riskCalculationService.calculateRiskAssessment(
        student_id,
        course_id,
        organization_id
      );

      if (riskData.success) {
        // Save the assessment to database
        await riskCalculationService.saveRiskAssessment(
          student_id,
          course_id,
          organization_id,
          riskData
        );
      }
    } else {
      // Use existing assessment
      riskData = {
        success: true,
        risk_score: existingAssessment.risk_score,
        risk_level: existingAssessment.risk_level,
        confidence_level: existingAssessment.confidence_level,
        factors: existingAssessment.factors,
        suggestions: existingAssessment.suggestions,
        data_points_used: existingAssessment.data_points_used,
        last_calculated: existingAssessment.last_calculated,
        from_cache: true
      };
    }

    if (!riskData.success) {
      return res.status(500).json({
        success: false,
        error: riskData.error,
        message: 'Failed to calculate risk assessment'
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.full_name,
          email: student.email
        },
        course: {
          id: course._id,
          title: course.title
        },
        assessment: {
          risk_score: riskData.risk_score,
          risk_level: riskData.risk_level,
          confidence_level: riskData.confidence_level,
          factors: riskData.factors,
          suggestions: riskData.suggestions,
          data_points_used: riskData.data_points_used,
          last_calculated: riskData.last_calculated || new Date(),
          from_cache: riskData.from_cache || false,
          insufficient_data: riskData.insufficient_data || false
        }
      },
      message: 'Risk assessment retrieved successfully'
    });

  } catch (error) {
    console.error('Get risk assessment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve risk assessment'
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard overview for organization
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { course_id, risk_level, limit = 20, page = 1 } = req.query;

    // Build filter query
    const filters = {};
    if (course_id) {
      filters.course_id = course_id;
    }
    if (risk_level && ['low', 'medium', 'high'].includes(risk_level)) {
      filters.risk_level = risk_level;
    }

    // Get organization risk statistics
    const orgStats = await RiskAssessment.getOrganizationStats(organization_id);

    // Get high-risk students (top priority)
    const highRiskStudents = await RiskAssessment.findHighRiskStudents(
      organization_id,
      course_id || null
    ).limit(10);

    // Get recent assessments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recentAssessments = await RiskAssessment.findByOrganization(
      organization_id,
      filters
    )
    .limit(parseInt(limit))
    .skip(skip);

    // Get total count for pagination
    const totalAssessments = await RiskAssessment.countDocuments({
      organization_id: organization_id,
      is_active: true,
      ...filters
    });

    // Get course-wise risk distribution if no specific course filter
    let courseRiskDistribution = [];
    if (!course_id) {
      const courseStats = await RiskAssessment.aggregate([
        {
          $match: {
            organization_id: organization_id,
            is_active: true
          }
        },
        {
          $group: {
            _id: {
              course_id: '$course_id',
              risk_level: '$risk_level'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.course_id',
            risk_distribution: {
              $push: {
                risk_level: '$_id.risk_level',
                count: '$count'
              }
            },
            total_students: { $sum: '$count' }
          }
        },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course'
          }
        },
        {
          $unwind: '$course'
        },
        {
          $project: {
            course_id: '$_id',
            course_title: '$course.title',
            total_students: 1,
            risk_distribution: 1
          }
        },
        {
          $sort: { total_students: -1 }
        },
        {
          $limit: 10
        }
      ]);

      courseRiskDistribution = courseStats;
    }

    // Calculate trends (compare with last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const trendsData = await RiskAssessment.aggregate([
      {
        $match: {
          organization_id: organization_id,
          is_active: true,
          last_calculated: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$last_calculated'
            }
          },
          high_risk_count: {
            $sum: { $cond: [{ $eq: ['$risk_level', 'high'] }, 1, 0] }
          },
          medium_risk_count: {
            $sum: { $cond: [{ $eq: ['$risk_level', 'medium'] }, 1, 0] }
          },
          low_risk_count: {
            $sum: { $cond: [{ $eq: ['$risk_level', 'low'] }, 1, 0] }
          },
          avg_risk_score: { $avg: '$risk_score' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_assessments: orgStats.total,
          risk_distribution: {
            high: orgStats.high,
            medium: orgStats.medium,
            low: orgStats.low
          },
          high_risk_students_count: orgStats.high.count,
          avg_risk_score: Math.round(
            (orgStats.high.avg_score * orgStats.high.count +
             orgStats.medium.avg_score * orgStats.medium.count +
             orgStats.low.avg_score * orgStats.low.count) / 
            (orgStats.total || 1)
          )
        },
        high_risk_students: highRiskStudents.map(assessment => ({
          student_id: assessment.student_id._id,
          student_name: assessment.student_id.full_name,
          student_email: assessment.student_id.email,
          course_id: assessment.course_id._id,
          course_title: assessment.course_id.title,
          risk_score: assessment.risk_score,
          risk_level: assessment.risk_level,
          confidence_level: assessment.confidence_level,
          suggestions: assessment.suggestions.slice(0, 3), // Top 3 suggestions
          last_calculated: assessment.last_calculated,
          needs_attention: assessment.risk_score >= 80
        })),
        recent_assessments: recentAssessments.map(assessment => ({
          student_id: assessment.student_id._id,
          student_name: assessment.student_id.full_name,
          course_id: assessment.course_id._id,
          course_title: assessment.course_id.title,
          risk_score: assessment.risk_score,
          risk_level: assessment.risk_level,
          confidence_level: assessment.confidence_level,
          last_calculated: assessment.last_calculated
        })),
        course_risk_distribution: courseRiskDistribution,
        trends: trendsData,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalAssessments / parseInt(limit)),
          total_items: totalAssessments,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Analytics dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve analytics dashboard'
    });
  }
});

/**
 * POST /api/analytics/bulk-calculate
 * Trigger bulk risk calculation for all students in organization or specific course
 */
router.post('/bulk-calculate', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    const { course_id, force_recalculate = false } = req.body;

    // Only instructors and admins can trigger bulk calculations
    if (!['instructor', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only instructors and admins can trigger bulk calculations'
      });
    }

    // Build enrollment query
    const enrollmentQuery = {
      organization_id: organization_id,
      status: 'active'
    };

    if (course_id) {
      // Validate course belongs to organization
      const course = await Course.findOne({
        _id: course_id,
        organization_id: organization_id,
        is_active: true
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found',
          message: 'Course not found in your organization'
        });
      }

      enrollmentQuery.course_id = course_id;
    }

    // Get all active enrollments
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('student_id', 'full_name email')
      .populate('course_id', 'title');

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: {
          processed: 0,
          skipped: 0,
          errors: 0
        },
        message: 'No active enrollments found'
      });
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const results = [];

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        // Check if we should skip (existing recent assessment)
        if (!force_recalculate) {
          const existingAssessment = await RiskAssessment.findOne({
            student_id: enrollment.student_id._id,
            course_id: enrollment.course_id._id,
            organization_id: organization_id
          });

          if (existingAssessment && !existingAssessment.needsUpdate()) {
            skipped++;
            continue;
          }
        }

        // Calculate risk assessment
        const riskData = await riskCalculationService.calculateRiskAssessment(
          enrollment.student_id._id,
          enrollment.course_id._id,
          organization_id
        );

        if (riskData.success) {
          // Save assessment
          await riskCalculationService.saveRiskAssessment(
            enrollment.student_id._id,
            enrollment.course_id._id,
            organization_id,
            riskData
          );

          processed++;
          results.push({
            student_name: enrollment.student_id.full_name,
            course_title: enrollment.course_id.title,
            risk_level: riskData.risk_level,
            risk_score: riskData.risk_score
          });
        } else {
          errors++;
          console.error(`Risk calculation failed for student ${enrollment.student_id._id}:`, riskData.error);
        }

      } catch (error) {
        errors++;
        console.error(`Error processing enrollment ${enrollment._id}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        total_enrollments: enrollments.length,
        sample_results: results.slice(0, 10) // Return first 10 results as sample
      },
      message: `Bulk calculation completed. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`
    });

  } catch (error) {
    console.error('Bulk calculate error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to perform bulk calculation'
    });
  }
});

/**
 * GET /api/analytics/course/:course_id/overview
 * Get detailed risk overview for a specific course
 */
router.get('/course/:course_id/overview', auth, async (req, res) => {
  try {
    const { course_id } = req.params;
    const { organization_id } = req.user;

    // Validate course belongs to organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: organization_id,
      is_active: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    // Get course risk overview
    const overview = await RiskAssessment.getCourseRiskOverview(course_id, organization_id);

    // Get factor analysis for the course
    const factorAnalysis = await RiskAssessment.aggregate([
      {
        $match: {
          course_id: course_id,
          organization_id: organization_id,
          is_active: true
        }
      },
      {
        $unwind: '$factors'
      },
      {
        $group: {
          _id: '$factors.factor_type',
          avg_score: { $avg: '$factors.score' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { avg_score: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          title: course.title,
          description: course.description
        },
        overview,
        factor_analysis: factorAnalysis.map(factor => ({
          factor_type: factor._id,
          avg_score: Math.round(factor.avg_score),
          student_count: factor.count,
          risk_level: factor.avg_score >= 70 ? 'high' : factor.avg_score >= 40 ? 'medium' : 'low'
        }))
      },
      message: 'Course risk overview retrieved successfully'
    });

  } catch (error) {
    console.error('Get course overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve course overview'
    });
  }
});

module.exports = router;