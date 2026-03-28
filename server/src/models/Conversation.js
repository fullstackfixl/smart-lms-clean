const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'context', 'system', 'group'],
    default: 'direct',
    index: true
  },
  name: {
    type: String,
    trim: true,
    default: null
  },
  contextType: {
    type: String,
    enum: ['organization', 'program', 'batch', 'course', 'assignment', 'quiz', 'live_class', 'system', null],
    default: null,
    index: true
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  }],
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  lastMessage: { 
    type: String,
    default: ''
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastMessageAt: { 
    type: Date,
    default: Date.now
  },
  lastMessageType: {
    type: String,
    enum: ['text', 'system', 'assignment', 'reminder', 'announcement'],
    default: 'text'
  },
  unreadCount: { 
    type: Map, 
    of: Number,
    default: {} 
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure a conversation contains exactly 2 participants and is unique
conversationSchema.index({ participants: 1, organizationId: 1, type: 1, contextType: 1, contextId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
