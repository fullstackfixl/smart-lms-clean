const express = require('express');
const { Course, Section, Lesson, Enrollment, User, Organization, Certificate, Quiz, QuizSubmission } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOrganization } = require('../middleware/orgProtection');
const { cloudinaryUpload, handleUploadError } = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

// All student routes require organization
router.use(requireOrganization);

// ─────────────────────────────────────────────────────────────
// GET /student/profile  — returns name, email + enrollment stats
// ─────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email profile createdAt');
    if (!user) return res.error('User not found', 'User not found', 404);

    const [enrollments, completed] = await Promise.all([
      Enrollment.countDocuments({ student_id: req.user._id, organization_id: req.user.organization_id }),
      Enrollment.countDocuments({ student_id: req.user._id, organization_id: req.user.organization_id, status: 'completed' })
    ]);

    res.success({
      _id: user._id,
      name: user.name,
      email: user.email,
      organization_code: req.user.organization_code || user.organization_code || null,
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      bio: user.profile?.bio || '',
      avatar: user.profile?.avatar || '',
      created_at: user.createdAt,
      enrollments_count: enrollments,
      completed_courses: completed
    }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('student profile error:', error);
    res.error(error.message, 'Failed to get profile', 500);
  }
});

// POST /student/profile/avatar — upload avatar to Cloudinary and update user profile
router.post(
  '/profile/avatar',
  authMiddleware,
  requireRole(['student']),
  cloudinaryUpload.single('avatar'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.error('No file provided', 'Please select an image to upload', 400);
      }

      // Validate image type and size (client also validates)
      if (!req.file.mimetype.startsWith('image/')) {
        return res.error('Invalid file type', 'Only image files are allowed', 400);
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.error('File too large', 'Image must be smaller than 5MB', 400);
      }

      const orgId = req.user.organization_id?._id || req.user.organization_id;
      const folder = `smart-lms/${orgId}/avatars`;
      const publicId = `avatar_${req.user._id}_${Date.now()}`;

      const result = await uploadToCloudinary(req.file.buffer, {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face', quality: 'auto' }]
      });

      // Update current user's avatar URL
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { 'profile.avatar': result.secure_url },
        { new: true }
      ).select('name email profile');

      return res.success(
        { avatar: user.profile?.avatar || result.secure_url },
        'Avatar updated successfully'
      );
    } catch (error) {
      console.error('student avatar upload error:', error);
      return res.error(error.message, 'Failed to upload avatar', 500);
    }
  }
);

