const express = require('express');
const communicationController = require('../../controllers/platform/communicationController');
const router = express.Router();

router.get('/', communicationController.getConversations);
router.get('/overview', communicationController.getOverview);
router.get('/messages/:conversationId', communicationController.getMessages);

module.exports = router;
