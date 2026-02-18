const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  installment_number: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  due_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  payment_date: Date,
  payment_id: String,
  transaction_id: String
}, { _id: false });

const reminderSchema = new mongoose.Schema({
  sent_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reminder_type: {
    type: String,
    enum: ['due_soon', 'overdue', 'final_notice'],
    required: true
  },
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }
}, { _id: false });

const feeSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true // null for general fees
  },
  fee_type: {
    type: String,
    enum: [
      'course_enrollment',
      'monthly_tuition',
      'semester_fee',
      'exam_fee',
      'library_fee',
      'lab_fee',
      'admission_fee',
      'other'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  due_date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'],
    default: 'pending',
    index: true
  },
  payment_details: {
    payment_id: String,
    payment_method: {
      type: String,
      enum: ['razorpay', 'stripe', 'cash', 'bank_transfer', 'cheque']
    },
    payment_date: Date,
    transaction_id: String,
    receipt_url: String,
    gateway_response: mongoose.Schema.Types.Mixed
  },
  installments: [installmentSchema],
  late_fee: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    applied_date: Date,
    calculation_type: {
      type: String,
      enum: ['fixed', 'percentage', 'daily'],
      default: 'fixed'
    }
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reason: String,
    applied_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    applied_date: Date
  },
  reminders_sent: [reminderSchema],
  academic_year: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', 'summer'],
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
feeSchema.index({ organization_id: 1, student_id: 1, status: 1 });
feeSchema.index({ organization_id: 1, due_date: 1, status: 1 });
feeSchema.index({ organization_id: 1, fee_type: 1, academic_year: 1 });
feeSchema.index({ organization_id: 1, course_id: 1, status: 1 });
feeSchema.index({ student_id: 1, status: 1, due_date: 1 });

// Virtual for total amount including late fees and discounts
feeSchema.virtual('total_amount').get(function() {
  let total = this.amount;
  
  // Add late fee if applicable
  if (this.late_fee.enabled && this.late_fee.applied_date) {
    total += this.late_fee.amount;
  }
  
  // Apply discount
  if (this.discount.amount > 0) {
    total -= this.discount.amount;
  } else if (this.discount.percentage > 0) {
    total -= (total * this.discount.percentage / 100);
  }
  
  return Math.max(0, total);
});

// Virtual for days overdue
feeSchema.virtual('days_overdue').get(function() {
  if (this.status !== 'overdue' && this.status !== 'pending') return 0;
  
  const now = new Date();
  if (this.due_date >= now) return 0;
  
  return Math.ceil((now - this.due_date) / (1000 * 60 * 60 * 24));
});

// Virtual for payment status summary
feeSchema.virtual('payment_summary').get(function() {
  if (this.installments.length === 0) {
    return {
      total_installments: 0,
      paid_installments: 0,
      pending_installments: 0,
      next_due_date: this.due_date
    };
  }
  
  const paid = this.installments.filter(i => i.status === 'paid').length;
  const pending = this.installments.filter(i => i.status === 'pending').length;
  const nextDue = this.installments
    .filter(i => i.status === 'pending')
    .sort((a, b) => a.due_date - b.due_date)[0];
  
  return {
    total_installments: this.installments.length,
    paid_installments: paid,
    pending_installments: pending,
    next_due_date: nextDue ? nextDue.due_date : null
  };
});

// Instance method to calculate late fee
feeSchema.methods.calculateLateFee = function() {
  if (!this.late_fee.enabled || this.status === 'paid') return 0;
  
  const daysOverdue = this.days_overdue;
  if (daysOverdue <= 0) return 0;
  
  switch (this.late_fee.calculation_type) {
    case 'fixed':
      return this.late_fee.amount;
    case 'percentage':
      return (this.amount * this.late_fee.amount / 100);
    case 'daily':
      return this.late_fee.amount * daysOverdue;
    default:
      return this.late_fee.amount;
  }
};

// Instance method to apply late fee
feeSchema.methods.applyLateFee = function() {
  if (!this.late_fee.enabled || this.late_fee.applied_date) return false;
  
  const calculatedLateFee = this.calculateLateFee();
  if (calculatedLateFee > 0) {
    this.late_fee.amount = calculatedLateFee;
    this.late_fee.applied_date = new Date();
    return true;
  }
  
  return false;
};

