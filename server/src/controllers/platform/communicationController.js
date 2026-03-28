const communicationService = require('../../services/platform/communicationService');

exports.getConversations = async (req, res) => {
  try {
    const result = await communicationService.listConversations(req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'COMMUNICATION_CONVERSATION_LIST_ERROR'
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const result = await communicationService.getConversationMessages(req.params.conversationId, req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const status = error.message === 'Conversation not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
      errorCode: 'COMMUNICATION_MESSAGE_LIST_ERROR'
    });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const overview = await communicationService.getConversationOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'COMMUNICATION_OVERVIEW_ERROR'
    });
  }
};
