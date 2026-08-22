/**
 * Milestone 4 Integration Test Suite: Plans, Subscriptions & Razorpay Payments
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. Plan CRUD & Validation (Free, Gold, Platinum, Diamond)
 * 2. Razorpay Order Creation (Monthly, Quarterly, Yearly pricing)
 * 3. Client Payment Signature Verification (HMAC SHA256) & Subscription Activation
 * 4. Razorpay Webhook Event Processing (crypto.timingSafeEqual HMAC verification & idempotency)
 * 5. Subscription Status, Remaining Contact Views & Cancellation
 * 6. Payment History & Admin Inspection
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const seedPlans = require('../scripts/seedPlans');
const { signAccessToken, signAdminToken } = require('../utils/token');
const env = require('../config/env');

describe('Milestone 4: Plans, Subscriptions & Razorpay Payments Test Suite', () => {
  let user1, user2, admin;
  let token1, token2, adminToken;
  let goldPlan, platinumPlan, diamondPlan, freePlan;

  beforeEach(async () => {
    // Seed default plans
    await seedPlans();
    goldPlan = await Plan.findOne({ name: 'Gold' });
    platinumPlan = await Plan.findOne({ name: 'Platinum' });
    diamondPlan = await Plan.findOne({ name: 'Diamond' });
    freePlan = await Plan.findOne({ name: 'Free' });

    // Create test users
    user1 = await User.create({
      mobile: '9876540001',
      name: 'Rohan Agrawal',
      email: 'rohan@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0
    });
    token1 = signAccessToken(user1);

    user2 = await User.create({
      mobile: '9876540002',
      name: 'Neha Mittal',
      email: 'neha@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0
    });
    token2 = signAccessToken(user2);

    // Create test admin
    admin = await Admin.create({
      name: 'Super Admin User',
      email: 'admin@matrimonyhub.com',
      password: 'hashed_admin_pass',
      role: 'Super Admin',
      status: 'Active'
    });
    adminToken = signAdminToken(admin);
  });

  describe('1. Plan Listing, Inspection & Admin CRUD', () => {
    it('GET /api/plans should return active subscription plans in order', async () => {
      const res = await request(app).get('/api/plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plans.length).toBeGreaterThanOrEqual(4);

      const planNames = res.body.data.plans.map(p => p.name);
      expect(planNames).toContain('Free');
      expect(planNames).toContain('Gold');
      expect(planNames).toContain('Platinum');
      expect(planNames).toContain('Diamond');
    });

    it('GET /api/plans/:id should return single plan by MongoDB ID, planId slug, or name', async () => {
      // By MongoDB ID
      const resById = await request(app).get(`/api/plans/${goldPlan._id}`);
      expect(resById.status).toBe(200);
      expect(resById.body.data.plan.name).toBe('Gold');
      expect(resById.body.data.plan.monthlyPrice).toBe(999);

      // By slug
      const resBySlug = await request(app).get('/api/plans/gold');
      expect(resBySlug.status).toBe(200);
      expect(resBySlug.body.data.plan.name).toBe('Gold');

      // By name
      const resByName = await request(app).get('/api/plans/Platinum');
      expect(resByName.status).toBe(200);
      expect(resByName.body.data.plan.monthlyPrice).toBe(1999);
    });

    it('GET /api/plans/:id should return 404 for non-existent plan ID', async () => {
      const res = await request(app).get('/api/plans/non-existent-plan-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/plans should allow Super Admin to create a new plan', async () => {
      const newPlanPayload = {
        name: 'Silver Special',
        nameHindi: 'सिल्वर',
        monthlyPrice: 499,
        yearlyPrice: 2499,
        contactViewLimit: 25,
        interestSendLimit: 30,
        features: ['Unlock 25 contact details', 'Send 30 interests', 'Standard support']
      };

      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPlanPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan.name).toBe('Silver Special');
      expect(res.body.data.plan.monthlyPrice).toBe(499);

      // Verify audit log created
      const auditLog = await AuditLog.findOne({ action: 'Created Subscription Plan' });
      expect(auditLog).toBeTruthy();
    });

    it('POST /api/plans should reject unauthenticated or non-admin requests', async () => {
      const resUnauth = await request(app)
        .post('/api/plans')
        .send({ name: 'Hacker Plan', monthlyPrice: 1, yearlyPrice: 1 });
      expect(resUnauth.status).toBe(401);

      const resUser = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Hacker Plan', monthlyPrice: 1, yearlyPrice: 1 });
      expect(resUser.status).toBe(401);
    });

    it('PUT /api/plans/:id should allow Super Admin to update existing plan', async () => {
      const res = await request(app)
        .put(`/api/plans/${goldPlan._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          monthlyPrice: 1099,
          badge: 'Top Seller'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan.monthlyPrice).toBe(1099);
      expect(res.body.data.plan.badge).toBe('Top Seller');
    });

    it('DELETE /api/plans/:id should allow Super Admin to soft-delete plan', async () => {
      const res = await request(app)
        .delete(`/api/plans/${goldPlan._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Plan.findById(goldPlan._id);
      expect(updated.isActive).toBe(false);
    });
  });

  describe('2. Razorpay Order Creation', () => {
    it('POST /api/payments/create-order should generate order for monthly billing cycle', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          planId: goldPlan._id.toString(),
          billingCycle: 'monthly'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBeDefined();
      expect(res.body.data.amount).toBe(99900); // 999 * 100 paise
      expect(res.body.data.currency).toBe('INR');

      // Verify payment doc was created in Created status
      const payment = await Payment.findOne({ orderId: res.body.data.orderId });
      expect(payment).toBeTruthy();
      expect(payment.status).toBe('Created');
      expect(payment.amount).toBe(999);
      expect(payment.userId.toString()).toBe(user1._id.toString());
    });

    it('POST /api/payments/create-order should calculate correct price for yearly billing cycle', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          planId: platinumPlan._id.toString(),
          billingCycle: 'yearly'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(platinumPlan.yearlyPrice * 100);
    });

    it('POST /api/payments/create-order should reject invalid or inactive plan ID', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          planId: '65f000000000000000000000',
          billingCycle: 'monthly'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/payments/create-order should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ planId: goldPlan._id.toString() });

      expect(res.status).toBe(401);
    });
  });

  describe('3. Client Payment Signature Verification & Subscription Activation', () => {
    let orderId, paymentId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          planId: goldPlan._id.toString(),
          billingCycle: 'monthly'
        });
      orderId = orderRes.body.data.orderId;
      paymentId = `pay_${Date.now()}_test`;
    });

    it('POST /api/payments/verify with valid HMAC SHA256 signature should activate subscription', async () => {
      // Generate genuine HMAC SHA256 signature matching server secret
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          orderId,
          paymentId,
          signature: validSignature
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('Success');
      expect(res.body.data.subscription.status).toBe('Active');

      // Verify User record updated
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.subscriptionStatus).toBe('Active');
      expect(updatedUser.subscriptionPlan).toBe('Gold');
      expect(updatedUser.contactViewLimit).toBe(50);
      expect(updatedUser.subscriptionExpiresAt).toBeDefined();

      // Verify Subscription record in DB
      const sub = await Subscription.findOne({ userId: user1._id, status: 'Active' });
      expect(sub).toBeTruthy();
      expect(sub.amountPaid).toBe(999);
      expect(sub.paymentId).toBe(paymentId);
    });

    it('POST /api/payments/verify with invalid/forged signature should reject with 400 and mark payment Failed', async () => {
      const forgedSignature = 'forged_fake_hmac_signature_hex_1234567890abcdef1234567890abcdef';

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          orderId,
          paymentId,
          signature: forgedSignature
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_SIGNATURE');

      // Verify payment marked as Failed
      const payment = await Payment.findOne({ orderId });
      expect(payment.status).toBe('Failed');

      // Verify user subscription was NOT activated
      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Free');
    });

    it('POST /api/payments/verify should reject missing parameters with 400', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({ orderId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Razorpay Webhook Event Handling (crypto.timingSafeEqual & Idempotency)', () => {
    let orderId, paymentId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          planId: platinumPlan._id.toString(),
          billingCycle: 'yearly'
        });
      orderId = orderRes.body.data.orderId;
      paymentId = `pay_wh_${Date.now()}`;
    });

    it('POST /api/payments/webhook should process payment.captured event with valid HMAC SHA256 signature', async () => {
      const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'payment.captured',
        id: `evt_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: platinumPlan.yearlyPrice * 100,
              currency: 'INR',
              status: 'captured',
              method: 'upi'
            }
          }
        }
      };

      const payloadString = JSON.stringify(webhookPayload);
      const validWebhookSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(payloadString)
        .digest('hex');

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSignature)
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify User 2 subscription activated to Platinum
      const user = await User.findById(user2._id);
      expect(user.subscriptionStatus).toBe('Active');
      expect(user.subscriptionPlan).toBe('Platinum');
      expect(user.contactViewLimit).toBe(150);

      // Verify Audit Log was recorded
      const log = await AuditLog.findOne({ action: 'Razorpay Payment Captured (Webhook)' });
      expect(log).toBeTruthy();
    });

    it('POST /api/payments/webhook should handle duplicate delivery idempotently', async () => {
      const webhookPayload = {
        entity: 'event',
        event: 'payment.captured',
        id: `evt_duplicate_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: platinumPlan.yearlyPrice * 100,
              currency: 'INR',
              status: 'captured',
              method: 'netbanking'
            }
          }
        }
      };

      const payloadString = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(payloadString)
        .digest('hex');

      // First webhook delivery
      const res1 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);
      expect(res1.status).toBe(200);

      // Second identical webhook delivery (replay/retry by Razorpay)
      const res2 = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);
      expect(res2.status).toBe(200);
      expect(res2.body.data.idempotent).toBe(true);

      // Ensure no duplicate active subscriptions created
      const activeSubs = await Subscription.find({ userId: user2._id, status: 'Active' });
      expect(activeSubs.length).toBe(1);
    });

    it('POST /api/payments/webhook should reject invalid webhook signature', async () => {
      const webhookPayload = { event: 'payment.captured' };
      const invalidSignature = 'invalid_webhook_signature_string';

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', invalidSignature)
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Subscription Lifecycle, History & Cancellation', () => {
    beforeEach(async () => {
      // Activate a subscription for user1
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token1}`)
        .send({ planId: goldPlan._id.toString() });

      const orderId = orderRes.body.data.orderId;
      const paymentId = 'pay_test_sub_lifecycle';
      const sig = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token1}`)
        .send({ orderId, paymentId, signature: sig });
    });

    it('GET /api/subscriptions/current should return active subscription and view counters', async () => {
      const res = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.status).toBe('Active');
      expect(res.body.data.subscription.planName).toBe('Gold');
      expect(res.body.data.subscription.contactViewLimit).toBe(50);
      expect(res.body.data.subscription.remainingContactViews).toBe(50);
    });

    it('GET /api/subscriptions/history should return paginated subscription records', async () => {
      const res = await request(app)
        .get('/api/subscriptions/history')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].status).toBe('Active');
    });

    it('POST /api/subscriptions/cancel should cancel active subscription', async () => {
      const res = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${token1}`)
        .send({ reason: 'Found matching partner through offline reference' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.status).toBe('Cancelled');

      const user = await User.findById(user1._id);
      expect(user.subscriptionStatus).toBe('Cancelled');
    });

    it('GET /api/payments/history should return user payment transactions', async () => {
      const res = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].status).toBe('Success');
    });

    it('GET /api/payments/admin/all should allow admin to inspect platform payments', async () => {
      const res = await request(app)
        .get('/api/payments/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
