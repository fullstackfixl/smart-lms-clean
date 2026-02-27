const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const moduleGuard = require('../middleware/moduleGuard');
const Fee = require('../models/Fee');
const User = require('../models/User');
const Course = require('../models/Course');
const notificationService = require('../utils/notificationService');

const router = express.Router();

// All fee routes require FEES module to be enabled
router.use(auth, moduleGuard('FEES'));

/**
 * POST /api/fees
 * Create a new fee record
 */
router.post('/', [
  auth,
  body('student_id').isMongoId().withMessage('Valid student ID is required'),
  body('fee_type').isIn([
    'course_enrollment', 'monthly_tuition', 'semester_fee', 'exam_fee',
    'library_fee', 'lab_fee', 'admission_fee', 'other'
  ]).withMessage('Valid fee type is required'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
  body('course_id').optional().isMongoId().withMessage('Valid course ID is required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Valid currency is required'),
  body('installments').optional().isArray().withMessage('Installments must be an array'),
  body('late_fee.enabled').optional().isBoolean().withMessage('Late fee enabled must be boolean'),
  body('late_fee.amount').optional().isFloat({ min: 0 }).withMessage('Late fee amount must be positive'),
  body('academic_year').optional().trim().isLength({ max: 20 }).withMessage('Academic year max 20 characters'),
  body('semester').optional().isIn(['1', '2', '3', '4', '5', '6', '7', '8', 'summer']).withMessage('Valid semester required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;

    // Only org_admin can create fees
    if (role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only organization administrators can create fees'
      });
    }

    const {
      student_id,
      course_id,
      fee_type,
      title,
      description,
      amount,
      currency = 'INR',
      due_date,
      installments = [],
      late_fee = {},
      discount = {},
      academic_year,
      semester,
      notes
    } = req.body;

    // Verify student exists and belongs to organization
    const student = await User.findOne({
      _id: student_id,
      organization_id: organization_id,
      role: 'student',
      is_active: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: 'Student not found in your organization'
      });
    }

    // Verify course exists and belongs to organization (if provided)
    if (course_id) {
      const course = await Course.findOne({
        _id: course_id,
        organization_id: organization_id,
        is_active: true
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found',
          message: 'Course not found in your organization'
        });
      }
    }

    // Create fee record
    const fee = new Fee({
      organization_id,
      student_id,
      course_id: course_id || null,
      fee_type,
      title,
      description,
      amount,
      currency,
      due_date: new Date(due_date),
      installments: installments.map(inst => ({
        ...inst,
        due_date: new Date(inst.due_date)
      })),
      late_fee: {
        enabled: late_fee.enabled || false,
        amount: late_fee.amount || 0,
        calculation_type: late_fee.calculation_type || 'fixed'
      },
      discount: {
        amount: discount.amount || 0,
        percentage: discount.percentage || 0,
        reason: discount.reason || '',
        applied_by: discount.amount > 0 || discount.percentage > 0 ? userId : null,
        applied_date: discount.amount > 0 || discount.percentage > 0 ? new Date() : null
      },
      academic_year,
      semester,
      notes,
      created_by: userId
    });

    await fee.save();

    // Populate for response
    await fee.populate([
      { path: 'student_id', select: 'full_name email' },
      { path: 'course_id', select: 'title' },
      { path: 'created_by', select: 'full_name' }
    ]);

    res.status(201).json({
      success: true,
      data: fee,
      message: 'Fee record created successfully'
    });

  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create fee record'
    });
  }
});

/**
 * GET /api/fees
 * Get fees with filtering and pagination
 */
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']),
  query('fee_type').optional().isIn([
    'course_enrollment', 'monthly_tuition', 'semester_fee', 'exam_fee',
    'library_fee', 'lab_fee', 'admission_fee', 'other'
  ]),
  query('student_id').optional().isMongoId().withMessage('Valid student ID required'),
  query('course_id').optional().isMongoId().withMessage('Valid course ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your query parameters',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      fee_type,
      student_id,
      course_id,
      academic_year,
      semester,
      search
    } = req.query;

    // Build filter query
    const filters = {};
    if (status) filters.status = status;
    if (fee_type) filters.fee_type = fee_type;
    if (academic_year) filters.academic_year = academic_year;
    if (semester) filters.semester = semester;

    // Role-based filtering
    if (role === 'student') {
      filters.student_id = userId;
    } else if (role === 'parent') {
      // Get linked students
      const linkedStudents = await User.find({
        parent_id: userId,
        organization_id: organization_id,
        role: 'student',
        is_active: true
      }).select('_id');

      if (linkedStudents.length === 0) {
        return res.json({
          success: true,
          data: {
            fees: [],
            pagination: {
              current_page: parseInt(page),
              total_pages: 0,
              total_items: 0,
              items_per_page: parseInt(limit)
            }
          },
          message: 'No linked students found'
        });
      }

      filters.student_id = { $in: linkedStudents.map(s => s._id) };
    } else if (role === 'instructor') {
      // Instructors can only see fees for their courses
      const instructorCourses = await Course.find({
        instructor_id: userId,
        organization_id: organization_id,
        is_active: true
      }).select('_id');

      filters.course_id = { $in: instructorCourses.map(c => c._id) };
    }

    // Additional filters
    if (student_id && (role === 'org_admin' || role === 'instructor')) {
      filters.student_id = student_id;
    }
    if (course_id) filters.course_id = course_id;

    // Search functionality
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get fees with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const fees = await Fee.findByOrganization(organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalFees = await Fee.countDocuments({
      organization_id: organization_id,
      is_active: true,
      ...filters
    });

    // Get summary statistics
    const statistics = await Fee.getFeeStatistics(organization_id, filters);

    res.json({
      success: true,
      data: {
        fees,
        statistics,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalFees / parseInt(limit)),
          total_items: totalFees,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Fees retrieved successfully'
    });

  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve fees'
    });
  }
});

