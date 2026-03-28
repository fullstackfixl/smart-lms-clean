const User = require('../../models/User');
const InstructorAssignment = require('../../models/InstructorAssignment');
const AcademicEnrollment = require('../../models/AcademicEnrollment');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');

class MessageService {
  /**
   * Validate if sender can message the receiver based on roles and enrollment
   * @param {Object} sender - The user attempting to send
   * @param {Object} receiver - The target user
   * @throws {Error} If permissions are not met
   */
  async validateMessagingPermission(sender, receiver) {
    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    const senderIdStr = sender._id.toString();
    const receiverIdStr = receiver._id.toString();

    // MANDATORY RULE: No self-chat
    if (senderIdStr === receiverIdStr) {
      throw new Error('You cannot chat with yourself');
    }

    const senderOrgStr = sender.organization_id?._id?.toString() || sender.organization_id?.toString();
    const receiverOrgStr = receiver.organization_id?._id?.toString() || receiver.organization_id?.toString();
    
    // Rule 1: Must be in the same organization
    if (senderOrgStr !== receiverOrgStr) {
      throw new Error('Cross-organization messaging is strictly prohibited');
    }

    // Role combinations
    const senderRole = sender.role;
    const receiverRole = receiver.role;

    // Rule 2: Org Admins can message anyone in their org
    if (['organization_admin', 'org_admin'].includes(senderRole)) {
      return true;
    }
    if (['organization_admin', 'org_admin'].includes(receiverRole)) {
      return true; // Anyone can message org admin back
    }

    // Rule 3: Instructor to Student or Student to Instructor requires active enrollment
    if (senderRole === 'instructor' && receiverRole === 'student') {
      await this.checkInstructorStudentConnection(sender._id, receiver._id, senderOrgStr);
      return true;
    }

    if (senderRole === 'student' && receiverRole === 'instructor') {
      await this.checkInstructorStudentConnection(receiver._id, sender._id, senderOrgStr);
      return true;
    }

    throw new Error('You do not have permission to message this user');
  }

  /**
   * Check if a student is enrolled in any active batch taught by the instructor
   */
  async checkInstructorStudentConnection(instructorId, studentId, organizationId) {
    // Find all active batches the instructor is assigned to
    const assignments = await InstructorAssignment.find({
      instructorId: instructorId,
      organizationId: organizationId,
      isActive: true
    }).select('batchId');

    const batchIds = assignments.map(a => a.batchId);

    if (batchIds.length === 0) {
      throw new Error('Instructor has no active assignments to message from');
    }

    // Check if the student is enrolled in any of these batches
    const enrollment = await AcademicEnrollment.findOne({
      studentId: studentId,
      batchId: { $in: batchIds }
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in any of your active classes');
    }
  }

  async createOrGetConversation({
    organizationId,
    participantIds = [],
    type = 'direct',
    name = null,
    contextType = null,
    contextId = null,
    createdBy = null,
    metadata = {}
  }) {
    const uniqueParticipants = [...new Set(participantIds.map(id => id.toString()))];

    if (!organizationId) {
      throw new Error('Organization is required');
    }
    if (uniqueParticipants.length === 0) {
      throw new Error('At least one participant is required');
    }

    const query = {
      organizationId,
      participants: { $all: uniqueParticipants }
    };

    if (contextType && contextId) {
      query.type = type === 'direct' ? 'context' : type;
      query.contextType = contextType;
      query.contextId = contextId;
      delete query.participants;
    } else {
      query.type = type;
      if (type === 'direct' && uniqueParticipants.length === 2) {
        query.participants = { $all: uniqueParticipants, $size: 2 };
      }
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name email role profilePicture');

    if (!conversation) {
      conversation = await Conversation.create({
        organizationId,
        participants: uniqueParticipants,
        type: contextType ? 'context' : type,
        name,
        contextType,
        contextId,
        createdBy,
        metadata
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role profilePicture');
    } else if (contextType && contextId) {
      const existingParticipants = new Set((conversation.participants || []).map(p => p.toString()));
      let changed = false;
      uniqueParticipants.forEach((participantId) => {
        if (!existingParticipants.has(participantId.toString())) {
          conversation.participants.push(participantId);
          changed = true;
        }
      });
      if (changed) {
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
          .populate('participants', 'name email role profilePicture');
      }
    }

    return conversation;
  }

  async createSystemMessage({
    organizationId,
    conversationId,
    text,
    contextType = null,
    contextId = null,
    metadata = {},
    senderId = null
  }) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId: null,
      organization_id: organizationId,
      text,
      messageType: 'system',
      contextType: contextType || conversation.contextType || null,
      contextId: contextId || conversation.contextId || null,
      metadata,
      isRead: false
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageType = 'system';
    conversation.lastMessageSender = senderId;
    if (conversation.unreadCount instanceof Map) {
      conversation.participants.forEach((participantId) => {
        const id = participantId.toString();
        if (senderId && id === senderId.toString()) {
          return;
        }
        const current = conversation.unreadCount.get(id) || 0;
        conversation.unreadCount.set(id, current + 1);
      });
    }
    await conversation.save();

    return message;
  }
}

module.exports = new MessageService();
