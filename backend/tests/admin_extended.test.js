/**
 * Admin Extended Operations Test Suite
 * Agrawal Matrimony Platform
 *
 * Covers the endpoints added to close the admin panel gaps:
 * 1. User deletion with data cascade and Super Admin gating
 * 2. Subscription listing
 * 3. Block record listing
 * 4. Featured profile placement toggle
 * 5. Matched pair listing (accepted interests, live-computed score)
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Admin = require('../models/Admin');
const Plan = require('../models/Plan');
const Block = require('../models/Block');
const Interest = require('../models/Interest');
const { calculateMatchScore } = require('../services/matchEngine');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');
const { signAdminToken } = require('../utils/token');

describe('Admin Extended Operations', () => {
  let superAdmin, moderator, superToken, moderatorToken;
  let alice, bob, aliceProfile, bobProfile, plan;

  beforeEach(async () => {
    superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'super@matrimonyhub.com',
      password: 'hashedPassword123',
      role: 'Super Admin',
      status: 'Active'
    });
    superToken = signAdminToken(superAdmin);

    moderator = await Admin.create({
      name: 'Moderator Staff',
      email: 'mod@matrimonyhub.com',
      password: 'hashedPassword123',
      role: 'Moderator',
      status: 'Active'
    });
    moderatorToken = signAdminToken(moderator);

    alice = await User.create({ mobile: '9844400001', name: 'Alice Garg', accountStatus: 'Active' });
    bob = await User.create({ mobile: '9844400002', name: 'Bob Bansal', accountStatus: 'Active' });

    aliceProfile = await Profile.create({
      userId: alice._id,
      profileId: 'PRF-930001',
      fullName: 'Alice Garg',
      gender: 'Female',
      dob: new Date('1997-01-20'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      city: 'Jaipur'
    });

    bobProfile = await Profile.create({
      userId: bob._id,
      profileId: 'PRF-930002',
      fullName: 'Bob Bansal',
      gender: 'Male',
      dob: new Date('1994-11-02'),
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      city: 'Delhi'
    });

    alice.activeProfileId = aliceProfile._id;
    alice.profiles = [aliceProfile._id];
    await alice.save();

    bob.activeProfileId = bobProfile._id;
    bob.profiles = [bobProfile._id];
    await bob.save();

    plan = await Plan.create({
      name: 'Gold Monthly',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      isActive: true,
      chatAccess: true
    });
  });

  describe('1. Delete user', () => {
    it('deletes the account and cascades to its data', async () => {
      await Interest.create({
        senderUserId: alice._id,
        senderProfileId: aliceProfile._id,
        recipientUserId: bob._id,
        recipientProfileId: bobProfile._id,
        status: 'Pending'
      });

      const res = await request(app)
        .delete(`/api/admin/users/${alice._id}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ reason: 'Fraudulent profile' });

      expect(res.status).toBe(200);
      expect(res.body.data.profilesDeleted).toBe(1);
      expect(await User.findById(alice._id)).toBeNull();
      expect(await Profile.countDocuments({ userId: alice._id })).toBe(0);
      expect(await Interest.countDocuments({ senderUserId: alice._id })).toBe(0);
    });

    it('writes an audit log entry', async () => {
      await request(app)
        .delete(`/api/admin/users/${alice._id}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ reason: 'Policy breach' });

      const log = await AuditLog.findOne({ action: 'User Account Deleted' });
      expect(log).not.toBeNull();
      expect(log.details).toMatch(/Policy breach/);
    });

    it('forbids a Moderator from deleting accounts', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${alice._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(403);
      expect(await User.findById(alice._id)).not.toBeNull();
    });

    it('404s for an unknown user', async () => {
      const res = await request(app)
        .delete('/api/admin/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('2. Subscriptions', () => {
    it('lists subscriptions with subscriber and plan details', async () => {
      await Subscription.create({
        userId: alice._id,
        planId: plan._id,
        billingCycle: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: 'Active',
        amountPaid: 999
      });

      const res = await request(app)
        .get('/api/admin/subscriptions')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].userId.name).toBe('Alice Garg');
      expect(res.body.data.items[0].planId.name).toBe('Gold Monthly');
    });

    it('filters by status', async () => {
      await Subscription.create({
        userId: alice._id,
        planId: plan._id,
        billingCycle: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: 'Cancelled',
        amountPaid: 999
      });

      const res = await request(app)
        .get('/api/admin/subscriptions?status=Active')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('requires admin authentication', async () => {
      const res = await request(app).get('/api/admin/subscriptions');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Block records', () => {
    it('lists blocks with both parties populated', async () => {
      await Block.create({
        blockerUserId: alice._id,
        blockerProfileId: aliceProfile._id,
        blockedUserId: bob._id,
        blockedProfileId: bobProfile._id,
        reason: 'Harassment'
      });

      const res = await request(app)
        .get('/api/admin/blocks')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].blockerUserId.name).toBe('Alice Garg');
      expect(res.body.data.items[0].blockedUserId.name).toBe('Bob Bansal');
      expect(res.body.data.items[0].reason).toBe('Harassment');
    });
  });

  describe('4. Featured placement', () => {
    it('features a profile and logs the action', async () => {
      const res = await request(app)
        .put(`/api/admin/profiles/${aliceProfile._id}/featured`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ isFeatured: true });

      expect(res.status).toBe(200);
      expect((await Profile.findById(aliceProfile._id)).isFeatured).toBe(true);
      expect(await AuditLog.findOne({ action: 'Profile Featured' })).not.toBeNull();
    });

    it('unfeatures a profile', async () => {
      await Profile.findByIdAndUpdate(aliceProfile._id, { isFeatured: true });

      const res = await request(app)
        .put(`/api/admin/profiles/${aliceProfile._id}/featured`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ isFeatured: false });

      expect(res.status).toBe(200);
      expect((await Profile.findById(aliceProfile._id)).isFeatured).toBe(false);
    });

    it('resolves the custom PRF- profile id', async () => {
      const res = await request(app)
        .put('/api/admin/profiles/PRF-930001/featured')
        .set('Authorization', `Bearer ${superToken}`)
        .send({ isFeatured: true });

      expect(res.status).toBe(200);
    });

    it('rejects a non-boolean isFeatured', async () => {
      const res = await request(app)
        .put(`/api/admin/profiles/${aliceProfile._id}/featured`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ isFeatured: 'yes' });

      expect(res.status).toBe(400);
    });

    it('404s for an unknown profile', async () => {
      const res = await request(app)
        .put('/api/admin/profiles/PRF-000000/featured')
        .set('Authorization', `Bearer ${superToken}`)
        .send({ isFeatured: true });

      expect(res.status).toBe(404);
    });
  });

  describe('5. Match pairs', () => {
    /** A mutually accepted interest - the real definition of "matched" the app uses everywhere else. */
    async function acceptInterest() {
      return Interest.create({
        senderUserId: alice._id,
        senderProfileId: aliceProfile._id,
        recipientUserId: bob._id,
        recipientProfileId: bobProfile._id,
        status: 'Accepted',
        respondedAt: new Date()
      });
    }

    it('lists an accepted interest as a matched pair with a live-computed score', async () => {
      await acceptInterest();
      const expectedScore = calculateMatchScore(aliceProfile, bobProfile).totalScore;

      const res = await request(app)
        .get('/api/admin/matches')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].matchScore).toBe(expectedScore);
    });

    it('does not list a pending (unaccepted) interest', async () => {
      await Interest.create({
        senderUserId: alice._id,
        senderProfileId: aliceProfile._id,
        recipientUserId: bob._id,
        recipientProfileId: bobProfile._id,
        status: 'Pending'
      });

      const res = await request(app)
        .get('/api/admin/matches')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('includes the owning account name for each side', async () => {
      await acceptInterest();

      const res = await request(app)
        .get('/api/admin/matches')
        .set('Authorization', `Bearer ${superToken}`);

      expect(res.body.data.items[0].profile.ownerName).toBe('Alice Garg');
      expect(res.body.data.items[0].matchedProfile.ownerName).toBe('Bob Bansal');
    });

    it('applies the minimum score filter', async () => {
      await acceptInterest();
      const actualScore = calculateMatchScore(aliceProfile, bobProfile).totalScore;

      const tooHigh = await request(app)
        .get(`/api/admin/matches?minScore=${actualScore + 1}`)
        .set('Authorization', `Bearer ${superToken}`);
      expect(tooHigh.status).toBe(200);
      expect(tooHigh.body.data.items).toHaveLength(0);

      const atThreshold = await request(app)
        .get(`/api/admin/matches?minScore=${actualScore}`)
        .set('Authorization', `Bearer ${superToken}`);
      expect(atThreshold.status).toBe(200);
      expect(atThreshold.body.data.items).toHaveLength(1);
    });

    it('requires admin authentication', async () => {
      const res = await request(app).get('/api/admin/matches');
      expect(res.status).toBe(401);
    });
  });
});
