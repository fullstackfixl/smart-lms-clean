const express = require('express');
const { Course, Section, Lesson, Enrollment, User, Organization } = require('../models');
const { authMiddleware, optionalAuth, orgAccessMiddleware, requireRole } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const { sendEnrollmentEmail } = emailService;
const moduleGuard = require('../middleware/moduleGuard');

const router = express.Router();

// Apply module guard to all course routes
router.use(authMiddleware, moduleGuard('COURSES'));

// 1️⃣ Instructor Create Course (Spec Alias)
router.post('/create', authMiddleware, requireRole(['instructor']), async (req, res) => {
  try {
    const { title, description, category = 'general', price = 0, level = 'beginner', thumbnail, tags = [] } = req.body;
    if (!title || !description) {
      return res.error('Missing required fields', 'Title and description are required', 400);
    }
    const course = await Course.create({
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      title,
      description,
      category,
      price: Math.max(0, Number(price) || 0),
      level,
      thumbnail,
      tags,
      status: 'draft',
      isActive: true
    });
    res.success({ course }, 'Course created successfully', 201);
  } catch (error) {
    res.error(error.message, 'Failed to create course', 500);
  }
});

// Create course (instructor/admin only)
router.post('/', authMiddleware, requireRole(['org_admin', 'instructor']), async (req, res) => {
  try {
    const { title, description, price = 0, category, level = 'beginner', thumbnail, tags = [] } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.error('Missing required fields', 'Title, description, and category are required', 400);
    }

    const course = new Course({
      organization_id: req.user.organization_id,
      title,
      description,
      price: Math.max(0, price), // Ensure price is not negative
      category,
      level,
      instructor_id: req.user._id,
      thumbnail,
      tags,
      status: 'draft'
    });

    await course.save();

    res.success({
      course: await course.populate([
        { path: 'instructor_id', select: 'profile.firstName profile.lastName' },
        { path: 'organization_id', select: 'name domain' }
      ])
    }, 'Course created successfully');

  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 'DUPLICATE_TITLE') {
      return res.error('Duplicate course title', 'A course with this title already exists in your organization', 400);
    }
    res.error(error.message, 'Failed to create course', 500);
  }
});

// Get all courses (public access with optional auth and filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      level,
      organization,
      status = 'published',
      instructor,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };

    // Status filter - only published courses for public access
    if (req.user && (req.user.role === 'org_admin' || req.user.role === 'instructor')) {
      // Instructors can see their own courses in any status
      if (status === 'all') {
        filter.instructor_id = req.user._id;
      } else {
        filter.status = status;
        if (status !== 'published') {
          filter.instructor_id = req.user._id; // Only own courses for non-published
        }
      }
    } else {
      filter.status = 'published';
    }

    // Organization-based access control
    if (req.user) {
      if (req.user.organization_id) {
        // STRICT: Org users ONLY see their org's courses
        // No access to global public courses unless they are IN their org
        filter.organization_id = req.user.organization_id;

        // They can see published courses, OR their own draft courses if they are instructors
        if (req.user.role === 'org_admin' || req.user.role === 'instructor') {
          if (status !== 'published') {
            // For non-published, ensure they are the instructor or admin
            // (Already handled by the status filter block above, but implicit here)
          }
        } else {
          // Students/others only see published
          filter.status = 'published';
        }
      } else {
        // Platform admins or users without org (if any)
        // Platform admins might want to see everything, but standard users without org see public
        if (req.user.role === 'platform_admin' || req.user.role === 'platformAdmin') {
          // No org filter needed, can see all
        } else {
          filter.isPublic = true;
          filter.status = 'published';
        }
      }
    } else {
      // Unauthenticated users see public published courses
      filter.isPublic = true;
      filter.status = 'published';
    }

    // Apply additional filters
    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    // Explicit organization filter from query (admin use only or drill-down)
    // If user already has organization_id, we ignore this or ensure it matches
    if (organization) {
      if (req.user && req.user.organization_id && req.user.organization_id.toString() !== organization) {
        // effective no-op or error, but let's just let the override above take precedence
        // The line `filter.organization_id = req.user.organization_id` above handles it
      } else {
        filter.organization_id = organization;
      }
    }

    if (instructor) {
      filter.instructor_id = instructor;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(filter)
      .populate('organization_id', 'name domain')
      .populate('instructor_id', 'profile.firstName profile.lastName')
      .select('-students')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortObj);

    const total = await Course.countDocuments(filter);

    res.success({
      courses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }, 'Courses retrieved successfully');

  } catch (error) {
    console.error('Get courses error:', error);
    res.error(error.message, 'Failed to get courses', 500);
  }
});