// PATCH /student/profile
router.patch('/profile', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { name, phone, location, bio } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone !== undefined) update['profile.phone'] = phone;
    if (location !== undefined) update['profile.location'] = location;
    if (bio !== undefined) update['profile.bio'] = bio;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true })
      .select('name email profile createdAt');

    res.success({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      bio: user.profile?.bio || '',
      avatar: user.profile?.avatar || '',
      created_at: user.createdAt
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('student profile update error:', error);
    res.error(error.message, 'Failed to update profile', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/available-courses
// Courses in same org, published, NOT yet enrolled by this student
// ─────────────────────────────────────────────────────────────
router.get('/available-courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, level } = req.query;

    // Find all courseIds this student is already enrolled in
    const myEnrollments = await Enrollment.find({
      student_id: req.user._id,
      organization_id: req.user.organization_id
    }).select('course_id');
    const enrolledCourseIds = myEnrollments.map(e => e.course_id.toString());

    // Build filter: org-scoped, published, NOT already enrolled
    const filter = {
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true,
      _id: { $nin: enrolledCourseIds }
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (level) filter.level = level;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor_id', 'name profile')
        .select('title description thumbnail instructor_id duration rating category level price enrollmentCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(filter)
    ]);

    res.success({
      courses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }, 'Available courses retrieved successfully');

  } catch (error) {
    console.error('available-courses error:', error);
    res.error(error.message, 'Failed to get available courses', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/courses  (browse all - includes enrolled flag)
// ─────────────────────────────────────────────────────────────
router.get('/courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, level } = req.query;

    const filter = {
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (level) filter.level = level;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor_id', 'name profile')
        .select('title description thumbnail instructor_id duration rating category level price enrollmentCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(filter)
    ]);

    const myEnrollments = await Enrollment.find({
      student_id: req.user._id,
      course_id: { $in: courses.map(c => c._id) }
    }).select('course_id progress status');

    const enrollmentMap = {};
    myEnrollments.forEach(e => { enrollmentMap[e.course_id.toString()] = e; });

    const coursesWithEnrollment = courses.map(course => {
      const enrollment = enrollmentMap[course._id.toString()];
      return {
        ...course.toObject(),
        isEnrolled: !!enrollment,
        enrollmentId: enrollment?._id,
        progress: enrollment?.progress?.completionPercentage || 0,
        enrollmentStatus: enrollment?.status || null
      };
    });

    res.success({
      courses: coursesWithEnrollment,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }, 'Courses retrieved successfully');

  } catch (error) {
    console.error('get-courses error:', error);
    res.error(error.message, 'Failed to get courses', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/my-courses  — enrolled courses with progress
// ─────────────────────────────────────────────────────────────
router.get('/my-courses', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student_id: req.user._id,
      organization_id: req.user.organization_id
    })
      .populate({
        path: 'course_id',
        select: 'title description thumbnail instructor_id duration rating category level',
        populate: { path: 'instructor_id', select: 'name profile' }
      })
      .sort({ updatedAt: -1 });

    const courses = enrollments.map(e => ({
      enrollmentId: e._id,
      course: e.course_id,
      progress: e.progress?.completionPercentage || 0,
      completedLessons: e.progress?.completedLessons?.length || 0,
      totalLessons: e.progress?.totalLessons || 0,
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      lastAccessedAt: e.lastAccessedAt
    }));

    res.success({ courses }, 'My courses retrieved successfully');

  } catch (error) {
    console.error('my-courses error:', error);
    res.error(error.message, 'Failed to get my courses', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/enrollments  — alias (dashboard compatibility)
// ─────────────────────────────────────────────────────────────
router.get('/enrollments', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    const filter = {
      student_id: req.user._id,
      organization_id: req.user.organization_id
    };
    if (status !== 'all') filter.status = status;

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course_id',
        select: 'title description thumbnail instructor_id duration rating',
        populate: { path: 'instructor_id', select: 'name' }
      })
      .sort({ enrolledAt: -1 });

    const enrollmentsData = enrollments.map(e => ({
      _id: e._id,
      course: e.course_id,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      lastAccessedAt: e.lastAccessedAt,
      status: e.status,
      completedAt: e.completedAt
    }));

    res.success({ enrollments: enrollmentsData }, 'Enrollments retrieved successfully');

  } catch (error) {
    console.error('enrollments error:', error);
    res.error(error.message, 'Failed to get enrollments', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/course/:courseId  — full course detail with video URLs
// Requires enrollment (except preview lessons)
// ─────────────────────────────────────────────────────────────
router.get('/course/:courseId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      status: 'published',
      isActive: true
    })
      .populate('instructor_id', 'name profile email')
      .populate('organization_id', 'name');

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available', 404);
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    const isEnrolled = !!enrollment;
    const completedLessonIds = enrollment
      ? enrollment.progress.completedLessons.map(cl => cl.lessonId.toString())
      : [];

    // Fetch sections with lessons (include video URLs if enrolled)
    const sections = await Section.find({
      course_id: courseId,
      isActive: true
    }).sort({ order: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async section => {
        const lessonQuery = { section_id: section._id, isActive: true };
        // If enrolled: return full content (incl video URL). Otherwise preview only.
        const selectFields = isEnrolled
          ? 'title description type duration order isPreview content'
          : 'title description type duration order isPreview';

        const lessons = await Lesson.find(lessonQuery)
          .sort({ order: 1 })
          .select(selectFields);

        return {
          ...section.toObject(),
          lessons: lessons.map(l => {
            const lessonObj = l.toObject();
            return {
              ...lessonObj,
              isCompleted: completedLessonIds.includes(l._id.toString()),
              videoUrl: lessonObj.content?.videoUrl,
              content: lessonObj.content?.textContent || lessonObj.content?.pdfUrl || lessonObj.content?.videoUrl
            };
          })
        };
      })
    );

    const totalLessons = sectionsWithLessons.reduce(
      (sum, s) => sum + s.lessons.length, 0
    );

    res.success({
      course: { ...course.toObject(), totalLessons },
      sections: sectionsWithLessons,
      isEnrolled,
      enrollment: enrollment
        ? {
          _id: enrollment._id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt
        }
        : null
    }, 'Course details retrieved successfully');

  } catch (error) {
    console.error('course-detail error:', error);
    res.error(error.message, 'Failed to get course details', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/courses/:id  — backward compat alias
// ─────────────────────────────────────────────────────────────
router.get('/courses/:id', authMiddleware, requireRole(['student']), async (req, res) => {
  req.params.courseId = req.params.id;
  // delegate to /course/:courseId logic inline
  try {
    const { id } = req.params;

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

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: id,
      status: { $in: ['active', 'completed'] }
    });

    const isEnrolled = !!enrollment;
    const completedLessonIds = enrollment
      ? enrollment.progress.completedLessons.map(cl => cl.lessonId.toString())
      : [];

    const sections = await Section.find({ course_id: id, isActive: true }).sort({ order: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async section => {
        const selectFields = isEnrolled
          ? 'title description type duration order isPreview content'
          : 'title description type duration order isPreview';
        const lessons = await Lesson.find({ section_id: section._id, isActive: true })
          .sort({ order: 1 })
          .select(selectFields);
        return {
          ...section.toObject(),
          lessons: lessons.map(l => ({
            ...l.toObject(),
            isCompleted: completedLessonIds.includes(l._id.toString())
          }))
        };
      })
    );

    const totalLessons = sectionsWithLessons.reduce((sum, s) => sum + s.lessons.length, 0);

    res.success({
      course: { ...course.toObject(), totalLessons },
      sections: sectionsWithLessons,
      isEnrolled,
      progress: enrollment?.progress || null,
      enrollment: enrollment
        ? {
          _id: enrollment._id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt
        }
        : null
    }, 'Course details retrieved successfully');

  } catch (error) {
    console.error('courses/:id error:', error);
    res.error(error.message, 'Failed to get course details', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /student/enroll/:courseId
// ─────────────────────────────────────────────────────────────
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
      course_id: courseId
    });

    if (existingEnrollment) {
      return res.success({
        enrollment: {
          _id: existingEnrollment._id,
          course_id: courseId,
          status: existingEnrollment.status,
          progress: existingEnrollment.progress
        }
      }, 'Already enrolled in this course');
    }

    // Count total lessons
    const sections = await Section.find({ course_id: courseId, isActive: true });
    let totalLessons = 0;
    for (const section of sections) {
      totalLessons += await Lesson.countDocuments({ section_id: section._id, isActive: true });
    }

    const enrollment = new Enrollment({
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
      enrolledAt: new Date()
    });

    await enrollment.save();

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
    console.error('enroll error:', error);
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /student/complete-lesson
// Body: { courseId, lessonId, timeSpent? }
// ─────────────────────────────────────────────────────────────
router.post('/complete-lesson', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId, lessonId, timeSpent = 0 } = req.body;

    if (!courseId || !lessonId) {
      return res.error('Missing fields', 'courseId and lessonId are required', 400);
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      course_id: courseId,
      isActive: true
    });
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      organization_id: req.user.organization_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    const alreadyCompleted = enrollment.progress.completedLessons.some(
      cl => cl.lessonId.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.progress.completedLessons.push({
        lessonId,
        completedAt: new Date(),
        timeSpent
      });
    }

    enrollment.progress.totalTimeSpent = (enrollment.progress.totalTimeSpent || 0) + timeSpent;
    enrollment.progress.lastAccessedLesson = lessonId;
    enrollment.lastAccessedAt = new Date();

    // Recalculate percentage
    const total = enrollment.progress.totalLessons || 1;
    const completed = enrollment.progress.completedLessons.length;
    enrollment.progress.completionPercentage = Math.min(100, Math.round((completed / total) * 100));

    // Auto-complete
    if (enrollment.progress.completionPercentage >= 100 && enrollment.status === 'active') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.success({
      progress: enrollment.progress,
      status: enrollment.status,
      isCompleted: enrollment.status === 'completed',
      completedAt: enrollment.completedAt || null
    }, 'Lesson marked as complete');

  } catch (error) {
    console.error('complete-lesson error:', error);
    res.error(error.message, 'Failed to complete lesson', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /student/progress/lecture/:lectureId  (backward compat)
// ─────────────────────────────────────────────────────────────
router.patch('/progress/lecture/:lectureId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { timeSpent = 0 } = req.body;

    const lesson = await Lesson.findById(lectureId);
    if (!lesson) return res.error('Lesson not found', 'Lesson does not exist', 404);

    const section = await Section.findById(lesson.section_id);
    if (!section) return res.error('Section not found', 'Section does not exist', 404);

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: section.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) return res.error('Not enrolled', 'You are not enrolled in this course', 403);

    const alreadyCompleted = enrollment.progress.completedLessons.some(
      cl => cl.lessonId.toString() === lectureId
    );

    if (!alreadyCompleted) {
      enrollment.progress.completedLessons.push({ lessonId: lectureId, completedAt: new Date(), timeSpent });
    }

    enrollment.progress.totalTimeSpent = (enrollment.progress.totalTimeSpent || 0) + timeSpent;
    enrollment.progress.lastAccessedLesson = lectureId;
    enrollment.lastAccessedAt = new Date();

    const total = enrollment.progress.totalLessons || 1;
    const completed = enrollment.progress.completedLessons.length;
    enrollment.progress.completionPercentage = Math.min(100, Math.round((completed / total) * 100));

    if (enrollment.progress.completionPercentage >= 100 && enrollment.status === 'active') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.success({
      progress: enrollment.progress,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }, 'Progress updated successfully');

  } catch (error) {
    console.error('progress/lecture error:', error);
    res.error(error.message, 'Failed to update progress', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/certificate/:courseId
// Returns certificate data (only if course completed)
// ─────────────────────────────────────────────────────────────
router.get('/certificate/:courseId', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      organization_id: req.user.organization_id,
      status: 'completed'
    });

    if (!enrollment) {
      return res.error('Certificate not available', 'You have not completed this course yet', 403);
    }

    const [course, student, organization, certRecord] = await Promise.all([
      Course.findById(courseId)
        .populate('instructor_id', 'name')
        .select('title instructor_id'),
      User.findById(req.user._id).select('name email'),
      Organization.findById(req.user.organization_id).select('name'),
      Certificate.findOne({
        student_id: req.user._id,
        course_id: courseId,
        organization_id: req.user.organization_id
      })
    ]);

    if (!course) return res.error('Course not found', 'Course does not exist', 404);

    res.success({
      certificate: {
        id: certRecord?._id || null,
        certificateId: certRecord?.certificate_id || null,
        pdfGenerated: certRecord?.pdf_generated || false,
        pdfUrl: certRecord?.pdf_file_url || null,
        studentName: student.name,
        studentEmail: student.email,
        courseTitle: course.title,
        instructorName: course.instructor_id?.name || 'N/A',
        organizationName: organization?.name || 'N/A',
        completionDate: enrollment.completedAt,
        enrollmentId: enrollment._id,
        progress: enrollment.progress?.completionPercentage || 100
      }
    }, 'Certificate retrieved successfully');

  } catch (error) {
    console.error('certificate error:', error);
    res.error(error.message, 'Failed to get certificate', 500);
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// GET /student/live-classes
// Upcoming live classes for this student's organization
// ─────────────────────────────────────────────────────────────────────────────
const LiveClass = require('../models/LiveClass');
router.get('/live-classes', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    if (!req.user.organization_id) {
      return res.success({ classes: [] }, 'No organization assigned');
    }

    const now = new Date();
    const classes = await LiveClass.find({
      organization_id: req.user.organization_id,
      scheduled_date: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // include last 1h (may be live)
      status: { $in: ['scheduled', 'live'] },
      is_active: true
    })
      .sort({ scheduled_date: 1 })
      .populate('course_id', 'title thumbnail')
      .populate('instructor_id', 'name email')
      .lean();

    // Compute canJoin (10 min before until end)
    const enriched = classes.map(lc => {
      const startMs = new Date(lc.scheduled_date).getTime();
      const joinWindowMs = startMs - 10 * 60 * 1000;
      const endMs = startMs + lc.duration_minutes * 60 * 1000;
      const nowMs = now.getTime();
      return {
        ...lc,
        canJoin: nowMs >= joinWindowMs && nowMs <= endMs,
        isLive: nowMs >= startMs && nowMs <= endMs
      };
    });

    return res.success({ classes: enriched }, 'Live classes retrieved');
  } catch (err) {
    console.error('[student/live-classes] Error:', err.message);
    res.error(err.message, 'Failed to fetch live classes', 500);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /student/quizzes — List all quizzes across enrolled courses
router.get('/quizzes', authMiddleware, requireRole(['student']), async (req, res) => {
  console.log('🎯 [DEBUG] Hit GET /student/quizzes for user:', req.user._id);
  try {
    const orgId = req.user.organization_id;

    // 1. Find all active enrollments for this student
    const enrollments = await Enrollment.find({
      student_id: req.user._id,
      organization_id: orgId,
      status: { $in: ['active', 'completed'] }
    }).select('course_id');

    const courseIds = enrollments.map(e => e.course_id);

    if (courseIds.length === 0) {
      return res.success({ quizzes: [] }, 'No enrolled courses found');
    }

    // 2. Find all published quizzes for these courses
    const quizzes = await Quiz.find({
      course_id: { $in: courseIds },
      organization_id: orgId,
      status: 'PUBLISHED',
      is_active: true
    })
      .populate('course_id', 'title thumbnail')
      .select('title description total_marks max_attempts timer_minutes created_at course_id')
      .sort({ created_at: -1 })
      .lean();

    // 3. Attach submission status for each quiz
    const quizIds = quizzes.map(q => q._id);
    const submissions = await QuizSubmission.find({
      quizId: { $in: quizIds },
      studentId: req.user._id
    }).select('quizId score percentage attemptNumber passed submittedAt').lean();

    const quizList = quizzes.map(quiz => {
      const studentSubmissions = submissions.filter(s => s.quizId.toString() === quiz._id.toString());
      const bestSubmission = studentSubmissions.sort((a, b) => b.score - a.score)[0] || null;

      return {
        ...quiz,
        attemptsCount: studentSubmissions.length,
        attemptsLeft: Math.max(0, quiz.max_attempts - studentSubmissions.length),
        bestScore: bestSubmission?.score || null,
        bestPercentage: bestSubmission?.percentage || null,
        isCompleted: studentSubmissions.some(s => s.passed),
        course: quiz.course_id // From populate
      };
    });

    res.success({ quizzes: quizList }, 'All quizzes retrieved successfully');
  } catch (error) {
    console.error('get all quizzes error:', error);
    res.error(error.message, 'Failed to get quizzes', 500);
  }
});

// QUIZ SYSTEM ROUTES
// ─────────────────────────────────────────────────────────────

// GET /student/course/:courseId/quizzes — List quizzes for a course
router.get('/course/:courseId/quizzes', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const orgId = req.user.organization_id;

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in this course', 403);
    }

    const quizzes = await Quiz.find({
      course_id: courseId,
      organization_id: orgId,
      status: 'PUBLISHED',
      is_active: true
    }).select('title description total_marks max_attempts timer_minutes created_at').lean();

    // Attach submission status for each quiz
    const quizIds = quizzes.map(q => q._id);
    const submissions = await QuizSubmission.find({
      quizId: { $in: quizIds },
      studentId: req.user._id
    }).select('quizId score percentage attemptNumber passed submittedAt').lean();

    const quizList = quizzes.map(quiz => {
      const studentSubmissions = submissions.filter(s => s.quizId.toString() === quiz._id.toString());
      const bestSubmission = studentSubmissions.sort((a, b) => b.score - a.score)[0] || null;

      return {
        ...quiz,
        attemptsCount: studentSubmissions.length,
        attemptsLeft: Math.max(0, quiz.max_attempts - studentSubmissions.length),
        bestScore: bestSubmission?.score || null,
        bestPercentage: bestSubmission?.percentage || null,
        isCompleted: studentSubmissions.some(s => s.passed)
      };
    });

    res.success({ quizzes: quizList }, 'Quizzes retrieved successfully');
  } catch (error) {
    console.error('get course quizzes error:', error);
    res.error(error.message, 'Failed to get quizzes', 500);
  }
});

// GET /student/quiz/:quizId/start — Fetch quiz details for starting
router.get('/quiz/:quizId/start', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { quizId } = req.params;
    const orgId = req.user.organization_id;

    const quiz = await Quiz.findOne({
      _id: quizId,
      organization_id: orgId,
      status: 'PUBLISHED',
      is_active: true
    });

    if (!quiz) {
      return res.error('Quiz not found', 'Quiz does not exist or is not published', 404);
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: quiz.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in the course for this quiz', 403);
    }

    // Check attempt limits
    const attemptCount = await QuizSubmission.countDocuments({
      quizId,
      studentId: req.user._id
    });

    if (attemptCount >= quiz.max_attempts) {
      return res.error('Max attempts reached', 'You have reached the maximum number of attempts for this quiz', 403);
    }

    // Return student version (no answers)
    const studentQuiz = quiz.getStudentVersion();

    res.success({
      quiz: {
        ...studentQuiz,
        attemptNumber: attemptCount + 1,
        totalMarks: quiz.total_marks
      }
    }, 'Quiz started successfully');
  } catch (error) {
    console.error('start quiz error:', error);
    res.error(error.message, 'Failed to start quiz', 500);
  }
});

// POST /student/quiz/:quizId/submit — Submit quiz and auto-grade
router.post('/quiz/:quizId/submit', authMiddleware, requireRole(['student']), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of selected indices
    const orgId = req.user.organization_id;

    if (!Array.isArray(answers)) {
      return res.error('Invalid format', 'Answers must be an array', 400);
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      organization_id: orgId,
      status: 'PUBLISHED',
      is_active: true
    });

    if (!quiz) {
      return res.error('Quiz not found', 'Quiz does not exist or is not published', 404);
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: quiz.course_id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You are not enrolled in the course for this quiz', 403);
    }

    // Check attempt limits
    const attemptCount = await QuizSubmission.countDocuments({
      quizId,
      studentId: req.user._id
    });

    if (attemptCount >= quiz.max_attempts) {
      return res.error('Max attempts reached', 'You have already used all your attempts', 403);
    }

    // Auto-grading
    let correctCount = 0;
    const detailedAnswers = quiz.questions.map((q, idx) => {
      const selectedIdx = answers[idx];
      const isCorrect = selectedIdx === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        questionIndex: idx,
        selectedOption: selectedIdx,
        isCorrect
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * quiz.total_marks);
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = percentage >= quiz.pass_percentage;

    const submission = new QuizSubmission({
      quizId,
      courseId: quiz.course_id,
      studentId: req.user._id,
      instructorId: quiz.instructor_id,
      organizationId: orgId,
      answers: detailedAnswers,
      score,
      totalMarks: quiz.total_marks,
      percentage,
      attemptNumber: attemptCount + 1,
      passed,
      submittedAt: new Date(),
      gradedAt: new Date()
    });

    await submission.save();

    res.success({
      submission: {
        score,
        totalMarks: quiz.total_marks,
        percentage,
        passed,
        attemptNumber: attemptCount + 1,
        results: detailedAnswers.map((da, idx) => ({
          ...da,
          explanation: quiz.questions[idx].explanation,
          correctAnswer: quiz.questions[idx].correct_answer
        }))
      }
    }, 'Quiz submitted and graded successfully');

  } catch (error) {
    console.error('submit quiz error:', error);
    res.error(error.message, 'Failed to submit quiz', 500);
  }
});

module.exports = router;

