const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find({
      participants: req.user._id,
      organization_id: organizationId
    })
      .populate('participants', 'profile.fullName email profile.avatar')
      .populate('last_message.sender_id', 'profile.fullName')
      .sort({ 'last_message.timestamp': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      participants: req.user._id,
      organization_id: organizationId
    });

    res.success({
      conversations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Conversations retrieved successfully');

  } catch (error) {
    console.error('Get conversations error:', error);
    res.error(error.message, 'Failed to fetch conversations', 500);
  }
});

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participantIds, type = 'direct', name } = req.body;
    const organizationId = req.user.organization_id;

    if (!participantIds || participantIds.length === 0) {
      return res.error('Participant IDs are required', 'Validation failed', 400);
    }

    // Add current user to participants
    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];

    // For direct messages, check if conversation already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 },
        organization_id: organizationId
      }).populate('participants', 'profile.fullName email profile.avatar');

      if (existingConversation) {
        return res.success({ conversation: existingConversation }, 'Conversation already exists');
      }
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: allParticipants,
      type,
      name: type === 'group' ? name : null,
      organization_id: organizationId
    });

    await conversation.save();
    await conversation.populate('participants', 'profile.fullName email profile.avatar');

    res.success({ conversation }, 'Conversation created successfully');

  } catch (error) {
    console.error('Create conversation error:', error);
    res.error(error.message, 'Failed to create conversation', 500);
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const organizationId = req.user.organization_id;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      organization_id: organizationId
    });

    if (!conversation) {
      return res.error('Conversation not found', 'Not found', 404);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      conversation_id: conversationId,
      is_deleted: false
    })
      .populate('sender_id', 'profile.fullName email profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversation_id: conversationId,
      is_deleted: false
    });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation_id: conversationId,
        sender_id: { $ne: req.user._id },
        is_read: false
      },
      {
        is_read: true,
        read_at: new Date()
      }
    );

    // Reset unread count for current user
    if (conversation.unread_count) {
      conversation.unread_count.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.success({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    console.error('Get messages error:', error);
    res.error(error.message, 'Failed to fetch messages', 500);
  }
});

// Send message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    const organizationId = req.user.organization_id;

    if (!content) {
      return res.error('Content is required', 'Validation failed', 400);
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      organization_id: organizationId
    });

    if (!conversation) {
      return res.error('Conversation not found', 'Not found', 404);
    }

    const message = new Message({
      conversation_id: conversationId,
      sender_id: req.user._id,
      content,
      attachments: attachments || [],
      organization_id: organizationId
    });

    await message.save();

    // Update conversation last message
    conversation.last_message = {
      content,
      sender_id: req.user._id,
      timestamp: new Date()
    };

    // Increment unread count for other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = conversation.unread_count.get(participantId.toString()) || 0;
        conversation.unread_count.set(participantId.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    await message.populate('sender_id', 'profile.fullName email profile.avatar');

    res.success({ message }, 'Message sent successfully');

  } catch (error) {
    console.error('Send message error:', error);
    res.error(error.message, 'Failed to send message', 500);
  }
});

// Delete message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const organizationId = req.user.organization_id;

    const message = await Message.findOne({
      _id: messageId,
      sender_id: req.user._id,
      organization_id: organizationId
    });

    if (!message) {
      return res.error('Message not found', 'Not found', 404);
    }

    message.is_deleted = true;
    message.deleted_at = new Date();
    await message.save();

    res.success({}, 'Message deleted successfully');

  } catch (error) {
    console.error('Delete message error:', error);
    res.error(error.message, 'Failed to delete message', 500);
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const conversations = await Conversation.find({
      participants: req.user._id,
      organization_id: organizationId
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      const count = conv.unread_count.get(req.user._id.toString()) || 0;
      totalUnread += count;
    });

    res.success({ unreadCount: totalUnread }, 'Unread count retrieved');

  } catch (error) {
    console.error('Get unread count error:', error);
    res.error(error.message, 'Failed to get unread count', 500);
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const organizationId = req.user.organization_id;

    if (!query) {
      return res.error('Search query is required', 'Validation failed', 400);
    }

    const filter = {
      organization_id: organizationId,
      content: { $regex: query, $options: 'i' },
      is_deleted: false
    };

    if (conversationId) {
      filter.conversation_id = conversationId;
    } else {
      // Only search in conversations user is part of
      const userConversations = await Conversation.find({
        participants: req.user._id,
        organization_id: organizationId
      }).select('_id');

      filter.conversation_id = { $in: userConversations.map(c => c._id) };
    }

    const messages = await Message.find(filter)
      .populate('sender_id', 'profile.fullName email profile.avatar')
      .populate('conversation_id', 'name type')
      .sort({ createdAt: -1 })
      .limit(50);

    res.success({ messages }, 'Search results retrieved');

  } catch (error) {
    console.error('Search messages error:', error);
    res.error(error.message, 'Failed to search messages', 500);
  }
});

module.exports = router;
