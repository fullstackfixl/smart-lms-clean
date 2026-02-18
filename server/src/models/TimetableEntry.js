const mongoose = require('mongoose');

const exceptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  replacement_scheduled: {
    type: Boolean,
    default: false
  },
  replacement_date: Date,
  replacement_time: String
}, { _id: false });

const timetableEntrySchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  day_of_week: {
    type: Number,
    required: true,
    min: 0,
    max: 6, // 0 = Sunday, 6 = Saturday
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
  duration_minutes: {
    type: Number,
    required: true,
    min: 1
  },
  room_number: {
    type: String,
    trim: true,
    maxlength: 50
  },
  building: {
    type: String,
    trim: true,
    maxlength: 100
  },
  location_details: {
    type: String,
    trim: true,
    maxlength: 200
  },
  session_type: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'exam', 'practical', 'workshop', 'other'],
    default: 'lecture'
  },
  recurring: {
    type: Boolean,
    default: true
  },
  effective_from: {
    type: Date,
    required: true,
    index: true
  },
  effective_until: {
    type: Date,
    index: true
  },
  exceptions: [exceptionSchema],
  max_capacity: {
    type: Number,
    min: 1
  },
  equipment_required: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academic_year: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', 'summer'],
    trim: true
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
timetableEntrySchema.index({ organization_id: 1, instructor_id: 1, day_of_week: 1 });
timetableEntrySchema.index({ organization_id: 1, course_id: 1, day_of_week: 1 });
timetableEntrySchema.index({ organization_id: 1, day_of_week: 1, start_time: 1 });
timetableEntrySchema.index({ organization_id: 1, room_number: 1, day_of_week: 1 });
timetableEntrySchema.index({ effective_from: 1, effective_until: 1 });

// Virtual for day name
timetableEntrySchema.virtual('day_name').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.day_of_week];
});

// Virtual for time slot display
timetableEntrySchema.virtual('time_slot').get(function() {
  return `${this.start_time} - ${this.end_time}`;
});

// Virtual for location display
timetableEntrySchema.virtual('location_display').get(function() {
  let location = '';
  if (this.room_number) location += `Room ${this.room_number}`;
  if (this.building) location += location ? `, ${this.building}` : this.building;
  if (this.location_details) location += location ? ` (${this.location_details})` : this.location_details;
  return location || 'Location TBD';
});

// Virtual for current status
timetableEntrySchema.virtual('current_status').get(function() {
  const now = new Date();
  
  if (this.effective_until && now > this.effective_until) {
    return 'expired';
  }
  
  if (now < this.effective_from) {
    return 'scheduled';
  }
  
  return 'active';
});

// Instance method to check if entry is active on a specific date
timetableEntrySchema.methods.isActiveOnDate = function(date) {
  const checkDate = new Date(date);
  
  // Check if date is within effective range
  if (checkDate < this.effective_from) return false;
  if (this.effective_until && checkDate > this.effective_until) return false;
  
  // Check if date matches day of week
  if (checkDate.getDay() !== this.day_of_week) return false;
  
  // Check if date is in exceptions
  const isException = this.exceptions.some(exception => {
    const exceptionDate = new Date(exception.date);
    return exceptionDate.toDateString() === checkDate.toDateString();
  });
  
  return !isException;
};

// Instance method to add exception
timetableEntrySchema.methods.addException = function(date, reason, replacementInfo = {}) {
  const exceptionDate = new Date(date);
  
  // Check if exception already exists
  const existingException = this.exceptions.find(exc => {
    const excDate = new Date(exc.date);
    return excDate.toDateString() === exceptionDate.toDateString();
  });
  
  if (existingException) {
    throw new Error('Exception already exists for this date');
  }
  
  const exception = {
    date: exceptionDate,
    reason,
    replacement_scheduled: replacementInfo.scheduled || false,
    replacement_date: replacementInfo.date || null,
    replacement_time: replacementInfo.time || null
  };
  
  this.exceptions.push(exception);
  return this.save();
};

// Instance method to remove exception
timetableEntrySchema.methods.removeException = function(date) {
  const exceptionDate = new Date(date);
  
  this.exceptions = this.exceptions.filter(exc => {
    const excDate = new Date(exc.date);
    return excDate.toDateString() !== exceptionDate.toDateString();
  });
  
  return this.save();
};

