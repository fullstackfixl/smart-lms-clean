const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Grade = require('../../models/Grade');
const AcademicEnrollment = require('../../models/AcademicEnrollment');
const InstructorAssignment = require('../../models/InstructorAssignment');
const messageService = require('../../services/college/messageService');

function getOrgId(user) {
  return user.organization_id?._id || user.organization_id;
}

function getDisplayName(user) {
  if (!user) return 'Unknown User';
  return user.display_name
    || user.name
    || user.full_name
    || `${user.first_name || ''} ${user.last_name || ''}`.trim()
    || 'Unknown User';
}

function normalizeConversation(conversation, currentUserId) {
  const convObj = conversation.toObject ? conversation.toObject() : conversation;
  const participants = Array.isArray(convObj.participants) ? convObj.participants : [];
  const otherParticipant = participants.find((participant) => {
    const id = typeof participant === 'string'
      ? participant
      : participant?._id?.toString?.() || participant?.toString?.();
    return id && id !== currentUserId.toString();
  });

  const contextLabel = convObj.metadata?.title
    || convObj.metadata?.label
    || (convObj.contextType ? `${convObj.contextType.replace(/_/g, ' ')} thread` : null);

  const label = convObj.name
    || contextLabel
    || getDisplayName(otherParticipant)
    || (convObj.type === 'system' ? 'System Feed' : 'Conversation');

  return {
    ...convObj,
    display_name: label,
    conversation_label: label,
    type: convObj.type || 'direct',
    contextType: convObj.contextType || null,
    contextId: convObj.contextId || null,
    otherParticipant
  };
}

