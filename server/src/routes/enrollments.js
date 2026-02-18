const express = require('express');
const { Course, Enrollment, User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createOrder, verifyPaymentSignature, getPayment } = require('../config/razorpay');
const notificationService = require('../utils/notificationService');

const router = express.Router();

// Free enrollment in a course
router.post('/:courseId/enroll', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course and validate it's published and free
    const course = await Course.findOne({
      _id: courseId,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    if (course.price > 0) {
      return res.error('Payment required', 'This course requires payment. Please use the payment flow.', 400);
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Create enrollment record
    const enrollment = new Enrollment({
      organization_id: course.organization_id,
      student_id: req.user._id,
      course_id: courseId,
      enrollment_date: new Date(),
      status: 'active',
      payment_status: 'free',
      progress: {
        percentage: 0,
        completed_lessons: [],
        total_lessons: 0,
        last_accessed: new Date()
      }
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolled_students: 1 }
    });

    // Send enrollment notification to instructor
    try {
      await notificationService.sendEnrollmentNotification({
        studentId: req.user._id,
        courseId: courseId,
        instructorId: course.instructor_id,
        organizationId: course.organization_id,
        organizationName: 'Smart LMS' // This should come from organization data
      });
    } catch (notificationError) {
      console.error('Failed to send enrollment notification:', notificationError);
      // Don't fail the enrollment if notification fails
    }

    res.success({
      enrollment: {
        _id: enrollment._id,
        course_id: courseId,
        enrollment_date: enrollment.enrollment_date,
        status: enrollment.status,
        progress: enrollment.progress
      }
    }, 'Successfully enrolled in the course');

  } catch (error) {
    console.error('Free enrollment error:', error);
    res.error(error.message, 'Failed to enroll in course', 500);
  }
});

// Create payment order for paid course enrollment
router.post('/:courseId/payment/create-order', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course and validate it's published and paid
    const course = await Course.findOne({
      _id: courseId,
      status: 'published',
      isActive: true
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not available for enrollment', 404);
    }

    if (course.price <= 0) {
      return res.error('Free course', 'This course is free. Use the free enrollment endpoint.', 400);
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Create Razorpay order
    const amount = course.price * 100; // Convert to paise
    const receipt = `course_${courseId}_${req.user._id}_${Date.now()}`;
    
    const order = await createOrder(amount, 'INR', receipt, {
      organization_id: course.organization_id.toString(),
      user_id: req.user._id.toString(),
      course_id: courseId.toString(),
      course_title: course.title
    });

    res.success({
      orderId: order.id,
      amount: course.price,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      course: {
        _id: course._id,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail
      }
    }, 'Payment order created successfully');

  } catch (error) {
    console.error('Create payment order error:', error);
    res.error(error.message, 'Failed to create payment order', 500);
  }
});

// Verify payment and create enrollment
router.post('/payment/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentId, signature, courseId } = req.body;

    if (!orderId || !paymentId || !signature || !courseId) {
      return res.error('Missing parameters', 'All payment parameters are required', 400);
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.error('Invalid signature', 'Payment verification failed', 400);
    }

    // Get payment details from Razorpay
    const payment = await getPayment(paymentId);

    // Verify payment belongs to the user and course
    if (payment.notes.user_id !== req.user._id.toString() || 
        payment.notes.course_id !== courseId) {
      return res.error('Payment mismatch', 'Payment does not match the request', 400);
    }

    // Verify payment is successful
    if (payment.status !== 'captured') {
      return res.error('Payment not captured', 'Payment was not successful', 400);
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.error('Course not found', 'Course does not exist', 404);
    }

    // Check if enrollment already exists (prevent double enrollment)
    const existingEnrollment = await Enrollment.findOne({
      student_id: req.user._id,
      course_id: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.error('Already enrolled', 'You are already enrolled in this course', 400);
    }

    // Create enrollment record
    const enrollment = new Enrollment({
      organization_id: course.organization_id,
      student_id: req.user._id,
      course_id: courseId,
      enrollment_date: new Date(),
      status: 'active',
      payment_status: 'paid',
      payment_info: {
        gateway: 'razorpay',
        transaction_id: paymentId,
        order_id: orderId,
        amount: payment.amount / 100,
        currency: payment.currency,
        payment_date: new Date(payment.created_at * 1000)
      },
      progress: {
        percentage: 0,
        completed_lessons: [],
        total_lessons: 0,
        last_accessed: new Date()
      }
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolled_students: 1 }
    });

    res.success({
      enrollment: {
        _id: enrollment._id,
        course_id: courseId,
        enrollment_date: enrollment.enrollment_date,
        status: enrollment.status,
        payment_status: enrollment.payment_status,
        progress: enrollment.progress
      },
      payment: {
        transaction_id: paymentId,
        amount: payment.amount / 100,
        currency: payment.currency
      }
    }, 'Payment verified and enrollment created successfully');

  } catch (error) {
    console.error('Payment verification error:', error);
    res.error(error.message, 'Payment verification failed', 500);
  }
});

