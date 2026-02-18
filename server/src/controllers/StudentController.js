const BaseController = require('../core/BaseController');
const { Course, Section, Lesson, Enrollment, User, LiveClass, Review } = require('../models');
const mongoose = require('mongoose');

class StudentController extends BaseController {
  constructor() {
    super(null);
  }

  // 1️⃣ COURSE DISCOVERY
  discoverCourses = this.asyncHandler(async (req, res) => {
    const { search, category, level, sort = '-createdAt', page = 1, limit = 12 } = req.query;
    const user = req.user;

    // Build filters
    const filters = {
      organization_id: user.organization_id,
      status: 'published',
      is_deleted: false,
      isActive: true
    };

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (level) {
      filters.level = level;
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 12, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    // Get courses with aggregation for additional data
    const courses = await Course.aggregate([
      { $match: filters },
      // Lookup instructor
      {
        $lookup: {
          from: 'users',
          localField: 'instructor_id',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: { path: '$instructor', preserveNullAndEmptyArrays: true } },
      // Count total lectures
      {
        $lookup: {
          from: 'sections',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$course_id', '$$courseId'] }, isActive: true } },
            {
              $lookup: {
                from: 'lessons',
                let: { sectionId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$section_id', '$$sectionId'] }, isActive: true } }
                ],
                as: 'lessons'
              }
            }
          ],
          as: 'sections'
        }
      },
      // Count enrollments
      {
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$course_id', '$$courseId'] } } },
            { $count: 'total' }
          ],
          as: 'enrollmentCount'
        }
      },
      // Get reviews
      {
        $lookup: {
          from: 'reviews',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$course_id', '$$courseId'] }, is_active: true } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
              }
            }
          ],
          as: 'reviewStats'
        }
      },
      // Check if student is enrolled
      {
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course_id', '$$courseId'] },
                    { $eq: ['$student_id', user._id] }
                  ]
                }
              }
            }
          ],
          as: 'enrollment'
        }
      },
      // Project final shape
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          category: 1,
          level: 1,
          price: 1,
          'instructor.name': 1,
          'instructor.email': 1,
          'instructor.profile.avatar': 1,
          totalLectures: {
            $sum: {
              $map: {
                input: '$sections',
                as: 'section',
                in: { $size: '$$section.lessons' }
              }
            }
          },
          enrolledCount: { $ifNull: [{ $arrayElemAt: ['$enrollmentCount.total', 0] }, 0] },
          rating: { $ifNull: [{ $arrayElemAt: ['$reviewStats.averageRating', 0] }, 0] },
          totalReviews: { $ifNull: [{ $arrayElemAt: ['$reviewStats.totalReviews', 0] }, 0] },
          isEnrolled: { $gt: [{ $size: '$enrollment' }, 0] },
          createdAt: 1
        }
      },
      { $sort: this.parseSortParam(sort) },
      { $skip: (numericPage - 1) * numericLimit },
      { $limit: numericLimit }
    ]);

    const total = await Course.countDocuments(filters);

    this.sendSuccess(res, {
      courses,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Courses retrieved successfully');
  });

  // 2️⃣ COURSE DETAIL PAGE
  getCourseDetail = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.error('Invalid course ID', 'The provided course ID is not valid', 400);
    }

    const course = await Course.findOne({
      _id: id,
      organization_id: user.organization_id,
      status: 'published',
      is_deleted: false,
      isActive: true
    })
      .populate('instructor_id', 'name email profile')
      .lean();

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available', 404);
    }

    // Get sections with lessons
    const sections = await Section.find({
      course_id: id,
      organization_id: user.organization_id,
      isActive: true
    })
      .sort({ order: 1 })
      .lean();

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({
          section_id: section._id,
          organization_id: user.organization_id,
          isActive: true
        })
          .sort({ order: 1 })
          .select('title description type duration isPreview order')
          .lean();

        return {
          ...section,
          lessons
        };
      })
    );

    // Calculate total duration
    const totalDuration = sectionsWithLessons.reduce((total, section) => {
      return total + section.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    }, 0);

    // Get rating stats
    const ratingStats = await Review.calculateCourseRating(id);

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: id,
      organization_id: user.organization_id
    }).lean();

    // Get total lectures count
    const totalLectures = sectionsWithLessons.reduce((sum, section) => sum + section.lessons.length, 0);

    this.sendSuccess(res, {
      course: {
        ...course,
        instructor: course.instructor_id
      },
      sections: sectionsWithLessons,
      totalDuration,
      totalLectures,
      ratingStats,
      isEnrolled: !!enrollment,
      enrollment: enrollment ? {
        progress: enrollment.progress.completionPercentage,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt
      } : null
    }, 'Course details retrieved successfully');
  });

  // 3️⃣ ENROLL IN COURSE
  enrollInCourse = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user;

    // Check if course exists and is published
    const course = await Course.findOne({
      _id: courseId,
      organization_id: user.organization_id,
      status: 'published',
      is_deleted: false,
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: courseId,
      organization_id: user.organization_id
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Count total lessons
    const sections = await Section.find({
      course_id: courseId,
      organization_id: user.organization_id,
      isActive: true
    });

    let totalLessons = 0;
    for (const section of sections) {
      const lessonCount = await Lesson.countDocuments({
        section_id: section._id,
        organization_id: user.organization_id,
        isActive: true
      });
      totalLessons += lessonCount;
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      organization_id: user.organization_id,
      student_id: user._id,
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

    this.sendSuccess(res, enrollment, 'Successfully enrolled in course', 201);
  });

  // 4️⃣ MY ENROLLED COURSES
  getMyEnrollments = this.asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 12 } = req.query;
    const user = req.user;

    const filters = {
      student_id: user._id,
      organization_id: user.organization_id
    };

    if (status && status !== 'all') {
      filters.status = status;
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 12, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const enrollments = await Enrollment.find(filters)
      .populate({
        path: 'course_id',
        select: 'title description thumbnail category level instructor_id',
        populate: {
          path: 'instructor_id',
          select: 'name'
        }
      })
      .sort({ lastAccessedAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const total = await Enrollment.countDocuments(filters);

    // Format response
    const formattedEnrollments = enrollments.map(enrollment => ({
      _id: enrollment._id,
      course: {
        _id: enrollment.course_id._id,
        title: enrollment.course_id.title,
        description: enrollment.course_id.description,
        thumbnail: enrollment.course_id.thumbnail,
        category: enrollment.course_id.category,
        level: enrollment.course_id.level,
        instructor: enrollment.course_id.instructor_id?.name
      },
      progress: enrollment.progress.completionPercentage,
      lastAccessedLesson: enrollment.progress.lastAccessedLesson,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt,
      certificateIssued: enrollment.certificate?.issued || false
    }));

    this.sendSuccess(res, {
      enrollments: formattedEnrollments,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Enrollments retrieved successfully');
  });

  // 5️⃣ MARK LECTURE COMPLETE
  markLectureComplete = this.asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { timeSpent = 0, score = null } = req.body;
    const user = req.user;

    // Find the lesson
    const lesson = await Lesson.findOne({
      _id: lectureId,
      organization_id: user.organization_id,
      isActive: true
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Find enrollment for this course
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: lesson.course_id,
      organization_id: user.organization_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    // Mark lesson as complete
    enrollment.completeLesson(lectureId, timeSpent, score);
    await enrollment.save();

    // Check if course is now 100% complete and issue certificate
    if (enrollment.status === 'completed' && !enrollment.certificate.issued) {
      enrollment.certificate.issued = true;
      enrollment.certificate.issuedAt = new Date();
      enrollment.certificate.certificateId = `CERT-${enrollment._id}-${Date.now()}`;
      await enrollment.save();
    }

    this.sendSuccess(res, {
      progress: enrollment.progress.completionPercentage,
      isCompleted: enrollment.status === 'completed',
      certificateIssued: enrollment.certificate.issued
    }, 'Lecture marked as complete');
  });

  // 6️⃣ RESUME LEARNING
  getResumeLesson = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user;

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: courseId,
      organization_id: user.organization_id
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    // If there's a last accessed lesson, return it
    if (enrollment.progress.lastAccessedLesson) {
      const lesson = await Lesson.findById(enrollment.progress.lastAccessedLesson)
        .populate('section_id', 'title')
        .lean();

      if (lesson) {
        return this.sendSuccess(res, { lesson, type: 'resume' }, 'Resume lesson retrieved');
      }
    }

    // Otherwise, find the first uncompleted lesson
    const sections = await Section.find({
      course_id: courseId,
      organization_id: user.organization_id,
      isActive: true
    }).sort({ order: 1 });

    for (const section of sections) {
      const lessons = await Lesson.find({
        section_id: section._id,
        organization_id: user.organization_id,
        isActive: true
      }).sort({ order: 1 });

      for (const lesson of lessons) {
        if (!enrollment.isLessonCompleted(lesson._id)) {
          const lessonWithSection = await Lesson.findById(lesson._id)
            .populate('section_id', 'title')
            .lean();

          return this.sendSuccess(res, { lesson: lessonWithSection, type: 'next' }, 'Next lesson retrieved');
        }
      }
    }

    // All lessons completed
    this.sendSuccess(res, { lesson: null, type: 'completed' }, 'Course completed');
  });

  // 7️⃣ RATE & REVIEW - Create/Update
  createOrUpdateReview = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    if (!rating || rating < 1 || rating > 5) {
      return res.error('Invalid rating', 'Rating must be between 1 and 5', 400);
    }

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: courseId,
      organization_id: user.organization_id
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You must be enrolled to review this course', 403);
    }

    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      organization_id: user.organization_id
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist', 404);
    }

    // Create or update review
    const review = await Review.findOneAndUpdate(
      {
        student_id: user._id,
        course_id: courseId,
        organization_id: user.organization_id
      },
      {
        rating,
        comment: comment || '',
        is_active: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Update course rating
    const ratingStats = await Review.calculateCourseRating(courseId);
    await Course.findByIdAndUpdate(courseId, {
      'rating.average': ratingStats.averageRating,
      'rating.count': ratingStats.totalReviews
    });

    this.sendSuccess(res, review, 'Review submitted successfully', 201);
  });

  // Get course reviews
  getCourseReviews = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const user = req.user;

    const numericLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const reviews = await Review.find({
      course_id: courseId,
      organization_id: user.organization_id,
      is_active: true
    })
      .populate('student_id', 'name profile')
      .sort(sort)
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const total = await Review.countDocuments({
      course_id: courseId,
      organization_id: user.organization_id,
      is_active: true
    });

    const ratingStats = await Review.calculateCourseRating(courseId);

    this.sendSuccess(res, {
      reviews,
      ratingStats,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Reviews retrieved successfully');
  });

  // 8️⃣ STUDENT DASHBOARD
  getDashboard = this.asyncHandler(async (req, res) => {
    const user = req.user;
    const userId = new mongoose.Types.ObjectId(user._id);
    const orgId = new mongoose.Types.ObjectId(user.organization_id);

    const [
      enrollmentStats,
      upcomingClasses,
      recentActivity,
      recommendations
    ] = await Promise.all([
      // Enrollment statistics
      Enrollment.aggregate([
        {
          $match: {
            student_id: userId,
            organization_id: orgId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Upcoming live classes
      LiveClass.find({
        organization_id: user.organization_id,
        scheduled_date: { $gte: new Date() },
        status: { $in: ['scheduled', 'live'] },
        is_active: true
      })
        .populate('course_id', 'title')
        .populate('instructor_id', 'name')
        .sort({ scheduled_date: 1 })
        .limit(5)
        .lean(),

      // Recent activity (recently accessed courses)
      Enrollment.find({
        student_id: user._id,
        organization_id: user.organization_id,
        status: 'active'
      })
        .populate('course_id', 'title thumbnail')
        .populate('progress.lastAccessedLesson', 'title')
        .sort({ lastAccessedAt: -1 })
        .limit(5)
        .lean(),

      // Recommendations (popular courses not enrolled in)
      Course.aggregate([
        {
          $match: {
            organization_id: orgId,
            status: 'published',
            is_deleted: false,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'enrollments',
            let: { courseId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$course_id', '$$courseId'] },
                      { $eq: ['$student_id', userId] }
                    ]
                  }
                }
              }
            ],
            as: 'userEnrollment'
          }
        },
        {
          $match: {
            userEnrollment: { $size: 0 }
          }
        },
        {
          $lookup: {
            from: 'sections',
            let: { courseId: '$_id' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $eq: ['$course_id', '$$courseId'] },
                  isActive: true 
                } 
              },
              {
                $lookup: {
                  from: 'lessons',
                  let: { sectionId: '$_id' },
                  pipeline: [
                    { 
                      $match: { 
                        $expr: { $eq: ['$section_id', '$$sectionId'] },
                        isActive: true 
                      } 
                    }
                  ],
                  as: 'lessons'
                }
              }
            ],
            as: 'sections'
          }
        },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course_id',
            as: 'enrollments'
          }
        },
        {
          $addFields: {
            enrollmentCount: { $size: '$enrollments' },
            totalLessons: {
              $sum: {
                $map: {
                  input: '$sections',
                  as: 'section',
                  in: { $size: '$$section.lessons' }
                }
              }
            }
          }
        },
        // Only show courses that have content
        {
          $match: {
            totalLessons: { $gt: 0 }
          }
        },
        { $sort: { enrollmentCount: -1, createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            title: 1,
            description: 1,
            thumbnail: 1,
            category: 1,
            level: 1,
            enrollmentCount: 1
          }
        }
      ])
    ]);

    // Format stats
    const stats = {
      totalEnrolled: enrollmentStats.reduce((sum, stat) => sum + stat.count, 0),
      completed: enrollmentStats.find(s => s._id === 'completed')?.count || 0,
      inProgress: enrollmentStats.find(s => s._id === 'active')?.count || 0
    };

    this.sendSuccess(res, {
      stats,
      upcomingClasses,
      recentActivity: recentActivity.map(e => ({
        course: e.course_id,
        progress: e.progress.completionPercentage,
        lastAccessedAt: e.lastAccessedAt,
        lastAccessedLesson: e.progress.lastAccessedLesson
      })),
      recommendations
    }, 'Dashboard data retrieved successfully');
  });

  // Helper method to parse sort parameter
  parseSortParam(sort) {
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }
    return sortObj;
  }
}

module.exports = new StudentController();
