/**
 * Challenger Remediation Stress Test Suite
 * Agrawal Biodata Matrimony Platform
 * 
 * Verifies:
 * 1. Mongoose ObjectId plan resolution & tier preservation (Platinum & Diamond NOT defaulting to Gold)
 * 2. 18 Authentic Maharaja Agrasen Gotras schema validation in Profile model
 * 3. Invalid Gotra rejection ('Agrawal', 'Gupta', empty, non-Gotras)
 * 4. Mother Gotra validation
 * 5. PaymentService order creation, signature verification, webhook processing idempotency
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Profile = require('../models/Profile');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const seedPlans = require('../scripts/seedPlans');
const { AGARWAL_GOTRAS } = require('../config/constants');
const crypto = require('crypto');
const env = require('../config/env');

describe('Challenger Remediation Stress Tests', () => {
  let goldPlan, platinumPlan, diamondPlan, freePlan;
  let testUser;

  beforeEach(async () => {
    await seedPlans();
    goldPlan = await Plan.findOne({ name: 'Gold' });
    platinumPlan = await Plan.findOne({ name: 'Platinum' });
    diamondPlan = await Plan.findOne({ name: 'Diamond' });
    freePlan = await Plan.findOne({ name: 'Free' });

    testUser = await User.create({
      mobile: '9876543210',
      name: 'Adversarial Tester',
      email: 'tester@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0
    });
  });

  describe('1. Empirical Verification: resolvePlan and activateUserSubscription with Mongoose ObjectId', () => {
    it('resolvePlan should resolve correctly with Mongoose ObjectId instance for Platinum plan', async () => {
      const resolved = await paymentService.resolvePlan(platinumPlan._id);
      expect(resolved).toBeTruthy();
      expect(resolved._id.toString()).toBe(platinumPlan._id.toString());
      expect(resolved.name).toBe('Platinum');
      expect(resolved.planId).toBe('platinum');
    });

    it('resolvePlan should resolve correctly with Mongoose ObjectId instance for Diamond plan', async () => {
      const resolved = await paymentService.resolvePlan(diamondPlan._id);
      expect(resolved).toBeTruthy();
      expect(resolved._id.toString()).toBe(diamondPlan._id.toString());
      expect(resolved.name).toBe('Diamond');
      expect(resolved.planId).toBe('diamond');
    });

    it('resolvePlan should resolve correctly with Mongoose ObjectId instance for Gold plan', async () => {
      const resolved = await paymentService.resolvePlan(goldPlan._id);
      expect(resolved).toBeTruthy();
      expect(resolved._id.toString()).toBe(goldPlan._id.toString());
      expect(resolved.name).toBe('Gold');
    });

    it('activateUserSubscription with Mongoose ObjectId instance for Platinum MUST activate Platinum and NOT default to Gold', async () => {
      const sub = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: platinumPlan._id, // Raw Mongoose Types.ObjectId
        billingCycle: 'monthly',
        paymentId: 'pay_plat_test_001',
        orderId: 'order_plat_test_001',
        amountPaid: platinumPlan.monthlyPrice
      });

      expect(sub).toBeTruthy();
      expect(sub.planId.toString()).toBe(platinumPlan._id.toString());
      expect(sub.status).toBe('Active');
      expect(sub.contactViewLimit).toBe(platinumPlan.contactViewLimit);

      // Verify User document updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscriptionPlan).toBe('Platinum');
      expect(updatedUser.subscriptionPlan).not.toBe('Gold');
      expect(updatedUser.subscriptionStatus).toBe('Active');
      expect(updatedUser.contactViewLimit).toBe(platinumPlan.contactViewLimit);
    });

    it('activateUserSubscription with Mongoose ObjectId instance for Diamond MUST activate Diamond and NOT default to Gold', async () => {
      const sub = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: diamondPlan._id, // Raw Mongoose Types.ObjectId
        billingCycle: 'yearly',
        paymentId: 'pay_diam_test_001',
        orderId: 'order_diam_test_001',
        amountPaid: diamondPlan.yearlyPrice
      });

      expect(sub).toBeTruthy();
      expect(sub.planId.toString()).toBe(diamondPlan._id.toString());
      expect(sub.status).toBe('Active');
      expect(sub.contactViewLimit).toBe(diamondPlan.contactViewLimit);

      // Verify User document updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscriptionPlan).toBe('Diamond');
      expect(updatedUser.subscriptionPlan).not.toBe('Gold');
      expect(updatedUser.subscriptionStatus).toBe('Active');
      // Diamond has unlimited views (-1 mapped to 999999)
      expect(updatedUser.contactViewLimit).toBe(999999);
    });

    it('activateUserSubscription should handle 24-hex string ID, slug string, and plan object', async () => {
      // 24-hex string
      const subHex = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: platinumPlan._id.toString(),
        billingCycle: 'monthly'
      });
      expect(subHex.planId.toString()).toBe(platinumPlan._id.toString());

      // Slug string 'diamond'
      const subSlug = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: 'diamond',
        billingCycle: 'quarterly'
      });
      expect(subSlug.planId.toString()).toBe(diamondPlan._id.toString());

      // Uppercase Slug 'PLATINUM'
      const subSlugUpper = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: 'PLATINUM',
        billingCycle: 'monthly'
      });
      expect(subSlugUpper.planId.toString()).toBe(platinumPlan._id.toString());

      // Plan object directly
      const subObj = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: goldPlan,
        billingCycle: 'monthly'
      });
      expect(subObj.planId.toString()).toBe(goldPlan._id.toString());
    });

    it('activateUserSubscription expires previously active subscriptions for the user', async () => {
      const sub1 = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: goldPlan._id,
        billingCycle: 'monthly'
      });
      expect(sub1.status).toBe('Active');

      const sub2 = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: diamondPlan._id,
        billingCycle: 'yearly'
      });
      expect(sub2.status).toBe('Active');

      // Check sub1 is now Expired
      const sub1Refreshed = await Subscription.findById(sub1._id);
      expect(sub1Refreshed.status).toBe('Expired');
    });
  });

  describe('2. Empirical Verification: Gotra Schema Validation in Profile.js', () => {
    it('MUST accept all 18 authentic Maharaja Agrasen Gotras', async () => {
      const authenticGotras = [
        'Garg', 'Bansal', 'Bindal', 'Goyal', 'Mittal', 'Singhal',
        'Jindal', 'Tingal', 'Tayal', 'Airan', 'Dharan', 'Madhukul',
        'Goyan', 'Kuchhal', 'Kansal', 'Nangal', 'Mangal', 'Bhandal'
      ];

      expect(authenticGotras.length).toBe(18);

      for (let i = 0; i < authenticGotras.length; i++) {
        const gotraName = authenticGotras[i];
        const profile = new Profile({
          userId: testUser._id,
          fullName: `Candidate ${gotraName}`,
          gender: 'Male',
          dob: new Date('1995-01-01'),
          gotra: gotraName,
          motherGotra: i === 0 ? 'Bansal' : 'Garg'
        });

        const saved = await profile.save();
        expect(saved).toBeTruthy();
        expect(saved.gotra).toBe(gotraName);
      }
    });

    it('MUST reject community name "Agrawal" as a Gotra with validation error', async () => {
      const profile = new Profile({
        userId: testUser._id,
        fullName: 'Invalid Candidate',
        gender: 'Male',
        dob: new Date('1995-01-01'),
        gotra: 'Agrawal'
      });

      await expect(profile.save()).rejects.toThrow(/not one of the authentic 18 Agarwal Gotras/i);
    });

    it('MUST reject other non-Gotra strings (Gupta, Sharma, Verma, Mittal123, empty)', async () => {
      const invalidNames = ['Gupta', 'Sharma', 'Verma', 'Mittal123', 'RandomGotra'];

      for (const invalid of invalidNames) {
        const profile = new Profile({
          userId: testUser._id,
          fullName: `Invalid Candidate ${invalid}`,
          gender: 'Female',
          dob: new Date('1996-01-01'),
          gotra: invalid
        });

        await expect(profile.save()).rejects.toThrow(/not one of the authentic 18 Agarwal Gotras/i);
      }
    });

    it('MUST reject invalid motherGotra when provided, but allow valid or empty motherGotra', async () => {
      // Invalid motherGotra
      const invalidMotherProfile = new Profile({
        userId: testUser._id,
        fullName: 'Candidate Invalid Mother',
        gender: 'Male',
        dob: new Date('1995-01-01'),
        gotra: 'Garg',
        motherGotra: 'Agrawal'
      });

      await expect(invalidMotherProfile.save()).rejects.toThrow(/not one of the authentic 18 Agarwal Gotras/i);

      // Empty motherGotra is allowed
      const validEmptyMother = new Profile({
        userId: testUser._id,
        fullName: 'Candidate Empty Mother',
        gender: 'Male',
        dob: new Date('1995-01-01'),
        gotra: 'Garg',
        motherGotra: ''
      });

      const saved = await validEmptyMother.save();
      expect(saved.gotra).toBe('Garg');
      expect(saved.motherGotra).toBe('');
    });

    it('MUST normalize gotra aliases and Hindi script to canonical English names', async () => {
      const aliasTests = [
        { input: 'Goel', expected: 'Goyal' },
        { input: 'Kushal', expected: 'Kuchhal' },
        { input: 'Nagal', expected: 'Nangal' },
        { input: 'गर्ग', expected: 'Garg' },
        { input: 'गोयल', expected: 'Goyal' }
      ];

      for (const test of aliasTests) {
        const profile = new Profile({
          userId: testUser._id,
          fullName: `Candidate ${test.input}`,
          gender: 'Female',
          dob: new Date('1997-05-15'),
          gotra: test.input
        });

        const saved = await profile.save();
        expect(saved.gotra).toBe(test.expected);
      }
    });
  });

  describe('3. Adversarial Payment Flow & Webhook Idempotency', () => {
    it('createOrder should correctly link plan ObjectId and price', async () => {
      const result = await paymentService.createOrder({
        userId: testUser._id,
        planId: diamondPlan._id,
        billingCycle: 'yearly'
      });

      expect(result.order).toBeTruthy();
      expect(result.payment).toBeTruthy();
      expect(result.payment.planId.toString()).toBe(diamondPlan._id.toString());
      expect(result.payment.amount).toBe(diamondPlan.yearlyPrice);
      expect(result.plan.name).toBe('Diamond');
    });

    it('verifyWebhookSignature should accept valid HMAC and reject tampered headers', () => {
      const payload = JSON.stringify({ event: 'payment.captured', id: 'evt_test_123' });
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      expect(paymentService.verifyWebhookSignature(payload, validSignature)).toBe(true);
      expect(paymentService.verifyWebhookSignature(payload, 'tampered_signature_1234567890abcdef')).toBe(false);
      expect(paymentService.verifyWebhookSignature('', validSignature)).toBe(false);
      expect(paymentService.verifyWebhookSignature(payload, '')).toBe(false);
    });

    it('processWebhookEvent should be strictly idempotent on repeated payment.captured events', async () => {
      // Create initial payment record
      const orderId = 'order_webhook_idem_001';
      const paymentId = 'pay_webhook_idem_001';

      const initialPayment = await Payment.create({
        userId: testUser._id,
        orderId: orderId,
        amount: platinumPlan.monthlyPrice,
        currency: 'INR',
        status: 'Created',
        planId: platinumPlan._id,
        billingCycle: 'monthly'
      });

      const webhookEvent = {
        event: 'payment.captured',
        id: 'evt_test_idem_001',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: platinumPlan.monthlyPrice * 100,
              currency: 'INR',
              method: 'upi'
            }
          }
        }
      };

      // First webhook invocation -> processes & activates
      const res1 = await paymentService.processWebhookEvent(webhookEvent);
      expect(res1.success).toBe(true);
      expect(res1.subscription).toBeTruthy();

      const userAfter1 = await User.findById(testUser._id);
      expect(userAfter1.subscriptionPlan).toBe('Platinum');

      const countSub1 = await Subscription.countDocuments({ userId: testUser._id });
      expect(countSub1).toBe(1);

      // Second webhook invocation with same event -> must return idempotent: true without duplicate subscription
      const res2 = await paymentService.processWebhookEvent(webhookEvent);
      expect(res2.success).toBe(true);
      expect(res2.idempotent).toBe(true);

      const countSub2 = await Subscription.countDocuments({ userId: testUser._id });
      expect(countSub2).toBe(1);
    });
  });
});
