/**
 * Empirical Challenger 2 Remediation Test Suite
 * Stress-testing:
 * 1. paymentService.resolvePlan & activateUserSubscription with Mongoose ObjectId instances for Platinum & Diamond
 * 2. Profile Gotra schema validation across all 18 authentic Maharaja Agrasen Gotras, Hindi scripts, aliases, and invalid Gotras (e.g. 'Agrawal', 'Sharma')
 * 3. Exogamy validation rules
 */

const mongoose = require('mongoose');
const paymentService = require('../services/paymentService');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { AGARWAL_GOTRAS, GOTRA_NAMES_EN } = require('../config/constants');
const { checkGotraExogamy, isValidGotra, normalizeGotra } = require('../utils/gotras');

describe('Empirical Challenger 2 Remediation Verification', () => {
  let goldPlan, platinumPlan, diamondPlan, testUser;

  beforeEach(async () => {
    // Seed standard plans
    goldPlan = await Plan.create({
      planId: 'gold',
      name: 'Gold',
      monthlyPrice: 999,
      yearlyPrice: 7999,
      contactViewLimit: 25,
      interestSendLimit: 50,
      features: ['25 Contact Views', '50 Interests', 'Chat Support'],
      isActive: true
    });

    platinumPlan = await Plan.create({
      planId: 'platinum',
      name: 'Platinum',
      monthlyPrice: 1999,
      yearlyPrice: 15999,
      contactViewLimit: 75,
      interestSendLimit: 150,
      features: ['75 Contact Views', '150 Interests', 'Priority Support', 'Profile Boost'],
      isActive: true
    });

    diamondPlan = await Plan.create({
      planId: 'diamond',
      name: 'Diamond',
      monthlyPrice: 3499,
      yearlyPrice: 29999,
      contactViewLimit: -1, // Unlimited
      interestSendLimit: -1,
      features: ['Unlimited Contact Views', 'Unlimited Interests', 'Relationship Manager', 'VIP Badge'],
      isActive: true
    });

    testUser = await User.create({
      mobile: '+919988776655',
      name: 'Empirical Challenger User',
      email: 'challenger2@agrawalmatrimony.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free Tier',
      subscriptionStatus: 'Free',
      contactViewLimit: 0
    });
  });

  // =========================================================================
  // 1. Payment Service: Plan Resolution & Subscription Activation
  // =========================================================================
  describe('1. Payment Service: ObjectId Plan Resolution & Tier Preservation', () => {
    it('resolvePlan should resolve Mongoose ObjectId instance for Platinum plan', async () => {
      const planObjectId = new mongoose.Types.ObjectId(platinumPlan._id.toString());
      const resolved = await paymentService.resolvePlan(planObjectId);

      expect(resolved).toBeTruthy();
      expect(resolved._id.toString()).toBe(platinumPlan._id.toString());
      expect(resolved.name).toBe('Platinum');
      expect(resolved.planId).toBe('platinum');
    });

    it('resolvePlan should resolve Mongoose ObjectId instance for Diamond plan', async () => {
      const planObjectId = new mongoose.Types.ObjectId(diamondPlan._id.toString());
      const resolved = await paymentService.resolvePlan(planObjectId);

      expect(resolved).toBeTruthy();
      expect(resolved._id.toString()).toBe(diamondPlan._id.toString());
      expect(resolved.name).toBe('Diamond');
      expect(resolved.planId).toBe('diamond');
    });

    it('resolvePlan should resolve 24-hex string, lowercase slug, uppercase slug, and name', async () => {
      // 24-hex string
      const hexResolved = await paymentService.resolvePlan(diamondPlan._id.toString());
      expect(hexResolved._id.toString()).toBe(diamondPlan._id.toString());

      // Lowercase slug
      const slugResolved = await paymentService.resolvePlan('platinum');
      expect(slugResolved._id.toString()).toBe(platinumPlan._id.toString());

      // Uppercase slug / name case-insensitive
      const upperResolved = await paymentService.resolvePlan('DIAMOND');
      expect(upperResolved._id.toString()).toBe(diamondPlan._id.toString());

      // Doc object itself
      const objResolved = await paymentService.resolvePlan(goldPlan);
      expect(objResolved._id.toString()).toBe(goldPlan._id.toString());

      // Non-existent ObjectId returns null
      const nonExistent = await paymentService.resolvePlan(new mongoose.Types.ObjectId());
      expect(nonExistent).toBeNull();

      // Null / undefined / empty
      expect(await paymentService.resolvePlan(null)).toBeNull();
      expect(await paymentService.resolvePlan(undefined)).toBeNull();
      expect(await paymentService.resolvePlan('')).toBeNull();
    });

    it('activateUserSubscription with Platinum ObjectId must activate Platinum tier and NOT default to Gold', async () => {
      const platinumObjectId = new mongoose.Types.ObjectId(platinumPlan._id.toString());

      const subscription = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: platinumObjectId,
        billingCycle: 'monthly',
        paymentId: 'pay_plat_001',
        orderId: 'order_plat_001',
        amountPaid: 1999
      });

      expect(subscription).toBeTruthy();
      expect(subscription.planId.toString()).toBe(platinumPlan._id.toString());
      expect(subscription.status).toBe('Active');
      expect(subscription.billingCycle).toBe('monthly');
      expect(subscription.contactViewLimit).toBe(75);

      // Verify User document in DB
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscriptionPlan).toBe('Platinum');
      expect(updatedUser.subscriptionPlan).not.toBe('Gold');
      expect(updatedUser.subscriptionPlan).not.toBe('Free Tier');
      expect(updatedUser.subscriptionStatus).toBe('Active');
      expect(updatedUser.contactViewLimit).toBe(75);
    });

    it('activateUserSubscription with Diamond ObjectId must activate Diamond tier with unlimited limits and NOT default to Gold', async () => {
      const diamondObjectId = new mongoose.Types.ObjectId(diamondPlan._id.toString());

      const subscription = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: diamondObjectId,
        billingCycle: 'yearly',
        paymentId: 'pay_diam_001',
        orderId: 'order_diam_001',
        amountPaid: 29999
      });

      expect(subscription).toBeTruthy();
      expect(subscription.planId.toString()).toBe(diamondPlan._id.toString());
      expect(subscription.status).toBe('Active');
      expect(subscription.billingCycle).toBe('yearly');

      // Verify User document in DB
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscriptionPlan).toBe('Diamond');
      expect(updatedUser.subscriptionPlan).not.toBe('Gold');
      expect(updatedUser.subscriptionStatus).toBe('Active');
      expect(updatedUser.contactViewLimit).toBe(999999); // Unlimited mapped to 999999
    });

    it('Upgrading subscriptions (Gold -> Platinum -> Diamond) must expire previous subscriptions and retain highest tier', async () => {
      // 1. Activate Gold
      const sub1 = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: goldPlan._id,
        billingCycle: 'monthly'
      });
      expect(sub1.status).toBe('Active');
      let user = await User.findById(testUser._id);
      expect(user.subscriptionPlan).toBe('Gold');

      // 2. Activate Platinum via ObjectId
      const sub2 = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: new mongoose.Types.ObjectId(platinumPlan._id.toString()),
        billingCycle: 'monthly'
      });
      const oldSub1 = await Subscription.findById(sub1._id);
      expect(oldSub1.status).toBe('Expired');
      expect(sub2.status).toBe('Active');
      user = await User.findById(testUser._id);
      expect(user.subscriptionPlan).toBe('Platinum');

      // 3. Activate Diamond via ObjectId
      const sub3 = await paymentService.activateUserSubscription({
        userId: testUser._id,
        planId: new mongoose.Types.ObjectId(diamondPlan._id.toString()),
        billingCycle: 'yearly'
      });
      const oldSub2 = await Subscription.findById(sub2._id);
      expect(oldSub2.status).toBe('Expired');
      expect(sub3.status).toBe('Active');
      user = await User.findById(testUser._id);
      expect(user.subscriptionPlan).toBe('Diamond');
      expect(user.contactViewLimit).toBe(999999);
    });
  });

  // =========================================================================
  // 2. Gotra Schema Validation: 18 Authentic Gotras vs Invalid Gotras
  // =========================================================================
  describe('2. Gotra Schema Validation: Authentic Maharaja Agrasen Gotras vs Invalids', () => {
    const authenticGotras = [
      'Garg', 'Goyal', 'Bansal', 'Bindal', 'Mittal', 'Singhal',
      'Jindal', 'Tingal', 'Tayal', 'Airan', 'Dharan', 'Madhukul',
      'Goyan', 'Kuchhal', 'Kansal', 'Nangal', 'Mangal', 'Bhandal'
    ];

    it('Should successfully create Profile for every one of the 18 authentic Gotras', async () => {
      for (let i = 0; i < authenticGotras.length; i++) {
        const gotraName = authenticGotras[i];
        const motherGotraName = authenticGotras[(i + 1) % authenticGotras.length];

        const profile = await Profile.create({
          userId: testUser._id,
          profileId: `PRF-GOTRA-${i + 1}`,
          fullName: `Candidate ${gotraName}`,
          gender: 'Male',
          dob: new Date('1995-01-01'),
          gotra: gotraName,
          motherGotra: motherGotraName
        });

        expect(profile).toBeTruthy();
        expect(profile.gotra).toBe(gotraName);
        expect(profile.motherGotra).toBe(motherGotraName);
      }
    });

    it('Should accept and normalize Hindi script and aliases for authentic Gotras', async () => {
      // Test Hindi input
      const hindiProfile = await Profile.create({
        userId: testUser._id,
        profileId: 'PRF-HINDI-1',
        fullName: 'Hindi Gotra Candidate',
        gender: 'Female',
        dob: new Date('1996-05-15'),
        gotra: 'गर्ग',
        motherGotra: 'गोयल'
      });
      expect(hindiProfile.gotra).toBe('Garg');
      expect(hindiProfile.motherGotra).toBe('Goyal');

      // Test Aliases (Goel, Kushal, Nagal, Dhingan)
      const aliasProfile = await Profile.create({
        userId: testUser._id,
        profileId: 'PRF-ALIAS-1',
        fullName: 'Alias Gotra Candidate',
        gender: 'Male',
        dob: new Date('1993-08-20'),
        gotra: 'Goel',
        motherGotra: 'Kushal'
      });
      expect(aliasProfile.gotra).toBe('Goyal');
      expect(aliasProfile.motherGotra).toBe('Kuchhal');

      // Test Bilingual format "गर्ग (Garg)"
      const bilingualProfile = await Profile.create({
        userId: testUser._id,
        profileId: 'PRF-BILINGUAL-1',
        fullName: 'Bilingual Candidate',
        gender: 'Female',
        dob: new Date('1994-03-10'),
        gotra: 'गर्ग (Garg)',
        motherGotra: 'Bansal (बंसल)'
      });
      expect(bilingualProfile.gotra).toBe('Garg');
      expect(bilingualProfile.motherGotra).toBe('Bansal');
    });

    it('Must strictly REJECT invalid gotras like "Agrawal", "Agarwal", "Sharma", "Gupta"', async () => {
      const invalidGotraList = [
        'Agrawal',
        'Agarwal',
        'Aggarwal',
        'Sharma',
        'Gupta',
        'Verma',
        'Jain',
        'KashyapNonAgrawal',
        'UnknownGotra123'
      ];

      for (const invalidGotra of invalidGotraList) {
        let error = null;
        try {
          await Profile.create({
            userId: testUser._id,
            profileId: `PRF-INV-${Math.floor(Math.random() * 100000)}`,
            fullName: 'Invalid Gotra User',
            gender: 'Male',
            dob: new Date('1995-01-01'),
            gotra: invalidGotra,
            motherGotra: 'Garg'
          });
        } catch (err) {
          error = err;
        }

        expect(error).toBeTruthy();
        expect(error.name).toBe('ValidationError');
        expect(error.errors.gotra).toBeDefined();
        expect(error.errors.gotra.message).toContain('is not one of the authentic 18 Agarwal Gotras');
      }
    });

    it('Must strictly REJECT invalid motherGotra when provided', async () => {
      let error = null;
      try {
        await Profile.create({
          userId: testUser._id,
          profileId: 'PRF-INV-MG-1',
          fullName: 'Invalid Mother Gotra User',
          gender: 'Female',
          dob: new Date('1995-01-01'),
          gotra: 'Garg',
          motherGotra: 'Agrawal'
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeTruthy();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.motherGotra).toBeDefined();
      expect(error.errors.motherGotra.message).toContain('is not one of the authentic 18 Agarwal Gotras');
    });

    it('Should allow empty motherGotra as it is optional', async () => {
      const profile = await Profile.create({
        userId: testUser._id,
        profileId: 'PRF-OPT-MG-1',
        fullName: 'Optional Mother Gotra User',
        gender: 'Male',
        dob: new Date('1995-01-01'),
        gotra: 'Mittal',
        motherGotra: ''
      });

      expect(profile).toBeTruthy();
      expect(profile.gotra).toBe('Mittal');
      expect(profile.motherGotra).toBe('');
    });
  });

  // =========================================================================
  // 3. Gotra Exogamy Rules Empirical Validation
  // =========================================================================
  describe('3. Gotra Exogamy Rule Validation Engine', () => {
    it('Sagotra marriage (same paternal gotra) must yield score 0 and isSagotra = true', () => {
      const result = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Mittal');
      expect(result.score).toBe(0);
      expect(result.isSagotra).toBe(true);
      expect(result.hasMaternalConflict).toBe(false);
      expect(result.details).toContain('Sagotra Conflict');
    });

    it('Maternal conflict (paternal matches partner maternal) must yield 50% score reduction', () => {
      const result = checkGotraExogamy('Garg', 'Bansal', 'Mittal', 'Garg');
      expect(result.score).toBe(15);
      expect(result.isSagotra).toBe(false);
      expect(result.hasMaternalConflict).toBe(true);
      expect(result.details).toContain('Maternal Gotra overlap detected');
    });

    it('Completely distinct gotras must yield full score 30/30', () => {
      const result = checkGotraExogamy('Garg', 'Bansal', 'Mittal', 'Jindal');
      expect(result.score).toBe(30);
      expect(result.maxScore).toBe(30);
      expect(result.isSagotra).toBe(false);
      expect(result.hasMaternalConflict).toBe(false);
    });
  });
});
