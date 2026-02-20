const mongoose = require('mongoose');

// Generate UUID v4 compatible string
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const attendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  join_time: {
    type: Date,
    required: true
  },
  leave_time: {
    type: Date
  },
  duration_minutes: {
    type: Number,
    min: 0,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const liveClassSchema = new mongoose.Schema({
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
  scheduled_date: {
    type: Date,
    required: true,
    index: true
  },
  start_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  duration_minutes: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  meeting_room_id: {
    type: String,
    required: false
  },
  meeting_url: {
    type: String,
    required: false
  },
  recording_enabled: {
    type: Boolean,
    default: false
  },
  recording: {
    url: {
      type: String,
      trim: true
    },
    file_path: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['not_started', 'recording', 'processing', 'completed', 'failed'],
      default: 'not_started'
    },
    duration_minutes: {
      type: Number,
      min: 0
    },
    file_size_bytes: {
      type: Number,
      min: 0
    },
    started_at: {
      type: Date
    },
    completed_at: {
      type: Date
    },
    access_permissions: {
      instructor_only: {
        type: Boolean,
        default: true
      },
      enrolled_students: {
        type: Boolean,
        default: false
      },
      organization_admins: {
        type: Boolean,
        default: true
      }
    },
    download_count: {
      type: Number,
      default: 0
    },
    last_accessed: {
      type: Date
    }
  },
  max_participants: {
    type: Number,
    default: 50,
    min: 1,
    max: 200
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  attendance: [attendanceSchema],
  timezone: {
    type: String,
    default: 'UTC'
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
liveClassSchema.index({ organization_id: 1, course_id: 1 });
liveClassSchema.index({ organization_id: 1, scheduled_date: 1 });
liveClassSchema.index({ organization_id: 1, instructor_id: 1 });
liveClassSchema.index({ organization_id: 1, status: 1 });
liveClassSchema.index({ meeting_room_id: 1 }, { unique: true });

// Virtual for end time calculation
liveClassSchema.virtual('end_time').get(function () {
  if (!this.start_time || !this.duration_minutes) return null;

  const [hours, minutes] = this.start_time.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + this.duration_minutes;

  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;

  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
});

// Virtual for total attendance count
liveClassSchema.virtual('total_attendees').get(function () {
  return this.attendance ? this.attendance.length : 0;
});

// Virtual for current participants (joined but not left)
liveClassSchema.virtual('current_participants').get(function () {
  if (!this.attendance) return 0;
  return this.attendance.filter(att => att.is_active && !att.leave_time).length;
});

// Instance method to check if user can access recording
liveClassSchema.methods.canAccessRecording = async function (user) {
  // Check if recording exists and is completed
  if (!this.recording.url || this.recording.status !== 'completed') {
    return { canAccess: false, reason: 'recording_not_available' };
  }

  // Check organization access
  if (this.organization_id.toString() !== user.organization_id.toString()) {
    return { canAccess: false, reason: 'organization_mismatch' };
  }

  // Check if user is admin - always has access
  if (user.role === 'admin' && this.recording.access_permissions.organization_admins) {
    return { canAccess: true, reason: 'admin_access' };
  }

  // Check if user is instructor - has access if instructor_only is true
  if (this.instructor_id.toString() === user._id.toString() && this.recording.access_permissions.instructor_only) {
    return { canAccess: true, reason: 'instructor_access' };
  }

  // Check if enrolled students can access
  if (this.recording.access_permissions.enrolled_students) {
    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findOne({
      student_id: user._id,
      course_id: this.course_id,
      organization_id: user.organization_id,
      status: 'active'
    });

    if (enrollment) {
      return { canAccess: true, reason: 'enrolled_student_access' };
    }
  }

  return { canAccess: false, reason: 'insufficient_permissions' };
};

// Instance method to start recording
liveClassSchema.methods.startRecording = function () {
  if (!this.recording_enabled) {
    return { success: false, message: 'Recording not enabled for this class' };
  }

  if (this.recording.status === 'recording') {
    return { success: false, message: 'Recording already in progress' };
  }

  this.recording.status = 'recording';
  this.recording.started_at = new Date();

  return { success: true, message: 'Recording started' };
};

// Instance method to complete recording
liveClassSchema.methods.completeRecording = function (recordingData = {}) {
  if (this.recording.status !== 'recording') {
    return { success: false, message: 'No active recording to complete' };
  }

  this.recording.status = 'processing';
  this.recording.completed_at = new Date();

  if (recordingData.url) this.recording.url = recordingData.url;
  if (recordingData.file_path) this.recording.file_path = recordingData.file_path;
  if (recordingData.file_size_bytes) this.recording.file_size_bytes = recordingData.file_size_bytes;

  // Calculate duration if not provided
  if (this.recording.started_at && !recordingData.duration_minutes) {
    this.recording.duration_minutes = Math.round(
      (this.recording.completed_at - this.recording.started_at) / (1000 * 60)
    );
  } else if (recordingData.duration_minutes) {
    this.recording.duration_minutes = recordingData.duration_minutes;
  }

  return { success: true, message: 'Recording completed and processing' };
};

// Instance method to mark recording as ready
liveClassSchema.methods.markRecordingReady = function () {
  if (this.recording.status !== 'processing') {
    return { success: false, message: 'Recording not in processing state' };
  }

  this.recording.status = 'completed';
  return { success: true, message: 'Recording is now available' };
};

// Instance method to mark recording as failed
liveClassSchema.methods.markRecordingFailed = function (error = null) {
  this.recording.status = 'failed';
  if (error) {
    this.recording.error_message = error;
  }
  return { success: true, message: 'Recording marked as failed' };
};

// Instance method to track recording access
liveClassSchema.methods.trackRecordingAccess = function () {
  this.recording.download_count = (this.recording.download_count || 0) + 1;
  this.recording.last_accessed = new Date();
  return this.save();
};
liveClassSchema.methods.canUserAccess = async function (user) {
  // Check if user belongs to same organization
  if (this.organization_id.toString() !== user.organization_id.toString()) {
    return { canAccess: false, reason: 'organization_mismatch' };
  }

  // Check if user is instructor or admin
  if (user.role === 'admin' || this.instructor_id.toString() === user._id.toString()) {
    return { canAccess: true, reason: 'instructor_access' };
  }

  // Check if user is enrolled in the course
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    student_id: user._id,
    course_id: this.course_id,
    organization_id: user.organization_id,
    status: 'active'
  });

  if (!enrollment) {
    return { canAccess: false, reason: 'not_enrolled' };
  }

  return { canAccess: true, reason: 'enrolled' };
};

// Instance method to check if class is currently live
liveClassSchema.methods.isCurrentlyLive = function () {
  const now = new Date();
  const classDate = new Date(this.scheduled_date);

  // Set the start time
  const [hours, minutes] = this.start_time.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);

  // Calculate end time
  const endTime = new Date(classDate.getTime() + (this.duration_minutes * 60 * 1000));

  return now >= classDate && now <= endTime && this.status === 'live';
};

// Instance method to check if user can join now
liveClassSchema.methods.canJoinNow = function () {
  const now = new Date();
  const classDate = new Date(this.scheduled_date);

  // Set the start time
  const [hours, minutes] = this.start_time.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);

  // Allow joining 10 minutes before and during the class
  const joinWindow = new Date(classDate.getTime() - (10 * 60 * 1000));
  const endTime = new Date(classDate.getTime() + (this.duration_minutes * 60 * 1000));

  return now >= joinWindow && now <= endTime && this.status !== 'cancelled';
};

