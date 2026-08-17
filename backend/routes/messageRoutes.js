/**
 * Messaging Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/unread-count', messageController.getUnreadCount);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.openConversation);
router.get('/conversations/:conversationId', messageController.getMessages);
router.post('/conversations/:conversationId', messageController.sendMessage);
router.put('/conversations/:conversationId/read', messageController.markConversationRead);

module.exports = router;
