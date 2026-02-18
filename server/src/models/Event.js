const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  response: {
    type: String,
    enum: ['attending', 'not_attending', 'maybe'],
    required: true
  },
  responded_at: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  waitlisted: {
    type: Boolean,
    default: false
  },
  waitlist_position: {
    type: Number,
    min: 1
  }
}, { _id: false });

const reminderSchema = new mongoose.Schema({
  reminder_time: {
    type: String,
    enum: ['24h', '1h', '15m'],
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  },
  sent_at: Date,
  notification_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }]
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  original_name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  file_type: {
    type: String,
    required: true,
    trim: true
  },
  file_size: {
    type: Number,
    min: 0
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
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
    maxlength: 2000
  },
  event_type: {
    type: String,
    enum: [
      'academic',
      'cultural',
      'sports',
      'meeting',
      'exam',
      'holiday',
      'workshop',
      'seminar',
      'conference',
      'social',
      'other'
    ],
    default: 'academic',
    index: true
  },
  event_date: {
    type: Date,
    required: true,
    index: true
  },
  start_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  end_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  all_day: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  virtual_link: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_virtual: {
    type: Boolean,
    default: false
  },
  max_attendees: {
    type: Number,
    min: 1
  },
  rsvp_enabled: {
    type: Boolean,
    default: true
  },
  rsvp_deadline: {
    type: Date,
    index: true
  },
  target_audience: [{
    type: String,
    enum: ['all', 'students', 'instructors', 'parents', 'admins', 'staff']
  }],
  course_specific: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  grade_specific: [{
    type: String,
    trim: true
  }],
  rsvps: [rsvpSchema],
  reminders: [reminderSchema],
  attachments: [attachmentSchema],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true
  },
  cancellation_reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  feedback_enabled: {
    type: Boolean,
    default: false
  },
  feedback_questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'rating', 'multiple_choice'],
      default: 'text'
    },
    options: [String], // for multiple choice
    required: {
      type: Boolean,
      default: false
    }
  }],
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
eventSchema.index({ organization_id: 1, event_date: 1, status: 1 });
eventSchema.index({ organization_id: 1, event_type: 1, event_date: 1 });
eventSchema.index({ organization_id: 1, 'rsvps.user_id': 1 });
eventSchema.index({ organization_id: 1, target_audience: 1, event_date: 1 });
eventSchema.index({ course_specific: 1, event_date: 1 });

// Virtual for total attendees
eventSchema.virtual('total_attendees').get(function() {
  return this.rsvps.filter(rsvp => rsvp.response === 'attending' && !rsvp.waitlisted).length;
});

// Virtual for waitlist count
eventSchema.virtual('waitlist_count').get(function() {
  return this.rsvps.filter(rsvp => rsvp.waitlisted).length;
});

// Virtual for maybe count
eventSchema.virtual('maybe_count').get(function() {
  return this.rsvps.filter(rsvp => rsvp.response === 'maybe').length;
});

// Virtual for not attending count
eventSchema.virtual('not_attending_count').get(function() {
  return this.rsvps.filter(rsvp => rsvp.response === 'not_attending').length;
});

// Virtual for event duration in minutes
eventSchema.virtual('duration_minutes').get(function() {
  if (this.all_day) return null;
  
  const startMinutes = this.timeToMinutes(this.start_time);
  const endMinutes = this.timeToMinutes(this.end_time);
  return endMinutes - startMinutes;
});

// Virtual for event status based on date and time
eventSchema.virtual('current_status').get(function() {
  const now = new Date();
  const eventDateTime = new Date(this.event_date);
  
  if (this.status === 'cancelled' || this.status === 'postponed') {
    return this.status;
  }
  
  if (!this.all_day) {
    const [startHours, startMinutes] = this.start_time.split(':').map(Number);
    const [endHours, endMinutes] = this.end_time.split(':').map(Number);
    
    const startDateTime = new Date(eventDateTime);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(eventDateTime);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    
    if (now >= startDateTime && now <= endDateTime) {
      return 'ongoing';
    } else if (now > endDateTime) {
      return 'completed';
    }
  } else {
    // All day event
    const eventDateOnly = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (nowDateOnly.getTime() === eventDateOnly.getTime()) {
      return 'ongoing';
    } else if (nowDateOnly > eventDateOnly) {
      return 'completed';
    }
  }
  
  return 'scheduled';
});