// Get user's enrollments
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { student_id: req.user._id };
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('course_id', 'title description thumbnail price category level duration instructor_id')
      .populate('course_id.instructor_id', 'fullName email')
      .sort({ enrollment_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    res.success({
      enrollments,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    }, 'Enrollments retrieved successfully');

  } catch (error) {
    console.error('Get enrollments error:', error);
    res.error(error.message, 'Failed to get enrollments', 500);
  }
});

// Get course enrollments (instructor only)
router.get('/:courseId/enrollments', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Verify course exists and user has permission
    const course = await Course.findOne({
      _id: courseId,
      organization_id: req.user.organization_id,
      $or: [
        { instructor_id: req.user._id },
        { 'req.user.role': 'admin' }
      ]
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or you do not have permission to view enrollments', 404);
    }

    // Build query
    const query = { course_id: courseId };
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('student_id', 'fullName email profile.avatar')
      .sort({ enrollment_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    // Calculate enrollment statistics
    const stats = await Enrollment.aggregate([
      { $match: { course_id: courseId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress.percentage' }
        }
      }
    ]);

    res.success({
      enrollments,
      statistics: stats,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    }, 'Course enrollments retrieved successfully');

  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.error(error.message, 'Failed to get course enrollments', 500);
  }
});

// Update enrollment status (instructor/admin only)
router.put('/:enrollmentId/status', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'completed', 'cancelled'].includes(status)) {
      return res.error('Invalid status', 'Status must be one of: active, suspended, completed, cancelled', 400);
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course_id', 'instructor_id organization_id');

    if (!enrollment) {
      return res.error('Enrollment not found', 'Enrollment does not exist', 404);
    }

    // Verify user has permission to modify this enrollment
    if (enrollment.course_id.organization_id.toString() !== req.user.organization_id.toString()) {
      return res.error('Access denied', 'You do not have permission to modify this enrollment', 403);
    }

    if (req.user.role !== 'admin' && enrollment.course_id.instructor_id.toString() !== req.user._id.toString()) {
      return res.error('Access denied', 'You do not have permission to modify this enrollment', 403);
    }

    enrollment.status = status;
    await enrollment.save();

    res.success({ enrollment }, 'Enrollment status updated successfully');

  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.error(error.message, 'Failed to update enrollment status', 500);
  }
});

// Get detailed enrollment progress
router.get('/:enrollmentId/progress', authMiddleware, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course_id', 'title instructor_id organization_id')
      .populate('student_id', 'fullName email');

    if (!enrollment) {
      return res.error('Enrollment not found', 'Enrollment does not exist', 404);
    }

    // Check if user has permission to view this enrollment
    const canView = enrollment.student_id._id.toString() === req.user._id.toString() ||
                   (enrollment.course_id.organization_id.toString() === req.user.organization_id.toString() &&
                    (req.user.role === 'admin' || enrollment.course_id.instructor_id.toString() === req.user._id.toString()));

    if (!canView) {
      return res.error('Access denied', 'You do not have permission to view this enrollment progress', 403);
    }

    // Get detailed progress with lesson information
    const detailedProgress = await enrollment.getDetailedProgress();

    res.success({
      enrollment: {
        _id: enrollment._id,
        course: enrollment.course_id,
        student: enrollment.student_id,
        enrollment_date: enrollment.enrollment_date,
        status: enrollment.status,
        progress: enrollment.progress,
        detailed_progress: detailedProgress
      }
    }, 'Enrollment progress retrieved successfully');

  } catch (error) {
    console.error('Get enrollment progress error:', error);
    res.error(error.message, 'Failed to get enrollment progress', 500);
  }
});