// 2️⃣ Get Courses For Student (Spec Alias)
router.get('/student', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const courses = await Course.find({
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    })
      .populate('instructor_id', 'name')
      .select('_id title description instructor_id thumbnail');

    const results = [];
    for (const course of courses) {
      const sections = await Section.find({ course_id: course._id, isActive: true }).select('_id');
      let totalLessons = 0;
      for (const section of sections) {
        totalLessons += await Lesson.countDocuments({ section_id: section._id, isActive: true });
      }
      results.push({
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: { name: course.instructor_id?.name || '' },
        totalLessons
      });
    }

    res.success({ courses: results }, 'Courses for student retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to get courses for student', 500);
  }
});

// Get course details with sections and lessons
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    let filter = { _id: id, isActive: true };

    // Access control based on user authentication
    if (req.user && req.user.organization_id) {
      // STRICT: Must match organization
      filter.organization_id = req.user.organization_id;

      // If student, must be published
      if (req.user.role !== 'teacher' && req.user.role !== 'admin' && req.user.role !== 'org_admin') {
        filter.status = 'published';
      }
    } else if (req.user && (req.user.role === 'platform_admin' || req.user.role === 'platformAdmin')) {
      // Platform admin can see all
    } else {
      // Public/Unauthenticated
      filter.isPublic = true;
      filter.status = 'published';
    }

    const course = await Course.findOne(filter)
      .populate('organization_id', 'name domain')
      .populate('instructor_id', 'profile.firstName profile.lastName profile.bio');

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

    // Check if user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        student_id: req.user._id,
        course_id: course._id,
        status: 'active'
      });
      isEnrolled = !!enrollment;
    }

    // 5️⃣ Course Access Guard (Students must be enrolled)
    if (req.user && req.user.role === 'student') {
      if (!isEnrolled) {
        return res.error('Access denied', 'You must be enrolled to access this course', 403);
      }
    }

    // Update total lessons count in course
    const totalLessons = sectionsWithLessons.reduce((sum, section) => sum + section.lessons.length, 0);
    if (course.totalLessons !== totalLessons) {
      await Course.findByIdAndUpdate(course._id, { totalLessons });
    }

    res.success({
      course: {
        ...course.toObject(),
        totalLessons
      },
      sections: sectionsWithLessons,
      isEnrolled,
      progress: enrollment ? enrollment.progress : null
    }, 'Course details retrieved successfully');

  } catch (error) {
    console.error('Get course details error:', error);
    res.error(error.message, 'Failed to get course details', 500);
  }
});

// Update course (instructor/admin only)
router.put('/:id', authMiddleware, requireRole(['org_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find course and verify ownership
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courseQuery = {
      _id: id,
      organization_id: orgId
    };

    if (req.user.role !== 'org_admin') {
      courseQuery.instructor_id = req.user._id;
    }

    const course = await Course.findOne(courseQuery);

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to edit it', 404);
    }

    // Prevent changing organization_id and instructor_id
    delete updates.organization_id;
    delete updates.instructor_id;

    // Update course
    Object.assign(course, updates);
    await course.save();

    res.success({
      course: await course.populate([
        { path: 'instructor_id', select: 'profile.firstName profile.lastName' },
        { path: 'organization_id', select: 'name domain' }
      ])
    }, 'Course updated successfully');

  } catch (error) {
    console.error('Update course error:', error);
    if (error.code === 'DUPLICATE_TITLE') {
      return res.error('Duplicate course title', 'A course with this title already exists in your organization', 400);
    }
    res.error(error.message, 'Failed to update course', 500);
  }
});

