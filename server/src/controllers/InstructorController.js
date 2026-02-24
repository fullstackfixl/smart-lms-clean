const BaseController = require('../core/BaseController');
const { Course, Section, Lesson, Enrollment, Quiz, QuizAttempt, Announcement, User, LiveClass } = require('../models');
const mongoose = require('mongoose');

class InstructorController extends BaseController {
  constructor() {
    super(null);
  }

  // DASHBOARD OVERVIEW
  getDashboardOverview = this.asyncHandler(async (req, res) => {
    const user = req.user;

    try {
      // Get total courses
      const totalCourses = await Course.countDocuments({
        instructor_id: user._id,
        organization_id: user.organization_id
      });

      // Get instructor's courses
      const instructorCourses = await Course.find({
        instructor_id: user._id,
        organization_id: user.organization_id
      }).select('_id');

      const courseIds = instructorCourses.map(c => c._id);

      // Get total students (unique enrollments)
      const enrollments = await Enrollment.find({
        course_id: { $in: courseIds },
        organization_id: user.organization_id
      }).distinct('student_id');
      const totalStudents = enrollments.length;

      // Get total lectures (count modules and lessons)
      let totalLectures = 0;
      for (const course of instructorCourses) {
        const courseData = await Course.findById(course._id);
        if (courseData && courseData.modules) {
          courseData.modules.forEach(module => {
            if (module.lessons) {
              totalLectures += module.lessons.length;
            }
          });
        }
      }

      // Get upcoming live classes
      const upcomingClasses = await LiveClass.find({
        instructor_id: user._id,
        organization_id: user.organization_id,
        scheduled_date: { $gte: new Date() },
        status: { $in: ['scheduled', 'live'] }
      })
        .sort({ scheduled_date: 1 })
        .limit(5)
        .populate('course_id', 'title')
        .lean();

      // Get completion stats
      const allEnrollments = await Enrollment.find({
        course_id: { $in: courseIds },
        organization_id: user.organization_id
      });

      const completedEnrollments = allEnrollments.filter(e => e.status === 'completed');
      const completionRate = allEnrollments.length > 0 
        ? (completedEnrollments.length / allEnrollments.length) * 100 
        : 0;

      return res.success({
        totalCourses,
        totalStudents,
        totalLectures,
        upcomingClasses,
        recentSubmissions: [],
        completionRate,
        completionStats: {
          total: allEnrollments.length,
          completed: completedEnrollments.length
        }
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      return res.error('Failed to load dashboard data', 500);
    }
  });

  // Helper: ensure instructor owns course within their organization
  async findInstructorCourse(courseId, user) {
    return Course.findOne({
      _id: courseId,
      organization_id: user.organization_id,
      instructor_id: user._id,
      is_deleted: false
    });
  }

  // COURSES
  createCourse = this.asyncHandler(async (req, res) => {
    const { title, description, price = 0, category, level = 'beginner', thumbnail, tags = [] } = req.body;

    if (!title || !description || !category) {
      console.error(`❌ [InstructorController] Missing required fields:`, { title: !!title, description: !!description, category: !!category });
      return res.error('Missing required fields', 'Title, description, and category are required', 400);
    }

    const course = await Course.create({
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      title,
      description,
      price: Math.max(0, price),
      category,
      level,
      thumbnail,
      tags,
      status: 'draft',
      is_deleted: false
    });

    this.sendSuccess(res, course, 'Course created successfully', 201);
  });

  getCourses = this.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const filters = {
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      is_deleted: false
    };

    if (status && status !== 'all') {
      filters.status = status;
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const [courses, total] = await Promise.all([
      Course.find(filters)
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Course.countDocuments(filters)
    ]);

    this.sendSuccess(res, {
      courses,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Instructor courses retrieved successfully');
  });

  getCourseById = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    // Load modules (sections) and lessons for builder view
    const sections = await Section.find({
      course_id: course._id,
      organization_id: req.user.organization_id,
      isActive: true
    }).sort({ order: 1 });

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({
          section_id: section._id,
          organization_id: req.user.organization_id,
          isActive: true
        }).sort({ order: 1 });

        return {
          ...section.toObject(),
          lessons
        };
      })
    );

