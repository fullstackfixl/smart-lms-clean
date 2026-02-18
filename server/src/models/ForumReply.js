const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  forum_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
  },
  parent_reply_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  content: {
    type: String,
    required: true
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  is_solution: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  is_edited: {
    type: Boolean,
    default: false
  },
  edited_at: Date
}, {
  timestamps: true
});

// Indexes
forumReplySchema.index({ forum_id: 1, createdAt: 1 });
forumReplySchema.index({ author_id: 1 });

module.exports = mongoose.model('ForumReply', forumReplySchema);