// Soft delete course (instructor/admin only)
router.delete('/:id', authMiddleware, requireRole(['org_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Find course and verify ownership
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courseQuery = {
      _id: id,
      organization_id: orgId
    };

    if (req.user.role !== 'org_admin') {
      courseQuery.instructor_id = req.user._id;
    }

    const course = await Course.findOne(courseQuery);

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to delete it', 404);
    }

    // Soft delete - set isActive to false
    course.isActive = false;
    course.status = 'archived';
    await course.save();

    res.success({}, 'Course deleted successfully');

  } catch (error) {
    console.error('Delete course error:', error);
    res.error(error.message, 'Failed to delete course', 500);
  }
});

// Publish/Unpublish course
router.patch('/:id/status', authMiddleware, requireRole(['org_admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.error('Invalid status', 'Status must be draft, published, or archived', 400);
    }

    // Find course and verify ownership
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courseQuery = {
      _id: id,
      organization_id: orgId
    };

    if (req.user.role !== 'org_admin') {
      courseQuery.instructor_id = req.user._id;
    }

    const course = await Course.findOne(courseQuery);

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to modify it', 404);
    }

    course.status = status;
    await course.save();

    res.success({ course }, `Course ${status} successfully`);

  } catch (error) {
    console.error('Update course status error:', error);
    res.error(error.message, 'Failed to update course status', 500);
  }
});

// Purchase course (requires authentication)
router.post('/:id/purchase', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, paymentAmount, paymentMethod = 'razorpay' } = req.body;

    const course = await Course.findOne({ _id: id, isActive: true, status: 'published' })
      .populate('organization_id');

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: course._id
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // For free courses
    if (course.price === 0) {
      const enrollment = new Enrollment({
        organization_id: course.organization_id._id,
        student_id: req.user._id,
        course_id: course._id,
        enrollmentType: 'free',
        status: 'active'
      });

      await enrollment.save();
    } else {
      // For paid courses, validate payment details
      if (!paymentId || !paymentAmount) {
        return res.error('Payment details required', 'Payment ID and amount are required for paid courses', 400);
      }

      if (paymentAmount < course.price) {
        return res.error('Invalid payment amount', 'Payment amount is less than course price', 400);
      }

      const enrollment = new Enrollment({
        organization_id: course.organization_id._id,
        student_id: req.user._id,
        course_id: course._id,
        enrollmentType: 'paid',
        payment: {
          amount: paymentAmount,
          paymentId: paymentId,
          paymentMethod: paymentMethod,
          paymentStatus: 'completed',
          paymentDate: new Date()
        }
      });

      await enrollment.save();
    }

    // Update user's enrolled organizations
    const user = await User.findById(req.user._id);
    user.addOrganizationEnrollment(course.organization_id._id);

    // If user has no primary organization, set this as primary
    if (!user.organization_id) {
      user.organization_id = course.organization_id._id;
    }

    await user.save();

    // Add student to course and increment enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $addToSet: { students: req.user._id },
      $inc: { enrollmentCount: 1 }
    });

    // Send enrollment email
    await sendEnrollmentEmail(user, course, course.organization_id);

    res.success({
      enrollment: {
        course: {
          _id: course._id,
          title: course.title,
          organization: course.organization_id.name
        },
        enrolledAt: new Date()
      }
    }, 'Course enrollment successful');

  } catch (error) {
    console.error('Purchase course error:', error);
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

// 4️⃣ Get My Enrolled Courses (Spec Alias)
router.get('/my-courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student_id: req.user._id,
      organization_id: req.user.organization_id
    })
      .populate({ path: 'course_id', select: 'title description instructor_id', populate: { path: 'instructor_id', select: 'name' } })
      .sort({ enrolledAt: -1 });

    const courses = enrollments.map(e => ({
      _id: e._id,
      course: {
        _id: e.course_id?._id,
        title: e.course_id?.title,
        description: e.course_id?.description,
        thumbnail: e.course_id?.thumbnail,
        instructor: { name: e.course_id?.instructor_id?.name || '' }
      },
      progress: e.progress?.completionPercentage || 0,
      enrolledAt: e.enrolledAt
    }));

    res.success({ courses }, 'My courses retrieved successfully');
  } catch (error) {
    res.error(error.message, 'Failed to get my courses', 500);
  }
});

