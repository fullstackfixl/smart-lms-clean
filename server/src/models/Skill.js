const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String, // e.g., 'Soft Skills', 'Technical', 'Management'
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

skillSchema.index({ organization_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