// Instance method to process payment
feeSchema.methods.processPayment = function(paymentData) {
  const { payment_id, payment_method, transaction_id, amount_paid, installment_number } = paymentData;
  
  if (installment_number && this.installments.length > 0) {
    // Process installment payment
    const installment = this.installments.find(i => i.installment_number === installment_number);
    if (installment && installment.status === 'pending') {
      installment.status = 'paid';
      installment.payment_date = new Date();
      installment.payment_id = payment_id;
      installment.transaction_id = transaction_id;
      
      // Check if all installments are paid
      const allPaid = this.installments.every(i => i.status === 'paid');
      if (allPaid) {
        this.status = 'paid';
      } else {
        this.status = 'partially_paid';
      }
    }
  } else {
    // Process full payment
    this.status = 'paid';
    this.payment_details = {
      payment_id,
      payment_method,
      payment_date: new Date(),
      transaction_id
    };
  }
  
  return this.save();
};

// Instance method to check if reminder should be sent
feeSchema.methods.shouldSendReminder = function(reminderType) {
  const now = new Date();
  const daysDiff = Math.ceil((this.due_date - now) / (1000 * 60 * 60 * 24));
  
  // Check if reminder was already sent
  const alreadySent = this.reminders_sent.some(r => r.reminder_type === reminderType);
  if (alreadySent) return false;
  
  switch (reminderType) {
    case 'due_soon':
      return daysDiff <= 3 && daysDiff > 0; // 3 days before due date
    case 'overdue':
      return daysDiff < 0 && daysDiff >= -7; // Up to 7 days after due date
    case 'final_notice':
      return daysDiff < -7; // More than 7 days overdue
    default:
      return false;
  }
};

// Instance method to mark reminder as sent
feeSchema.methods.markReminderSent = function(reminderType, notificationId) {
  this.reminders_sent.push({
    reminder_type: reminderType,
    notification_id: notificationId
  });
  return this.save();
};

// Static method to find fees by organization with filters
feeSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('student_id', 'full_name email profile_picture')
    .populate('course_id', 'title')
    .populate('created_by', 'full_name')
    .sort({ due_date: -1, created_at: -1 });
};

// Static method to find overdue fees
feeSchema.statics.findOverdueFees = function(organizationId) {
  const now = new Date();
  
  return this.find({
    organization_id: organizationId,
    due_date: { $lt: now },
    status: { $in: ['pending', 'partially_paid'] },
    is_active: true
  })
  .populate('student_id', 'full_name email')
  .populate('course_id', 'title')
  .sort({ due_date: 1 });
};

// Static method to get fee statistics
feeSchema.statics.getFeeStatistics = async function(organizationId, filters = {}) {
  const matchQuery = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        avg_amount: { $avg: '$amount' }
      }
    }
  ]);
  
  const totalFees = await this.countDocuments(matchQuery);
  const totalAmount = await this.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return {
    total_fees: totalFees,
    total_amount: totalAmount[0]?.total || 0,
    by_status: stats,
    collection_rate: totalFees > 0 ? 
      (stats.find(s => s._id === 'paid')?.count || 0) / totalFees * 100 : 0
  };
};

// Static method to create bulk fees for course enrollment
feeSchema.statics.createBulkCourseFees = async function(courseId, organizationId, feeData, createdBy) {
  const Enrollment = mongoose.model('Enrollment');
  
  // Get all active enrollments for the course
  const enrollments = await Enrollment.find({
    course_id: courseId,
    organization_id: organizationId,
    status: 'active'
  });
  
  const fees = enrollments.map(enrollment => ({
    organization_id: organizationId,
    student_id: enrollment.student_id,
    course_id: courseId,
    fee_type: 'course_enrollment',
    title: feeData.title,
    description: feeData.description,
    amount: feeData.amount,
    due_date: feeData.due_date,
    academic_year: feeData.academic_year,
    semester: feeData.semester,
    created_by: createdBy
  }));
  
  return this.insertMany(fees);
};

// Pre-save middleware to update status based on due date
feeSchema.pre('save', function(next) {
  const now = new Date();
  
  // Update status to overdue if past due date and still pending
  if (this.due_date < now && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  // Apply late fee if enabled and overdue
  if (this.status === 'overdue' && this.late_fee.enabled && !this.late_fee.applied_date) {
    this.applyLateFee();
  }
  
  next();
});

// Pre-save middleware to validate organization consistency
feeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify student belongs to same organization
      const User = mongoose.model('User');
      const student = await User.findById(this.student_id);
      
      if (!student) {
        return next(new Error('Student not found'));
      }
      
      if (student.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Student must belong to the same organization'));
      }
      
      // Verify course belongs to same organization (if course_id provided)
      if (this.course_id) {
        const Course = mongoose.model('Course');
        const course = await Course.findById(this.course_id);
        
        if (!course) {
          return next(new Error('Course not found'));
        }
        
        if (course.organization_id.toString() !== this.organization_id.toString()) {
          return next(new Error('Course must belong to the same organization'));
        }
      }
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;