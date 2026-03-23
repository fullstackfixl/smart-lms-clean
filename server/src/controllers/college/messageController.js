const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Grade = require('../../models/Grade');
const AcademicEnrollment = require('../../models/AcademicEnrollment');
const InstructorAssignment = require('../../models/InstructorAssignment');
const messageService = require('../../services/college/messageService');

exports.getAllowedUsers = async (req, res) => {
  try {
    const requester = req.user;
    const orgId = requester.organization_id?._id || requester.organization_id;

    const role = requester.role;

    // Org admin: any user in org (excluding self)
    if (['organization_admin', 'org_admin'].includes(role)) {
      const users = await User.find({
        organization_id: orgId,
        _id: { $ne: requester._id },
        status: 'active'
      }).select('name email role profilePicture');

      const data = users.map(u => ({
        _id: u._id,
        name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        display_name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture
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
        User.find({ _id: { $in: studentIds }, status: 'active' }).select('name email role profilePicture'),
        User.find({ organization_id: orgId, role: { $in: ['organization_admin', 'org_admin'] }, status: 'active' }).select('name email role profilePicture')
      ]);

      const combined = [...students, ...admins]
        .filter(u => u._id.toString() !== requester._id.toString());

      const dedup = new Map();
      combined.forEach(u => dedup.set(u._id.toString(), u));

      const data = Array.from(dedup.values()).map(u => ({
        _id: u._id,
        name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        display_name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture
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
        User.find({ _id: { $in: instructorIds }, status: 'active' }).select('name email role profilePicture'),
        User.find({ organization_id: orgId, role: { $in: ['organization_admin', 'org_admin'] }, status: 'active' }).select('name email role profilePicture')
      ]);

      const combined = [...instructors, ...admins]
        .filter(u => u._id.toString() !== requester._id.toString());

      const dedup = new Map();
      combined.forEach(u => dedup.set(u._id.toString(), u));

      const data = Array.from(dedup.values()).map(u => ({
        _id: u._id,
        name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        display_name: ['organization_admin', 'org_admin'].includes(u.role) ? 'Admin' : u.name,
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture
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
    const { receiverId } = req.body;
    const sender = req.user;
    const orgId = sender.organization_id?._id || sender.organization_id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required' });
    }

    if (sender._id.toString() === receiverId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Validate if messaging is allowed
    try {
      await messageService.validateMessagingPermission(sender, receiver);
    } catch (permError) {
      return res.status(403).json({ success: false, message: permError.message });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      organizationId: orgId,
      participants: { $all: [sender._id, receiverId] }
    }).populate('participants', 'name email role profilePicture');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        organizationId: orgId,
        participants: [sender._id, receiverId],
        unreadCount: {}
      });
      await conversation.save();
      await conversation.populate('participants', 'name email role profilePicture');
    }

    // Apply "Admin" name rule for response
    const data = JSON.parse(JSON.stringify(conversation));
    data.participants = data.participants.map(p => {
      if (['organization_admin', 'org_admin'].includes(p.role)) {
        p.display_name = "Admin";
      } else {
        p.display_name = p.name;
      }
      return p;
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to start conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const sender = req.user;
    const orgId = sender.organization_id?._id || sender.organization_id;

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

    const receiverId = conversation.participants.find(p => p.toString() !== sender._id.toString());

    // Save message
    const message = new Message({
      conversationId,
      senderId: sender._id,
      receiverId,
      organization_id: orgId,
      text: text.trim()
    });
    await message.save();

    // Update conversation
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = Date.now();
    
    // Increment unread count for receiver if it's a map
    if (conversation.unreadCount instanceof Map) {
      const current = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), current + 1);
    }
    
    await conversation.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const userId = req.user._id;

    console.log(`[Debug] getConversations: orgId=${orgId}, userId=${userId}`);

    const conversations = await Conversation.find({ 
      organizationId: orgId,
      participants: userId
    })
    .populate('participants', 'name email role profilePicture')
    .sort({ lastMessageAt: -1 });

    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      
      // Apply Admin Name Masking Rule
      let display_name = otherParticipant?.name || 'Unknown User';
      if (['org_admin', 'organization_admin'].includes(otherParticipant?.role)) {
        display_name = 'Admin';
      }

      const convObj = conv.toObject();
      return {
        ...convObj,
        display_name,
        profilePicture: otherParticipant?.profilePicture
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
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    
    // Mark as read
    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Reset unread count
    if (conversation.unreadCount instanceof Map && conversation.unreadCount.get(userId.toString()) > 0) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

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
    const orgId = requester.organization_id?._id || requester.organization_id;

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
      name: isTargetAdmin ? "Admin" : targetUser.name,
      role: targetUser.role,
      profilePicture: targetUser.profilePicture
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