// Instance method to get next occurrence
timetableEntrySchema.methods.getNextOccurrence = function(fromDate = new Date()) {
  const startDate = new Date(Math.max(fromDate, this.effective_from));
  
  // Find next occurrence of this day of week
  let nextDate = new Date(startDate);
  const daysUntilNext = (this.day_of_week - nextDate.getDay() + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysUntilNext);
  
  // If it's today but time has passed, move to next week
  if (nextDate.toDateString() === startDate.toDateString()) {
    const now = new Date();
    const [hours, minutes] = this.end_time.split(':').map(Number);
    const endTime = new Date(now);
    endTime.setHours(hours, minutes, 0, 0);
    
    if (now > endTime) {
      nextDate.setDate(nextDate.getDate() + 7);
    }
  }
  
  // Check if within effective range
  if (this.effective_until && nextDate > this.effective_until) {
    return null;
  }
  
  // Skip exceptions
  while (this.exceptions.some(exc => new Date(exc.date).toDateString() === nextDate.toDateString())) {
    nextDate.setDate(nextDate.getDate() + 7);
    if (this.effective_until && nextDate > this.effective_until) {
      return null;
    }
  }
  
  return nextDate;
};

// Helper method to convert time string to minutes
timetableEntrySchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Instance method to check time overlap with another entry
timetableEntrySchema.methods.hasTimeOverlapWith = function(otherEntry) {
  if (this.day_of_week !== otherEntry.day_of_week) return false;
  
  const thisStart = this.timeToMinutes(this.start_time);
  const thisEnd = this.timeToMinutes(this.end_time);
  const otherStart = this.timeToMinutes(otherEntry.start_time);
  const otherEnd = this.timeToMinutes(otherEntry.end_time);
  
  return thisStart < otherEnd && thisEnd > otherStart;
};

// Static method to find entries by organization
timetableEntrySchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('course_id', 'title')
    .populate('instructor_id', 'full_name email')
    .populate('created_by', 'full_name')
    .sort({ day_of_week: 1, start_time: 1 });
};

