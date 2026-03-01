const { Course } = require('../models');
const BaseController = require('../core/BaseController');

class PlatformCourseController extends BaseController {
    /**
     * List all courses across the platform with pagination and filters
     */
    async listCourses(req, res) {
        try {
            const { page = 1, limit = 20, search, status, globalPublished } = req.query;

            const query = { is_deleted: false };

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ];
            }

            if (status) {
                query.status = status;
            }

            if (globalPublished !== undefined) {
                query.isGloballyPublished = globalPublished === 'true';
            }

            const [courses, total] = await Promise.all([
                Course.find(query)
                    .populate('organization_id', 'name code')
                    .populate('instructor_id', 'profile.firstName profile.lastName email')
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit))
                    .lean(),
                Course.countDocuments(query)
            ]);

            return res.success({
                courses,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    current: parseInt(page),
                    limit: parseInt(limit)
                }
            }, 'Courses retrieved successfully');
        } catch (err) {
            return res.error(err.message, 'Failed to list courses', 500);
        }
    }

    /**
     * Get course statistics for platform dashboard
     */
    async getStats(req, res) {
        try {
            const [total, published, globallyPublished, draft] = await Promise.all([
                Course.countDocuments({ is_deleted: false }),
                Course.countDocuments({ is_deleted: false, status: 'published' }),
                Course.countDocuments({ is_deleted: false, isGloballyPublished: true }),
                Course.countDocuments({ is_deleted: false, status: 'draft' })
            ]);

            return res.success({
                total,
                published,
                globallyPublished,
                draft
            }, 'Course stats retrieved successfully');
        } catch (err) {
            return res.error(err.message, 'Failed to get course stats', 500);
        }
    }

    /**
     * Toggle global visibility for landing page
     */
    async toggleGlobalPublish(req, res) {
        try {
            const { id } = req.params;
            const { publish } = req.body;

            const course = await Course.findById(id);
            if (!course) {
                return res.error('Course not found', 'Not Found', 404);
            }

            course.isGloballyPublished = publish;
            if (publish) {
                course.globallyPublishedAt = new Date();
                course.globallyPublishedBy = req.user._id;
            }

            await course.save();

            return res.success({
                isGloballyPublished: course.isGloballyPublished,
                globallyPublishedAt: course.globallyPublishedAt
            }, `Course ${publish ? 'published to' : 'removed from'} landing page successfully`);
        } catch (err) {
            return res.error(err.message, 'Failed to toggle global publish', 500);
        }
    }

    /**
     * Publish course to official Marketplace
     */
    async publishToMarketplace(req, res) {
        try {
            const { id } = req.params;
            const { price, publish = true } = req.body;

            if (publish && (price === undefined || price < 0)) {
                return res.error('Valid price is required for marketplace publishing', 'Validation Error', 400);
            }

            const course = await Course.findById(id);
            if (!course) {
                return res.error('Course not found', 'Not Found', 404);
            }

            course.isPublishedToMarketplace = publish;
            course.marketplaceStatus = publish ? 'PUBLISHED' : 'DRAFT';
            if (price !== undefined) {
                course.marketplacePrice = price;
            }
            course.publishedByPlatformAdmin = publish;

            await course.save();

            return res.success({
                isPublishedToMarketplace: course.isPublishedToMarketplace,
                marketplaceStatus: course.marketplaceStatus,
                marketplacePrice: course.marketplacePrice
            }, `Course ${publish ? 'published to' : 'removed from'} marketplace successfully`);
        } catch (err) {
            return res.error(err.message, 'Failed to publish to marketplace', 500);
        }
    }
}

module.exports = new PlatformCourseController();
