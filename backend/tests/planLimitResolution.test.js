/**
 * Plan Limit Resolution Test Suite
 * Agrawal Matrimony Platform
 *
 * Reproduces the exact bug reported in production: a user whose plan was
 * assigned by any path other than paymentService.activateUserSubscription
 * (an admin action, a seed script) has subscriptionPlanId correctly pointing
 * at a paid Plan, but the denormalized User.dailyMatchLimit /
 * User.contactViewLimit fields are left at their zero schema default. Every
 * limit check must resolve live from the linked plan, not those fields.
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Plan = require('../models/Plan');
const { signAccessToken } = require('../utils/token');
const matchQuotaService = require('../services/matchQuotaService');

describe('Plan limit resolution (desynced denormalized fields)', () => {
  let platinumPlan;

  beforeEach(async () => {
    platinumPlan = await Plan.create({
      planId: 'platinum',
      name: 'Platinum',
      monthlyPrice: 1999,
      yearlyPrice: 8999,
      contactViewLimit: 150,
      dailyMatchLimit: -1
    });

    await Plan.create({
      planId: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      contactViewLimit: 0,
      dailyMatchLimit: 5
    });
  });

  /**
   * A user linked to Platinum via subscriptionPlanId (as an admin/seed path
   * would do) but whose cached limit fields were never synced - exactly the
   * state the reported bug was found in.
   */
  async function makeDesyncedPlatinumUser(mobile) {
    const user = await User.create({
      mobile,
      name: 'Desynced Platinum User',
      accountStatus: 'Active',
      subscriptionPlan: 'Platinum',
      subscriptionPlanId: platinumPlan._id
      // dailyMatchLimit / contactViewLimit left at their 0 schema default -
      // never touched by whatever path linked subscriptionPlanId.
    });
    const profile = await Profile.create({
      userId: user._id,
      profileId: 'PRF-DESYNC-001',
      fullName: 'Desynced Platinum User',
      gender: 'Female',
      dob: new Date('1996-06-15'),
      gotra: 'Garg',
      motherGotra: 'Mittal',
      city: 'Jaipur'
    });
    user.activeProfileId = profile._id;
    user.profiles = [profile._id];
    await user.save();
    return { user, profile, token: signAccessToken(user) };
  }

  it('matchQuotaService resolves the real Platinum daily limit, not the stale 0 field', async () => {
    const { user } = await makeDesyncedPlatinumUser('9833000001');
    expect(user.dailyMatchLimit).toBe(0);

    const status = await matchQuotaService.getQuotaStatus(user);
    expect(status.unlimited).toBe(true);
    expect(status.limit).toBe(-1);
  });

  it('GET /api/contacts/quota reports the real Platinum contact limit, not the stale 0 field', async () => {
    const { user, token } = await makeDesyncedPlatinumUser('9833000002');
    expect(user.contactViewLimit).toBe(0);

    const res = await request(app)
      .get('/api/contacts/quota')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.limit).toBe(150);
    expect(res.body.data.remaining).toBe(150);
  });

  it('POST /api/contacts/unlock actually succeeds for a desynced Platinum user instead of hitting the Free-tier wall', async () => {
    const { token } = await makeDesyncedPlatinumUser('9833000003');

    const target = await User.create({ mobile: '9833000004', name: 'Target', accountStatus: 'Active' });
    const targetProfile = await Profile.create({
      userId: target._id,
      profileId: 'PRF-DESYNC-002',
      fullName: 'Target Candidate',
      gender: 'Male',
      dob: new Date('1994-01-01'),
      gotra: 'Bansal',
      motherGotra: 'Jindal',
      city: 'Delhi',
      email: 'target@example.com',
      residentialAddress: '1 Test Street'
    });

    const res = await request(app)
      .post('/api/contacts/unlock')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetProfileId: targetProfile._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.contact.email).toBe('target@example.com');
    expect(res.body.data.remainingUnlocks).toBe(149);
  });
});