// Virtual for RSVP summary
eventSchema.virtual('rsvp_summary').get(function() {
  return {
    total_responses: this.rsvps.length,
    attending: this.total_attendees,
    maybe: this.maybe_count,
    not_attending: this.not_attending_count,
    waitlisted: this.waitlist_count,
    response_rate: this.max_attendees ? 
      Math.round((this.rsvps.length / this.max_attendees) * 100) : null
  };
});

// Helper method to convert time string to minutes
eventSchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Instance method to add RSVP
eventSchema.methods.addRSVP = function(userId, response, notes = '') {
  // Check if RSVP deadline has passed
  if (this.rsvp_deadline && new Date() > this.rsvp_deadline) {
    throw new Error('RSVP deadline has passed');
  }
  
  // Check if event has already occurred
  if (this.current_status === 'completed') {
    throw new Error('Cannot RSVP to a completed event');
  }
  
  // Remove existing RSVP from same user
  this.rsvps = this.rsvps.filter(rsvp => rsvp.user_id.toString() !== userId.toString());
  
  const rsvp = {
    user_id: userId,
    response,
    notes,
    responded_at: new Date()
  };
  
  // Check capacity and waitlist if needed
  if (response === 'attending' && this.max_attendees) {
    const currentAttendees = this.total_attendees;
    
    if (currentAttendees >= this.max_attendees) {
      rsvp.waitlisted = true;
      rsvp.waitlist_position = this.waitlist_count + 1;
    }
  }
  
  this.rsvps.push(rsvp);
  return this.save();
};

// Instance method to update RSVP
eventSchema.methods.updateRSVP = function(userId, response, notes = '') {
  const existingRSVP = this.rsvps.find(rsvp => rsvp.user_id.toString() === userId.toString());
  
  if (!existingRSVP) {
    throw new Error('RSVP not found');
  }
  
  // Check if RSVP deadline has passed
  if (this.rsvp_deadline && new Date() > this.rsvp_deadline) {
    throw new Error('RSVP deadline has passed');
  }
  
  const wasAttending = existingRSVP.response === 'attending' && !existingRSVP.waitlisted;
  
  existingRSVP.response = response;
  existingRSVP.notes = notes;
  existingRSVP.responded_at = new Date();
  
  // Handle capacity changes
  if (response === 'attending' && this.max_attendees) {
    const currentAttendees = this.total_attendees;
    
    if (!wasAttending && currentAttendees >= this.max_attendees) {
      existingRSVP.waitlisted = true;
      existingRSVP.waitlist_position = this.waitlist_count + 1;
    } else if (existingRSVP.waitlisted) {
      existingRSVP.waitlisted = false;
      delete existingRSVP.waitlist_position;
    }
  } else if (response !== 'attending') {
    existingRSVP.waitlisted = false;
    delete existingRSVP.waitlist_position;
    
    // Move someone from waitlist if space opened up
    if (wasAttending) {
      this.processWaitlist();
    }
  }
  
  return this.save();
};

// Instance method to process waitlist
eventSchema.methods.processWaitlist = function() {
  if (!this.max_attendees) return;
  
  const currentAttendees = this.total_attendees;
  const availableSpots = this.max_attendees - currentAttendees;
  
  if (availableSpots > 0) {
    const waitlistedRSVPs = this.rsvps
      .filter(rsvp => rsvp.waitlisted && rsvp.response === 'attending')
      .sort((a, b) => a.waitlist_position - b.waitlist_position);
    
    const toPromote = waitlistedRSVPs.slice(0, availableSpots);
    
    toPromote.forEach(rsvp => {
      rsvp.waitlisted = false;
      delete rsvp.waitlist_position;
    });
    
    // Update waitlist positions for remaining
    const remaining = waitlistedRSVPs.slice(availableSpots);
    remaining.forEach((rsvp, index) => {
      rsvp.waitlist_position = index + 1;
    });
  }
};

// Instance method to cancel event
eventSchema.methods.cancelEvent = function(reason, notifyAttendees = true) {
  this.status = 'cancelled';
  this.cancellation_reason = reason;
  
  if (notifyAttendees) {
    // This would trigger notifications to all RSVPed users
    // Implementation would depend on notification service
  }
  
  return this.save();
};