// Get user's enrolled courses
router.get('/my/enrollments', authMiddleware, async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const filter = { student_id: req.user._id };
    if (status !== 'all') {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course_id',
        populate: {
          path: 'organization_id',
          select: 'name domain'
        }
      })
      .sort({ enrolledAt: -1 });

    const courses = enrollments.map(enrollment => ({
      enrollment: {
        _id: enrollment._id,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        enrollmentType: enrollment.enrollmentType
      },
      course: enrollment.course_id,
      organization: enrollment.course_id.organization_id
    }));

    res.success({ courses }, 'Enrolled courses retrieved successfully');

  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.error(error.message, 'Failed to get enrolled courses', 500);
  }
});

// Get courses by organization (for organization members)
router.get('/organization/:orgId', authMiddleware, orgAccessMiddleware, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { page = 1, limit = 12, status = 'published' } = req.query;

    // Check if user can access this organization
    const canAccess = req.user.role === 'platform_admin' ||
      req.user.organization_id?.toString() === orgId ||
      req.user.enrolledOrganizations?.includes(orgId);

    if (!canAccess) {
      return res.error('Access denied', 'You cannot access courses from this organization', 403);
    }

    const filter = {
      organization_id: orgId,
      isActive: true
    };

    if (status !== 'all') {
      filter.status = status;
    }

    const courses = await Course.find(filter)
      .populate('instructor_id', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.success({
      courses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    }, 'Organization courses retrieved successfully');

  } catch (error) {
    console.error('Get organization courses error:', error);
    res.error(error.message, 'Failed to get organization courses', 500);
  }
});

// 3️⃣ Enroll in Course (Spec Alias)
router.post('/enroll/:courseId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    const sections = await Section.find({ course_id: courseId, isActive: true }).select('_id');
    let totalLessons = 0;
    for (const section of sections) {
      totalLessons += await Lesson.countDocuments({ section_id: section._id, isActive: true });
    }

    const enrollment = await Enrollment.create({
      organization_id: req.user.organization_id,
      student_id: req.user._id,
      course_id: courseId,
      enrollmentType: course.price > 0 ? 'paid' : 'free',
      status: 'active',
      progress: {
        completedLessons: [],
        totalLessons,
        completionPercentage: 0,
        totalTimeSpent: 0
      },
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });

    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 },
      $addToSet: { students: req.user._id }
    });

    res.success({ enrollment }, 'Enrollment successful');
  } catch (error) {
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

module.exports = router;
// Get course analytics (instructor only)
router.get('/:courseId/analytics', authMiddleware, requireRole(['org_admin', 'instructor']), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists and user has permission
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courseQuery = {
      _id: courseId,
      organization_id: orgId
    };

    if (req.user.role !== 'org_admin') {
      courseQuery.instructor_id = req.user._id;
    }

    const course = await Course.findOne(courseQuery);

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to view analytics', 404);
    }

    // Get enrollment statistics
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { course_id: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress.percentage' }
        }
      }
    ]);

    // Get total enrollments
    const totalEnrollments = await Enrollment.countDocuments({ course_id: courseId });

    // Get completion rate
    const completedEnrollments = await Enrollment.countDocuments({
      course_id: courseId,
      status: 'completed'
    });
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Get lesson analytics
    const { Lesson } = require('../models');
    const lessons = await Lesson.find({ course_id: courseId, isActive: true });

    const lessonAnalytics = await Promise.all(lessons.map(async (lesson) => {
      const completions = await Enrollment.countDocuments({
        course_id: courseId,
        'progress.completed_lessons.lesson_id': lesson._id
      });

      const completionRate = totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

      return {
        lesson_id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        completions,
        completion_rate: completionRate,
        avg_time_spent: 0 // This would need to be calculated from enrollment data
      };
    }));

    // Get revenue analytics (for paid courses)
    let revenueStats = null;
    if (course.price > 0) {
      const paidEnrollments = await Enrollment.find({
        course_id: courseId,
        payment_status: 'paid'
      });

      const totalRevenue = paidEnrollments.reduce((sum, enrollment) => {
        return sum + (enrollment.payment_info?.amount || 0);
      }, 0);

      revenueStats = {
        total_revenue: totalRevenue,
        paid_enrollments: paidEnrollments.length,
        average_revenue_per_user: paidEnrollments.length > 0 ? totalRevenue / paidEnrollments.length : 0
      };
    }

    // Get engagement metrics
    const engagementStats = await Enrollment.aggregate([
      { $match: { course_id: course._id } },
      {
        $group: {
          _id: null,
          avg_progress: { $avg: '$progress.percentage' },
          avg_time_spent: { $avg: '$progress.total_time_spent' },
          total_students: { $sum: 1 }
        }
      }
    ]);

    res.success({
      course: {
        _id: course._id,
        title: course.title,
        total_enrollments: totalEnrollments,
        completion_rate: completionRate
      },
      enrollment_stats: enrollmentStats,
      lesson_analytics: lessonAnalytics,
      revenue_stats: revenueStats,
      engagement_stats: engagementStats[0] || {
        avg_progress: 0,
        avg_time_spent: 0,
        total_students: 0
      }
    }, 'Course analytics retrieved successfully');

  } catch (error) {
    console.error('Get course analytics error:', error);
    res.error(error.message, 'Failed to get course analytics', 500);
  }
});

