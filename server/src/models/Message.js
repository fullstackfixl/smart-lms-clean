const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null,
    index: true
  },
  organization_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  text: { 
    type: String, 
    required: true 
  },
  messageType: {
    type: String,
    enum: ['text', 'system', 'assignment', 'reminder', 'announcement'],
    default: 'text'
  },
  contextType: {
    type: String,
    enum: ['organization', 'program', 'batch', 'course', 'assignment', 'quiz', 'live_class', 'system', null],
    default: null
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: {
    type: Date,
    default: null
  },
  attachments: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
