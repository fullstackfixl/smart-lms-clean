const { Conversation, Message } = require('../../models');

function conversationLabel(conversation) {
  if (!conversation) return 'Conversation';
  if (conversation.name) return conversation.name;
  if (conversation.metadata?.title) return conversation.metadata.title;
  if (conversation.metadata?.label) return conversation.metadata.label;
  if (conversation.contextType) return `${conversation.contextType.replace(/_/g, ' ')} thread`;
  return 'Conversation';
}

async function computeResponseTimeMinutes(conversationId) {
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(12)
    .select('senderId createdAt')
    .lean();

  if (messages.length < 2) {
    return null;
  }

  const latest = messages[0];
  const responder = messages.find((message) => String(message.senderId) !== String(latest.senderId));
  if (!responder) {
    return null;
  }

  return Math.max(0, Math.round((new Date(latest.createdAt).getTime() - new Date(responder.createdAt).getTime()) / 60000));
}

exports.listConversations = async (params = {}) => {
  const {
    search,
    type,
    contextType,
    organizationId,
    escalated,
    page = 1,
    limit = 20
  } = params;

  const query = {};
  if (organizationId) query.organizationId = organizationId;
  if (type) query.type = type;
  if (contextType) query.contextType = contextType;
  if (escalated === 'true') {
    query.$or = [
      { 'metadata.escalationLevel': { $in: ['high', 'critical'] } },
      { 'metadata.flagged': true }
    ];
  }

  const conversations = await Conversation.find(query)
    .populate('participants', 'name email role profilePicture profile')
    .populate('lastMessageSender', 'name email role')
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const filtered = search
    ? conversations.filter((conversation) => {
        const blob = [
          conversation.name,
          conversation.lastMessage,
          conversation.contextType,
          conversation.metadata?.title,
          conversation.metadata?.label,
          ...(conversation.participants || []).map((participant) => participant?.name || participant?.email || '')
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(search.toLowerCase());
      })
    : conversations;

  const enriched = await Promise.all(filtered.map(async (conversation) => ({
    ...conversation,
    label: conversationLabel(conversation),
    responseTimeMinutes: await computeResponseTimeMinutes(conversation._id),
    escalationLevel: conversation.metadata?.escalationLevel || 'none',
    participantCount: Array.isArray(conversation.participants) ? conversation.participants.length : 0,
    unreadTotal: conversation.unreadCount
      ? Object.values(conversation.unreadCount).reduce((sum, value) => sum + Number(value || 0), 0)
      : 0
  })));

  const total = await Conversation.countDocuments(query);

  return {
    conversations: enriched,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

exports.getConversationMessages = async (conversationId, params = {}) => {
  const { page = 1, limit = 50 } = params;

  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name email role profilePicture profile')
    .populate('lastMessageSender', 'name email role profilePicture')
    .lean();

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const messages = await Message.find({ conversationId })
    .populate('senderId', 'name email role profilePicture profile')
    .sort({ createdAt: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await Message.countDocuments({ conversationId });

  const responseTimeMinutes = await computeResponseTimeMinutes(conversationId);

  return {
    conversation: {
      ...conversation,
      label: conversationLabel(conversation),
      responseTimeMinutes,
      escalationLevel: conversation.metadata?.escalationLevel || 'none'
    },
    messages,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

exports.getConversationOverview = async () => {
  const [totalConversations, escalatedConversations, unreadConversations, responseWindows] = await Promise.all([
    Conversation.countDocuments({}),
    Conversation.countDocuments({
      $or: [
        { 'metadata.escalationLevel': { $in: ['high', 'critical'] } },
        { 'metadata.flagged': true }
      ]
    }),
    Conversation.countDocuments({
      $or: [
        { unreadCount: { $exists: true, $ne: {} } },
        { 'metadata.unread': true }
      ]
    }),
    Conversation.find({}).select('lastMessageAt lastMessageSender participants metadata').limit(25).lean()
  ]);

  const responseTimes = await Promise.all(
    responseWindows.map((conversation) => computeResponseTimeMinutes(conversation._id))
  );
  const validResponseTimes = responseTimes.filter((value) => typeof value === 'number' && Number.isFinite(value));
  const averageResponseTime = validResponseTimes.length
    ? Math.round(validResponseTimes.reduce((sum, value) => sum + value, 0) / validResponseTimes.length)
    : 0;

  return {
    totalConversations,
    escalatedConversations,
    unreadConversations,
    averageResponseTimeMinutes: averageResponseTime
  };
};
