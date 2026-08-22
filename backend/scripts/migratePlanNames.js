/**
 * Plan Name / Plan Reference Backfill (Idempotent)
 * Agrawal Matrimony Platform
 *
 * Fixes users whose `subscriptionPlan` was stamped from the old
 * config/constants.js values ('Free Tier', 'Gold Monthly', 'Gold Annual
 * Premium', 'Premium Platinum', 'Premium Diamond') that never matched any
 * seeded Plan document, and backfills `subscriptionPlanId` (added so plan
 * renames no longer detach existing subscribers) from the Plan whose name
 * matches the user's current subscriptionPlan string.
 */

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

// Maps every legacy display string this app has ever written to a User
// document to the real Plan name it was meant to represent.
const LEGACY_NAME_MAP = {
  'Free Tier': SUBSCRIPTION_PLANS.FREE,
  'Gold Monthly': SUBSCRIPTION_PLANS.GOLD,
  'Gold Quarterly': SUBSCRIPTION_PLANS.GOLD,
  'Gold Annual Premium': SUBSCRIPTION_PLANS.GOLD,
  'Premium Platinum': SUBSCRIPTION_PLANS.PLATINUM,
  'Premium Diamond': SUBSCRIPTION_PLANS.DIAMOND
};

const migratePlanNames = async () => {
  try {
    let renamed = 0;
    let linked = 0;

    for (const [legacyName, realName] of Object.entries(LEGACY_NAME_MAP)) {
      const result = await User.updateMany(
        { subscriptionPlan: legacyName },
        { subscriptionPlan: realName }
      );
      renamed += result.modifiedCount || 0;
    }

    const usersMissingPlanId = await User.find({
      subscriptionPlanId: null,
      subscriptionPlan: { $nin: [null, '', SUBSCRIPTION_PLANS.FREE] }
    });

    for (const user of usersMissingPlanId) {
      const plan = await Plan.findOne({ name: new RegExp(`^${user.subscriptionPlan}$`, 'i') });
      if (plan) {
        user.subscriptionPlanId = plan._id;
        await user.save();
        linked += 1;
      }
    }

    logger.info(`[MIGRATE] Renamed ${renamed} user(s) off legacy plan-name strings.`);
    logger.info(`[MIGRATE] Linked ${linked} user(s) to their Plan document via subscriptionPlanId.`);
    return { renamed, linked };
  } catch (error) {
    logger.error(`[MIGRATE ERROR] Failed to migrate plan names: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await migratePlanNames();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      logger.error(`[MIGRATE FATAL] ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = migratePlanNames;