// Static method to find instructor conflicts
timetableEntrySchema.statics.findInstructorConflicts = async function(instructorId, dayOfWeek, startTime, endTime, organizationId, excludeId = null) {
  const query = {
    instructor_id: instructorId,
    organization_id: organizationId,
    day_of_week: dayOfWeek,
    is_active: true
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingEntries = await this.find(query);
  
  const startMinutes = this.timeToMinutes(startTime);
  const endMinutes = this.timeToMinutes(endTime);
  
  return existingEntries.filter(entry => {
    const entryStart = this.timeToMinutes(entry.start_time);
    const entryEnd = this.timeToMinutes(entry.end_time);
    
    return startMinutes < entryEnd && endMinutes > entryStart;
  });
};

// Static method to find room conflicts
timetableEntrySchema.statics.findRoomConflicts = async function(roomNumber, building, dayOfWeek, startTime, endTime, organizationId, excludeId = null) {
  if (!roomNumber) return []; // No room specified, no conflict
  
  const query = {
    room_number: roomNumber,
    organization_id: organizationId,
    day_of_week: dayOfWeek,
    is_active: true
  };
  
  if (building) query.building = building;
  if (excludeId) query._id = { $ne: excludeId };
  
  const existingEntries = await this.find(query);
  
  const startMinutes = this.timeToMinutes(startTime);
  const endMinutes = this.timeToMinutes(endTime);
  
  return existingEntries.filter(entry => {
    const entryStart = this.timeToMinutes(entry.start_time);
    const entryEnd = this.timeToMinutes(entry.end_time);
    
    return startMinutes < entryEnd && endMinutes > entryStart;
  });
};

// Static method to suggest alternative time slots
timetableEntrySchema.statics.suggestAlternativeSlots = async function(instructorId, dayOfWeek, durationMinutes, organizationId, preferences = {}) {
  const { 
    earliest_time = '08:00', 
    latest_time = '18:00', 
    preferred_gaps = 15 // minutes between classes
  } = preferences;
  
  // Get all existing entries for instructor on this day
  const existingEntries = await this.find({
    instructor_id: instructorId,
    organization_id: organizationId,
    day_of_week: dayOfWeek,
    is_active: true
  }).sort({ start_time: 1 });
  
  const suggestions = [];
  const earliestMinutes = this.timeToMinutes(earliest_time);
  const latestMinutes = this.timeToMinutes(latest_time);
  
  // Check if we can fit before first class
  if (existingEntries.length === 0) {
    suggestions.push({
      start_time: earliest_time,
      end_time: this.minutesToTime(earliestMinutes + durationMinutes),
      reason: 'No existing classes on this day'
    });
  } else {
    const firstClassStart = this.timeToMinutes(existingEntries[0].start_time);
    if (firstClassStart - earliestMinutes >= durationMinutes + preferred_gaps) {
      suggestions.push({
        start_time: earliest_time,
        end_time: this.minutesToTime(earliestMinutes + durationMinutes),
        reason: 'Before first class'
      });
    }
    
    // Check gaps between classes
    for (let i = 0; i < existingEntries.length - 1; i++) {
      const currentEnd = this.timeToMinutes(existingEntries[i].end_time);
      const nextStart = this.timeToMinutes(existingEntries[i + 1].start_time);
      const gapDuration = nextStart - currentEnd;
      
      if (gapDuration >= durationMinutes + (preferred_gaps * 2)) {
        const suggestedStart = currentEnd + preferred_gaps;
        suggestions.push({
          start_time: this.minutesToTime(suggestedStart),
          end_time: this.minutesToTime(suggestedStart + durationMinutes),
          reason: `Between ${existingEntries[i].course_id} and ${existingEntries[i + 1].course_id}`
        });
      }
    }
    
    // Check if we can fit after last class
    const lastClassEnd = this.timeToMinutes(existingEntries[existingEntries.length - 1].end_time);
    if (latestMinutes - lastClassEnd >= durationMinutes + preferred_gaps) {
      const suggestedStart = lastClassEnd + preferred_gaps;
      suggestions.push({
        start_time: this.minutesToTime(suggestedStart),
        end_time: this.minutesToTime(suggestedStart + durationMinutes),
        reason: 'After last class'
      });
    }
  }
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
};

// Static method to get instructor workload
timetableEntrySchema.statics.getInstructorWorkload = async function(instructorId, organizationId, filters = {}) {
  const matchQuery = {
    instructor_id: instructorId,
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const workload = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$day_of_week',
        total_hours: { $sum: { $divide: ['$duration_minutes', 60] } },
        class_count: { $sum: 1 },
        courses: { $addToSet: '$course_id' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  const totalHours = workload.reduce((sum, day) => sum + day.total_hours, 0);
  const totalClasses = workload.reduce((sum, day) => sum + day.class_count, 0);
  const uniqueCourses = new Set();
  workload.forEach(day => day.courses.forEach(course => uniqueCourses.add(course.toString())));
  
  return {
    weekly_hours: Math.round(totalHours * 100) / 100,
    total_classes: totalClasses,
    unique_courses: uniqueCourses.size,
    daily_breakdown: workload.map(day => ({
      day: day._id,
      day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day._id],
      hours: Math.round(day.total_hours * 100) / 100,
      classes: day.class_count,
      courses: day.courses.length
    }))
  };
};

// Static helper method to convert minutes to time string
timetableEntrySchema.statics.minutesToTime = function(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Static helper method to convert time string to minutes
timetableEntrySchema.statics.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Pre-save middleware to validate times and calculate duration
timetableEntrySchema.pre('save', function(next) {
  // Validate that end_time is after start_time
  const startMinutes = this.timeToMinutes(this.start_time);
  const endMinutes = this.timeToMinutes(this.end_time);
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  // Calculate duration if not provided
  if (!this.duration_minutes) {
    this.duration_minutes = endMinutes - startMinutes;
  }
  
  next();
});

// Pre-save middleware to validate organization consistency
timetableEntrySchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify course belongs to same organization
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course_id);
      
      if (!course) {
        return next(new Error('Course not found'));
      }
      
      if (course.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Course must belong to the same organization'));
      }
      
      // Verify instructor belongs to same organization
      const User = mongoose.model('User');
      const instructor = await User.findById(this.instructor_id);
      
      if (!instructor) {
        return next(new Error('Instructor not found'));
      }
      
      if (instructor.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Instructor must belong to the same organization'));
      }
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);

module.exports = TimetableEntry;