/**
 * Messaging Controller
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const chatService = require('../services/chatService');
const { ChatAccessError } = require('../services/chatService');
const notificationService = require('../services/notificationService');
const realtime = require('../realtime');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const { success, created, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/** Maps a ChatAccessError onto the right HTTP status. */
function handleChatError(res, error, next) {
  if (!(error instanceof ChatAccessError)) return next(error);
  if (error.code === 'NOT_FOUND') return notFound(res, error.message);
  if (error.code === 'EMPTY_MESSAGE' || error.code === 'PROFILE_REQUIRED') {
    return badRequest(res, error.message, null, error.code);
  }
  return forbidden(res, error.message, error.code);
}

/**
 * Shapes a conversation for the client: the other participant is surfaced as
 * `withProfile` and the caller's own unread count is lifted to the top level.
 */
function serializeConversation(conversation, userId) {
  const mine = conversation.participants.find((p) => p.userId.toString() === userId.toString());
  const theirs = conversation.participants.find((p) => p.userId.toString() !== userId.toString());
  const other = theirs?.profileId;

  return {
    id: conversation._id.toString(),
    withProfile: other && other._id
      ? {
          id: other._id.toString(),
          profileId: other.profileId,
          fullName: other.fullName,
          profilePicture: other.profilePicture,
          verified: other.verified
        }
      : { id: theirs?.profileId?.toString() || null },
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    isLastMessageMine:
      conversation.lastMessageSenderProfileId &&
      mine &&
      conversation.lastMessageSenderProfileId.toString() === mine.profileId.toString(),
    unreadCount: mine ? mine.unreadCount : 0
  };
}

/**
 * 1. List the caller's conversations
 * GET /api/messages/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const { conversations, total } = await chatService.listConversations(req.user.userId, {
      page,
      limit
    });

    return success(res, 'Conversations retrieved successfully', {
      conversations: conversations.map((c) => serializeConversation(c, req.user.userId)),
      total,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Open (or create) the conversation with a candidate profile
 * POST /api/messages/conversations
 * body: { targetProfileId }
 */
const openConversation = async (req, res, next) => {
  try {
    const { targetProfileId } = req.body || {};
    if (!targetProfileId) {
      return badRequest(res, 'Target profile ID is required');
    }

    const userProfileData = await getUserActiveProfile(req.user.userId);
    if (!userProfileData?.activeProfile) {
      return badRequest(
        res,
        'No active candidate profile found. Please create or activate a profile first.',
        null,
        'NO_ACTIVE_PROFILE'
      );
    }

    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    if (!targetProfile) {
      return notFound(res, 'Candidate profile not found');
    }

    const conversation = await chatService.resolveConversation({
      initiatorProfile: userProfileData.activeProfile,
      targetProfile
    });

    await conversation.populate('participants.profileId', 'fullName profileId profilePicture verified');

    return created(res, 'Conversation ready', {
      conversation: serializeConversation(conversation, req.user.userId)
    });
  } catch (error) {
    return handleChatError(res, error, next);
  }
};

/**
 * 3. Read a conversation thread
 * GET /api/messages/conversations/:conversationId
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return notFound(res, 'Conversation not found');
    }

    const conversation = await Conversation.findById(conversationId).populate(
      'participants.profileId',
      'fullName profileId profilePicture verified'
    );

    chatService.assertParticipant(conversation, req.user.userId);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const { messages, total } = await chatService.listMessages(conversationId, { page, limit });

    return success(res, 'Messages retrieved successfully', {
      conversation: serializeConversation(conversation, req.user.userId),
      messages,
      total,
      page,
      limit
    });
  } catch (error) {
    return handleChatError(res, error, next);
  }
};

/**
 * 4. Send a message
 * POST /api/messages/conversations/:conversationId
 * body: { body }
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { body, text, message } = req.body || {};
    const content = body || text || message;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return notFound(res, 'Conversation not found');
    }

    const conversation = await Conversation.findById(conversationId);
    chatService.assertParticipant(conversation, req.user.userId);

    const result = await chatService.sendMessage({
      conversation,
      senderUserId: req.user.userId,
      body: content
    });

    // Push to the recipient's socket room and record a notification so the
    // message is still discoverable if they were offline.
    const senderProfile = await mongoose
      .model('Profile')
      .findById(result.sender.profileId)
      .select('fullName profilePicture');

    realtime.emitToUser(result.recipient.userId.toString(), 'message:new', {
      conversationId: conversation._id.toString(),
      message: result.message.toJSON()
    });

    await notificationService.messageReceived({
      recipientUserId: result.recipient.userId,
      recipientProfileId: result.recipient.profileId,
      senderProfile,
      preview: result.message.body.slice(0, 120),
      conversationId: conversation._id.toString()
    });

    return created(res, 'Message sent', { message: result.message });
  } catch (error) {
    return handleChatError(res, error, next);
  }
};

/**
 * 5. Mark a conversation as read
 * PUT /api/messages/conversations/:conversationId/read
 */
const markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return notFound(res, 'Conversation not found');
    }

    const conversation = await Conversation.findById(conversationId);
    chatService.assertParticipant(conversation, req.user.userId);

    await chatService.markRead(conversation, req.user.userId);

    return success(res, 'Conversation marked as read', {
      conversationId,
      unreadCount: 0
    });
  } catch (error) {
    return handleChatError(res, error, next);
  }
};

/**
 * 6. Total unread message count across all conversations
 * GET /api/messages/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await chatService.totalUnread(req.user.userId);
    return success(res, 'Unread message count retrieved', { unreadCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  openConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount
};
