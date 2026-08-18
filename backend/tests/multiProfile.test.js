/**
 * Multi-Profile Test Suite
 * Agrawal Matrimony Platform
 *
 * One account can run several candidate profiles - the motivating case is a
 * parent operating biodata for both a son and a daughter. These tests pin the
 * separation that makes that safe:
 *
 * 1. X-Profile-Id selects which profile a request acts as, and cannot be used
 *    to borrow a profile belonging to another account
 * 2. Interest inboxes are per profile, not merged across the account
 * 3. An accepted interest on one child does not unmask contact details on the
 *    other's profile
 * 4. Conversations and unread counts stay separate per profile
 * 5. The per-account profile cap is enforced
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const { signAccessToken } = require('../utils/token');

describe('Multi-Profile Accounts', () => {
  let parent, parentToken, son, daughter;
  let suitorCtx, suitressCtx;

  /** Creates an account carrying a single candidate profile. */
  async function makeMember({ mobile, name, gender, gotra, profileId }) {
    const user = await User.create({ mobile, name, accountStatus: 'Active' });
    const profile = await Profile.create({
      userId: user._id,
      profileId,
      fullName: name,
      gender,
      dob: new Date('1995-04-12'),
      gotra,
      motherGotra: 'Mittal',
      city: 'Jaipur',
      mobileNumber: '9800000000',
      residentialAddress: '12 Civil Lines, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only'
      }
    });
    user.activeProfileId = profile._id;
    user.profiles = [profile._id];
    await user.save();
    return { user, profile, token: signAccessToken(user) };
  }

  /** Adds another candidate profile to an existing account. */
  async function addProfile(user, { name, gender, gotra, profileId, profileFor }) {
    const profile = await Profile.create({
      userId: user._id,
      profileId,
      profileFor,
      fullName: name,
      gender,
      dob: new Date('1998-09-20'),
      gotra,
      motherGotra: 'Mittal',
      city: 'Jaipur'
    });
    user.profiles.push(profile._id);
    await user.save();
    return profile;
  }

  async function acceptedInterest(fromUser, fromProfile, toUser, toProfile) {
    return Interest.create({
      senderUserId: fromUser._id,
      senderProfileId: fromProfile._id,
      recipientUserId: toUser._id,
      recipientProfileId: toProfile._id,
      status: 'Accepted',
      respondedAt: new Date()
    });
  }

  beforeEach(async () => {
    // A parent account running biodata for a son and a daughter.
    const parentCtx = await makeMember({
      mobile: '9811100001',
      name: 'Aman Agarwal',
      gender: 'Male',
      gotra: 'Garg',
      profileId: 'PRF-920001'
    });
    parent = parentCtx.user;
    parentToken = parentCtx.token;
    son = parentCtx.profile;
    son.profileFor = 'Son';
    await son.save();

    daughter = await addProfile(parent, {
      name: 'Riya Agarwal',
      gender: 'Female',
      gotra: 'Garg',
      profileId: 'PRF-920002',
      profileFor: 'Daughter'
    });

    // Two unrelated accounts to interact with.
    suitressCtx = await makeMember({
      mobile: '9811100002',
      name: 'Neha Bansal',
      gender: 'Female',
      gotra: 'Bansal',
      profileId: 'PRF-920003'
    });
    suitorCtx = await makeMember({
      mobile: '9811100003',
      name: 'Vikram Jindal',
      gender: 'Male',
      gotra: 'Jindal',
      profileId: 'PRF-920004'
    });
  });

  describe('1. Profile selection via X-Profile-Id', () => {
    it('acts as the requested profile', async () => {
      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.profile.fullName).toBe('Riya Agarwal');
    });

    it('falls back to the persisted active profile with no header', async () => {
      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.fullName).toBe('Aman Agarwal');
    });

    it('rejects a profile belonging to another account', async () => {
      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', suitressCtx.profile._id.toString());

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('lists every profile on the account with the active one flagged', async () => {
      const res = await request(app)
        .get('/api/profiles/my-profiles')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCount).toBe(2);
      const names = res.body.data.profiles.map((p) => p.fullName).sort();
      expect(names).toEqual(['Aman Agarwal', 'Riya Agarwal']);
    });
  });

  describe('2. Interest inboxes are per profile', () => {
    beforeEach(async () => {
      // Neha writes to the son; Vikram writes to the daughter.
      await Interest.create({
        senderUserId: suitressCtx.user._id,
        senderProfileId: suitressCtx.profile._id,
        recipientUserId: parent._id,
        recipientProfileId: son._id,
        status: 'Pending'
      });
      await Interest.create({
        senderUserId: suitorCtx.user._id,
        senderProfileId: suitorCtx.profile._id,
        recipientUserId: parent._id,
        recipientProfileId: daughter._id,
        status: 'Pending'
      });
    });

    it('shows only the son\'s interests while acting as the son', async () => {
      const res = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', son._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.interests).toHaveLength(1);
      expect(res.body.data.interests[0].senderProfileId.fullName).toBe('Neha Bansal');
    });

    it('shows only the daughter\'s interests while acting as the daughter', async () => {
      const res = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.interests).toHaveLength(1);
      expect(res.body.data.interests[0].senderProfileId.fullName).toBe('Vikram Jindal');
    });

    it('does not report the son\'s interest as the daughter\'s status', async () => {
      const res = await request(app)
        .get(`/api/interests/status/${suitressCtx.profile._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('None');
    });
  });

  describe('3. A connection on one profile does not unmask the other', () => {
    beforeEach(async () => {
      // The son and Neha are connected. The daughter and Neha are not.
      await acceptedInterest(parent, son, suitressCtx.user, suitressCtx.profile);
    });

    it('reveals the contact number to the connected son', async () => {
      const res = await request(app)
        .get(`/api/profiles/${suitressCtx.profile._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', son._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(true);
      expect(res.body.data.profile.phoneMasked).toBe(false);
      expect(res.body.data.profile.mobileNumber).toBe('9800000000');
    });

    it('keeps the number masked for the unconnected daughter', async () => {
      const res = await request(app)
        .get(`/api/profiles/${suitressCtx.profile._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(false);
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.mobileNumber).not.toBe('9800000000');
      expect(res.body.data.profile.addressMasked).toBe(true);
    });
  });

  describe('4. Conversations are per profile', () => {
    it('keeps each profile\'s threads and unread counts separate', async () => {
      await acceptedInterest(parent, son, suitressCtx.user, suitressCtx.profile);

      // Neha opens a thread with the son and sends a message.
      const opened = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${suitressCtx.token}`)
        .send({ targetProfileId: son._id.toString() });
      expect(opened.status).toBe(201);

      const sent = await request(app)
        .post(`/api/messages/conversations/${opened.body.data.conversation.id}`)
        .set('Authorization', `Bearer ${suitressCtx.token}`)
        .send({ body: 'Namaste, we liked the biodata.' });
      expect(sent.status).toBe(201);

      // The son sees the thread.
      const sonInbox = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', son._id.toString());
      expect(sonInbox.status).toBe(200);
      expect(sonInbox.body.data.conversations).toHaveLength(1);

      // The daughter's inbox is untouched.
      const daughterInbox = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());
      expect(daughterInbox.status).toBe(200);
      expect(daughterInbox.body.data.conversations).toHaveLength(0);

      const sonUnread = await request(app)
        .get('/api/messages/unread-count')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', son._id.toString());
      expect(sonUnread.body.data.unreadCount).toBe(1);

      const daughterUnread = await request(app)
        .get('/api/messages/unread-count')
        .set('Authorization', `Bearer ${parentToken}`)
        .set('X-Profile-Id', daughter._id.toString());
      expect(daughterUnread.body.data.unreadCount).toBe(0);
    });
  });

  describe('5. Per-account profile cap', () => {
    const original = process.env.MAX_PROFILES_PER_ACCOUNT;

    afterEach(() => {
      process.env.MAX_PROFILES_PER_ACCOUNT = original;
    });

    it('refuses to create a profile past the configured limit', async () => {
      process.env.MAX_PROFILES_PER_ACCOUNT = '2';

      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          fullName: 'Third Candidate',
          gender: 'Male',
          dob: '1997-01-01',
          gotra: 'Garg',
          profileFor: 'Relative'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROFILE_LIMIT_REACHED');
    });

    it('allows creation below the limit', async () => {
      process.env.MAX_PROFILES_PER_ACCOUNT = '5';

      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          fullName: 'Third Candidate',
          gender: 'Male',
          dob: '1997-01-01',
          gotra: 'Garg',
          profileFor: 'Relative'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.profile.profileFor).toBe('Relative');
    });
  });
});