module.exports = router;
// Check and handle course completion
router.post('/:enrollmentId/check-completion', authMiddleware, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course_id', 'title instructor_id organization_id')
      .populate('student_id', 'fullName email');

    if (!enrollment) {
      return res.error('Enrollment not found', 'Enrollment does not exist', 404);
    }

    // Check if user has permission to check this enrollment
    const canCheck = enrollment.student_id._id.toString() === req.user._id.toString() ||
                    (enrollment.course_id.organization_id.toString() === req.user.organization_id.toString() &&
                     (req.user.role === 'admin' || enrollment.course_id.instructor_id.toString() === req.user._id.toString()));

    if (!canCheck) {
      return res.error('Access denied', 'You do not have permission to check this enrollment', 403);
    }

    // Check if course is already completed
    if (enrollment.status === 'completed') {
      return res.success({
        isCompleted: true,
        completionDate: enrollment.completion_date,
        certificateGenerated: !!enrollment.certificate
      }, 'Course is already completed');
    }

    // Get all lessons in the course
    const { Lesson } = require('../models');
    const totalLessons = await Lesson.countDocuments({
      course_id: enrollment.course_id._id,
      isActive: true
    });

    const completedLessons = enrollment.progress.completed_lessons.length;

    // Check if all lessons are completed (100%)
    const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;

    if (isCompleted && enrollment.status !== 'completed') {
      // Mark course as completed
      enrollment.status = 'completed';
      enrollment.completion_date = new Date();
      enrollment.progress.percentage = 100;

      // Generate certificate data
      enrollment.certificate = {
        certificate_id: `CERT_${enrollment.course_id._id}_${enrollment.student_id._id}_${Date.now()}`,
        issued_date: new Date(),
        student_name: enrollment.student_id.fullName,
        course_title: enrollment.course_id.title,
        completion_date: new Date()
      };

      await enrollment.save();

      // Send completion notification (you can implement email service here)
      console.log(`Course completed by ${enrollment.student_id.fullName} for course ${enrollment.course_id.title}`);

      res.success({
        isCompleted: true,
        completionDate: enrollment.completion_date,
        certificate: enrollment.certificate,
        progress: enrollment.progress
      }, 'Congratulations! Course completed successfully');

    } else {
      res.success({
        isCompleted: false,
        progress: enrollment.progress,
        totalLessons,
        completedLessons,
        remainingLessons: totalLessons - completedLessons
      }, 'Course not yet completed');
    }

  } catch (error) {
    console.error('Check course completion error:', error);
    res.error(error.message, 'Failed to check course completion', 500);
  }
});

// Generate and download certificate
router.get('/:enrollmentId/certificate', authMiddleware, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course_id', 'title instructor_id organization_id')
      .populate('student_id', 'fullName email');

    if (!enrollment) {
      return res.error('Enrollment not found', 'Enrollment does not exist', 404);
    }

    // Check if user has permission to access this certificate
    const canAccess = enrollment.student_id._id.toString() === req.user._id.toString() ||
                     (enrollment.course_id.organization_id.toString() === req.user.organization_id.toString() &&
                      (req.user.role === 'admin' || enrollment.course_id.instructor_id.toString() === req.user._id.toString()));

    if (!canAccess) {
      return res.error('Access denied', 'You do not have permission to access this certificate', 403);
    }

    // Check if course is completed and certificate exists
    if (enrollment.status !== 'completed' || !enrollment.certificate) {
      return res.error('Certificate not available', 'Certificate is only available for completed courses', 400);
    }

    res.success({
      certificate: enrollment.certificate,
      course: {
        title: enrollment.course_id.title,
        completion_date: enrollment.completion_date
      },
      student: {
        name: enrollment.student_id.fullName,
        email: enrollment.student_id.email
      }
    }, 'Certificate retrieved successfully');

  } catch (error) {
    console.error('Get certificate error:', error);
    res.error(error.message, 'Failed to get certificate', 500);
  }
});