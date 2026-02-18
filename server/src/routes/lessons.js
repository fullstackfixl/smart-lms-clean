const express = require('express');
const { Course, Section, Lesson, Enrollment } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Create lesson
router.post('/:courseId/sections/:sectionId/lessons', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const { title, description, type, content, order, prerequisites = [], duration = 0, isPreview = false } = req.body;

    if (!title || !type) {
      return res.error('Missing required fields', 'Lesson title and type are required', 400);
    }

    // Verify course and section exist and user has permission
    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      $or: [
        { instructor_id: req.user._id },
        { 'req.user.role': 'admin' }
      ]
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to modify it', 404);
    }

    const section = await Section.findOne({
      _id: sectionId,
      course_id: courseId,
      organization_id: req.user.organization_id
    });

    if (!section) {
      return res.error('Section not found', 'Section does not exist', 404);
    }

    const lesson = new Lesson({
      organization_id: req.user.organization_id,
      course_id: courseId,
      section_id: sectionId,
      title,
      description,
      type,
      content,
      order,
      prerequisites,
      duration,
      isPreview
    });

    await lesson.save();

    res.success({ lesson }, 'Lesson created successfully');

  } catch (error) {
    console.error('Create lesson error:', error);
    res.error(error.message, 'Failed to create lesson', 500);
  }
});

// Get lesson details with access control
router.get('/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      isActive: true
    }).populate('prerequisites', 'title');

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Check if user can access this lesson
    const accessCheck = await lesson.canUserAccess(req.user);
    
    if (!accessCheck.canAccess) {
      let message = 'You do not have access to this lesson';
      switch (accessCheck.reason) {
        case 'not_enrolled':
          message = 'You must be enrolled in the course to access this lesson';
          break;
        case 'prerequisites_not_met':
          message = 'Complete prerequisite lessons before accessing this lesson';
          break;
      }
      return res.error('Access denied', message, 403);
    }

    // Get enrollment for progress tracking
    let enrollment = null;
    if (req.user && accessCheck.reason === 'enrolled') {
      enrollment = await Enrollment.findOne({
        student_id: req.user._id,
        course_id: lesson.course_id,
        status: 'active'
      });
    }

    // Prepare lesson content based on type
    let lessonContent = { ...lesson.toObject() };
    
    // For video lessons, generate signed URL if user has access
    if (lesson.type === 'video' && lesson.content.videoUrl) {
      try {
        const signedUrl = cloudinary.utils.private_download_url(
          lesson.content.videoPublicId || lesson.content.videoUrl,
          'video',
          {
            resource_type: 'video',
            expires_at: Math.floor(Date.now() / 1000) + (2 * 3600), // 2 hours
            secure: true
          }
        );
        lessonContent.content.signedVideoUrl = signedUrl;
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    res.success({
      lesson: lessonContent,
      canAccess: accessCheck.canAccess,
      accessReason: accessCheck.reason,
      isCompleted: enrollment ? enrollment.isLessonCompleted(lessonId) : false,
      completionData: enrollment ? enrollment.getLessonCompletion(lessonId) : null
    }, 'Lesson retrieved successfully');

  } catch (error) {
    console.error('Get lesson error:', error);
    res.error(error.message, 'Failed to get lesson', 500);
  }
});

// Update lesson
router.put('/:lessonId', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const updates = req.body;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      organization_id: req.user.organization_id
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist or you do not have permission to modify it', 404);
    }

    // Verify user has permission to modify the course
    const course = await Course.findOne({
      _id: lesson.course_id,
      organization_id: req.user.organization_id,
      $or: [
        { instructor_id: req.user._id },
        { 'req.user.role': 'admin' }
      ]
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this lesson', 403);
    }

    // Prevent changing organization_id, course_id, and section_id
    delete updates.organization_id;
    delete updates.course_id;
    delete updates.section_id;

    Object.assign(lesson, updates);
    await lesson.save();

    res.success({ lesson }, 'Lesson updated successfully');

  } catch (error) {
    console.error('Update lesson error:', error);
    res.error(error.message, 'Failed to update lesson', 500);
  }
});