exports.getAllowedUsers = async (req, res) => {
  try {
    const requester = req.user;
    const orgId = getOrgId(requester);

    const role = requester.role;

    // Org admin: any user in org (excluding self)
    if (['organization_admin', 'org_admin'].includes(role)) {
      const users = await User.find({
        organization_id: orgId,
        _id: { $ne: requester._id },
        status: 'active'
      }).select('name email role profilePicture profile');

      const data = users.map(u => ({
        _id: u._id,
        name: getDisplayName(u),
        display_name: getDisplayName(u),
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture || null,
        profileImageUrl: u.profile?.pic_url || null
      }));

      return res.status(200).json({ success: true, data });
    }

    // Instructor: students in their active batches + org admin
    if (role === 'instructor') {
      const assignments = await InstructorAssignment.find({
        organizationId: orgId,
        instructorId: requester._id,
        isActive: true
      }).select('batchId');

      const batchIds = assignments.map(a => a.batchId);

      const enrollments = await AcademicEnrollment.find({
        organizationId: orgId,
        batchId: { $in: batchIds }
      }).select('studentId');

      const studentIds = [...new Set(enrollments.map(e => e.studentId.toString()))];

      const [students, admins] = await Promise.all([
        User.find({ _id: { $in: studentIds }, status: 'active' }).select('name email role profilePicture profile'),
        User.find({ organization_id: orgId, role: { $in: ['organization_admin', 'org_admin'] }, status: 'active' }).select('name email role profilePicture profile')
      ]);

      const combined = [...students, ...admins]
        .filter(u => u._id.toString() !== requester._id.toString());

      const dedup = new Map();
      combined.forEach(u => dedup.set(u._id.toString(), u));

      const data = Array.from(dedup.values()).map(u => ({
        _id: u._id,
        name: getDisplayName(u),
        display_name: getDisplayName(u),
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture || null,
        profileImageUrl: u.profile?.pic_url || null
      }));

      return res.status(200).json({ success: true, data });
    }

    // Student: instructors assigned to them + org admin
    if (role === 'student') {
      const enrollments = await AcademicEnrollment.find({
        organizationId: orgId,
        studentId: requester._id
      }).select('instructorId');

      const instructorIds = [...new Set(enrollments
        .map(e => e.instructorId)
        .filter(Boolean)
        .map(id => id.toString()))];

      const [instructors, admins] = await Promise.all([
        User.find({ _id: { $in: instructorIds }, status: 'active' }).select('name email role profilePicture profile'),
        User.find({ organization_id: orgId, role: { $in: ['organization_admin', 'org_admin'] }, status: 'active' }).select('name email role profilePicture profile')
      ]);

      const combined = [...instructors, ...admins]
        .filter(u => u._id.toString() !== requester._id.toString());

      const dedup = new Map();
      combined.forEach(u => dedup.set(u._id.toString(), u));

      const data = Array.from(dedup.values()).map(u => ({
        _id: u._id,
        name: getDisplayName(u),
        display_name: getDisplayName(u),
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture || null,
        profileImageUrl: u.profile?.pic_url || null
      }));

      return res.status(200).json({ success: true, data });
    }

    return res.status(403).json({ success: false, message: 'Messaging not enabled for this role' });
  } catch (error) {
    console.error('Get allowed users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const {
      receiverId,
      participantIds,
      type = 'direct',
      name = null,
      contextType = null,
      contextId = null,
      metadata = {}
    } = req.body;
    const sender = req.user;
    const orgId = getOrgId(sender);

    const targetIds = Array.isArray(participantIds) && participantIds.length > 0
      ? participantIds
      : (receiverId ? [receiverId] : []);

    if (targetIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Receiver ID or participantIds are required' });
    }

    const uniqueParticipantIds = [...new Set([sender._id.toString(), ...targetIds.map(id => id.toString())])];
    if (uniqueParticipantIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    const receivers = await User.find({ _id: { $in: uniqueParticipantIds.filter(id => id !== sender._id.toString()) } });
    if (receivers.length === 0) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    for (const receiver of receivers) {
      try {
        await messageService.validateMessagingPermission(sender, receiver);
      } catch (permError) {
        return res.status(403).json({ success: false, message: permError.message });
      }
    }

    const conversation = await messageService.createOrGetConversation({
      organizationId: orgId,
      participantIds: uniqueParticipantIds,
      type: contextType ? 'context' : type,
      name,
      contextType,
      contextId,
      createdBy: sender._id,
      metadata
    });

    const data = normalizeConversation(conversation, sender._id);
    data.participants = (data.participants || []).map(p => ({
      ...p,
      display_name: getDisplayName(p)
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to start conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, attachments = [], messageType = 'text', metadata = {} } = req.body;
    const sender = req.user;
    const orgId = getOrgId(sender);

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Conversation ID and text are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify participation
    if (!conversation.participants.some(p => p.toString() === sender._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const receiverId = conversation.participants.find(p => p.toString() !== sender._id.toString()) || null;

    // Save message
    const message = new Message({
      conversationId,
      senderId: sender._id,
      receiverId,
      organization_id: orgId,
      text: text.trim(),
      messageType,
      contextType: conversation.contextType || null,
      contextId: conversation.contextId || null,
      attachments,
      metadata
    });
    await message.save();

    // Update conversation
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = Date.now();
    conversation.lastMessageSender = sender._id;
    conversation.lastMessageType = messageType;
    
    // Increment unread count for receiver if it's a map
    if (conversation.unreadCount instanceof Map) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== sender._id.toString()) {
          const current = conversation.unreadCount.get(participantId.toString()) || 0;
          conversation.unreadCount.set(participantId.toString(), current + 1);
        }
      });
    }
    
    await conversation.save();

    await message.populate('senderId', 'name email role profilePicture');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

exports.createSystemMessage = async (req, res) => {
  try {
    const {
      conversationId,
      participantIds = [],
      text,
      name = null,
      contextType = null,
      contextId = null,
      metadata = {}
    } = req.body;
    const sender = req.user;
    const orgId = getOrgId(sender);

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      const baseParticipants = Array.isArray(participantIds) ? participantIds : [];
      conversation = await messageService.createOrGetConversation({
        organizationId: orgId,
        participantIds: [...new Set([sender._id.toString(), ...baseParticipants.map(id => id.toString())])],
        type: 'system',
        name,
        contextType,
        contextId,
        createdBy: sender._id,
        metadata
      });
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === sender._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await messageService.createSystemMessage({
      organizationId: orgId,
      conversationId: conversation._id,
      text: text.trim(),
      contextType,
      contextId,
      metadata,
      senderId: sender._id
    });

    await message.populate('senderId', 'name email role profilePicture');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Create system message error:', error);
    res.status(500).json({ success: false, message: 'Failed to create system message' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const orgId = getOrgId(req.user);
    const userId = req.user._id;

    console.log(`[Debug] getConversations: orgId=${orgId}, userId=${userId}`);

    const conversations = await Conversation.find({ 
      organizationId: orgId,
      participants: userId
    })
    .populate('participants', 'name email role profilePicture profile')
    .sort({ lastMessageAt: -1, updatedAt: -1 });

    const formattedConversations = conversations.map(conv => {
      const normalized = normalizeConversation(conv, req.user._id);
      const otherParticipant = normalized.otherParticipant;
      // Expose both profilePicture (base64) and profileImageUrl (URL)
      const pic = otherParticipant?.profilePicture || null;
      const picUrl = otherParticipant?.profile?.pic_url || null;
      return {
        ...normalized,
        profilePicture: pic,
        profileImageUrl: picUrl,
        participants: (normalized.participants || []).map((p) => ({
          ...p,
          profileImageUrl: p?.profile?.pic_url || null
        })),
        display_name: normalized.display_name
      };
    });

    res.status(200).json({ success: true, data: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations', error: error.message });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Fetch messages
    const messages = await Message.find({ conversationId }).populate('senderId', 'name email role profilePicture profile').sort({ createdAt: 1 });
    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.senderId && typeof msgObj.senderId === 'object') {
        msgObj.senderId.profileImageUrl = msgObj.senderId.profile?.pic_url || null;
      }
      return msgObj;
    });
    
    // Mark as read
    await Message.updateMany(
      { conversationId, isRead: false, senderId: { $ne: userId } },
      { $set: { isRead: true, readAt: new Date() } }
    );

    // Reset unread count
    if (conversation.unreadCount instanceof Map && conversation.unreadCount.get(userId.toString()) > 0) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    res.status(200).json({ success: true, data: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = getOrgId(req.user);

    const conversations = await Conversation.find({
      organizationId: orgId,
      participants: userId
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.unreadCount instanceof Map) {
        totalUnread += (conv.unreadCount.get(userId.toString()) || 0);
      }
    });

    res.status(200).json({ success: true, totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = req.user;
    const orgId = getOrgId(requester);

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Secure cross-tenant check
    const targetOrgId = targetUser.organization_id?.toString() || targetUser.organization_id?._id?.toString();
    if (targetOrgId !== orgId.toString()) {
       return res.status(403).json({ success: false, message: 'Cross-organization profile access denied' });
    }

    const role = requester.role;
    const isTargetAdmin = ['organization_admin', 'org_admin'].includes(targetUser.role);
    
    // Base restricted profile
    const baseProfile = {
      _id: targetUser._id,
      name: getDisplayName(targetUser),
      role: targetUser.role,
      profilePicture: targetUser.profilePicture || null,
      profileImageUrl: targetUser.profile?.pic_url || null
    };

    // 1. Student View -> Show most restricted info
    if (role === 'student') {
      return res.status(200).json({ success: true, data: baseProfile });
    }

    // 2. Instructor View -> Show batch/program info if student
    if (role === 'instructor') {
      if (isTargetAdmin) {
        return res.status(200).json({ success: true, data: baseProfile });
      }
      
      if (targetUser.role === 'student') {
        const studentEnrollments = await AcademicEnrollment.find({
          organizationId: orgId,
          studentId: targetUser._id
        }).select('batchId programId');

        const batchIds = studentEnrollments.map(e => e.batchId);
        const programIds = studentEnrollments.map(e => e.programId);
        
        return res.status(200).json({
          success: true,
          data: {
            ...baseProfile,
            batches: batchIds,
            academicInfo: {
              batch: targetUser.profile?.batch || 'N/A',
              program: targetUser.profile?.program_id || 'N/A',
              programIds
            }
          }
        });
      }
      return res.status(200).json({ success: true, data: baseProfile });
    }

    // 3. Org Admin View -> Full access
    if (['organization_admin', 'org_admin'].includes(role)) {
      let academicDetails = {};
      
      if (targetUser.role === 'student') {
        const attendanceSummary = await Attendance.aggregate([
          { $match: { organization_id: targetUser.organization_id, "attendance_records.student_id": targetUser._id } },
          { $unwind: "$attendance_records" },
          { $match: { "attendance_records.student_id": targetUser._id } },
          { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$attendance_records.status", "present"] }, 1, 0] } } } }
        ]);
        
        const grades = await Grade.find({ student_id: targetUser._id }).limit(5).sort({ created_at: -1 });
        
        academicDetails = {
          attendance: attendanceSummary.length > 0 ? Math.round((attendanceSummary[0].present / attendanceSummary[0].total) * 100) : 0,
          grades: grades,
          profile: targetUser.profile
        };
      }

      return res.status(200).json({
        success: true,
        data: {
          ...baseProfile,
          email: targetUser.email,
          ...academicDetails
        }
      });
    }

    res.status(403).json({ success: false, message: 'Unauthorized profile access' });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};
