/**
 * Challenger M4 Empirical Verification Test Suite
 * Stress testing & Adversarial validation for Milestone 4:
 * 1. Razorpay HMAC Signature Forgery & Tamper Resistance
 * 2. Webhook Replay Attack & Event Idempotency
 * 3. Subscription Expiration, Transition & Cancellation Edge Cases
 * 4. KYC Document Submission Edge Cases & Missing Payloads
 * 5. Multi-Profile Verification Badge Sync on Admin Approval
 * 6. Admin KYC Rejection Workflow & Immutable Audit Trail Logging
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Verification = require('../models/Verification');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const seedPlans = require('../scripts/seedPlans');
const { signAccessToken, signAdminToken } = require('../utils/token');
const env = require('../config/env');

describe('Challenger M4: Adversarial Stress & Edge Case Verification Suite', () => {
  let user1, user2, user3, adminUser;
  let user1Token, user2Token, user3Token, adminToken;
  let goldPlan, platinumPlan, diamondPlan;
  let dummyDocBuffer;

  beforeAll(() => {
    dummyDocBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  beforeEach(async () => {
    // Seed default subscription plans
    await seedPlans();
    goldPlan = await Plan.findOne({ name: 'Gold' });
    platinumPlan = await Plan.findOne({ name: 'Platinum' });
    diamondPlan = await Plan.findOne({ name: 'Diamond' });

    // 1. Create User 1
    user1 = await User.create({
      mobile: '9820000001',
      name: 'Aditya Agrawal',
      email: 'aditya@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0,
      verificationStatus: 'Unverified'
    });
    user1Token = signAccessToken(user1);

    // 2. Create User 2
    user2 = await User.create({
      mobile: '9820000002',
      name: 'Bhavna Bansal',
      email: 'bhavna@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0,
      verificationStatus: 'Unverified'
    });
    user2Token = signAccessToken(user2);

    // 3. Create User 3 (For Multi-Profile sync testing)
    user3 = await User.create({
      mobile: '9820000003',
      name: 'Chirag Garg',
      email: 'chirag@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0,
      verificationStatus: 'Unverified'
    });
    user3Token = signAccessToken(user3);

    // 4. Create Super Admin
    adminUser = await Admin.create({
      name: 'Chief Security Officer',
      email: 'security@matrimonyhub.com',
      password: 'hashed_admin_pass_123',
      role: 'Super Admin',
      status: 'Active'
    });
    adminToken = signAdminToken(adminUser);
  });

  // =========================================================================
  // 1. Razorpay HMAC Signature Forgery & Cryptographic Tamper Resistance
  // =========================================================================
  describe('1. Razorpay HMAC Signature Forgery & Verification Attacks', () => {
    let orderId, paymentId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          planId: goldPlan._id.toString(),
          billingCycle: 'monthly'
        });
      expect(orderRes.status).toBe(201);
      orderId = orderRes.body.data.orderId;
      paymentId = `pay_challenger_${Date.now()}`;
    });

    it('Should reject completely forged client payment signature with 400 and code INVALID_SIGNATURE', async () => {
      const forgedSignature = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          orderId,
          paymentId,
          signature: forgedSignature
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_SIGNATURE');

      // Payment document in DB must be transitioned to 'Failed'
      const paymentDoc = await Payment.findOne({ orderId });
      expect(paymentDoc).toBeTruthy();
      expect(paymentDoc.status).toBe('Failed');

      // User must NOT have active subscription
      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Free');
      expect(user.subscriptionPlan).toBe('Free');
    });

    it('Should reject subtly tampered signature (1 bit/character flipped) with 400', async () => {
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Flip the last character
      const lastChar = validSignature.slice(-1);
      const flippedChar = lastChar === 'a' ? 'b' : 'a';
      const tamperedSignature = validSignature.slice(0, -1) + flippedChar;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          orderId,
          paymentId,
          signature: tamperedSignature
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_SIGNATURE');
    });

    it('Should reject payment verification with missing parameters (missing paymentId or signature)', async () => {
      const res1 = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ orderId, signature: 'some_sig' });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ orderId, paymentId });
      expect(res2.status).toBe(400);
    });

    it('Should reject webhook with forged x-razorpay-signature header with 400', async () => {
      const webhookPayload = {
        entity: 'event',
        event: 'payment.captured',
        id: `evt_forgery_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 99900,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      };

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'forged_webhook_hmac_signature_hex_value_000000000000000000000000')
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*signature/i);

      // Subscription should NOT be activated
      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Free');
    });

    it('Should reject webhook when x-razorpay-signature header is omitted entirely', async () => {
      const webhookPayload = {
        entity: 'event',
        event: 'payment.captured',
        id: `evt_nosig_${Date.now()}`
      };

      const res = await request(app)
        .post('/api/payments/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Should successfully verify authentic client HMAC SHA256 signature and activate Gold subscription', async () => {
      const authenticSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          orderId,
          paymentId,
          signature: authenticSignature
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('Success');
      expect(res.body.data.subscription.status).toBe('Active');

      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Active');
      expect(user.subscriptionPlan).toBe('Gold');
      expect(user.contactViewLimit).toBe(50);
    });
  });

  // =========================================================================
  // 2. Webhook Replay Attack & Duplicate Event Idempotency
  // =========================================================================
  describe('2. Webhook Replay Attack & Event Idempotency', () => {
    let orderId, paymentId, webhookPayload, validWebhookSignature;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          planId: platinumPlan._id.toString(),
          billingCycle: 'monthly'
        });
      orderId = orderRes.body.data.orderId;
      paymentId = `pay_replay_${Date.now()}`;

      webhookPayload = {
        entity: 'event',
        account_id: 'acc_test_replay',
        event: 'payment.captured',
        id: `evt_replay_test_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: platinumPlan.monthlyPrice * 100,
              currency: 'INR',
              status: 'captured',
              method: 'upi'
            }
          }
        }
      };

      const payloadString = JSON.stringify(webhookPayload);
      validWebhookSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(payloadString)
        .digest('hex');
    });

    it('Should process initial webhook, then handle subsequent replay attacks idempotently without duplicate records', async () => {
      // 1st delivery (Valid Webhook Event)
      const res1 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSignature)
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const userAfter1 = await User.findById(user2._id);
      expect(userAfter1.subscriptionStatus).toBe('Active');
      expect(userAfter1.subscriptionPlan).toBe('Platinum');

      const subsCount1 = await Subscription.countDocuments({ userId: user2._id, status: 'Active' });
      expect(subsCount1).toBe(1);

      // 2nd delivery (Replay / Duplicate webhook from network retry)
      const res2 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSignature)
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.data.idempotent).toBe(true);

      // 3rd delivery (Another replay)
      const res3 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSignature)
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res3.status).toBe(200);
      expect(res3.body.data.idempotent).toBe(true);

      // Verify that there is STILL only 1 active subscription and contact limits are not multiplied
      const subsCountFinal = await Subscription.countDocuments({ userId: user2._id, status: 'Active' });
      expect(subsCountFinal).toBe(1);

      const userFinal = await User.findById(user2._id);
      expect(userFinal.contactViewLimit).toBe(platinumPlan.contactViewLimit);
    });

    it('Should cleanly accept unhandled webhook events (e.g. payment.failed) without crashing', async () => {
      const ignoredPayload = {
        entity: 'event',
        event: 'payment.failed',
        id: `evt_failed_${Date.now()}`,
        payload: { payment: { entity: { id: 'pay_failed_1' } } }
      };
      const raw = JSON.stringify(ignoredPayload);
      const sig = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(raw)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', sig)
        .send(ignoredPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/ignored/i);
    });
  });

  // =========================================================================
  // 3. Subscription Expiration, State Transitions & Cancellation Edge Cases
  // =========================================================================
  describe('3. Subscription Expiration & Cancellation Edge Cases', () => {
    it('Should accurately determine subscription active state based on endDate', async () => {
      // Past subscription
      const pastSub = await Subscription.create({
        userId: user1._id,
        planId: goldPlan._id,
        billingCycle: 'monthly',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'Active',
        amountPaid: 999
      });

      expect(pastSub.isCurrentlyActive()).toBe(false);

      // Future subscription
      const activeSub = await Subscription.create({
        userId: user1._id,
        planId: goldPlan._id,
        billingCycle: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Active',
        amountPaid: 999
      });

      expect(activeSub.isCurrentlyActive()).toBe(true);
    });

    it('GET /api/subscriptions/current should return null activeSubscription if endDate has expired', async () => {
      // Create expired subscription record
      await Subscription.create({
        userId: user1._id,
        planId: goldPlan._id,
        billingCycle: 'monthly',
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'Active', // Status in doc is Active, but endDate is past
        amountPaid: 999
      });

      await User.findByIdAndUpdate(user1._id, {
        subscriptionPlan: 'Gold',
        subscriptionStatus: 'Active',
        subscriptionExpiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });

      const res = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // activeSubscription should be null because endDate < Date.now()
      expect(res.body.data.subscription.activeSubscription).toBeNull();
    });

    it('Activating a new subscription should mark previous active subscriptions as Expired', async () => {
      // 1st sub: Gold
      const order1Res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ planId: goldPlan._id.toString() });
      const order1Id = order1Res.body.data.orderId;
      const pay1Id = 'pay_sub1';
      const sig1 = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${order1Id}|${pay1Id}`)
        .digest('hex');

      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ orderId: order1Id, paymentId: pay1Id, signature: sig1 });

      const sub1 = await Subscription.findOne({ orderId: order1Id });
      expect(sub1.status).toBe('Active');

      // 2nd sub: Upgrade to Diamond
      const order2Res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ planId: diamondPlan._id.toString() });
      const order2Id = order2Res.body.data.orderId;
      const pay2Id = 'pay_sub2';
      const sig2 = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${order2Id}|${pay2Id}`)
        .digest('hex');

      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ orderId: order2Id, paymentId: pay2Id, signature: sig2 });

      // Check sub1 status is now Expired
      const sub1After = await Subscription.findById(sub1._id);
      expect(sub1After.status).toBe('Expired');

      // Check sub2 is Active
      const sub2 = await Subscription.findOne({ orderId: order2Id });
      expect(sub2.status).toBe('Active');

      // User account is Diamond
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.subscriptionPlan).toBe('Diamond');
    });

    it('POST /api/subscriptions/cancel should cancel active subscription and update user status', async () => {
      // Activate sub
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ planId: goldPlan._id.toString() });
      const orderId = orderRes.body.data.orderId;
      const payId = 'pay_cancel_test';
      const sig = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${payId}`)
        .digest('hex');

      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ orderId, paymentId: payId, signature: sig });

      // Now cancel
      const cancelRes = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reason: 'Found alliance offline' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.subscription.status).toBe('Cancelled');
      expect(cancelRes.body.data.subscription.cancellationReason).toBe('Found alliance offline');
      expect(cancelRes.body.data.subscription.cancelledAt).toBeDefined();

      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Cancelled');
    });

    it('POST /api/subscriptions/cancel should fail with 400 when user has no active subscription', async () => {
      const res = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ reason: 'No active plan' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no active subscription/i);
    });
  });

  // =========================================================================
  // 4. KYC Document Submission Edge Cases & Missing Payloads
  // =========================================================================
  describe('4. KYC Document Submission Validation & Edge Cases', () => {
    it('Should reject KYC submission when no document files or URLs are provided with 400', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          documentType: 'Aadhaar Card',
          documentNumber: '1234-5678-9012'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least one verification document/i);
    });

    it('Should reject unauthenticated KYC submission with 401', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .send({
          documentType: 'Aadhaar Card',
          idProofUrl: '/uploads/documents/doc.png'
        });

      expect(res.status).toBe(401);
    });

    it('Should successfully accept multipart upload with single idProof document', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${user1Token}`)
        .field('documentType', 'Voter ID')
        .field('documentNumber', 'VTR-998877')
        .attach('idProof', dummyDocBuffer, 'voter_id.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.status).toBe('Pending');
      expect(res.body.data.verification.documentType).toBe('Voter ID');
      expect(res.body.data.verification.documentNumber).toBe('VTR-998877');

      const user = await User.findById(user1._id);
      expect(user.verificationStatus).toBe('Pending');
    });
  });

  // =========================================================================
  // 5. Multi-Profile Verification Badge Synchronization
  // =========================================================================
  describe('5. Multi-Profile Verification Badge Synchronization (1 User -> N Profiles)', () => {
    let profileA, profileB, profileC, otherUserProfile;

    beforeEach(async () => {
      // User 3 creates 3 distinct candidate profiles (e.g., Self, Brother, Sister)
      profileA = await Profile.create({
        userId: user3._id,
        profileId: 'PRF-M4-001',
        fullName: 'Chirag Garg (Self)',
        gender: 'Male',
        dob: new Date('1995-05-15'),
        gotra: 'Garg',
        motherGotra: 'Goyal',
        profileFor: 'Self',
        verified: false
      });

      profileB = await Profile.create({
        userId: user3._id,
        profileId: 'PRF-M4-002',
        fullName: 'Deepak Garg (Brother)',
        gender: 'Male',
        dob: new Date('1997-09-20'),
        gotra: 'Garg',
        motherGotra: 'Goyal',
        profileFor: 'Brother',
        verified: false
      });

      profileC = await Profile.create({
        userId: user3._id,
        profileId: 'PRF-M4-003',
        fullName: 'Divya Garg (Sister)',
        gender: 'Female',
        dob: new Date('2000-01-10'),
        gotra: 'Garg',
        motherGotra: 'Goyal',
        profileFor: 'Sister',
        verified: false
      });

      await User.findByIdAndUpdate(user3._id, {
        activeProfileId: profileA._id,
        profiles: [profileA._id, profileB._id, profileC._id]
      });

      // User 2 creates 1 candidate profile (Must remain unverified when User 3 is approved)
      otherUserProfile = await Profile.create({
        userId: user2._id,
        profileId: 'PRF-M4-004',
        fullName: 'Bhavna Bansal',
        gender: 'Female',
        dob: new Date('1998-04-12'),
        gotra: 'Bansal',
        motherGotra: 'Singhal',
        verified: false
      });
    });

    it('Admin approving KYC must synchronize verified: true to ALL 3 Candidate Profiles of the user', async () => {
      // Verify initial state: all profiles verified = false
      const preA = await Profile.findById(profileA._id);
      const preB = await Profile.findById(profileB._id);
      const preC = await Profile.findById(profileC._id);
      const preOther = await Profile.findById(otherUserProfile._id);

      expect(preA.verified).toBe(false);
      expect(preB.verified).toBe(false);
      expect(preC.verified).toBe(false);
      expect(preOther.verified).toBe(false);

      // User 3 submits KYC
      const submitRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          documentType: 'Aadhaar Card',
          documentNumber: '1122-3344-5566',
          idProofUrl: '/uploads/documents/chirag_aadhaar.png',
          professionProofUrl: '/uploads/documents/chirag_degree.pdf'
        });

      expect(submitRes.status).toBe(201);
      const verificationId = submitRes.body.data.verification._id;

      // Admin approves verification
      const approveRes = await request(app)
        .put(`/api/admin/verifications/${verificationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Verified against national database successfully.' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.verification.status).toBe('Approved');
      expect(approveRes.body.data.userVerificationStatus).toBe('Approved');
      expect(approveRes.body.data.profilesSynchronized).toBe(3);

      // Assert User 3 is Approved
      const user3Updated = await User.findById(user3._id);
      expect(user3Updated.verificationStatus).toBe('Approved');

      // Assert ALL 3 Candidate Profiles are verified = true!
      const postA = await Profile.findById(profileA._id);
      const postB = await Profile.findById(profileB._id);
      const postC = await Profile.findById(profileC._id);

      expect(postA.verified).toBe(true);
      expect(postB.verified).toBe(true);
      expect(postC.verified).toBe(true);

      // Assert User 2 profile is untouched (remains false)
      const postOther = await Profile.findById(otherUserProfile._id);
      expect(postOther.verified).toBe(false);

      // Assert Immutable Audit Log entry exists
      const auditLog = await AuditLog.findOne({
        action: 'Approved KYC Verification',
        target: verificationId.toString()
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog.adminName).toBe(adminUser.name);
      expect(auditLog.details).toContain('Synchronized 3 profile(s)');
      expect(auditLog.metadata.profilesSynced).toBe(3);
    });
  });

  // =========================================================================
  // 6. Admin KYC Rejection Workflow & Audit Trail
  // =========================================================================
  describe('6. Admin KYC Rejection Workflow & Audit Trail', () => {
    let verificationId, candidateProfile;

    beforeEach(async () => {
      candidateProfile = await Profile.create({
        userId: user1._id,
        profileId: 'PRF-REJ-001',
        fullName: 'Aditya Agrawal',
        gender: 'Male',
        dob: new Date('1994-06-10'),
        gotra: 'Bansal',
        motherGotra: 'Garg',
        verified: false
      });

      const submitRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          documentType: 'PAN Card',
          documentNumber: 'ABCDE1234F',
          idProofUrl: '/uploads/documents/blurry_card.jpg'
        });

      verificationId = submitRes.body.data.verification._id;
    });

    it('Admin rejection should update verification status, user status, keep profiles unverified, and log audit trail', async () => {
      const rejectRes = await request(app)
        .put(`/api/admin/verifications/${verificationId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'ID document is unreadable / blurred photo',
          rejectionCategory: 'Document Quality',
          notes: 'Please re-upload a higher resolution PDF or JPG.'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.verification.status).toBe('Rejected');
      expect(rejectRes.body.data.verification.rejectionReason).toBe('ID document is unreadable / blurred photo');
      expect(rejectRes.body.data.verification.rejectionCategory).toBe('Document Quality');
      expect(rejectRes.body.data.userVerificationStatus).toBe('Rejected');

      // Verify User status in DB
      const user = await User.findById(user1._id);
      expect(user.verificationStatus).toBe('Rejected');

      // Verify Profile remains verified: false
      const profile = await Profile.findById(candidateProfile._id);
      expect(profile.verified).toBe(false);

      // Verify Audit Log
      const log = await AuditLog.findOne({
        action: 'Rejected KYC Verification',
        target: verificationId.toString()
      });

      expect(log).toBeTruthy();
      expect(log.adminName).toBe(adminUser.name);
      expect(log.details).toContain('Rejected KYC document');
      expect(log.metadata.rejectionCategory).toBe('Document Quality');
    });

    it('Rejecting non-existent verification ID should return 404', async () => {
      const res = await request(app)
        .put('/api/admin/verifications/65f000000000000000000000/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Non-admin users should be forbidden with 401 when attempting approval or rejection', async () => {
      const resApprove = await request(app)
        .put(`/api/admin/verifications/${verificationId}/approve`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(resApprove.status).toBe(401);

      const resReject = await request(app)
        .put(`/api/admin/verifications/${verificationId}/reject`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reason: 'Test' });
      expect(resReject.status).toBe(401);
    });
  });
});