// Reorder lessons within a section
router.put('/reorder', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { sectionId, lessons } = req.body;

    if (!sectionId || !lessons || !Array.isArray(lessons)) {
      return res.error('Invalid data', 'Section ID and lessons array are required', 400);
    }

    // Verify section exists and user has permission
    const section = await Section.findOne({
      _id: sectionId,
      organization_id: req.user.organization_id
    });

    if (!section) {
      return res.error('Section not found', 'Section does not exist', 404);
    }

    const course = await Course.findOne({
      _id: section.course_id,
      organization_id: req.user.organization_id,
      $or: [
        { instructor_id: req.user._id },
        { 'req.user.role': 'admin' }
      ]
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this course', 403);
    }

    // Reorder lessons
    await Lesson.reorderLessons(sectionId, lessons);

    res.success({}, 'Lessons reordered successfully');

  } catch (error) {
    console.error('Reorder lessons error:', error);
    res.error(error.message, 'Failed to reorder lessons', 500);
  }
});

// Delete lesson
router.delete('/:lessonId', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      organization_id: req.user.organization_id
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist or you do not have permission to modify it', 404);
    }

    // Verify user has permission to modify the course
    const course = await Course.findOne({
      _id: lesson.course_id,
      organization_id: req.user.organization_id,
      $or: [
        { instructor_id: req.user._id },
        { 'req.user.role': 'admin' }
      ]
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to modify this lesson', 403);
    }

    // Check if lesson is a prerequisite for other lessons
    const dependentLessons = await Lesson.find({
      prerequisites: lessonId,
      isActive: true
    });

    if (dependentLessons.length > 0) {
      return res.error('Lesson has dependencies', 'Cannot delete lesson that is a prerequisite for other lessons', 400);
    }

    // Soft delete lesson
    lesson.isActive = false;
    await lesson.save();

    res.success({}, 'Lesson deleted successfully');

  } catch (error) {
    console.error('Delete lesson error:', error);
    res.error(error.message, 'Failed to delete lesson', 500);
  }
});

// Mark lesson as completed
router.post('/:lessonId/complete', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent = 0, score = null } = req.body;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      isActive: true
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Check if user can access this lesson
    const accessCheck = await lesson.canUserAccess(req.user);
    
    if (!accessCheck.canAccess) {
      return res.error('Access denied', 'You do not have access to this lesson', 403);
    }

    // Get enrollment
    const enrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: lesson.course_id,
      status: 'active'
    });

    if (!enrollment) {
      return res.error('Not enrolled', 'You must be enrolled in the course to complete lessons', 403);
    }

    // Mark lesson as completed
    enrollment.completeLesson(lessonId, timeSpent, score);
    await enrollment.save();

    // Get next lesson in sequence
    const nextLesson = await lesson.getNextLesson();

    res.success({
      progress: enrollment.progress,
      nextLesson: nextLesson ? {
        _id: nextLesson._id,
        title: nextLesson.title,
        type: nextLesson.type
      } : null
    }, 'Lesson marked as completed');

  } catch (error) {
    console.error('Complete lesson error:', error);
    res.error(error.message, 'Failed to complete lesson', 500);
  }
});

// Get signed video URL for streaming
router.get('/:lessonId/video-url', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({
      _id: lessonId,
      type: 'video',
      isActive: true
    });

    if (!lesson) {
      return res.error('Lesson not found', 'Video lesson does not exist', 404);
    }

    // Check if user can access this lesson
    const accessCheck = await lesson.canUserAccess(req.user);
    
    if (!accessCheck.canAccess) {
      return res.error('Access denied', 'You do not have access to this video', 403);
    }

    if (!lesson.content.videoUrl) {
      return res.error('Video not available', 'Video content is not available for this lesson', 404);
    }

    try {
      // Generate signed URL with 2-hour expiry
      const signedUrl = cloudinary.utils.private_download_url(
        lesson.content.videoPublicId || lesson.content.videoUrl,
        'video',
        {
          resource_type: 'video',
          expires_at: Math.floor(Date.now() / 1000) + (2 * 3600), // 2 hours
          secure: true
        }
      );

      res.success({
        signedUrl,
        expiresAt: new Date(Date.now() + (2 * 3600 * 1000)).toISOString(),
        duration: lesson.content.videoDuration
      }, 'Signed video URL generated successfully');

    } catch (error) {
      console.error('Error generating signed URL:', error);
      res.error('Video service error', 'Failed to generate secure video URL', 500);
    }

  } catch (error) {
    console.error('Get video URL error:', error);
    res.error(error.message, 'Failed to get video URL', 500);
  }
});

module.exports = router;