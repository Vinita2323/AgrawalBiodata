/**
 * Messaging Test Suite
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. Conversation gating (accepted interest required, blocks, self-chat)
 * 2. Conversation uniqueness regardless of who opens it
 * 3. Message send, thread read, unread counters and read receipts
 * 4. Participant-only authorization on every conversation route
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const Block = require('../models/Block');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { signAccessToken } = require('../utils/token');

describe('Messaging', () => {
  let alice, bob, carol;
  let aliceToken, bobToken, carolToken;
  let aliceProfile, bobProfile, carolProfile;

  /** Creates a user with one candidate profile and returns everything. */
  async function makeMember({ mobile, name, gender, gotra, profileId }) {
    const user = await User.create({ mobile, name, accountStatus: 'Active' });
    const profile = await Profile.create({
      userId: user._id,
      profileId,
      fullName: name,
      gender,
      dob: new Date('1996-06-15'),
      gotra,
      motherGotra: 'Mittal',
      city: 'Jaipur'
    });
    user.activeProfileId = profile._id;
    user.profiles = [profile._id];
    await user.save();

    return { user, profile, token: signAccessToken(user) };
  }

  /** Marks two profiles as connected through an accepted interest. */
  async function connect(a, b) {
    return Interest.create({
      senderUserId: a.user._id,
      senderProfileId: a.profile._id,
      recipientUserId: b.user._id,
      recipientProfileId: b.profile._id,
      status: 'Accepted',
      respondedAt: new Date()
    });
  }

  let aliceCtx, bobCtx, carolCtx;

  beforeEach(async () => {
    aliceCtx = await makeMember({
      mobile: '9822200001',
      name: 'Alice Garg',
      gender: 'Female',
      gotra: 'Garg',
      profileId: 'PRF-910001'
    });
    bobCtx = await makeMember({
      mobile: '9822200002',
      name: 'Bob Bansal',
      gender: 'Male',
      gotra: 'Bansal',
      profileId: 'PRF-910002'
    });
    carolCtx = await makeMember({
      mobile: '9822200003',
      name: 'Carol Goyal',
      gender: 'Female',
      gotra: 'Goyal',
      profileId: 'PRF-910003'
    });

    ({ user: alice, profile: aliceProfile, token: aliceToken } = aliceCtx);
    ({ user: bob, profile: bobProfile, token: bobToken } = bobCtx);
    ({ user: carol, profile: carolProfile, token: carolToken } = carolCtx);
  });

  describe('1. Conversation gating', () => {
    it('refuses to open a conversation without an accepted interest', async () => {
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_CONNECTED');
      expect(await Conversation.countDocuments({})).toBe(0);
    });

    it('opens a conversation once the interest is accepted', async () => {
      await connect(aliceCtx, bobCtx);

      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.conversation.withProfile.fullName).toBe('Bob Bansal');
      expect(await Conversation.countDocuments({})).toBe(1);
    });

    it('honours the accepted interest in either direction', async () => {
      await connect(bobCtx, aliceCtx);

      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(201);
    });

    it('refuses when either party has blocked the other', async () => {
      await connect(aliceCtx, bobCtx);
      await Block.create({
        blockerUserId: bob._id,
        blockerProfileId: bobProfile._id,
        blockedUserId: alice._id,
        blockedProfileId: aliceProfile._id,
        reason: 'Other'
      });

      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('BLOCKED');
    });

    it('refuses a conversation with oneself', async () => {
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: aliceProfile._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SELF_CHAT');
    });

    it('reuses the same conversation no matter who opens it', async () => {
      await connect(aliceCtx, bobCtx);

      const first = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      const second = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ targetProfileId: aliceProfile._id.toString() });

      expect(first.body.data.conversation.id).toBe(second.body.data.conversation.id);
      expect(await Conversation.countDocuments({})).toBe(1);
    });
  });

  describe('2. Sending & reading messages', () => {
    let conversationId;

    beforeEach(async () => {
      await connect(aliceCtx, bobCtx);
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });
      conversationId = res.body.data.conversation.id;
    });

    it('persists a message and bumps only the recipient unread counter', async () => {
      const res = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Namaste Bob' });

      expect(res.status).toBe(201);
      expect(res.body.data.message.body).toBe('Namaste Bob');

      const conversation = await Conversation.findById(conversationId);
      const aliceEntry = conversation.participants.find(
        (p) => p.userId.toString() === alice._id.toString()
      );
      const bobEntry = conversation.participants.find(
        (p) => p.userId.toString() === bob._id.toString()
      );

      expect(aliceEntry.unreadCount).toBe(0);
      expect(bobEntry.unreadCount).toBe(1);
      expect(conversation.lastMessage).toBe('Namaste Bob');
    });

    it('rejects an empty message', async () => {
      const res = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: '   ' });

      expect(res.status).toBe(400);
      expect(await Message.countDocuments({})).toBe(0);
    });

    it('returns the thread oldest-first', async () => {
      await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'First' });
      await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ body: 'Second' });

      const res = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages.map((m) => m.body)).toEqual(['First', 'Second']);
    });

    it('clears the unread counter and stamps readAt when marked read', async () => {
      await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Are you there?' });

      const res = await request(app)
        .put(`/api/messages/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);

      const conversation = await Conversation.findById(conversationId);
      const bobEntry = conversation.participants.find(
        (p) => p.userId.toString() === bob._id.toString()
      );
      expect(bobEntry.unreadCount).toBe(0);

      const message = await Message.findOne({ recipientUserId: bob._id });
      expect(message.readAt).toBeTruthy();
    });

    it('aggregates unread counts across conversations', async () => {
      await connect(carolCtx, bobCtx);
      const other = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${carolToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Hi from Alice' });
      await request(app)
        .post(`/api/messages/conversations/${other.body.data.conversation.id}`)
        .set('Authorization', `Bearer ${carolToken}`)
        .send({ body: 'Hi from Carol' });

      const res = await request(app)
        .get('/api/messages/unread-count')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });
  });

  describe('3. Participant-only authorization', () => {
    let conversationId;

    beforeEach(async () => {
      await connect(aliceCtx, bobCtx);
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });
      conversationId = res.body.data.conversation.id;
    });

    it('blocks a non-participant from reading the thread', async () => {
      const res = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${carolToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_PARTICIPANT');
    });

    it('blocks a non-participant from sending into the thread', async () => {
      const res = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${carolToken}`)
        .send({ body: 'Let me in' });

      expect(res.status).toBe(403);
      expect(await Message.countDocuments({})).toBe(0);
    });

    it('requires authentication on the conversation list', async () => {
      const res = await request(app).get('/api/messages/conversations');
      expect(res.status).toBe(401);
    });

    it('only lists a user own conversations', async () => {
      const res = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${carolToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(0);
    });
  });

  describe('4. Delivery, edit, and delete', () => {
    let conversationId;

    beforeEach(async () => {
      await connect(aliceCtx, bobCtx);
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });
      conversationId = res.body.data.conversation.id;
    });

    it('stamps deliveredAt once the recipient opens the thread', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Are you there?' });

      expect(sendRes.body.data.message.deliveredAt).toBeFalsy();

      await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      const message = await Message.findOne({ recipientUserId: bob._id });
      expect(message.deliveredAt).toBeTruthy();
    });

    it('lets the sender edit a message within the window', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Oiginal typo' });
      const messageId = sendRes.body.data.message.id;

      const res = await request(app)
        .put(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Original fixed' });

      expect(res.status).toBe(200);
      expect(res.body.data.message.body).toBe('Original fixed');
      expect(res.body.data.message.editedAt).toBeTruthy();
    });

    it('refuses to let the recipient edit the sender message', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Hello' });
      const messageId = sendRes.body.data.message.id;

      const res = await request(app)
        .put(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ body: 'Hijacked' });

      expect(res.status).toBe(403);
      expect((await Message.findById(messageId)).body).toBe('Hello');
    });

    it('refuses to edit a message older than 15 minutes', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Old message' });
      const messageId = sendRes.body.data.message.id;

      // Mongoose's timestamps plugin silently ignores an explicit createdAt
      // passed to findByIdAndUpdate, so backdating requires the raw driver.
      await Message.collection.updateOne(
        { _id: new (require('mongoose').Types.ObjectId)(messageId) },
        { $set: { createdAt: new Date(Date.now() - 16 * 60 * 1000) } }
      );

      const res = await request(app)
        .put(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Too late' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('EDIT_WINDOW_EXPIRED');
    });

    it('"delete for me" hides the message only from the deleter own thread', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Only I will hide this' });
      const messageId = sendRes.body.data.message.id;

      const delRes = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ scope: 'me' });
      expect(delRes.status).toBe(200);

      const aliceThread = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceThread.body.data.messages.map((m) => m.id)).not.toContain(messageId);

      const bobThread = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobThread.body.data.messages.map((m) => m.id)).toContain(messageId);
    });

    it('"delete for everyone" blanks the body for both participants, sender only', async () => {
      const sendRes = await request(app)
        .post(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ body: 'Everyone loses this' });
      const messageId = sendRes.body.data.message.id;

      const forbidden = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ scope: 'everyone' });
      expect(forbidden.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ scope: 'everyone' });
      expect(delRes.status).toBe(200);

      // The body is preserved in the database (the schema requires it to be
      // non-empty) but is never serialized once deletedForEveryone is set.
      const stored = await Message.findById(messageId);
      expect(stored.deletedForEveryone).toBe(true);
      expect(stored.body).toBe('Everyone loses this');

      const bobThread = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      const inBobThread = bobThread.body.data.messages.find((m) => m.id === messageId);
      expect(inBobThread.deletedForEveryone).toBe(true);
      expect(inBobThread.body).toBe('');
    });
  });
});
