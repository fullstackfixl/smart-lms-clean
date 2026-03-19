const BaseController = require('../core/BaseController');
const { Course, Section, Lesson, Enrollment, Quiz, QuizAttempt, Announcement, User, LiveClass, QuizSubmission } = require('../models');
const { recordOrgEvent, EVENT_TYPES } = require('../utils/orgEvents');

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

      // College or Course Attendance Stats
      let attendanceStats = null;
      if (user.organization_id && (user.role === 'instructor' || user.role === 'org_admin')) {
        try {
          const Attendance = require('../models/Attendance');
          const Subject = require('../models/Subject');

          // Get instructor's subjects if they exist
          const subjects = await Subject.find({
            instructor_id: user._id,
            organization_id: user.organization_id
          }).select('_id');
          const subjectIds = subjects.map(s => s._id);

          const stats = await Attendance.aggregate([
            {
              $match: {
                organization_id: new mongoose.Types.ObjectId(user.organization_id),
                $or: [
                  { course_id: { $in: courseIds.map(id => new mongoose.Types.ObjectId(id)) } },
                  { subjectId: { $in: subjectIds.map(id => new mongoose.Types.ObjectId(id)) } }
                ]
              }
            },
            { $unwind: '$attendance_records' },
            {
              $group: {
                _id: '$attendance_records.student_id',
                total: { $sum: 1 },
                present: { $sum: { $cond: [{ $in: ['$attendance_records.status', ['present', 'late']] }, 1, 0] } }
              }
            },
            {
              $group: {
                _id: null,
                avgPresent: { $avg: { $divide: ['$present', '$total'] } },
                belowThreshold: {
                  $sum: { $cond: [{ $lt: [{ $divide: ['$present', '$total'] }, 0.75] }, 1, 0] }
                }
              }
            }
          ]);

          if (stats.length > 0) {
            attendanceStats = {
              overallPercentage: parseFloat((stats[0].avgPresent * 100).toFixed(1)) || 0,
              atRiskStudents: stats[0].belowThreshold || 0
            };
          } else {
            attendanceStats = { overallPercentage: 0, atRiskStudents: 0 };
          }
        } catch (attErr) {
          console.error('Attendance stats error:', attErr);
        }
      }

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
        },
        attendanceStats
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      return res.error(error.message, `Server Exception: ${error.message}`, 500);
    }
  });

  // Helper: ensure instructor owns course within their organization
  findInstructorCourse = async (courseId, user) => {
    const orgId = user.organization_id._id || user.organization_id;
    return await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      instructor_id: user._id,
      is_deleted: false
    });
  };

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

    // Record Organization Event
    const event = await recordOrgEvent(
      req.user.organization_id,
      EVENT_TYPES.NEW_COURSE,
      `Instructor ${req.user.name || 'Generic'} created a new course: ${title}`,
      course._id
    );

    // Emit real-time update
    if (global.io && event) {
      global.io.to(`organization_${req.user.organization_id}`).emit('new_event', event);
    }


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

    // Record Event
    await recordOrgEvent(
      req.user.organization_id,
      EVENT_TYPES.QUIZ_PUBLISHED, // Reusing or adding a course published type if it existed, but using this for now as shorthand or I can add COURSE_PUBLISHED
      `Course published: ${course.title}`,
      course._id
    );

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
  generateAIQuiz = this.asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { prompt, numberOfQuestions = 5, difficulty = 'medium' } = req.body;

    if (!prompt) {
      return res.error('Prompt is required', 'Topic or prompt is needed for AI generation', 400);
    }

    const course = await this.findInstructorCourse(courseId, req.user);
    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have access', 404);
    }

    const aiService = require('../services/aiService');
    const orgId = req.user.organization_id._id || req.user.organization_id;
    const questions = await aiService.generateAIQuiz(prompt, numberOfQuestions, difficulty, courseId, orgId);

    // Create a DRAFT quiz with generated questions
    const quiz = await Quiz.create({
      organization_id: orgId,
      course_id: course._id,
      instructor_id: req.user._id,
      title: `AI Generated: ${prompt.substring(0, 30)}`,
      questions,
      status: 'DRAFT',
      total_marks: questions.length * 2, // Default 2 marks per question
      pass_percentage: 60,
      max_attempts: 3
    });

    this.sendSuccess(res, quiz, 'AI Quiz generated and saved as draft', 201);

    // Record Event
    await recordOrgEvent(
      orgId,
      EVENT_TYPES.NEW_QUIZ,
      `AI Quiz generated: ${quiz.title}`,
      quiz._id
    );

  });

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

  // SUBMISSIONS REVIEW - Assignment Submissions
  getSubmissions = this.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, courseId, assignmentId, status = 'all' } = req.query;
    const { Submission, Subject, InstructorAssignment, Assignment, Course } = require('../models');

    // Build filters
    const filters = {
      organization_id: req.user.organization_id?._id || req.user.organization_id,
      is_active: true
    };

    const orgId = filters.organization_id;

    // Get all courses by this instructor (legacy)
    const instructorCourses = await Course.find({
      instructor_id: req.user._id,
      organization_id: orgId,
      is_deleted: false
    }).select('_id');

    const directCourseIds = instructorCourses.map(c => c._id);

    // College mode: instructor mapped via InstructorAssignment -> Subject -> contentCourseId
    let mappedCourseIds = [];
    try {
      const mappings = await InstructorAssignment.find({
        organizationId: orgId,
        instructorId: req.user._id,
        isActive: true
      }).select('subjectId').lean();

      const subjectIds = [...new Set(mappings.map(m => String(m.subjectId)).filter(Boolean))];
      if (subjectIds.length) {
        const subjects = await Subject.find({
          _id: { $in: subjectIds },
          organizationId: orgId,
          isActive: true,
          contentCourseId: { $ne: null }
        }).select('contentCourseId').lean();

        mappedCourseIds = [...new Set(subjects.map(s => String(s.contentCourseId)).filter(Boolean))];
      }
    } catch (_) {
      mappedCourseIds = [];
    }

    const allCourseIds = [...new Set([
      ...directCourseIds.map(id => String(id)),
      ...mappedCourseIds
    ])];

    if (assignmentId) {
      const assignment = await Assignment.findOne({
        _id: assignmentId,
        organization_id: orgId,
        is_active: true
      }).select('_id course_id subjectId batchId').lean();

      if (!assignment) {
        return res.error('Assignment not found', 'Assignment does not exist or you do not have access', 404);
      }

      const assignmentCourseId = String(assignment.course_id);
      const isInAccessibleCourses = allCourseIds.includes(assignmentCourseId);

      let isMappedOwner = false;
      if (assignment.subjectId && assignment.batchId) {
        const mapping = await InstructorAssignment.findOne({
          organizationId: orgId,
          instructorId: req.user._id,
          subjectId: assignment.subjectId,
          batchId: assignment.batchId,
          isActive: true
        }).select('_id').lean();
        isMappedOwner = Boolean(mapping);
      }

      // Fallback legacy ownership: course.instructor_id
      let isLegacyOwner = false;
      if (!isMappedOwner && isInAccessibleCourses) {
        const course = await Course.findOne({
          _id: assignment.course_id,
          organization_id: orgId,
          is_deleted: false
        }).select('instructor_id').lean();
        isLegacyOwner = Boolean(course && String(course.instructor_id) === String(req.user._id));
      }

      if (!isMappedOwner && !isLegacyOwner) {
        return res.error('Access denied', 'You do not have permission to view submissions for this assignment', 403);
      }

      filters.assignment_id = assignmentId;
      filters.course_id = assignment.course_id;
    }

    if (!assignmentId && courseId) {
      // If courseId provided, verify instructor can access it (direct or mapped)
      if (!allCourseIds.includes(String(courseId))) {
        return res.error('Course not found', 'Course does not exist or you do not have access', 404);
      }
      filters.course_id = courseId;
    } else if (!assignmentId) {
      filters.course_id = { $in: allCourseIds };
    }

    // Filter by status if provided
    if (status !== 'all') {
      filters.status = status;
    }

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const [submissions, total] = await Promise.all([
      Submission.find(filters)
        .populate('student_id', 'name email profile')
        .populate('course_id', 'title')
        .populate('assignment_id', 'title max_score due_date')
        .populate('graded_by', 'name')
        .sort({ submitted_at: -1, createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Submission.countDocuments(filters)
    ]);

    // Format submissions for frontend
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      studentId: sub.student_id?._id || sub.student_id,
      studentName: sub.student_id?.name || 'Unknown Student',
      studentEmail: sub.student_id?.email || '',
      studentAvatar: sub.student_id?.profile?.avatar || null,
      assignmentId: sub.assignment_id?._id || sub.assignment_id,
      assignmentTitle: sub.assignment_id?.title || 'Unknown Assignment',
      maxScore: sub.assignment_id?.max_score || 0,
      courseId: sub.course_id?._id || sub.course_id,
      courseTitle: sub.course_id?.title || 'Unknown Course',
      earnedScore: sub.earned_score,
      percentage: sub.assignment_id?.max_score > 0 && sub.earned_score !== null 
        ? Math.round((sub.earned_score / sub.assignment_id.max_score) * 100) 
        : null,
      status: sub.status,
      submittedAt: sub.submitted_at || sub.createdAt,
      gradedAt: sub.graded_at,
      gradedBy: sub.graded_by?.name || null,
      comments: sub.comments,
      content: sub.content,
      attachments: sub.attachments || []
    }));

    this.sendSuccess(res, {
      submissions: formattedSubmissions,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Assignment submissions retrieved successfully');
  });

  gradeSubmission = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { earned_score, comments } = req.body;
    const { Submission, Assignment, Course, InstructorAssignment } = require('../models');

    // Find the submission
    const submission = await Submission.findOne({
      _id: id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!submission) {
      return res.error('Submission not found', 'Submission does not exist or you do not have access', 404);
    }

    // Get the assignment to check ownership
    const assignment = await Assignment.findOne({
      _id: submission.assignment_id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!assignment) {
      return res.error('Assignment not found', 'Assignment not found', 404);
    }

    // Check instructor permission - try subject+batch mapping first, then course ownership
    let hasPermission = false;
    
    if (assignment.subjectId && assignment.batchId) {
      // College mode: check InstructorAssignment mapping
      const mapping = await InstructorAssignment.findOne({
        organizationId: req.user.organization_id,
        instructorId: req.user._id,
        subjectId: assignment.subjectId,
        batchId: assignment.batchId,
        isActive: true
      });
      if (mapping) {
        hasPermission = true;
      }
    }
    
    // Fallback: check course ownership (legacy or non-college mode)
    if (!hasPermission && assignment.course_id) {
      const course = await this.findInstructorCourse(assignment.course_id, req.user);
      if (course) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return res.error('Access denied', 'You do not have permission to grade this submission', 403);
    }

    // Update submission
    if (earned_score !== undefined) {
      submission.earned_score = earned_score;
    }

    if (comments !== undefined) {
      submission.comments = comments;
    }

    submission.status = 'graded';
    submission.graded_by = req.user._id;
    submission.graded_at = new Date();

    await submission.save();

    // Also update/create Grade record for gradebook
    const { Grade } = require('../models');
    await Grade.findOneAndUpdate(
      {
        organization_id: req.user.organization_id,
        course_id: assignment.course_id,
        student_id: submission.student_id,
        assignment_type: 'assignment',
        assignment_title: assignment.title,
        is_active: true
      },
      {
        $set: {
          assignment_description: assignment.description,
          max_score: assignment.max_score,
          earned_score: earned_score,
          percentage: assignment.max_score > 0 ? (earned_score / assignment.max_score) * 100 : 0,
          weight: 100,
          due_date: assignment.due_date,
          submitted_date: submission.submitted_at,
          graded_date: new Date(),
          graded_by: req.user._id,
          comments: comments
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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

  // QUIZ SUBMISSIONS (Course-Scoped Board)
  getQuizSubmissions = this.asyncHandler(async (req, res) => {
    const { courseId, quizId, page = 1, limit = 20 } = req.query;
    const orgId = req.user.organization_id;

    const filters = {
      organizationId: orgId,
      instructorId: req.user._id
    };

    if (courseId) filters.courseId = courseId;
    if (quizId) filters.quizId = quizId;

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const [submissions, total] = await Promise.all([
      QuizSubmission.find(filters)
        .populate('studentId', 'name email profile')
        .populate('quizId', 'title')
        .populate('courseId', 'title')
        .sort({ submittedAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      QuizSubmission.countDocuments(filters)
    ]);

    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      studentName: sub.studentId?.name || 'Unknown',
      studentEmail: sub.studentId?.email || '',
      studentProfilePhoto: sub.studentId?.profile?.avatar || '',
      quizTitle: sub.quizId?.title || 'Unknown Quiz',
      courseTitle: sub.courseId?.title || 'Unknown Course',
      score: sub.score,
      totalMarks: sub.totalMarks,
      percentage: sub.percentage,
      attemptNumber: sub.attemptNumber,
      submittedAt: sub.submittedAt,
      passed: sub.passed
    }));

    this.sendSuccess(res, {
      submissions: formattedSubmissions,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    }, 'Quiz submissions retrieved successfully');
  });

  getQuizSubmissionById = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orgId = req.user.organization_id;

    const submission = await QuizSubmission.findOne({
      _id: id,
      organizationId: orgId,
      instructorId: req.user._id
    })
      .populate('studentId', 'name email profile')
      .populate({
        path: 'quizId',
        select: 'title questions pass_percentage total_marks'
      })
      .populate('courseId', 'title');

    if (!submission) {
      return res.error('Submission not found', 'Submission not found or access denied', 404);
    }

    // Attach question details, explanations and correct answers from the Quiz model
    const detailedAnswers = submission.answers.map(ans => {
      const question = submission.quizId.questions[ans.questionIndex];
      return {
        ...ans,
        questionText: question.question,
        options: question.options,
        correctAnswer: question.correct_answer,
        explanation: question.explanation
      };
    });

    res.success({
      submission: {
        ...submission.toObject(),
        answers: detailedAnswers
      }
    }, 'Submission details retrieved successfully');
  });
  // ENROLLMENT & JOINING
  enrollStudentInCourse = this.asyncHandler(async (req, res) => {
    const { id } = req.params; // courseId
    const { name, email } = req.body;

    if (!email || !name) {
      return res.error('Name and email are required', 'Validation failed', 400);
    }

    const course = await this.findInstructorCourse(id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course not found or access denied', 404);
    }

    const orgId = req.user.organization_id;
    const crypto = require('crypto');
    const { Invite } = require('../models');
    
    // 1. Create Invite
    const token = crypto.randomBytes(32).toString('hex');
    const invite = await Invite.create({
      email: email.toLowerCase(),
      role: 'student',
      organization_id: orgId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // 2. Send Email
    const emailService = require('../services/email.service');
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const setupLink = `${clientUrl}/accept-invite?token=${token}&courseId=${course._id}`;
    
    try {
      const html = emailService.generateInvitationTemplate(course.title, setupLink);
      await emailService.sendEmail({
        to: email,
        subject: `Invitation to join course: ${course.title}`,
        html
      });
    } catch (err) {
      console.warn('Enrollment email failed:', err.message);
    }

    return res.success({ invite: { token } }, 'Student invited to course successfully');
  });

  getJoinLink = this.asyncHandler(async (req, res) => {
    const { id } = req.params; // courseId
    const course = await this.findInstructorCourse(id, req.user);
    if (!course) {
      return res.error('Course not found', 'Course not found or access denied', 404);
    }

    const Organization = require('../models/Organization');
    const org = await Organization.findById(req.user.organization_id);
    
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const joinCode = org.code || org.subdomain;
    const joinLink = `${clientUrl}/register?org=${joinCode}&course=${course._id}`;

    return res.success({ joinLink, joinCode }, 'Join link generated successfully');
  });
}

module.exports = new InstructorController();
