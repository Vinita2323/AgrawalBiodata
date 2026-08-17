/**
 * Chat Service
 * Conversation resolution, access gating and message persistence
 * Agrawal Matrimony Platform
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Interest = require('../models/Interest');
const { isBlockedBetween } = require('../utils/profileHelper');
const { INTEREST_STATUS } = require('../config/constants');

/**
 * Error thrown for access-control failures so controllers can map them to a
 * 403 rather than a generic 500.
 */
class ChatAccessError extends Error {
  constructor(message, code = 'CHAT_FORBIDDEN') {
    super(message);
    this.name = 'ChatAccessError';
    this.code = code;
  }
}

class ChatService {
  /**
   * Whether two profiles have an accepted interest in either direction.
   * Messaging is gated on connection, not on payment: the plan tier only
   * affects how many conversations a user may start, never whether they can
   * reply to someone who already accepted them.
   */
  async areConnected(profileIdA, profileIdB) {
    const interest = await Interest.findOne({
      status: INTEREST_STATUS.ACCEPTED,
      $or: [
        { senderProfileId: profileIdA, recipientProfileId: profileIdB },
        { senderProfileId: profileIdB, recipientProfileId: profileIdA }
      ]
    });
    return interest || null;
  }

  /**
   * Finds or creates the conversation between two candidate profiles,
   * enforcing connection and block rules.
   *
   * @param {object} params
   * @param {object} params.initiatorProfile Mongoose Profile document
   * @param {object} params.targetProfile Mongoose Profile document
   * @returns {Promise<object>} the conversation document
   * @throws {ChatAccessError}
   */
  async resolveConversation({ initiatorProfile, targetProfile }) {
    if (!initiatorProfile || !targetProfile) {
      throw new ChatAccessError('Both candidate profiles are required', 'PROFILE_REQUIRED');
    }

    if (initiatorProfile._id.toString() === targetProfile._id.toString()) {
      throw new ChatAccessError('You cannot start a conversation with yourself', 'SELF_CHAT');
    }

    const blocked = await isBlockedBetween(
      initiatorProfile.userId,
      targetProfile.userId,
      initiatorProfile._id,
      targetProfile._id
    );
    if (blocked) {
      throw new ChatAccessError('Messaging is unavailable due to block restrictions', 'BLOCKED');
    }

    const interest = await this.areConnected(initiatorProfile._id, targetProfile._id);
    if (!interest) {
      throw new ChatAccessError(
        'You can only message candidates who have accepted your interest',
        'NOT_CONNECTED'
      );
    }

    const pairKey = Conversation.buildPairKey(initiatorProfile._id, targetProfile._id);

    let conversation = await Conversation.findOne({ pairKey });
    if (conversation) return conversation;

    conversation = await Conversation.create({
      pairKey,
      interestId: interest._id,
      participants: [
        {
          userId: initiatorProfile.userId,
          profileId: initiatorProfile._id,
          unreadCount: 0
        },
        {
          userId: targetProfile.userId,
          profileId: targetProfile._id,
          unreadCount: 0
        }
      ],
      lastMessage: '',
      lastMessageAt: new Date()
    });

    return conversation;
  }

  /**
   * Asserts the user participates in the conversation and returns both sides.
   * @returns {{ conversation: object, me: object, them: object }}
   */
  assertParticipant(conversation, userId) {
    if (!conversation) {
      throw new ChatAccessError('Conversation not found', 'NOT_FOUND');
    }

    const me = conversation.participants.find((p) => p.userId.toString() === userId.toString());
    if (!me) {
      throw new ChatAccessError('You are not a participant in this conversation', 'NOT_PARTICIPANT');
    }

    const them = conversation.participants.find((p) => p.userId.toString() !== userId.toString());
    return { conversation, me, them };
  }

  /**
   * Persists a message and updates the conversation summary + unread counters.
   *
   * @param {object} params
   * @param {object} params.conversation
   * @param {string} params.senderUserId
   * @param {string} params.body
   * @returns {Promise<{ message: object, conversation: object, recipient: object }>}
   */
  async sendMessage({ conversation, senderUserId, body }) {
    const trimmed = String(body || '').trim();
    if (!trimmed) {
      throw new ChatAccessError('Message body cannot be empty', 'EMPTY_MESSAGE');
    }

    const { me, them } = this.assertParticipant(conversation, senderUserId);

    const message = await Message.create({
      conversationId: conversation._id,
      senderUserId: me.userId,
      senderProfileId: me.profileId,
      recipientUserId: them.userId,
      recipientProfileId: them.profileId,
      body: trimmed
    });

    // Update the denormalized summary and bump only the recipient's counter.
    conversation.lastMessage = trimmed.slice(0, 200);
    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessageSenderProfileId = me.profileId;

    const recipientEntry = conversation.participants.find(
      (p) => p.userId.toString() === them.userId.toString()
    );
    recipientEntry.unreadCount += 1;

    await conversation.save();

    return { message, conversation, recipient: them, sender: me };
  }

  /**
   * Lists a user's conversations, newest activity first.
   */
  async listConversations(userId, { page = 1, limit = 20 } = {}) {
    const filter = { 'participants.userId': userId };
    const skip = (page - 1) * limit;

    const [total, conversations] = await Promise.all([
      Conversation.countDocuments(filter),
      Conversation.find(filter)
        .populate('participants.profileId', 'fullName profileId profilePicture verified')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return { conversations, total };
  }

  /**
   * Reads one conversation thread, newest-first for pagination but returned
   * oldest-first so the client can append directly.
   */
  async listMessages(conversationId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      Message.countDocuments({ conversationId }),
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return { messages: messages.reverse(), total };
  }

  /**
   * Marks every message the user received in a conversation as read and
   * clears their unread counter.
   */
  async markRead(conversation, userId) {
    const { me } = this.assertParticipant(conversation, userId);

    await Message.updateMany(
      { conversationId: conversation._id, recipientUserId: userId, readAt: null },
      { readAt: new Date() }
    );

    const entry = conversation.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );
    entry.unreadCount = 0;
    entry.lastReadAt = new Date();
    await conversation.save();

    return conversation;
  }

  /**
   * Total unread messages across all of a user's conversations.
   */
  async totalUnread(userId) {
    const conversations = await Conversation.find({ 'participants.userId': userId }).select(
      'participants'
    );

    return conversations.reduce((sum, c) => {
      const entry = c.participants.find((p) => p.userId.toString() === userId.toString());
      return sum + (entry ? entry.unreadCount : 0);
    }, 0);
  }
}

const chatService = new ChatService();
chatService.ChatAccessError = ChatAccessError;

module.exports = chatService;
module.exports.ChatAccessError = ChatAccessError;
