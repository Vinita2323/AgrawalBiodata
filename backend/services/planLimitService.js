/**
 * Plan Limit Resolution Service
 * Agrawal Matrimony Platform
 *
 * User.dailyMatchLimit / User.contactViewLimit are denormalized copies,
 * written once by paymentService when a real (or demo) payment activates a
 * subscription. Any other path that assigns a plan - an admin action, a
 * seed script, a data migration - only touches subscriptionPlan /
 * subscriptionPlanId, leaving those copies at their zero default. The user
 * then shows the right plan everywhere the plan *name* is displayed, while
 * every limit check silently enforces Free-tier defaults instead.
 *
 * resolveUserPlan is the fix: every limit check resolves live from the
 * user's current plan document instead of trusting a cached copy, so no
 * future write path can reintroduce this drift.
 */

const Plan = require('../models/Plan');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

/**
 * Resolves the Plan document that should govern a user's entitlements right
 * now. Tries subscriptionPlanId first (authoritative once linked), falls
 * back to matching the subscriptionPlan name string, and finally to the
 * Free plan so a caller always gets a usable plan document.
 * @param {object} user Mongoose User document (or plain object with the same fields)
 * @returns {Promise<object|null>}
 */
async function resolveUserPlan(user) {
  if (user?.subscriptionPlanId) {
    const byId = await Plan.findById(user.subscriptionPlanId);
    if (byId) return byId;
  }

  if (user?.subscriptionPlan) {
    const byName = await Plan.findOne({ name: user.subscriptionPlan });
    if (byName) return byName;
  }

  return Plan.findOne({ name: SUBSCRIPTION_PLANS.FREE });
}

module.exports = { resolveUserPlan };