// Get progress reports for a course
router.get('/:courseId/progress-report', authMiddleware, requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { format = 'json', page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify course exists and user has permission
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courseQuery = {
      _id: courseId,
      organization_id: orgId
    };

    if (req.user.role !== 'org_admin') {
      courseQuery.instructor_id = req.user._id;
    }

    const course = await Course.findOne(courseQuery);

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to view reports', 404);
    }

    // Get detailed progress for all enrollments
    const enrollments = await Enrollment.find({ course_id: courseId })
      .populate('student_id', 'fullName email profile.avatar')
      .sort({ enrollment_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments({ course_id: courseId });

    // Get lesson details for progress calculation
    const { Lesson } = require('../models');
    const totalLessons = await Lesson.countDocuments({ course_id: courseId, isActive: true });

    const progressReport = enrollments.map(enrollment => ({
      student: {
        _id: enrollment.student_id._id,
        name: enrollment.student_id.fullName,
        email: enrollment.student_id.email,
        avatar: enrollment.student_id.profile?.avatar
      },
      enrollment: {
        date: enrollment.enrollment_date,
        status: enrollment.status,
        payment_status: enrollment.payment_status
      },
      progress: {
        percentage: enrollment.progress.percentage,
        completed_lessons: enrollment.progress.completed_lessons.length,
        total_lessons: totalLessons,
        total_time_spent: enrollment.progress.total_time_spent || 0,
        last_accessed: enrollment.progress.last_accessed
      },
      completion: {
        is_completed: enrollment.status === 'completed',
        completion_date: enrollment.completion_date,
        has_certificate: !!enrollment.certificate
      }
    }));

    res.success({
      course: {
        _id: course._id,
        title: course.title
      },
      report: progressReport,
      summary: {
        total_students: total,
        completed_students: progressReport.filter(p => p.completion.is_completed).length,
        average_progress: progressReport.reduce((sum, p) => sum + p.progress.percentage, 0) / progressReport.length || 0
      },
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    }, 'Progress report generated successfully');

  } catch (error) {
    console.error('Get progress report error:', error);
    res.error(error.message, 'Failed to generate progress report', 500);
  }
});
