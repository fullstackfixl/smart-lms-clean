const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  lecture_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  watched_seconds: {
    type: Number,
    default: 0,
    min: 0
  },
  total_duration: {
    type: Number,
    required: true,
    min: 0
  },
  completion_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  completed_at: Date,
  last_watched_at: {
    type: Date,
    default: Date.now
  },
  watch_count: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
lectureProgressSchema.index({ user_id: 1, lecture_id: 1 }, { unique: true });
lectureProgressSchema.index({ user_id: 1, course_id: 1 });
lectureProgressSchema.index({ course_id: 1, lecture_id: 1 });
lectureProgressSchema.index({ organization_id: 1, user_id: 1 });

// Pre-save hook to calculate completion percentage
lectureProgressSchema.pre('save', function(next) {
  if (this.total_duration > 0) {
    this.completion_percentage = Math.min(
      Math.round((this.watched_seconds / this.total_duration) * 100),
      100
    );
    
    // Mark as completed if watched >= 90%
    if (this.completion_percentage >= 90 && !this.completed) {
      this.completed = true;
      this.completed_at = new Date();
    }
  }
  next();
});

// Static method to get user's progress for a course
lectureProgressSchema.statics.getCourseProgress = async function(userId, courseId) {
  const progress = await this.find({
    user_id: userId,
    course_id: courseId
  }).lean();
  
  const totalLectures = progress.length;
  const completedLectures = progress.filter(p => p.completed).length;
  const totalWatchedSeconds = progress.reduce((sum, p) => sum + p.watched_seconds, 0);
  
  return {
    totalLectures,
    completedLectures,
    completionPercentage: totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0,
    totalWatchedSeconds,
    lectures: progress
  };
};

module.exports = mongoose.model('LectureProgress', lectureProgressSchema);
