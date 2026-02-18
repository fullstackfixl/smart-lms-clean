const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  is_active: {
    type: Boolean,
    default: true
  },
  helpful_count: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes
reviewSchema.index({ student_id: 1, course_id: 1 }, { unique: true });
reviewSchema.index({ course_id: 1, is_active: 1 });
reviewSchema.index({ organization_id: 1, course_id: 1 });
reviewSchema.index({ rating: 1 });

// Static method to calculate course average rating
reviewSchema.statics.calculateCourseRating = async function(courseId) {
  const result = await this.aggregate([
    {
      $match: {
        course_id: new mongoose.Types.ObjectId(courseId),
        is_active: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const data = result[0];
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  data.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(data.averageRating * 10) / 10,
    totalReviews: data.totalReviews,
    ratingDistribution: distribution
  };
};

module.exports = mongoose.model('Review', reviewSchema);
