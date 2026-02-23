const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require platform_admin
router.use(authMiddleware);
router.use(requireRole(['platform_admin']));

/**
 * GET /api/platform/courses
 * List all courses across all organizations for platform admin review
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            organization,
            globalPublished,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = { isActive: true };

        if (status && status !== 'all') filter.status = status;
        if (organization) filter.organization_id = organization;
        if (globalPublished === 'true') filter.isGloballyPublished = true;
        if (globalPublished === 'false') filter.isGloballyPublished = false;
        if (search) filter.$text = { $search: search };

        const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('organization_id', 'name code domain')
                .populate('instructor_id', 'profile.firstName profile.lastName email')
                .populate('globallyPublishedBy', 'profile.firstName profile.lastName email')
                .select('-students')
                .sort(sortObj)
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .lean(),
            Course.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                courses,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Platform: list courses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
});

/**
 * PATCH /api/platform/courses/:id/global-publish
 * Toggle isGloballyPublished — makes course visible on the public landing page
 * Body: { publish: true | false }
 */
router.patch('/:id/global-publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { publish } = req.body;

        if (typeof publish !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'publish field must be boolean (true or false)'
            });
        }

        const course = await Course.findOne({ _id: id, isActive: true });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Course must be published (by instructor) before it can be globally published
        if (publish && course.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Course must be published by the instructor before it can be shown on the landing page'
            });
        }

        course.isGloballyPublished = publish;
        course.globallyPublishedAt = publish ? new Date() : null;
        course.globallyPublishedBy = publish ? req.user._id : null;

        await course.save();

        res.json({
            success: true,
            message: publish
                ? 'Course is now visible on the landing page'
                : 'Course removed from the landing page',
            data: {
                _id: course._id,
                title: course.title,
                isGloballyPublished: course.isGloballyPublished,
                globallyPublishedAt: course.globallyPublishedAt
            }
        });
    } catch (error) {
        console.error('Platform: toggle global publish error:', error);
        res.status(500).json({ success: false, message: 'Failed to update course visibility' });
    }
});

/**
 * GET /api/platform/courses/stats
 * Quick stats for the platform admin dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, published, globallyPublished, draft] = await Promise.all([
            Course.countDocuments({ isActive: true }),
            Course.countDocuments({ isActive: true, status: 'published' }),
            Course.countDocuments({ isActive: true, isGloballyPublished: true }),
            Course.countDocuments({ isActive: true, status: 'draft' }),
        ]);

        res.json({
            success: true,
            data: { total, published, globallyPublished, draft }
        });
    } catch (error) {
        console.error('Platform: course stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch course stats' });
    }
});

module.exports = router;
