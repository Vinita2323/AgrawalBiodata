/**
 * Realtime Transport (Socket.io)
 * Agrawal Matrimony Platform
 *
 * Every authenticated socket joins a room named after its user id, so the rest
 * of the app can push to a user without tracking individual socket ids. This
 * also means a user connected from several devices receives every event once
 * per device.
 *
 * The module is safe to call before `init` - emit helpers become no-ops, so a
 * REST-only deployment (or the test suite) needs no special handling.
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('./utils/token');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const chatService = require('./services/chatService');
const notificationService = require('./services/notificationService');
const logger = require('./utils/logger');
const env = require('./config/env');

/** Groups a flat list of {senderUserId, ...} rows by senderUserId. */
function groupBySender(rows) {
  const bySender = {};
  for (const row of rows) {
    if (!bySender[row.senderUserId]) bySender[row.senderUserId] = [];
    bySender[row.senderUserId].push(row);
  }
  return bySender;
}

let io = null;

/** Room name for a user's devices. */
const userRoom = (userId) => `user:${userId}`;

/**
 * Authenticates a socket handshake using the same access token as the REST API.
 * Token may arrive via `auth.token` (preferred) or the Authorization header.
 */
async function authenticateSocket(socket, next) {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!raw) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(raw);
    if (!decoded?.userId) {
      return next(new Error('Invalid or expired token'));
    }

    const user = await User.findById(decoded.userId).select('accountStatus activeProfileId name');
    if (!user) {
      return next(new Error('User not found'));
    }
    if (user.accountStatus === 'Suspended') {
      return next(new Error('Account suspended'));
    }

    socket.data.userId = user._id.toString();
    socket.data.activeProfileId = user.activeProfileId ? user.activeProfileId.toString() : null;
    return next();
  } catch (error) {
    return next(new Error('Authentication failed'));
  }
}

/**
 * Confirms the socket's user participates in a conversation before letting it
 * join that conversation's room. Without this a client could subscribe to any
 * thread by guessing an id.
 */
async function canJoinConversation(userId, conversationId) {
  try {
    const conversation = await Conversation.findById(conversationId).select('participants');
    if (!conversation) return false;
    return conversation.participants.some((p) => p.userId.toString() === userId);
  } catch {
    return false;
  }
}

/**
 * Attaches Socket.io to an existing HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN.includes(origin) || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true
    },
    path: '/socket.io'
  });

  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const { userId } = socket.data;
    socket.join(userRoom(userId));
    logger.info(`Socket connected: user ${userId} (${socket.id})`);

    // Coming online delivers anything that was sent while this user was
    // offline - each sender's tick moves from single to double right away
    // instead of waiting for the recipient to open that specific thread.
    try {
      const delivered = await chatService.markDelivered(userId);
      Object.entries(groupBySender(delivered)).forEach(([senderId, rows]) => {
        emitToUser(senderId, 'message:delivered', {
          messageIds: rows.map((r) => r.id),
          deliveredAt: rows[0].deliveredAt
        });
      });
    } catch (error) {
      logger.warn(`Delivery backfill failed for user ${userId}: ${error.message}`);
    }

    // Subscribe to a specific thread for typing/read receipts.
    socket.on('conversation:join', async (conversationId, ack) => {
      if (!(await canJoinConversation(userId, conversationId))) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Not a participant' });
        return;
      }
      socket.join(`conversation:${conversationId}`);
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    /**
     * Send a message over the socket. This mirrors the REST endpoint so the
     * client can use whichever is convenient; both persist through the same
     * service, so there is no divergent write path.
     */
    socket.on('message:send', async ({ conversationId, body } = {}, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        chatService.assertParticipant(conversation, userId);

        const result = await chatService.sendMessage({
          conversation,
          senderUserId: userId,
          body
        });

        // The recipient's room is about to receive this in the same tick, so
        // if they are connected the message is delivered right now.
        if (isUserOnline(result.recipient.userId.toString())) {
          result.message.deliveredAt = new Date();
          await result.message.save();
        }

        const payload = {
          conversationId: conversation._id.toString(),
          message: result.message.toJSON()
        };

        io.to(userRoom(result.recipient.userId.toString())).emit('message:new', payload);
        socket.emit('message:sent', payload);

        const senderProfile = await require('./models/Profile')
          .findById(result.sender.profileId)
          .select('fullName profilePicture');

        await notificationService.messageReceived({
          recipientUserId: result.recipient.userId,
          recipientProfileId: result.recipient.profileId,
          senderProfile,
          preview: result.message.body.slice(0, 120),
          conversationId: conversation._id.toString()
        });

        if (typeof ack === 'function') ack({ ok: true, message: payload.message });
      } catch (error) {
        if (typeof ack === 'function') ack({ ok: false, error: error.message });
      }
    });

    // Typing indicators are broadcast to the thread room only, never persisted.
    socket.on('typing:start', ({ conversationId } = {}) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { conversationId, userId });
    });

    socket.on('typing:stop', ({ conversationId } = {}) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { conversationId, userId });
    });

    socket.on('conversation:read', async ({ conversationId } = {}) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        const { them } = chatService.assertParticipant(conversation, userId);
        await chatService.markRead(conversation, userId);
        const readPayload = { conversationId, readerUserId: userId };
        socket.to(`conversation:${conversationId}`).emit('conversation:read', readPayload);
        // Also reach the other side directly - they may not have this
        // specific thread open (and thus not be in its room) right now.
        if (them?.userId) emitToUser(them.userId.toString(), 'conversation:read', readPayload);
      } catch {
        // A failed read receipt is not worth surfacing to the client.
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: user ${userId} (${reason})`);
    });
  });

  // Let the notification service push through this transport.
  notificationService.setRealtimeEmitter({ emitToUser });

  logger.info('Socket.io realtime transport initialised');
  return io;
}

/**
 * Pushes an event to every device of one user. No-op when Socket.io is not
 * running (REST-only or test environments).
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(userRoom(userId.toString())).emit(event, payload);
}

/**
 * Pushes an event to everyone subscribed to a conversation thread.
 */
function emitToConversation(conversationId, event, payload) {
  if (!io || !conversationId) return;
  io.to(`conversation:${conversationId}`).emit(event, payload);
}

/** Whether any of a user's devices currently hold an open socket. */
function isUserOnline(userId) {
  if (!io || !userId) return false;
  const room = io.sockets.adapter.rooms.get(userRoom(userId.toString()));
  return Boolean(room && room.size > 0);
}

function getIo() {
  return io;
}

async function close() {
  if (io) {
    await io.close();
    io = null;
  }
}

module.exports = {
  init,
  emitToUser,
  emitToConversation,
  isUserOnline,
  getIo,
  close
};
