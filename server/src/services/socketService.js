const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class SocketService {
  constructor() {
    this.io = null;
    this.users = new Map(); // userId -> socketId
    this.typingUsers = new Map(); // conversationId -> Set of userIds
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO initialized');
  }

  // Authenticate socket connection
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.organizationId = decoded.organizationId;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  }

  // Handle new connection
  handleConnection(socket) {
    console.log(`User connected: ${socket.userId}`);

    // Store user socket mapping
    this.users.set(socket.userId, socket.id);

    // Emit online status
    this.io.emit('user:online', { userId: socket.userId });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle events
    socket.on('conversation:join', (data) => this.handleJoinConversation(socket, data));
    socket.on('conversation:leave', (data) => this.handleLeaveConversation(socket, data));
    socket.on('message:send', (data) => this.handleSendMessage(socket, data));
    socket.on('message:read', (data) => this.handleMarkAsRead(socket, data));
    socket.on('typing:start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing:stop', (data) => this.handleTypingStop(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // Join conversation room
  handleJoinConversation(socket, { conversationId }) {
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  }

  // Leave conversation room
  handleLeaveConversation(socket, { conversationId }) {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${socket.userId} left conversation ${conversationId}`);
  }

  // Send message
  async handleSendMessage(socket, data) {
    try {
      const { conversationId, content, attachments } = data;

      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
        organization_id: socket.organizationId
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Create message
      const message = new Message({
        conversation_id: conversationId,
        sender_id: socket.userId,
        content,
        attachments: attachments || [],
        organization_id: socket.organizationId
      });

      await message.save();
      await message.populate('sender_id', 'profile.fullName email profile.avatar');

      // Update conversation
      conversation.last_message = {
        content,
        sender_id: socket.userId,
        timestamp: new Date()
      };

      // Increment unread count for other participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          const currentCount = conversation.unread_count.get(participantId.toString()) || 0;
          conversation.unread_count.set(participantId.toString(), currentCount + 1);
        }
      });

      await conversation.save();

      // Emit to conversation room
      this.io.to(`conversation:${conversationId}`).emit('message:new', {
        message,
        conversationId
      });

      // Emit to participants' personal rooms for notification
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          this.io.to(`user:${participantId}`).emit('notification:new-message', {
            conversationId,
            message,
            sender: message.sender_id
          });
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Mark messages as read
  async handleMarkAsRead(socket, { conversationId, messageIds }) {
    try {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          conversation_id: conversationId,
          sender_id: { $ne: socket.userId }
        },
        {
          is_read: true,
          read_at: new Date()
        }
      );

      // Update conversation unread count
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unread_count.set(socket.userId, 0);
        await conversation.save();
      }

      // Emit read receipt to conversation
      this.io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        messageIds,
        readBy: socket.userId
      });

    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  // Handle typing start
  handleTypingStart(socket, { conversationId }) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    this.typingUsers.get(conversationId).add(socket.userId);

    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId
    });
  }

  // Handle typing stop
  handleTypingStop(socket, { conversationId }) {
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.userId);

      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId: socket.userId
    });
  }

  // Handle disconnect
  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId}`);

    // Remove from users map
    this.users.delete(socket.userId);

    // Remove from typing users
    this.typingUsers.forEach((users, conversationId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        this.io.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    // Emit offline status
    this.io.emit('user:offline', { userId: socket.userId });
  }

  // Send notification to user
  sendNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.io.to(`user:${userId}`).emit('notification', notification);
    });
  }

  // Broadcast to organization
  broadcastToOrganization(organizationId, event, data) {
    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(this.users.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.users.has(userId);
  }
}

module.exports = new SocketService();
