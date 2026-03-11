const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Course, Section, Lesson, User } = require('../models');

const router = express.Router();

// Get pending course applications (pending_review status)
router.get('/applications', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    
    const courses = await Course.find({
      organization_id: orgId,
      status: 'pending_review',
      isActive: true
    }).populate('instructor_id', 'profile.firstName profile.lastName email');

    // Get modules (sections) and lessons for each course
    const applications = await Promise.all(
      courses.map(async (course) => {
        const sections = await Section.find({
          course_id: course._id,
          isActive: true
        }).sort({ order: 1 });

        const modulesWithLessons = await Promise.all(
          sections.map(async (section) => {
            const lessons = await Lesson.find({
              section_id: section._id,
              isActive: true
            }).sort({ order: 1 }).select('title description type duration order isPreview');

            return {
              _id: section._id,
              title: section.title,
              description: section.description,
              lessons: lessons.map(l => ({
                _id: l._id,
                title: l.title,
                type: l.type,
                duration: l.duration,
                content: l.content
              }))
            };
          })
        );

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          status: course.status,
          instructor_id: course.instructor_id,
          modules: modulesWithLessons,
          submittedAt: course.updatedAt
        };
      })
    );

    res.success({ applications }, 'Pending applications retrieved successfully');
  } catch (error) {
    console.error('Get applications error:', error);
    res.error(error.message, 'Failed to load applications', 500);
  }
});

// Approve and publish course
router.post('/applications/:courseId/approve', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    course.status = 'published';
    await course.save();

    res.success({ course }, 'Course approved and published successfully');
  } catch (error) {
    console.error('Approve course error:', error);
    res.error(error.message, 'Failed to approve course', 500);
  }
});

// Reject course
router.post('/applications/:courseId/reject', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    course.status = 'draft';
    course.rejectionReason = reason;
    await course.save();

    res.success({ course }, 'Course rejected and returned to instructor');
  } catch (error) {
    console.error('Reject course error:', error);
    res.error(error.message, 'Failed to reject course', 500);
  }
});

// Update course details (before approval)
router.put('/applications/:courseId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, level, price } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (price !== undefined) course.price = price;

    await course.save();

    res.success({ course }, 'Course updated successfully');
  } catch (error) {
    console.error('Update application error:', error);
    res.error(error.message, 'Failed to update course', 500);
  }
});

// Update module
router.put('/applications/modules/:moduleId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const section = await Section.findOne({ _id: moduleId });
    if (!section) {
      return res.error('Module not found', 'Module does not exist', 404);
    }

    // Verify the course belongs to this org
    const course = await Course.findOne({
      _id: section.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to edit this module', 403);
    }

    if (title) section.title = title;
    if (description) section.description = description;
    await section.save();

    res.success({ section }, 'Module updated successfully');
  } catch (error) {
    console.error('Update module error:', error);
    res.error(error.message, 'Failed to update module', 500);
  }
});

// Delete module
router.delete('/applications/modules/:moduleId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { moduleId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const section = await Section.findOne({ _id: moduleId });
    if (!section) {
      return res.error('Module not found', 'Module does not exist', 404);
    }

    // Verify the course belongs to this org
    const course = await Course.findOne({
      _id: section.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to delete this module', 403);
    }

    // Soft delete
    section.isActive = false;
    await section.save();

    res.success({}, 'Module deleted successfully');
  } catch (error) {
    console.error('Delete module error:', error);
    res.error(error.message, 'Failed to delete module', 500);
  }
});

// Delete lesson
router.delete('/applications/lessons/:lessonId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const lesson = await Lesson.findOne({ _id: lessonId });
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Verify the course belongs to this org
    const section = await Section.findOne({ _id: lesson.section_id });
    const course = await Course.findOne({
      _id: section?.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to delete this lesson', 403);
    }

    // Soft delete
    lesson.isActive = false;
    await lesson.save();

    res.success({}, 'Lesson deleted successfully');
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.error(error.message, 'Failed to delete lesson', 500);
  }
});

// Update lesson
router.put('/lessons/:lessonId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, duration } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const lesson = await Lesson.findOne({ _id: lessonId });
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Verify the course belongs to this org
    const section = await Section.findOne({ _id: lesson.section_id });
    const course = await Course.findOne({
      _id: section?.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to edit this lesson', 403);
    }

    // Update lesson fields
    if (title) lesson.title = title;
    if (duration !== undefined) lesson.duration = duration;
    if (content) lesson.content = content;

    await lesson.save();

    res.success({ lesson }, 'Lesson updated successfully');
  } catch (error) {
    console.error('Update lesson error:', error);
    res.error(error.message, 'Failed to update lesson', 500);
  }
});

module.exports = router;
