const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'phone', 'password_reset', 'parent_link'],
    required: true,
    index: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user_id + type
verificationCodeSchema.index({ user_id: 1, type: 1 });

// TTL index for automatic expiration
verificationCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Method to check if code is valid
verificationCodeSchema.methods.isValid = function() {
  return !this.used && this.expires_at > new Date();
};

// Method to mark code as used
verificationCodeSchema.methods.markAsUsed = function() {
  this.used = true;
  return this.save();
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