// Instance method to add attendance record
liveClassSchema.methods.addAttendance = function (studentId, joinTime = new Date()) {
  // Check if student already has an active attendance record
  const existingAttendance = this.attendance.find(
    att => att.student_id.toString() === studentId.toString() && att.is_active && !att.leave_time
  );

  if (existingAttendance) {
    return { success: false, message: 'Student already joined' };
  }

  // Check capacity
  if (this.current_participants >= this.max_participants) {
    return { success: false, message: 'Class is at maximum capacity' };
  }

  this.attendance.push({
    student_id: studentId,
    join_time: joinTime,
    is_active: true
  });

  return { success: true, message: 'Attendance recorded' };
};

// Instance method to mark student as left
liveClassSchema.methods.markStudentLeft = function (studentId, leaveTime = new Date()) {
  const attendance = this.attendance.find(
    att => att.student_id.toString() === studentId.toString() && att.is_active && !att.leave_time
  );

  if (!attendance) {
    return { success: false, message: 'Student not found in attendance' };
  }

  attendance.leave_time = leaveTime;
  attendance.duration_minutes = Math.round((leaveTime - attendance.join_time) / (1000 * 60));

  return { success: true, message: 'Leave time recorded' };
};

// Static method to find live classes by course with organization isolation
liveClassSchema.statics.findByCourse = function (courseId, organizationId, options = {}) {
  const query = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options).sort({ scheduled_date: 1 });
};

