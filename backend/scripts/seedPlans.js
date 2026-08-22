/**
 * Subscription Plans Seeder (Idempotent)
 * Agrawal Matrimony Platform
 */

const { connectDB, disconnectDB } = require('../config/db');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

const DEFAULT_PLANS = [
  {
    planId: 'free',
    name: SUBSCRIPTION_PLANS.FREE,
    nameHindi: 'मुफ़्त',
    tagline: 'Get started and explore matches',
    description: 'Basic access to candidate profiles and community discovery.',
    badge: 'Free Forever',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    discountPercent: 0,
    contactViewLimit: 0,
    interestSendLimit: 5,
    dailyMatchLimit: 5,
    verifiedPriority: false,
    chatAccess: false,
    relationshipManager: false,
    profileBoost: false,
    isActive: true,
    sortOrder: 1,
    features: [
      'Create and manage matrimonial profile',
      'Search and browse matching profiles',
      'View 5 profiles per day',
      'Send up to 5 interests',
      'Standard Gotra exogamy compatibility scoring'
    ]
  },
  {
    planId: 'gold',
    name: SUBSCRIPTION_PLANS.GOLD,
    nameHindi: 'गोल्ड',
    tagline: 'Most Popular for Active Matchseekers',
    description: 'Direct contact details, unlimited interests, and verified priority recommendations.',
    badge: 'Popular',
    monthlyPrice: 999,
    quarterlyPrice: 2499,
    yearlyPrice: 4999,
    discountPercent: 58,
    contactViewLimit: 50,
    interestSendLimit: -1,
    dailyMatchLimit: 25,
    verifiedPriority: true,
    chatAccess: true,
    relationshipManager: false,
    profileBoost: true,
    isActive: true,
    sortOrder: 2,
    features: [
      'View 25 profiles per day',
      'Unlock 50 verified member contact details',
      'Send unlimited interests',
      'Direct chat and messaging access',
      'Priority placement in match recommendations',
      'Kundli & Astrology matching reports',
      'See profile visitors & contact details'
    ]
  },
  {
    planId: 'platinum',
    name: SUBSCRIPTION_PLANS.PLATINUM,
    nameHindi: 'प्लेटिनम',
    tagline: 'Premium Matchmaking with High Visibility',
    description: '150 contact unlocks, top carousel placement, and verified profile highlight.',
    badge: 'Best Value',
    monthlyPrice: 1999,
    quarterlyPrice: 4999,
    yearlyPrice: 8999,
    discountPercent: 62,
    contactViewLimit: 150,
    interestSendLimit: -1,
    dailyMatchLimit: -1,
    verifiedPriority: true,
    chatAccess: true,
    relationshipManager: false,
    profileBoost: true,
    isActive: true,
    sortOrder: 3,
    features: [
      'View unlimited profiles per day',
      'Unlock 150 verified member contact details',
      'Send unlimited interests & messages',
      'Top Homepage Carousel spotlight',
      'Verified Profile badge highlight',
      'Detailed 3-Generation family tree access',
      'Advanced multi-parameter filters'
    ]
  },
  {
    planId: 'diamond',
    name: SUBSCRIPTION_PLANS.DIAMOND,
    nameHindi: 'डायमंड',
    tagline: 'VIP Concierge & Dedicated Relationship Manager',
    description: 'Exclusive assisted matchmaking, unlimited contact views, and privacy management.',
    badge: 'VIP Exclusive',
    monthlyPrice: 3999,
    quarterlyPrice: 9999,
    yearlyPrice: 17999,
    discountPercent: 62,
    contactViewLimit: -1,
    interestSendLimit: -1,
    dailyMatchLimit: -1,
    verifiedPriority: true,
    chatAccess: true,
    relationshipManager: true,
    profileBoost: true,
    isActive: true,
    sortOrder: 4,
    features: [
      'Unlimited verified member contact detail unlocks',
      'Dedicated personal Relationship Manager',
      'Handpicked curated match introductions',
      'VIP spotlight on homepage and search top',
      'Confidential and incognito browsing option',
      'Priority background and Gotra verification'
    ]
  }
];

const seedPlans = async () => {
  try {
    for (const planData of DEFAULT_PLANS) {
      const existing = await Plan.findOne({
        $or: [{ planId: planData.planId }, { name: planData.name }]
      });

      if (!existing) {
        const newPlan = new Plan(planData);
        await newPlan.save();
        logger.info(`[SEED] Plan created: ${planData.name}`);
      } else {
        Object.assign(existing, planData);
        await existing.save();
        logger.info(`[SEED] Plan updated/verified: ${planData.name}`);
      }
    }

    const count = await Plan.countDocuments();
    logger.info(`[SEED] Subscription plans seeded successfully (Total: ${count})`);
    return true;
  } catch (error) {
    logger.error(`[SEED ERROR] Failed to seed plans: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedPlans();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      logger.error(`[SEED FATAL] ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = seedPlans;
