const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  marked_at: {
    type: Date,
    default: Date.now
  },
  late_minutes: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  marked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  auto_marked: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  organizationType: {
    type: String,
    enum: ['college', 'school', 'coaching', 'corporate', 'university'],
    default: 'college',
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false, // Optional for backward compatibility
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    index: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    index: true
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session_date: {
    type: Date,
    required: true,
    index: true
  },
  session_type: {
    type: String,
    enum: ['regular_class', 'live_class', 'lab_session', 'exam', 'tutorial', 'seminar', 'other'],
    default: 'regular_class'
  },
  session_title: {
    type: String,
    trim: true,
    maxlength: 200
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
  total_duration_minutes: {
    type: Number,
    required: true,
    min: 1
  },
  attendance_records: [attendanceRecordSchema],
  auto_marked: {
    type: Boolean,
    default: false
  },
  live_class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveClass'
  },
  late_marking_reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  topic_covered: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  homework_assigned: {
    type: String,
    trim: true,
    maxlength: 1000
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
attendanceSchema.index({ organization_id: 1, course_id: 1, session_date: -1 });
attendanceSchema.index({ organization_id: 1, subjectId: 1, session_date: -1 });
attendanceSchema.index({ organization_id: 1, 'attendance_records.student_id': 1 });
attendanceSchema.index({ course_id: 1, session_date: -1 });
attendanceSchema.index({ subjectId: 1, session_date: -1 });
attendanceSchema.index({ instructor_id: 1, session_date: -1 });
attendanceSchema.index({ organization_id: 1, session_date: -1 });

// Unique constraint to prevent duplicate sessions
attendanceSchema.index({
  subjectId: 1,
  session_date: 1,
  start_time: 1
}, {
  unique: true,
  partialFilterExpression: { subjectId: { $exists: true } }
});
attendanceSchema.index({
  course_id: 1,
  session_date: 1,
  start_time: 1
}, {
  unique: true,
  partialFilterExpression: { course_id: { $exists: true } }
});

// Virtual for total students
attendanceSchema.virtual('total_students').get(function () {
  return this.attendance_records.length;
});

// Virtual for present count
attendanceSchema.virtual('present_count').get(function () {
  return this.attendance_records.filter(record => record.status === 'present').length;
});

// Virtual for absent count
attendanceSchema.virtual('absent_count').get(function () {
  return this.attendance_records.filter(record => record.status === 'absent').length;
});

// Virtual for late count
attendanceSchema.virtual('late_count').get(function () {
  return this.attendance_records.filter(record => record.status === 'late').length;
});

// Virtual for attendance percentage
attendanceSchema.virtual('attendance_percentage').get(function () {
  if (this.total_students === 0) return 0;
  return Math.round((this.present_count / this.total_students) * 100);
});

// Virtual for session summary
attendanceSchema.virtual('session_summary').get(function () {
  return {
    total_students: this.total_students,
    present: this.present_count,
    absent: this.absent_count,
    late: this.late_count,
    excused: this.attendance_records.filter(r => r.status === 'excused').length,
    attendance_percentage: this.attendance_percentage
  };
});

// Instance method to mark attendance for a student
attendanceSchema.methods.markStudentAttendance = function (studentId, status, options = {}) {
  const { notes, late_minutes = 0, marked_by, auto_marked = false } = options;

  // Find existing record
  const existingIndex = this.attendance_records.findIndex(
    record => record.student_id.toString() === studentId.toString()
  );

  const attendanceData = {
    student_id: studentId,
    status,
    marked_at: new Date(),
    late_minutes: status === 'late' ? late_minutes : 0,
    notes: notes || '',
    marked_by,
    auto_marked
  };

  if (existingIndex >= 0) {
    // Update existing record
    this.attendance_records[existingIndex] = attendanceData;
  } else {
    // Add new record
    this.attendance_records.push(attendanceData);
  }

  return this.save();
};

// Instance method to bulk mark attendance
attendanceSchema.methods.bulkMarkAttendance = function (attendanceData, markedBy) {
  attendanceData.forEach(({ student_id, status, notes, late_minutes }) => {
    const existingIndex = this.attendance_records.findIndex(
      record => record.student_id.toString() === student_id.toString()
    );

    const recordData = {
      student_id,
      status,
      marked_at: new Date(),
      late_minutes: status === 'late' ? (late_minutes || 0) : 0,
      notes: notes || '',
      marked_by: markedBy,
      auto_marked: false
    };

    if (existingIndex >= 0) {
      this.attendance_records[existingIndex] = recordData;
    } else {
      this.attendance_records.push(recordData);
    }
  });

  return this.save();
};

// Instance method to get student attendance status
attendanceSchema.methods.getStudentAttendance = function (studentId) {
  return this.attendance_records.find(
    record => record.student_id.toString() === studentId.toString()
  );
};

// Instance method to auto-mark from live class
attendanceSchema.methods.autoMarkFromLiveClass = async function (liveClassId) {
  const LiveClass = mongoose.model('LiveClass');

  const liveClass = await LiveClass.findById(liveClassId);
  if (!liveClass || !liveClass.attendance || liveClass.attendance.length === 0) {
    return false;
  }

  // Mark students who attended live class as present
  liveClass.attendance.forEach(attendanceRecord => {
    if (attendanceRecord.duration_minutes > 0) {
      this.markStudentAttendance(
        attendanceRecord.student_id,
        attendanceRecord.duration_minutes >= (this.total_duration_minutes * 0.5) ? 'present' : 'late',
        {
          notes: `Auto-marked from live class (${attendanceRecord.duration_minutes} minutes)`,
          late_minutes: attendanceRecord.duration_minutes < (this.total_duration_minutes * 0.5) ?
            (this.total_duration_minutes - attendanceRecord.duration_minutes) : 0,
          auto_marked: true
        }
      );
    }
  });

  this.auto_marked = true;
  this.live_class_id = liveClassId;

  return this.save();
};

// Static method to find attendance by organization
attendanceSchema.statics.findByOrganization = function (organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };

  return this.find(query)
    .populate('course_id', 'title')
    .populate('instructor_id', 'full_name')
    .populate('attendance_records.student_id', 'full_name email')
    .sort({ session_date: -1, start_time: -1 });
};

// Static method to get student attendance summary
attendanceSchema.statics.getStudentAttendanceSummary = async function (studentId, organizationId, filters = {}) {
  const matchQuery = {
    organization_id: organizationId,
    'attendance_records.student_id': studentId,
    is_active: true,
    ...filters
  };

  const attendanceData = await this.aggregate([
    { $match: matchQuery },
    { $unwind: '$attendance_records' },
    { $match: { 'attendance_records.student_id': studentId } },
    {
      $group: {
        _id: '$attendance_records.status',
        count: { $sum: 1 },
        sessions: {
          $push: {
            session_date: '$session_date',
            course_id: '$course_id',
            session_title: '$session_title',
            status: '$attendance_records.status',
            late_minutes: '$attendance_records.late_minutes',
            notes: '$attendance_records.notes'
          }
        }
      }
    }
  ]);

  const totalSessions = await this.countDocuments({
    organization_id: organizationId,
    'attendance_records.student_id': studentId,
    is_active: true,
    ...filters
  });

  const summary = {
    total_sessions: totalSessions,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendance_percentage: 0
  };

  attendanceData.forEach(item => {
    summary[item._id] = item.count;
  });

  if (totalSessions > 0) {
    summary.attendance_percentage = Math.round(((summary.present + summary.late) / totalSessions) * 100);
  }

  return summary;
};

// Static method to get course attendance statistics
attendanceSchema.statics.getCourseAttendanceStats = async function (courseId, organizationId, dateRange = {}) {
  const matchQuery = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  };

  if (dateRange.start) matchQuery.session_date = { $gte: dateRange.start };
  if (dateRange.end) {
    matchQuery.session_date = matchQuery.session_date || {};
    matchQuery.session_date.$lte = dateRange.end;
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    { $unwind: '$attendance_records' },
    {
      $group: {
        _id: {
          student_id: '$attendance_records.student_id',
          status: '$attendance_records.status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.student_id',
        attendance_breakdown: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total_sessions: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $project: {
        student_id: '$_id',
        student_name: '$student.full_name',
        student_email: '$student.email',
        attendance_breakdown: 1,
        total_sessions: 1,
        attendance_percentage: {
          $multiply: [
            {
              $divide: [
                {
                  $add: [
                    { $ifNull: [{ $arrayElemAt: [{ $filter: { input: '$attendance_breakdown', cond: { $eq: ['$$this.status', 'present'] } } }, 0] }, { count: 0 }] },
                    { $ifNull: [{ $arrayElemAt: [{ $filter: { input: '$attendance_breakdown', cond: { $eq: ['$$this.status', 'late'] } } }, 0] }, { count: 0 }] }
                  ]
                },
                '$total_sessions'
              ]
            },
            100
          ]
        }
      }
    },
    { $sort: { attendance_percentage: -1 } }
  ]);

  return stats;
};

// Static method to find students with low attendance
attendanceSchema.statics.findLowAttendanceStudents = async function (organizationId, threshold = 75, dateRange = {}) {
  const matchQuery = {
    organization_id: organizationId,
    is_active: true
  };

  if (dateRange.start) matchQuery.session_date = { $gte: dateRange.start };
  if (dateRange.end) {
    matchQuery.session_date = matchQuery.session_date || {};
    matchQuery.session_date.$lte = dateRange.end;
  }

  const lowAttendanceStudents = await this.aggregate([
    { $match: matchQuery },
    { $unwind: '$attendance_records' },
    {
      $group: {
        _id: {
          student_id: '$attendance_records.student_id',
          course_id: '$course_id'
        },
        total_sessions: { $sum: 1 },
        present_sessions: {
          $sum: {
            $cond: [
              { $in: ['$attendance_records.status', ['present', 'late']] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        attendance_percentage: {
          $multiply: [
            { $divide: ['$present_sessions', '$total_sessions'] },
            100
          ]
        }
      }
    },
    { $match: { attendance_percentage: { $lt: threshold } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id.student_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$student' },
    { $unwind: '$course' },
    {
      $project: {
        student_id: '$_id.student_id',
        course_id: '$_id.course_id',
        student_name: '$student.full_name',
        student_email: '$student.email',
        course_title: '$course.title',
        total_sessions: 1,
        present_sessions: 1,
        attendance_percentage: { $round: ['$attendance_percentage', 1] }
      }
    },
    { $sort: { attendance_percentage: 1 } }
  ]);

  return lowAttendanceStudents;
};

// Pre-save middleware to validate session times
attendanceSchema.pre('save', function (next) {
  // Validate that end_time is after start_time
  const startMinutes = this.timeToMinutes(this.start_time);
  const endMinutes = this.timeToMinutes(this.end_time);

  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }

  // Calculate duration if not provided
  if (!this.total_duration_minutes) {
    this.total_duration_minutes = endMinutes - startMinutes;
  }

  next();
});

// Helper method to convert time string to minutes
attendanceSchema.methods.timeToMinutes = function (timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Pre-save middleware to validate organization consistency
attendanceSchema.pre('save', async function (next) {
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

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;