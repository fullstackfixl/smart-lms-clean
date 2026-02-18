/**
 * Notification Configuration
 * Centralized configuration for notification types, templates, and settings
 */

const notificationConfig = {
  // Notification types and their default settings
  types: {
    enrollment: {
      name: 'Student Enrollment',
      description: 'Triggered when a student enrolls in a course',
      channels: ['email', 'in_app'],
      priority: 'normal',
      template: 'enrollment',
      recipients: ['instructor', 'admin'],
      variables: ['studentName', 'courseName', 'enrollmentDate', 'organizationName']
    },
    
    payment_success: {
      name: 'Payment Successful',
      description: 'Triggered when a payment is successfully processed',
      channels: ['email', 'push', 'in_app'],
      priority: 'high',
      template: 'payment-success',
      recipients: ['student', 'admin', 'parent'],
      variables: ['studentName', 'courseName', 'amount', 'currency', 'paymentId', 'organizationName']
    },
    
    quiz_completion: {
      name: 'Quiz Completed',
      description: 'Triggered when a student completes a quiz',
      channels: ['push', 'in_app'],
      priority: 'normal',
      template: 'quiz-completion',
      recipients: ['student', 'parent'],
      variables: ['studentName', 'quizName', 'score', 'courseName', 'organizationName']
    },
    
    quiz_passed: {
      name: 'Quiz Passed',
      description: 'Triggered when a student passes a quiz',
      channels: ['email', 'push', 'in_app'],
      priority: 'normal',
      template: 'quiz-passed',
      recipients: ['student', 'parent'],
      variables: ['studentName', 'quizName', 'score', 'courseName', 'organizationName']
    },
    
    fee_overdue: {
      name: 'Fee Overdue',
      description: 'Triggered when a fee payment is overdue',
      channels: ['email', 'push', 'in_app'],
      priority: 'high',
      template: 'fee-overdue',
      recipients: ['student', 'parent'],
      variables: ['studentName', 'amount', 'currency', 'dueDate', 'courseName', 'organizationName']
    },
    
    high_risk_alert: {
      name: 'High Risk Alert',
      description: 'Triggered when a student is identified as high dropout risk',
      channels: ['email', 'in_app'],
      priority: 'critical',
      template: 'high-risk-alert',
      recipients: ['instructor', 'admin'],
      variables: ['studentName', 'courseName', 'riskScore', 'riskFactors', 'suggestions', 'organizationName']
    },
    
    medium_risk_alert: {
      name: 'Medium Risk Alert',
      description: 'Triggered when a student is identified as medium dropout risk',
      channels: ['in_app'],
      priority: 'normal',
      template: 'medium-risk-alert',
      recipients: ['instructor'],
      variables: ['studentName', 'courseName', 'riskScore', 'riskFactors', 'suggestions', 'organizationName']
    },
    
    live_class_starting: {
      name: 'Live Class Starting',
      description: 'Triggered 15 minutes before a live class starts',
      channels: ['push', 'in_app'],
      priority: 'high',
      template: 'live-class-starting',
      recipients: ['student'],
      variables: ['className', 'courseName', 'startTime', 'joinUrl', 'organizationName']
    },
    
    course_update: {
      name: 'Course Updated',
      description: 'Triggered when course content is updated',
      channels: ['push', 'in_app'],
      priority: 'normal',
      template: 'course-update',
      recipients: ['student'],
      variables: ['courseName', 'updateType', 'updateDescription', 'organizationName']
    },
    
    certificate_earned: {
      name: 'Certificate Earned',
      description: 'Triggered when a student earns a certificate',
      channels: ['email', 'push', 'in_app'],
      priority: 'high',
      template: 'certificate-earned',
      recipients: ['student', 'parent'],
      variables: ['studentName', 'courseName', 'certificateUrl', 'completionDate', 'organizationName']
    },
    
    attendance_marked: {
      name: 'Attendance Marked',
      description: 'Daily digest of attendance for parents',
      channels: ['email'],
      priority: 'low',
      template: 'attendance-digest',
      recipients: ['parent'],
      variables: ['studentName', 'attendanceData', 'date', 'organizationName']
    },
    
    event_rsvp: {
      name: 'Event RSVP Confirmed',
      description: 'Triggered when someone RSVPs to an event',
      channels: ['in_app'],
      priority: 'low',
      template: 'event-rsvp',
      recipients: ['organizer'],
      variables: ['eventName', 'attendeeName', 'rsvpStatus', 'organizationName']
    },
    
    system_alert: {
      name: 'System Alert',
      description: 'System-wide alerts and announcements',
      channels: ['email', 'push', 'in_app'],
      priority: 'critical',
      template: 'system-alert',
      recipients: ['admin'],
      variables: ['alertType', 'message', 'severity', 'timestamp', 'organizationName']
    }
  },

  // Channel-specific settings
  channels: {
    email: {
      enabled: true,
      rateLimits: {
        perMinute: 10,
        perHour: 100,
        perDay: 1000
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'exponential',
        initialDelay: 2000,
        maxDelay: 30000
      },
      templates: {
        defaultFrom: process.env.EMAIL_FROM || 'Smart LMS <noreply@smartlms.com>',
        defaultSubjectPrefix: '[Smart LMS]',
        templatePath: '../templates/email'
      }
    },
    
    push: {
      enabled: true,
      rateLimits: {
        perMinute: 50,
        perHour: 500,
        perDay: 5000
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000
      },
      settings: {
        sound: 'default',
        badge: true,
        ttl: 3600, // 1 hour
        priority: 'normal'
      }
    },
    
    in_app: {
      enabled: true,
      rateLimits: {
        perMinute: 100,
        perHour: 1000,
        perDay: 10000
      },
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'fixed',
        initialDelay: 1000
      },
      settings: {
        autoExpire: true,
        expireAfterDays: 30,
        markReadAfterDays: 7
      }
    }
  },

  // Priority levels and their settings
  priorities: {
    low: {
      level: 1,
      description: 'Non-urgent notifications',
      respectQuietHours: true,
      batchingAllowed: true,
      maxDelay: 3600000 // 1 hour
    },
    
    normal: {
      level: 5,
      description: 'Standard notifications',
      respectQuietHours: true,
      batchingAllowed: false,
      maxDelay: 300000 // 5 minutes
    },
    
    high: {
      level: 10,
      description: 'Important notifications',
      respectQuietHours: false,
      batchingAllowed: false,
      maxDelay: 60000 // 1 minute
    },
    
    critical: {
      level: 20,
      description: 'Critical system notifications',
      respectQuietHours: false,
      batchingAllowed: false,
      maxDelay: 0 // Immediate
    }
  },

  // Default user preferences
  defaultPreferences: {
    email: true,
    push: true,
    inApp: true,
    categories: {
      enrollment: true,
      payment_success: true,
      quiz_completion: true,
      quiz_passed: true,
      fee_overdue: true,
      high_risk_alert: true,
      medium_risk_alert: true,
      live_class_starting: true,
      course_update: true,
      certificate_earned: true,
      attendance_marked: true,
      event_rsvp: true,
      system_alert: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC'
    }
  },

  // Queue settings
  queues: {
    email: {
      concurrency: 5,
      removeOnComplete: 50,
      removeOnFail: 100,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    },
    
    push: {
      concurrency: 10,
      removeOnComplete: 50,
      removeOnFail: 100,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    },
    
    inapp: {
      concurrency: 20,
      removeOnComplete: 100,
      removeOnFail: 50,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    }
  },

  // Template variables that are always available
  globalVariables: {
    currentYear: () => new Date().getFullYear(),
    currentDate: () => new Date().toLocaleDateString(),
    currentDateTime: () => new Date().toLocaleString(),
    platformName: 'Smart LMS',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@smartlms.com',
    websiteUrl: process.env.CLIENT_URL || 'https://smartlms.com'
  },

  // Validation rules for notification data
  validation: {
    required: ['organizationId', 'type'],
    optional: ['userId', 'channels', 'priority', 'data', 'delay'],
    channels: ['email', 'push', 'in_app'],
    priorities: ['low', 'normal', 'high', 'critical']
  }
};

