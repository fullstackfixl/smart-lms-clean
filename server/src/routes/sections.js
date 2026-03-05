const express = require('express');
const { Course, Section, Lesson } = require('../models');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create section
router.post('/:courseId/sections', authMiddleware, requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    if (!title) {
      return res.error('Missing required fields', 'Section title is required', 400);
    }

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
      return res.error('Course not found', 'Course does not exist or you do not have permission to modify it', 404);
    }

    const section = new Section({
      organization_id: orgId,
      course_id: courseId,
      title,
      description,
      order
    });

    await section.save();

    res.success({ section }, 'Section created successfully');

  } catch (error) {
    console.error('Create section error:', error);
    res.error(error.message, 'Failed to create section', 500);
  }
});

// Get sections for a course
router.get('/:courseId/sections', optionalAuth, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists and is accessible
    const course = await Course.findOne({
      _id: courseId,
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist', 404);
    }

    // Check access permissions
    if (!course.canUserAccess(req.user || {})) {
      return res.error('Access denied', 'You do not have permission to view this course', 403);
    }

    const sections = await Section.find({
      course_id: courseId,
      isActive: true
    }).sort({ order: 1 });

    // Get lessons for each section
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

    res.success({ sections: sectionsWithLessons }, 'Sections retrieved successfully');

  } catch (error) {
    console.error('Get sections error:', error);
    res.error(error.message, 'Failed to get sections', 500);
  }
});

// Update section
router.put('/:courseId/sections/:sectionId', authMiddleware, requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const updates = req.body;

    // Verify course and section exist and user has permission
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

    // Prevent changing organization_id and course_id
    delete updates.organization_id;
    delete updates.course_id;

    Object.assign(section, updates);
    await section.save();

    res.success({ section }, 'Section updated successfully');

  } catch (error) {
    console.error('Update section error:', error);
    res.error(error.message, 'Failed to update section', 500);
  }
});

// Reorder sections
router.put('/:courseId/sections/reorder', authMiddleware, requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.error('Invalid data', 'Sections array is required', 400);
    }

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
      return res.error('Course not found', 'Course does not exist or you do not have permission to modify it', 404);
    }

    // Reorder sections
    await Section.reorderSections(courseId, sections);

    res.success({}, 'Sections reordered successfully');

  } catch (error) {
    console.error('Reorder sections error:', error);
    res.error(error.message, 'Failed to reorder sections', 500);
  }
});

// Delete section
router.delete('/:courseId/sections/:sectionId', authMiddleware, requireRole(['instructor', 'org_admin']), async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;

    // Verify course and section exist and user has permission
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

    // Check if section has lessons
    const lessonsCount = await Lesson.countDocuments({
      section_id: sectionId,
      isActive: true
    });

    if (lessonsCount > 0) {
      return res.error('Section has lessons', 'Cannot delete section that contains lessons. Delete lessons first.', 400);
    }

    // Soft delete section
    section.isActive = false;
    await section.save();

    res.success({}, 'Section deleted successfully');

  } catch (error) {
    console.error('Delete section error:', error);
    res.error(error.message, 'Failed to delete section', 500);
  }
});

module.exports = router;