/**
 * GET /api/fees/:id
 * Get specific fee details
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role, _id: userId } = req.user;

    const fee = await Fee.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    }).populate([
      { path: 'student_id', select: 'full_name email profile_picture' },
      { path: 'course_id', select: 'title' },
      { path: 'created_by', select: 'full_name' }
    ]);

    if (!fee) {
      return res.status(404).json({
        success: false,
        error: 'Fee not found',
        message: 'Fee record not found'
      });
    }

    // Check access permissions
    if (role === 'student' && fee.student_id._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own fees'
      });
    }

    if (role === 'parent') {
      const isLinkedStudent = await User.findOne({
        _id: fee.student_id._id,
        parent_id: userId,
        organization_id: organization_id
      });

      if (!isLinkedStudent) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view fees for your linked students'
        });
      }
    }

    res.json({
      success: true,
      data: fee,
      message: 'Fee details retrieved successfully'
    });

  } catch (error) {
    console.error('Get fee details error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve fee details'
    });
  }
});

/**
 * PUT /api/fees/:id
 * Update fee record
 */
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title max 200 characters'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('due_date').optional().isISO8601().withMessage('Valid due date required'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { organization_id, role } = req.user;

    // Only org_admin can update fees
    if (role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only organization administrators can update fees'
      });
    }

    const fee = await Fee.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!fee) {
      return res.status(404).json({
        success: false,
        error: 'Fee not found',
        message: 'Fee record not found'
      });
    }

    // Prevent updating paid fees
    if (fee.status === 'paid' && req.body.status !== 'refunded') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update paid fee',
        message: 'Paid fees cannot be modified except for refunds'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'amount', 'due_date', 'status',
      'late_fee', 'discount', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'due_date') {
          fee[field] = new Date(req.body[field]);
        } else {
          fee[field] = req.body[field];
        }
      }
    });

    await fee.save();

    await fee.populate([
      { path: 'student_id', select: 'full_name email' },
      { path: 'course_id', select: 'title' },
      { path: 'created_by', select: 'full_name' }
    ]);

    res.json({
      success: true,
      data: fee,
      message: 'Fee updated successfully'
    });

  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update fee'
    });
  }
});

/**
 * DELETE /api/fees/:id
 * Delete (deactivate) fee record
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role } = req.user;

    // Only org_admin can delete fees
    if (role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only organization administrators can delete fees'
      });
    }

    const fee = await Fee.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    });

    if (!fee) {
      return res.status(404).json({
        success: false,
        error: 'Fee not found',
        message: 'Fee record not found'
      });
    }

    // Prevent deleting paid fees
    if (fee.status === 'paid' || fee.status === 'partially_paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete paid fee',
        message: 'Paid or partially paid fees cannot be deleted'
      });
    }

    // Soft delete
    fee.is_active = false;
    fee.status = 'cancelled';
    await fee.save();

    res.json({
      success: true,
      message: 'Fee record deleted successfully'
    });

  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete fee record'
    });
  }
});

/**
 * POST /api/fees/bulk-create
 * Create fees for multiple students
 */