// Static method to find upcoming live classes
liveClassSchema.statics.findUpcoming = function (organizationId, limit = 10) {
  const now = new Date();

  return this.find({
    organization_id: organizationId,
    scheduled_date: { $gte: now },
    status: { $in: ['scheduled', 'live'] },
    is_active: true
  })
    .sort({ scheduled_date: 1 })
    .limit(limit)
    .populate('course_id', 'title')
    .populate('instructor_id', 'full_name email');
};

// Static method to find live classes by instructor
liveClassSchema.statics.findByInstructor = function (instructorId, organizationId, options = {}) {
  const query = {
    instructor_id: instructorId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options).sort({ scheduled_date: -1 });
};

// Pre-save middleware to validate organization consistency
liveClassSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('course_id') || this.isModified('instructor_id')) {
    try {
      // Verify course exists
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course_id);

      if (!course) {
        console.error('❌ [LiveClass Pre-Save] Course not found:', this.course_id);
        return next(new Error('Course not found'));
      }

      console.log('🔍 [LiveClass Pre-Save] Validating organization consistency:', {
        liveClassOrgId: this.organization_id?.toString(),
        courseOrgId: course.organization_id?.toString(),
        courseTitle: course.title,
        instructorId: this.instructor_id?.toString()
      });

      // Handle null organization_id for public courses - skip validation
      if (!course.organization_id || !this.organization_id) {
        console.warn('⚠️  [LiveClass Pre-Save] Null organization_id detected, skipping org validation');
        // Continue without organization validation for public courses
      } else {
        // Verify course belongs to same organization
        const courseOrgId = course.organization_id ? course.organization_id.toString() : null;
        const liveClassOrgId = this.organization_id ? (this.organization_id._id || this.organization_id).toString() : null;

        if (courseOrgId && liveClassOrgId && courseOrgId !== liveClassOrgId) {
          console.error('❌ [LiveClass Pre-Save] Organization mismatch:', {
            courseOrgId,
            liveClassOrgId,
            courseTitle: course.title
          });
          return next(new Error('Course must belong to the same organization'));
        }
      }

      // Verify instructor exists
      const User = mongoose.model('User');
      const instructor = await User.findById(this.instructor_id);

      if (!instructor) {
        console.error('❌ [LiveClass Pre-Save] Instructor not found:', this.instructor_id);
        return next(new Error('Instructor not found'));
      }

      console.log('🔍 [LiveClass Pre-Save] Instructor details:', {
        instructorId: instructor._id.toString(),
        instructorOrgId: instructor.organization_id?.toString(),
        instructorRole: instructor.role,
        instructorName: instructor.name
      });

      // Verify instructor belongs to same organization (if org is set)
      if (instructor.organization_id && this.organization_id) {
        const instructorOrgId = instructor.organization_id.toString();
        const liveClassOrgId = (this.organization_id._id || this.organization_id).toString();

        if (instructorOrgId !== liveClassOrgId) {
          console.error('❌ [LiveClass Pre-Save] Instructor organization mismatch:', {
            instructorOrgId,
            liveClassOrgId,
            instructorName: instructor.name
          });
          return next(new Error('Instructor must belong to the same organization'));
        }
      }

      // Verify instructor has instructor, org_admin, or platform_admin role
      if (!['instructor', 'org_admin', 'admin', 'platform_admin', 'platformAdmin'].includes(instructor.role)) {
        console.error('❌ [LiveClass Pre-Save] Invalid instructor role:', instructor.role);
        return next(new Error('User must be an instructor or admin to create live classes'));
      }

      console.log('✅ [LiveClass Pre-Save] Validation passed');

    } catch (error) {
      console.error('❌ [LiveClass Pre-Save] Validation error:', error);
      return next(error);
    }
  }

  // Generate meeting URL if not provided
  if (this.isNew) {
    if (!this.meeting_room_id) {
      this.meeting_room_id = `room-${Date.now()}-${generateUUID().substring(0, 8)}`;
    }
    if (!this.meeting_url) {
      const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
      this.meeting_url = `https://${jitsiDomain}/${this.meeting_room_id}`;
    }
    console.log('✅ [LiveClass Pre-Save] Meeting URL generated:', this.meeting_url);
  }

  next();
});

// Pre-save middleware to validate scheduled date and time
liveClassSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('scheduled_date') || this.isModified('start_time')) {
    // Validate start_time format
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(this.start_time)) {
      return next(new Error('Invalid start_time format. Use HH:MM format'));
    }
  }

  next();
});

const LiveClass = mongoose.model('LiveClass', liveClassSchema);

module.exports = LiveClass;