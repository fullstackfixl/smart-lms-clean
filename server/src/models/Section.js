const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  order: {
    type: Number,
    required: false,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
sectionSchema.index({ organization_id: 1, course_id: 1, order: 1 });
sectionSchema.index({ course_id: 1, order: 1 });

// Virtual for lessons count
sectionSchema.virtual('lessonsCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'section_id',
  count: true
});

// Ensure virtual fields are serialized
sectionSchema.set('toJSON', { virtuals: true });
sectionSchema.set('toObject', { virtuals: true });

sectionSchema.pre('validate', async function(next) {
  if (this.isNew && (this.order === undefined || this.order === null)) {
    const query = { course_id: this.course_id };
    if (this.organization_id) query.organization_id = this.organization_id;

    const maxOrderSection = await this.constructor
      .findOne(query)
      .sort({ order: -1 })
      .select('order');

    this.order = maxOrderSection && maxOrderSection.order ? maxOrderSection.order + 1 : 1;
  }
  next();
});

// Static method to reorder sections
sectionSchema.statics.reorderSections = async function(courseId, sectionOrders) {
  const bulkOps = sectionOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, course_id: courseId },
      update: { $set: { order } }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('Section', sectionSchema);