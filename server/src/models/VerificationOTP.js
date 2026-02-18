const mongoose = require('mongoose');

const verificationOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  registrationData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expires: 0 } // TTL index - auto delete after expiry
  },
  attempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for cleanup
verificationOTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // 10 minutes

module.exports = mongoose.model('VerificationOTP', verificationOTPSchema);