// Instance method to add attachment
eventSchema.methods.addAttachment = function(attachmentData) {
  const attachment = {
    filename: attachmentData.filename,
    original_name: attachmentData.original_name,
    url: attachmentData.url,
    file_type: attachmentData.file_type,
    file_size: attachmentData.file_size,
    uploaded_by: attachmentData.uploaded_by
  };
  
  this.attachments.push(attachment);
  return this.save();
};

// Instance method to check if user can RSVP
eventSchema.methods.canUserRSVP = function(user) {
  // Check if event is active and not completed
  if (!this.is_active || this.current_status === 'completed') {
    return { can_rsvp: false, reason: 'Event is not available for RSVP' };
  }
  
  // Check if RSVP is enabled
  if (!this.rsvp_enabled) {
    return { can_rsvp: false, reason: 'RSVP is not enabled for this event' };
  }
  
  // Check RSVP deadline
  if (this.rsvp_deadline && new Date() > this.rsvp_deadline) {
    return { can_rsvp: false, reason: 'RSVP deadline has passed' };
  }
  
  // Check target audience
  if (this.target_audience.length > 0 && !this.target_audience.includes('all')) {
    if (!this.target_audience.includes(user.role)) {
      return { can_rsvp: false, reason: 'This event is not open to your user type' };
    }
  }
  
  // Check course-specific events
  if (this.course_specific) {
    // Would need to check if user is enrolled in the course
    // This would require additional logic based on enrollment
  }
  
  return { can_rsvp: true };
};

// Static method to find events by organization
eventSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('created_by', 'full_name email')
    .populate('course_specific', 'title')
    .populate('rsvps.user_id', 'full_name email')
    .sort({ event_date: 1, start_time: 1 });
};

// Static method to find upcoming events
eventSchema.statics.findUpcomingEvents = function(organizationId, days = 30, filters = {}) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const query = {
    organization_id: organizationId,
    event_date: { $gte: now, $lte: futureDate },
    status: { $in: ['scheduled', 'ongoing'] },
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('created_by', 'full_name')
    .populate('course_specific', 'title')
    .sort({ event_date: 1, start_time: 1 });
};

// Static method to find events needing reminders
eventSchema.statics.findEventsNeedingReminders = function() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
  
  return this.find({
    is_active: true,
    status: 'scheduled',
    $or: [
      {
        event_date: { $lte: in24Hours, $gte: now },
        'reminders.reminder_time': '24h',
        'reminders.sent': false
      },
      {
        event_date: { $lte: in1Hour, $gte: now },
        'reminders.reminder_time': '1h',
        'reminders.sent': false
      },
      {
        event_date: { $lte: in15Minutes, $gte: now },
        'reminders.reminder_time': '15m',
        'reminders.sent': false
      }
    ]
  });
};

// Static method to get event statistics
eventSchema.statics.getEventStatistics = async function(organizationId, filters = {}) {
  const matchQuery = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          type: '$event_type',
          status: '$status'
        },
        count: { $sum: 1 },
        avg_attendees: { $avg: { $size: { $filter: { input: '$rsvps', cond: { $eq: ['$$this.response', 'attending'] } } } } }
      }
    }
  ]);
  
  const totalEvents = await this.countDocuments(matchQuery);
  
  return {
    total_events: totalEvents,
    by_type_and_status: stats,
    upcoming_events: await this.countDocuments({
      ...matchQuery,
      event_date: { $gte: new Date() },
      status: 'scheduled'
    })
  };
};

// Pre-save middleware to validate times
eventSchema.pre('save', function(next) {
  if (!this.all_day) {
    const startMinutes = this.timeToMinutes(this.start_time);
    const endMinutes = this.timeToMinutes(this.end_time);
    
    if (endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time'));
    }
  }
  
  // Set default reminders if not provided
  if (this.isNew && this.reminders.length === 0) {
    this.reminders = [
      { reminder_time: '24h' },
      { reminder_time: '1h' }
    ];
  }
  
  next();
});

// Pre-save middleware to validate organization consistency
eventSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify course belongs to same organization (if course_specific)
      if (this.course_specific) {
        const Course = mongoose.model('Course');
        const course = await Course.findById(this.course_specific);
        
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

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;