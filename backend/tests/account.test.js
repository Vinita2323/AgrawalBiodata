/**
 * Account Lifecycle, Contact Unlock & Preferences Test Suite
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. Mobile change (OTP-verified) and email change, including collisions
 * 2. Deactivate / reactivate and its effect on match discovery
 * 3. Permanent deletion and its data cascade
 * 4. Contact unlock quota accounting and the no-double-charge guarantee
 * 5. Partner preferences and saved search history
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const Notification = require('../models/Notification');
const ContactUnlock = require('../models/ContactUnlock');
const SavedSearch = require('../models/SavedSearch');
const Plan = require('../models/Plan');
const otpService = require('../services/otpService');
const { signAccessToken } = require('../utils/token');

describe('Account Lifecycle, Contacts & Preferences', () => {
  let alice, bob, aliceToken, bobToken, aliceProfile, bobProfile;

  beforeEach(async () => {
    alice = await User.create({
      mobile: '9833300001',
      name: 'Alice Garg',
      email: 'alice@example.com',
      accountStatus: 'Active'
    });
    bob = await User.create({
      mobile: '9833300002',
      name: 'Bob Bansal',
      email: 'bob@example.com',
      accountStatus: 'Active'
    });

    aliceToken = signAccessToken(alice);
    bobToken = signAccessToken(bob);

    aliceProfile = await Profile.create({
      userId: alice._id,
      profileId: 'PRF-920001',
      fullName: 'Alice Garg',
      gender: 'Female',
      dob: new Date('1997-03-12'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      city: 'Jaipur',
      mobileNumber: '9833300001',
      residentialAddress: '12 Malviya Nagar, Jaipur'
    });

    bobProfile = await Profile.create({
      userId: bob._id,
      profileId: 'PRF-920002',
      fullName: 'Bob Bansal',
      gender: 'Male',
      dob: new Date('1994-08-05'),
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      city: 'Delhi',
      mobileNumber: '9833300002',
      residentialAddress: 'B-42 South Extension, Delhi'
    });

    alice.activeProfileId = aliceProfile._id;
    alice.profiles = [aliceProfile._id];
    await alice.save();

    bob.activeProfileId = bobProfile._id;
    bob.profiles = [bobProfile._id];
    await bob.save();
  });

  describe('1. Contact details', () => {
    it('sends an OTP to the new number and switches on confirmation', async () => {
      const requested = await request(app)
        .post('/api/account/mobile/request-otp')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: '9999900001' });

      expect(requested.status).toBe(200);
      const otp = requested.body.data.devOtp;
      expect(otp).toHaveLength(6);

      const changed = await request(app)
        .put('/api/account/mobile')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: '9999900001', otp });

      expect(changed.status).toBe(200);
      expect((await User.findById(alice._id)).mobile).toBe('9999900001');
    });

    it('rejects a mobile already registered to someone else', async () => {
      const res = await request(app)
        .post('/api/account/mobile/request-otp')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: bob.mobile });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('rejects the current number as a change target', async () => {
      const res = await request(app)
        .post('/api/account/mobile/request-otp')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: alice.mobile });

      expect(res.status).toBe(400);
    });

    it('rejects a mobile change with a wrong OTP', async () => {
      await request(app)
        .post('/api/account/mobile/request-otp')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: '9999900002' });

      const res = await request(app)
        .put('/api/account/mobile')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ mobile: '9999900002', otp: '000000' });

      expect(res.status).toBe(400);
      expect((await User.findById(alice._id)).mobile).toBe('9833300001');
    });

    it('changes the email address', async () => {
      const res = await request(app)
        .put('/api/account/email')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'Alice.New@Example.COM' });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('alice.new@example.com');
    });

    it('rejects a malformed email', async () => {
      const res = await request(app)
        .put('/api/account/email')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('rejects an email already in use', async () => {
      const res = await request(app)
        .put('/api/account/email')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ email: 'bob@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Deactivate & reactivate', () => {
    it('hides every candidate profile on deactivation', async () => {
      const res = await request(app)
        .put('/api/account/deactivate')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe('Deactivated');
      expect((await Profile.findById(aliceProfile._id)).isHidden).toBe(true);
    });

    it('removes a deactivated profile from match discovery', async () => {
      const before = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(before.body.data.matches.length).toBeGreaterThan(0);

      await request(app)
        .put('/api/account/deactivate')
        .set('Authorization', `Bearer ${aliceToken}`);

      const after = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(after.body.data.matches).toHaveLength(0);
    });

    it('restores visibility on reactivation', async () => {
      await request(app).put('/api/account/deactivate').set('Authorization', `Bearer ${aliceToken}`);
      const res = await request(app)
        .put('/api/account/reactivate')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect((await Profile.findById(aliceProfile._id)).isHidden).toBe(false);
    });

    it('reactivates automatically when the user logs back in', async () => {
      await request(app).put('/api/account/deactivate').set('Authorization', `Bearer ${aliceToken}`);

      const otpRes = await otpService.requestOtp(alice.mobile);
      const login = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: alice.mobile, otp: otpRes.data.devOtp });

      expect(login.status).toBe(200);
      expect(login.body.data.user.accountStatus).toBe('Active');
      expect((await Profile.findById(aliceProfile._id)).isHidden).toBe(false);
    });

    it('refuses to deactivate a suspended account', async () => {
      await User.findByIdAndUpdate(alice._id, { accountStatus: 'Suspended' });

      const res = await request(app)
        .put('/api/account/deactivate')
        .set('Authorization', `Bearer ${aliceToken}`);

      // The auth middleware rejects suspended accounts before the controller.
      expect(res.status).toBe(403);
    });
  });

  describe('3. Permanent deletion', () => {
    it('requires the literal confirmation string', async () => {
      const res = await request(app)
        .delete('/api/account')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ confirm: 'yes' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CONFIRMATION_REQUIRED');
      expect(await User.findById(alice._id)).not.toBeNull();
    });

    it('deletes the user and cascades to their data', async () => {
      await Interest.create({
        senderUserId: alice._id,
        senderProfileId: aliceProfile._id,
        recipientUserId: bob._id,
        recipientProfileId: bobProfile._id,
        status: 'Pending'
      });
      await Notification.create({
        userId: alice._id,
        type: 'System',
        category: 'Account',
        title: 'Welcome'
      });

      const res = await request(app)
        .delete('/api/account')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ confirm: 'DELETE' });

      expect(res.status).toBe(200);
      expect(await User.findById(alice._id)).toBeNull();
      expect(await Profile.countDocuments({ userId: alice._id })).toBe(0);
      expect(await Interest.countDocuments({ senderUserId: alice._id })).toBe(0);
      expect(await Notification.countDocuments({ userId: alice._id })).toBe(0);

      // Other members are untouched.
      expect(await User.findById(bob._id)).not.toBeNull();
    });
  });

  describe('4. Contact unlock', () => {
    /**
     * Limits resolve live from the user's linked plan (see planLimitService),
     * not from a directly-set User.contactViewLimit field - so tests set up
     * "alice is on a plan with this contact allowance" by linking a real
     * Plan document, the same way any real plan assignment would.
     */
    async function setAliceContactLimit(contactViewLimit) {
      const plan = await Plan.create({
        name: `Test Plan ${Date.now()}-${Math.random().toString(36).slice(2)}`,
        monthlyPrice: 999,
        yearlyPrice: 4999,
        contactViewLimit
      });
      alice.subscriptionPlanId = plan._id;
      await alice.save();
      return plan;
    }

    it('refuses when the plan grants no contact views', async () => {
      const res = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CONTACT_LIMIT_REACHED');
      expect(await ContactUnlock.countDocuments({})).toBe(0);
    });

    it('reveals the address and consumes one view, but never the mobile number', async () => {
      await setAliceContactLimit(2);

      const res = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.contact.residentialAddress).toBe('B-42 South Extension, Delhi');
      expect(res.body.data.contact.mobileNumber).toBeUndefined();
      expect(res.body.data.remainingUnlocks).toBe(1);
      expect((await User.findById(alice._id)).contactViewsUsed).toBe(1);
    });

    it('never charges twice for the same profile', async () => {
      await setAliceContactLimit(2);

      await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      const second = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(second.status).toBe(200);
      expect(second.body.data.alreadyUnlocked).toBe(true);
      expect((await User.findById(alice._id)).contactViewsUsed).toBe(1);
      expect(await ContactUnlock.countDocuments({})).toBe(1);
    });

    it('unlocks free of charge for a connected member', async () => {
      await Interest.create({
        senderUserId: alice._id,
        senderProfileId: aliceProfile._id,
        recipientUserId: bob._id,
        recipientProfileId: bobProfile._id,
        status: 'Accepted',
        respondedAt: new Date()
      });

      const res = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.viaConnection).toBe(true);
      // A connection is free, so the plan allowance is untouched.
      expect((await User.findById(alice._id)).contactViewsUsed).toBe(0);
    });

    it('treats -1 as unlimited', async () => {
      await setAliceContactLimit(-1);

      const res = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.remainingUnlocks).toBeNull();
      expect((await User.findById(alice._id)).contactViewsUsed).toBe(0);
    });

    it('reports the quota', async () => {
      await setAliceContactLimit(5);
      await User.findByIdAndUpdate(alice._id, { contactViewsUsed: 2 });

      const res = await request(app)
        .get('/api/contacts/quota')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ limit: 5, used: 2, remaining: 3, unlimited: false });
    });

    it('reports unlock status per profile', async () => {
      await setAliceContactLimit(1);

      const before = await request(app)
        .get(`/api/contacts/status/${bobProfile._id}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(before.body.data.isUnlocked).toBe(false);

      await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: bobProfile._id.toString() });

      const after = await request(app)
        .get(`/api/contacts/status/${bobProfile._id}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(after.body.data.isUnlocked).toBe(true);
    });

    it('refuses to unlock your own profile', async () => {
      const res = await request(app)
        .post('/api/contacts/unlock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ targetProfileId: aliceProfile._id.toString() });

      expect(res.status).toBe(400);
    });
  });

  describe('5. Partner preferences & saved searches', () => {
    it('returns preferences for the active profile', async () => {
      const res = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferences).toBeDefined();
    });

    it('updates only the supplied fields', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ minAge: 25, maxAge: 32, cities: ['Jaipur', 'Delhi'] });

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.minAge).toBe(25);
      expect(res.body.data.preferences.cities).toEqual(['Jaipur', 'Delhi']);
      expect(res.body.data.preferences.verifiedOnly).toBe(false);
    });

    it('rejects an inverted age range', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ minAge: 40, maxAge: 25 });

      expect(res.status).toBe(400);
    });

    it('rejects an empty preference payload', async () => {
      const res = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ notAField: 1 });

      expect(res.status).toBe(400);
    });

    it('records a search and returns it in history', async () => {
      await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ query: 'Software Engineer', resultCount: 4 });

      const res = await request(app)
        .get('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.searches).toHaveLength(1);
      expect(res.body.data.searches[0].query).toBe('Software Engineer');
    });

    it('bumps an identical repeat search instead of duplicating it', async () => {
      const payload = { query: 'Doctor', filters: {}, resultCount: 2 };

      await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send(payload);
      await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send(payload);

      expect(await SavedSearch.countDocuments({ userId: alice._id })).toBe(1);
    });

    it('caps unsaved history at ten entries', async () => {
      for (let i = 0; i < 13; i += 1) {
        await request(app)
          .post('/api/preferences/searches')
          .set('Authorization', `Bearer ${aliceToken}`)
          .send({ query: `term-${i}` });
      }

      const count = await SavedSearch.countDocuments({ userId: alice._id, isSaved: false });
      expect(count).toBeLessThanOrEqual(10);
    });

    it('rejects a search with neither query nor filters', async () => {
      const res = await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('deletes a search from history', async () => {
      const created = await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ query: 'CA' });

      const res = await request(app)
        .delete(`/api/preferences/searches/${created.body.data.search.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(await SavedSearch.countDocuments({ userId: alice._id })).toBe(0);
    });

    it('refuses to delete another user search', async () => {
      const created = await request(app)
        .post('/api/preferences/searches')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ query: 'CA' });

      const res = await request(app)
        .delete(`/api/preferences/searches/${created.body.data.search.id}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(404);
      expect(await SavedSearch.countDocuments({ userId: alice._id })).toBe(1);
    });
  });
});