router.post('/bulk-create', [
  auth,
  body('course_id').optional().isMongoId().withMessage('Valid course ID required'),
  body('student_ids').optional().isArray().withMessage('Student IDs must be an array'),
  body('fee_data').isObject().withMessage('Fee data is required'),
  body('fee_data.fee_type').isIn([
    'course_enrollment', 'monthly_tuition', 'semester_fee', 'exam_fee',
    'library_fee', 'lab_fee', 'admission_fee', 'other'
  ]).withMessage('Valid fee type required'),
  body('fee_data.title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('fee_data.amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('fee_data.due_date').isISO8601().withMessage('Valid due date required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { organization_id, role, _id: userId } = req.user;

    // Only org_admin can create bulk fees
    if (role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only organization administrators can create bulk fees'
      });
    }

    const { course_id, student_ids, fee_data } = req.body;

    let createdFees = [];

    if (course_id) {
      // Create fees for all enrolled students in a course
      createdFees = await Fee.createBulkCourseFees(
        course_id,
        organization_id,
        fee_data,
        userId
      );
    } else if (student_ids && student_ids.length > 0) {
      // Create fees for specific students
      const fees = student_ids.map(student_id => ({
        organization_id,
        student_id,
        course_id: null,
        ...fee_data,
        due_date: new Date(fee_data.due_date),
        created_by: userId
      }));

      createdFees = await Fee.insertMany(fees);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Either course_id or student_ids must be provided'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        created_count: createdFees.length,
        fees: createdFees
      },
      message: `${createdFees.length} fee records created successfully`
    });

  } catch (error) {
    console.error('Bulk create fees error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create bulk fees'
    });
  }
});

/**
 * GET /api/fees/reports/overdue
 * Get overdue fees report
 */
router.get('/reports/overdue', auth, async (req, res) => {
  try {
    const { organization_id, role } = req.user;

    // Only org_admin and instructors can view reports
    if (!['org_admin', 'instructor'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only administrators and instructors can view reports'
      });
    }

    const overdueFees = await Fee.findOverdueFees(organization_id);

    // Group by student for better reporting
    const studentOverdues = {};
    let totalOverdueAmount = 0;

    overdueFees.forEach(fee => {
      const studentId = fee.student_id._id.toString();
      if (!studentOverdues[studentId]) {
        studentOverdues[studentId] = {
          student: fee.student_id,
          fees: [],
          total_amount: 0,
          oldest_due_date: fee.due_date
        };
      }

      studentOverdues[studentId].fees.push(fee);
      studentOverdues[studentId].total_amount += fee.total_amount;
      totalOverdueAmount += fee.total_amount;

      if (fee.due_date < studentOverdues[studentId].oldest_due_date) {
        studentOverdues[studentId].oldest_due_date = fee.due_date;
      }
    });

    res.json({
      success: true,
      data: {
        total_overdue_amount: totalOverdueAmount,
        total_overdue_fees: overdueFees.length,
        students_with_overdue: Object.keys(studentOverdues).length,
        student_overdue_details: Object.values(studentOverdues),
        overdue_fees: overdueFees
      },
      message: 'Overdue fees report generated successfully'
    });

  } catch (error) {
    console.error('Overdue fees report error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate overdue fees report'
    });
  }
});

/**
 * POST /api/fees/:id/process-payment
 * Process fee payment (for webhook integration)
 */
router.post('/:id/process-payment', [
  auth,
  body('payment_id').notEmpty().withMessage('Payment ID is required'),
  body('payment_method').isIn(['razorpay', 'stripe', 'cash', 'bank_transfer', 'cheque']).withMessage('Valid payment method required'),
  body('transaction_id').optional().notEmpty().withMessage('Transaction ID cannot be empty'),
  body('amount_paid').isFloat({ min: 0 }).withMessage('Amount paid must be positive'),
  body('installment_number').optional().isInt({ min: 1 }).withMessage('Valid installment number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { organization_id, role } = req.user;
    const { payment_id, payment_method, transaction_id, amount_paid, installment_number } = req.body;

    // Only org_admin can process payments manually
    if (role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only organization administrators can process payments'
      });
    }

    const fee = await Fee.findOne({
      _id: id,
      organization_id: organization_id,
      is_active: true
    }).populate('student_id', 'full_name email');

    if (!fee) {
      return res.status(404).json({
        success: false,
        error: 'Fee not found',
        message: 'Fee record not found'
      });
    }

    // Process payment
    await fee.processPayment({
      payment_id,
      payment_method,
      transaction_id,
      amount_paid,
      installment_number
    });

    // Send payment confirmation notification
    if (fee.status === 'paid') {
      try {
        await notificationService.createNotification({
          organization_id: organization_id,
          recipient_id: fee.student_id._id,
          type: 'general',
          title: 'Payment Received',
          message: `Your payment for "${fee.title}" has been received successfully.`,
          data: {
            fee_id: fee._id,
            amount: amount_paid,
            payment_method
          },
          priority: 'low'
        });
      } catch (notificationError) {
        console.error('Failed to send payment notification:', notificationError);
      }
    }

    res.json({
      success: true,
      data: fee,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process payment'
    });
  }
});

module.exports = router;