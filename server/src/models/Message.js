const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: Date,
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: Date
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversation_id: 1, createdAt: -1 });
messageSchema.index({ sender_id: 1 });

module.exports = mongoose.model('Message', messageSchema);