/**
 * Get notification configuration for a specific type
 * @param {string} type - Notification type
 * @returns {Object|null} Configuration object or null if not found
 */
function getNotificationConfig(type) {
  return notificationConfig.types[type] || null;
}

/**
 * Get channel configuration
 * @param {string} channel - Channel name
 * @returns {Object|null} Channel configuration or null if not found
 */
function getChannelConfig(channel) {
  return notificationConfig.channels[channel] || null;
}

/**
 * Get priority configuration
 * @param {string} priority - Priority level
 * @returns {Object|null} Priority configuration or null if not found
 */
function getPriorityConfig(priority) {
  return notificationConfig.priorities[priority] || null;
}

/**
 * Validate notification data
 * @param {Object} data - Notification data
 * @returns {Object} Validation result
 */
function validateNotificationData(data) {
  const errors = [];
  
  // Check required fields
  notificationConfig.validation.required.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate notification type
  if (data.type && !notificationConfig.types[data.type]) {
    errors.push(`Invalid notification type: ${data.type}`);
  }
  
  // Validate channels
  if (data.channels) {
    const invalidChannels = data.channels.filter(
      channel => !notificationConfig.validation.channels.includes(channel)
    );
    if (invalidChannels.length > 0) {
      errors.push(`Invalid channels: ${invalidChannels.join(', ')}`);
    }
  }
  
  // Validate priority
  if (data.priority && !notificationConfig.validation.priorities.includes(data.priority)) {
    errors.push(`Invalid priority: ${data.priority}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get default channels for notification type
 * @param {string} type - Notification type
 * @returns {Array} Array of default channels
 */
function getDefaultChannels(type) {
  const config = getNotificationConfig(type);
  return config ? config.channels : ['in_app'];
}

/**
 * Get default priority for notification type
 * @param {string} type - Notification type
 * @returns {string} Default priority
 */
function getDefaultPriority(type) {
  const config = getNotificationConfig(type);
  return config ? config.priority : 'normal';
}

/**
 * Check if notification should respect quiet hours
 * @param {string} priority - Notification priority
 * @returns {boolean} True if should respect quiet hours
 */
function shouldRespectQuietHours(priority) {
  const config = getPriorityConfig(priority);
  return config ? config.respectQuietHours : true;
}

module.exports = {
  config: notificationConfig,
  getNotificationConfig,
  getChannelConfig,
  getPriorityConfig,
  validateNotificationData,
  getDefaultChannels,
  getDefaultPriority,
  shouldRespectQuietHours
};