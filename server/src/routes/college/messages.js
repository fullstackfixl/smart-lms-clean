const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/college/messageController');
const { authMiddleware } = require('../../middleware/auth');

// Apply auth middleware to all message routes
router.use(authMiddleware);

// Get a list of all active conversations involving the user
router.get('/', messageController.getConversations);

// Get the unread message count for the red badge
router.get('/unread-count', messageController.getUnreadCount);

// Get role-based allowed users list for starting conversations
router.get('/users', messageController.getAllowedUsers);

// Get role-based user profile for chat preview
router.get('/profile/:userId', messageController.getUserProfile);

// Get all messages for a particular conversation
router.get('/:conversationId', messageController.getConversationMessages);

// Start a new conversation with a receiver
router.post('/start', messageController.startConversation);

// Send a chat message inside an existing conversation
router.post('/send', messageController.sendMessage);

module.exports = router;