    this.sendSuccess(res, {
      course,
      modules: sectionsWithLessons
    }, 'Course retrieved successfully');
  });

  updateCourse = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const updates = { ...req.body };
    delete updates.organization_id;
    delete updates.instructor_id;
    delete updates.is_deleted;

    Object.assign(course, updates);
    await course.save();

    this.sendSuccess(res, course, 'Course updated successfully');
  });

  deleteCourse = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    course.is_deleted = true;
    course.isActive = false;
    course.status = 'archived';
    await course.save();

    this.sendSuccess(res, null, 'Course deleted successfully');
  });

  publishCourse = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    course.status = 'published';
    await course.save();

    this.sendSuccess(res, course, 'Course published successfully');
  });

  // MODULES (Sections)
  createModule = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.error('Module title is required', 'Validation failed', 400);
    }

    const course = await this.findInstructorCourse(courseId, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    // Compute next order if not provided
    let nextOrder = 1;
    const lastSection = await Section.findOne({
      course_id: course._id,
      organization_id: req.user.organization_id
    }).sort({ order: -1 }).select('order');
    if (lastSection && typeof lastSection.order === 'number') {
      nextOrder = lastSection.order + 1;
    }

    const moduleDoc = await Section.create({
      organization_id: req.user.organization_id,
      course_id: course._id,
      title,
      description,
      order: nextOrder
    });

    this.sendSuccess(res, moduleDoc, 'Module created successfully', 201);
  });

  updateModule = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const moduleDoc = await Section.findOne({
      _id: id,
      organization_id: req.user.organization_id
    });

    if (!moduleDoc) {
      return res.error('Module not found', 'Module does not exist or you do not have access', 404);
    }

    const course = await this.findInstructorCourse(moduleDoc.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this module', 403);
    }

    const updates = { ...req.body };
    delete updates.organization_id;
    delete updates.course_id;

    Object.assign(moduleDoc, updates);
    await moduleDoc.save();

    this.sendSuccess(res, moduleDoc, 'Module updated successfully');
  });

  deleteModule = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const moduleDoc = await Section.findOne({
      _id: id,
      organization_id: req.user.organization_id
    });

    if (!moduleDoc) {
      return res.error('Module not found', 'Module does not exist or you do not have access', 404);
    }

    const course = await this.findInstructorCourse(moduleDoc.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this module', 403);
    }

    // Soft delete module
    moduleDoc.isActive = false;
    await moduleDoc.save();

    this.sendSuccess(res, null, 'Module deleted successfully');
  });

  // LESSONS
  createLesson = this.asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { title, description, type, content, prerequisites = [], duration = 0, isPreview = false } = req.body;

    if (!title || !type) {
      return res.error('Missing required fields', 'Lesson title and type are required', 400);
    }

    const section = await Section.findOne({
      _id: moduleId,
      organization_id: req.user.organization_id,
      isActive: true
    });

    if (!section) {
      return res.error('Module not found', 'Module does not exist or you do not have access', 404);
    }

    const course = await this.findInstructorCourse(section.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this lesson', 403);
    }

    // Compute next order within the section
    let nextOrder = 1;
    const lastLesson = await Lesson.findOne({
      section_id: section._id,
      organization_id: req.user.organization_id,
      isActive: true
    }).sort({ order: -1 }).select('order');
    if (lastLesson && typeof lastLesson.order === 'number') {
      nextOrder = lastLesson.order + 1;
    }

    const lesson = await Lesson.create({
      organization_id: req.user.organization_id,
      course_id: course._id,
      section_id: section._id,
      title,
      description,
      type,
      content,
      order: nextOrder,
      prerequisites,
      duration,
      isPreview
    });

    this.sendSuccess(res, lesson, 'Lesson created successfully', 201);
  });

  updateLesson = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lesson = await Lesson.findOne({
      _id: id,
      organization_id: req.user.organization_id
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist or you do not have access', 404);
    }

    const course = await this.findInstructorCourse(lesson.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this lesson', 403);
    }

    const updates = { ...req.body };
    delete updates.organization_id;
    delete updates.course_id;
    delete updates.section_id;

    Object.assign(lesson, updates);
    await lesson.save();

    this.sendSuccess(res, lesson, 'Lesson updated successfully');
  });

  deleteLesson = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lesson = await Lesson.findOne({
      _id: id,
      organization_id: req.user.organization_id
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist or you do not have access', 404);
    }

    const course = await this.findInstructorCourse(lesson.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this lesson', 403);
    }

    lesson.isActive = false;
    await lesson.save();

    this.sendSuccess(res, null, 'Lesson deleted successfully');
  });

  // QUIZZES
  createQuiz = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const payload = req.body;

    const course = await this.findInstructorCourse(courseId, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const quiz = await Quiz.create({
      ...payload,
      organization_id: req.user.organization_id,
      course_id: course._id,
      instructor_id: req.user._id
    });

    this.sendSuccess(res, quiz, 'Quiz created successfully', 201);
  });

  updateQuiz = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quiz = await Quiz.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      is_active: true
    });

    if (!quiz) {
      return res.error('Quiz not found', 'Quiz does not exist or you do not have access', 404);
    }

    const updates = { ...req.body };
    delete updates.organization_id;
    delete updates.instructor_id;
    delete updates.course_id;

    Object.assign(quiz, updates);
    await quiz.save();

    this.sendSuccess(res, quiz, 'Quiz updated successfully');
  });

  deleteQuiz = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quiz = await Quiz.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      is_active: true
    });

    if (!quiz) {
      return res.error('Quiz not found', 'Quiz does not exist or you do not have access', 404);
    }

    quiz.is_active = false;
    await quiz.save();

    this.sendSuccess(res, null, 'Quiz deleted successfully');
  });

  // STUDENTS & ANALYTICS
  getCourseStudents = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          course_id: new mongoose.Types.ObjectId(course._id),
          organization_id: new mongoose.Types.ObjectId(req.user.organization_id)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 1,
          status: 1,
          enrolledAt: 1,
          'student._id': 1,
          'student.name': 1,
          'student.email': 1,
          'student.profile': 1,
          'progress.completionPercentage': 1,
          'progress.totalTimeSpent': 1
        }
      }
    ]);

    this.sendSuccess(res, { students: enrollments }, 'Course students retrieved successfully');
  });

  getCourseAnalytics = this.asyncHandler(async (req, res) => {
    const course = await this.findInstructorCourse(req.params.id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const courseId = new mongoose.Types.ObjectId(course._id);
    const orgId = new mongoose.Types.ObjectId(req.user.organization_id);

    const [enrollmentStats, quizStats] = await Promise.all([
      Enrollment.aggregate([
        {
          $match: {
            course_id: courseId,
            organization_id: orgId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProgress: { $avg: '$progress.completionPercentage' },
            avgTimeSpent: { $avg: '$progress.totalTimeSpent' }
          }
        }
      ]),
      QuizAttempt.aggregate([
        {
          $match: {
            course_id: courseId,
            organization_id: orgId,
            is_active: true
          }
        },
        {
          $group: {
            _id: '$quiz_id',
            attempts: { $sum: 1 },
            avgScore: { $avg: '$score' },
            avgPercentage: { $avg: '$percentage' },
            passRate: { $avg: { $cond: ['$passed', 1, 0] } }
          }
        }
      ])
    ]);

    const totalEnrollments = await Enrollment.countDocuments({
      course_id: courseId,
      organization_id: orgId
    });

    const completed = enrollmentStats.find(s => s._id === 'completed');
    const completionRate = totalEnrollments > 0 && completed
      ? (completed.count / totalEnrollments) * 100
      : 0;

    this.sendSuccess(res, {
      summary: {
        totalEnrollments,
        completionRate,
        enrollmentStats
      },
      quizzes: quizStats
    }, 'Course analytics computed successfully');
  });

  // ANNOUNCEMENTS
  createAnnouncement = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, message, is_pinned, audience, tags } = req.body;

    if (!title || !message) {
      return res.error('Missing required fields', 'Title and message are required', 400);
    }

    const course = await this.findInstructorCourse(id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const announcement = await Announcement.create({
      organization_id: req.user.organization_id,
      course_id: course._id,
      instructor_id: req.user._id,
      title,
      message,
      is_pinned: !!is_pinned,
      metadata: {
        audience: audience || 'all',
        tags: tags || []
      }
    });

    this.sendSuccess(res, announcement, 'Announcement created successfully', 201);
  });

  getAnnouncements = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await this.findInstructorCourse(id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const announcements = await Announcement.find({
      course_id: course._id,
      organization_id: req.user.organization_id,
      is_active: true
    }).sort({ is_pinned: -1, createdAt: -1 });

    this.sendSuccess(res, { announcements }, 'Announcements retrieved successfully');
  });

  deleteAnnouncement = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const announcement = await Announcement.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      instructor_id: req.user._id,
      is_active: true
    });

    if (!announcement) {
      return res.error('Announcement not found', 'Announcement does not exist or you do not have access', 404);
    }

    announcement.is_active = false;
    await announcement.save();

    this.sendSuccess(res, null, 'Announcement deleted successfully');
  });

  // Get course sections
  getCourseSections = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await this.findInstructorCourse(courseId, req.user);
    if (!course) {
      return res.error('Course not found', 'Course not found or access denied', 404);
    }

    const sections = await Section.find({
      course_id: courseId,
      organization_id: req.user.organization_id
    }).sort({ order: 1 }).lean();

    this.sendSuccess(res, sections, 'Sections retrieved successfully');
  });

  // Get section lessons
  getSectionLessons = this.asyncHandler(async (req, res) => {
    const { sectionId } = req.params;

    const section = await Section.findOne({
      _id: sectionId,
      organization_id: req.user.organization_id
    }).lean();

    if (!section) {
      return res.error('Section not found', 'Section not found or access denied', 404);
    }

    // Verify instructor owns the course
    const course = await this.findInstructorCourse(section.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have access to this section', 403);
    }

    const lessons = await Lesson.find({
      section_id: sectionId,
      organization_id: req.user.organization_id,
      isActive: true
    }).sort({ order: 1 }).lean();

    this.sendSuccess(res, lessons, 'Lessons retrieved successfully');
  });

  // SUBMISSIONS REVIEW
  getSubmissions = this.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, courseId, status = 'all' } = req.query;
    const { Grade } = require('../models');

    // Build filters
    const filters = {
      organization_id: req.user.organization_id,
      is_active: true
    };

    // If courseId provided, verify instructor owns it
    if (courseId) {
      const course = await this.findInstructorCourse(courseId, req.user);
      if (!course) {
        return res.error('Course not found', 'Course does not exist or you do not have access', 404);
      }
      filters.course_id = courseId;
    } else {
      // Get all courses by this instructor
      const instructorCourses = await Course.find({
        instructor_id: req.user._id,
        organization_id: req.user.organization_id,
        is_deleted: false
      }).select('_id');
      
      filters.course_id = { $in: instructorCourses.map(c => c._id) };
    }

    // Filter by assignment type (only assignments, not quizzes)
    filters.assignment_type = { $in: ['assignment', 'project', 'lab_work'] };

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const [submissions, total] = await Promise.all([
      Grade.find(filters)
        .populate('student_id', 'name email profile')
        .populate('course_id', 'title')
        .populate('graded_by', 'name')
        .sort({ submitted_date: -1, created_at: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Grade.countDocuments(filters)
    ]);

    this.sendSuccess(res, {
      submissions,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Submissions retrieved successfully');
  });

  gradeSubmission = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { earned_score, comments, rubric_scores } = req.body;
    const { Grade } = require('../models');

    const submission = await Grade.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!submission) {
      return res.error('Submission not found', 'Submission does not exist or you do not have access', 404);
    }

    // Verify instructor owns the course
    const course = await this.findInstructorCourse(submission.course_id, req.user);
    if (!course) {
      return res.error('Access denied', 'You do not have permission to grade this submission', 403);
    }

    // Update grade
    if (earned_score !== undefined) {
      submission.earned_score = earned_score;
      submission.percentage = (earned_score / submission.max_score) * 100;
    }
    
    if (comments !== undefined) {
      submission.comments = comments;
    }
    
    if (rubric_scores) {
      submission.rubric_scores = rubric_scores;
    }

    submission.graded_by = req.user._id;
    submission.graded_date = new Date();

    await submission.save();

    this.sendSuccess(res, submission, 'Submission graded successfully');
  });

  // NOTIFICATIONS
  getNotifications = this.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const { Notification } = require('../models');

    const filters = {
      recipient_id: req.user._id,
      organization_id: req.user.organization_id,
      is_active: true
    };

    if (status !== 'all') {
      filters.status = status;
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filters)
        .populate('sender_id', 'name email')
        .sort({ priority: -1, created_at: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Notification.countDocuments(filters),
      Notification.countDocuments({
        ...filters,
        status: { $in: ['pending', 'sent'] }
      })
    ]);

    this.sendSuccess(res, {
      notifications,
      unreadCount,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Notifications retrieved successfully');
  });

  markNotificationRead = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { Notification } = require('../models');

    const notification = await Notification.findOne({
      _id: id,
      recipient_id: req.user._id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!notification) {
      return res.error('Notification not found', 'Notification does not exist or you do not have access', 404);
    }

    await notification.markAsRead();

    this.sendSuccess(res, notification, 'Notification marked as read');
  });

  markAllNotificationsRead = this.asyncHandler(async (req, res) => {
    const { Notification } = require('../models');

    await Notification.updateMany(
      {
        recipient_id: req.user._id,
        organization_id: req.user.organization_id,
        status: { $in: ['pending', 'sent'] },
        is_active: true
      },
      {
        status: 'read',
        'channels.in_app.read': true,
        'channels.in_app.read_at': new Date()
      }
    );

    this.sendSuccess(res, null, 'All notifications marked as read');
  });

  deleteNotification = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { Notification } = require('../models');

    const notification = await Notification.findOne({
      _id: id,
      recipient_id: req.user._id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!notification) {
      return res.error('Notification not found', 'Notification does not exist or you do not have access', 404);
    }

    await notification.dismiss();

    this.sendSuccess(res, null, 'Notification deleted successfully');
  });
}

module.exports = new InstructorController();
