const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'high_risk_alert',
      'medium_risk_alert',
      'course_completion',
      'quiz_failed',
      'live_class_reminder',
      'live_class_started',
      'certificate_issued',
      'general'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'read', 'dismissed'],
    default: 'pending',
    index: true
  },
  channels: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sent_at: Date,
      error: String
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sent_at: Date,
      error: String
    },
    in_app: {
      enabled: {
        type: Boolean,
        default: true
      },
      read: {
        type: Boolean,
        default: false
      },
      read_at: Date
    }
  },
  scheduled_for: {
    type: Date,
    index: true
  },
  expires_at: {
    type: Date,
    index: true
  },
  action_url: {
    type: String,
    trim: true
  },
  action_text: {
    type: String,
    trim: true,
    maxlength: 50
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
notificationSchema.index({ organization_id: 1, recipient_id: 1, status: 1 });
notificationSchema.index({ organization_id: 1, type: 1, priority: 1 });
notificationSchema.index({ recipient_id: 1, status: 1, created_at: -1 });
notificationSchema.index({ scheduled_for: 1, status: 1 });


// Virtual for checking if notification is overdue
notificationSchema.virtual('is_overdue').get(function () {
  return this.scheduled_for && this.scheduled_for < new Date() && this.status === 'pending';
});

// Virtual for checking if notification is expired
notificationSchema.virtual('is_expired').get(function () {
  return this.expires_at && this.expires_at < new Date();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = 'read';
  this.channels.in_app.read = true;
  this.channels.in_app.read_at = new Date();
  return this.save();
};

// Instance method to mark as dismissed
notificationSchema.methods.dismiss = function () {
  this.status = 'dismissed';
  return this.save();
};

// Instance method to mark email as sent
notificationSchema.methods.markEmailSent = function (error = null) {
  this.channels.email.sent = !error;
  this.channels.email.sent_at = new Date();
  if (error) {
    this.channels.email.error = error;
  }

  // Update overall status if all enabled channels are sent
  if (this.areAllChannelsSent()) {
    this.status = 'sent';
  }

  return this.save();
};

// Instance method to mark push as sent
notificationSchema.methods.markPushSent = function (error = null) {
  this.channels.push.sent = !error;
  this.channels.push.sent_at = new Date();
  if (error) {
    this.channels.push.error = error;
  }

  // Update overall status if all enabled channels are sent
  if (this.areAllChannelsSent()) {
    this.status = 'sent';
  }

  return this.save();
};

// Helper method to check if all enabled channels are sent
notificationSchema.methods.areAllChannelsSent = function () {
  const emailSent = !this.channels.email.enabled || this.channels.email.sent;
  const pushSent = !this.channels.push.enabled || this.channels.push.sent;
  return emailSent && pushSent;
};

// Static method to find notifications for user
notificationSchema.statics.findForUser = function (userId, organizationId, filters = {}) {
  const query = {
    recipient_id: userId,
    organization_id: organizationId,
    is_active: true,
    ...filters
  };

  return this.find(query)
    .populate('sender_id', 'full_name email')
    .sort({ priority: -1, created_at: -1 });
};

// Static method to find pending notifications
notificationSchema.statics.findPending = function (organizationId = null) {
  const query = {
    status: 'pending',
    is_active: true,
    $or: [
      { scheduled_for: { $lte: new Date() } },
      { scheduled_for: { $exists: false } }
    ]
  };

  if (organizationId) {
    query.organization_id = organizationId;
  }

  return this.find(query)
    .populate('recipient_id', 'full_name email preferences.notifications')
    .sort({ priority: -1, created_at: 1 });
};

// Static method to create high-risk alert notification
notificationSchema.statics.createHighRiskAlert = function (data) {
  const {
    organizationId,
    recipientId,
    studentId,
    studentName,
    courseId,
    courseTitle,
    riskScore,
    suggestions = []
  } = data;

  return this.create({
    organization_id: organizationId,
    recipient_id: recipientId,
    type: 'high_risk_alert',
    title: `High Risk Alert: ${studentName}`,
    message: `Student ${studentName} in course "${courseTitle}" has a high dropout risk (${riskScore}%). Immediate attention required.`,
    data: {
      student_id: studentId,
      student_name: studentName,
      course_id: courseId,
      course_title: courseTitle,
      risk_score: riskScore,
      suggestions: suggestions.slice(0, 3)
    },
    priority: 'urgent',
    action_url: `/dashboard/analytics/student/${studentId}/course/${courseId}`,
    action_text: 'View Details',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
};

// Static method to create medium-risk alert notification
notificationSchema.statics.createMediumRiskAlert = function (data) {
  const {
    organizationId,
    recipientId,
    studentId,
    studentName,
    courseId,
    courseTitle,
    riskScore,
    suggestions = []
  } = data;

  return this.create({
    organization_id: organizationId,
    recipient_id: recipientId,
    type: 'medium_risk_alert',
    title: `Medium Risk Alert: ${studentName}`,
    message: `Student ${studentName} in course "${courseTitle}" shows medium dropout risk (${riskScore}%). Consider providing additional support.`,
    data: {
      student_id: studentId,
      student_name: studentName,
      course_id: courseId,
      course_title: courseTitle,
      risk_score: riskScore,
      suggestions: suggestions.slice(0, 2)
    },
    priority: 'medium',
    action_url: `/dashboard/analytics/student/${studentId}/course/${courseId}`,
    action_text: 'View Details',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      expires_at: { $lt: new Date() },
      is_active: true
    },
    {
      is_active: false,
      updated_at: new Date()
    }
  );

  return result.modifiedCount;
};

// Pre-save middleware to validate organization consistency
notificationSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Verify recipient belongs to same organization
      const User = mongoose.model('User');
      const recipient = await User.findById(this.recipient_id);

      if (!recipient) {
        return next(new Error('Recipient not found'));
      }

      if (recipient.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Recipient must belong to the same organization'));
      }

    } catch (error) {
      return next(error);
    }
  }

  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;