const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
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
  lastMessageAt: { 
    type: Date,
    default: Date.now
  },
  unreadCount: { 
    type: Map, 
    of: Number,
    default: {} 
  }
}, {
  timestamps: true
});

// Ensure a conversation contains exactly 2 participants and is unique
conversationSchema.index({ participants: 1, organizationId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
