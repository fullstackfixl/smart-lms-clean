const { Course, Enrollment, User } = require('../models');
const BaseController = require('../core/BaseController');
const { stripe } = require('../config/stripe');

class MarketplaceController extends BaseController {
    /**
     * List all courses published to the marketplace
     */
    async listCourses(req, res) {
        try {
            const courses = await Course.find({
                isPublishedToMarketplace: true,
                marketplaceStatus: 'PUBLISHED',
                is_deleted: false
            })
                .populate('organization_id', 'name')
                .populate('instructor_id', 'profile.firstName profile.lastName')
                .select('title description marketplacePrice thumbnail category level instructor_id organization_id rating enrollmentCount')
                .lean();

            return res.success(courses, 'Marketplace courses retrieved successfully');
        } catch (err) {
            return res.error(err.message, 'Failed to fetch marketplace courses', 500);
        }
    }

    /**
     * Get course details for public view
     */
    async getCourseDetails(req, res) {
        try {
            const { id } = req.params;
            const course = await Course.findOne({
                _id: id,
                isPublishedToMarketplace: true,
                marketplaceStatus: 'PUBLISHED'
            })
                .populate('organization_id', 'name description')
                .populate('instructor_id', 'profile.firstName profile.lastName profile.bio')
                .lean();

            if (!course) {
                return res.error('Course not found or not available in marketplace', 'Not Found', 404);
            }

            // TODO: Fetch sections/lessons for preview if needed

            return res.success(course, 'Course details retrieved successfully');
        } catch (err) {
            return res.error(err.message, 'Failed to fetch course details', 500);
        }
    }

    /**
     * Create Stripe Checkout Session
     */
    async createCheckoutSession(req, res) {
        try {
            const { courseId } = req.body;
            const user = req.user;

            if (!courseId) {
                return res.error('Course ID is required', 'Validation Error', 400);
            }

            const course = await Course.findById(courseId);
            if (!course || !course.isPublishedToMarketplace || course.marketplaceStatus !== 'PUBLISHED') {
                return res.error('Course not available for purchase', 'Not Found', 404);
            }

            // Security Check: Internal org students same organization
            if (user.organization_id && user.organization_id.toString() === course.organization_id.toString()) {
                return res.error('Internal organization students cannot purchase their own organization courses', 'Access Denied', 403);
            }

            // Check for already enrolled
            const existing = await Enrollment.findOne({
                student_id: user._id,
                course_id: courseId
            });
            if (existing) {
                return res.error('You are already enrolled in this course', 'Duplicate Enrollment', 400);
            }

            const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            description: course.description?.substring(0, 255)
                        },
                        unit_amount: Math.round(course.marketplacePrice * 100), // Stripe expects cents
                    },
                    quantity: 1,
                }],
                metadata: {
                    userId: user._id.toString(),
                    courseId: course._id.toString(),
                    organizationId: course.organization_id.toString(),
                    type: 'MARKETPLACE'
                },
                success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${baseUrl}/course/${courseId}`,
                customer_email: user.email,
            });

            return res.success({ url: session.url, sessionId: session.id }, 'Checkout session created');
        } catch (err) {
            console.error('Stripe Checkout Error:', err);
            return res.error(err.message, 'Failed to initiate payment', 500);
        }
    }

    /**
     * Handle Webhook for successful payment (Auto-enrollment)
     */
    async handleWebhook(req, res) {
        const event = req.stripeEvent;

        if (!event) {
            return res.status(400).send('Webhook Error: Event not found');
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            const { userId, courseId, organizationId } = session.metadata;

            try {
                // 1. Create Enrollment
                const existing = await Enrollment.findOne({ student_id: userId, course_id: courseId });
                if (!existing) {
                    await Enrollment.create({
                        organization_id: organizationId,
                        student_id: userId,
                        course_id: courseId,
                        enrollmentType: 'marketplace',
                        status: 'active',
                        enrolledAt: new Date(),
                        payment: {
                            amount: session.amount_total / 100,
                            currency: session.currency?.toUpperCase() || 'USD',
                            paymentId: session.payment_intent,
                            paymentMethod: 'stripe',
                            paymentStatus: 'completed',
                            paymentDate: new Date()
                        }
                    });

                    // 2. Update Course stats
                    await Course.findByIdAndUpdate(courseId, {
                        $addToSet: { students: userId },
                        $inc: { enrollmentCount: 1 }
                    });

                    console.log(`✅ Auto-enrolled user ${userId} to course ${courseId}`);
                }
            } catch (err) {
                console.error('❌ Failed auto-enrollment in webhook:', err);
                // We might want to store failed webhooks for manual retry
            }
        }

        res.json({ received: true });
    }
}

module.exports = new MarketplaceController();
