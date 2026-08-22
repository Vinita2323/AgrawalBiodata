/**
 * Daily Match View Quota Service
 * Agrawal Matrimony Platform
 *
 * Enforces the plan-configurable "profiles viewable per day" entitlement.
 * Search and the match feed stay unlimited; only opening a profile's full
 * detail consumes quota, and re-opening an already-viewed profile is free.
 */

const Plan = require('../models/Plan');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

const FALLBACK_LIMIT = 5;

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Resets the per-day counters on `user` in memory if the day has rolled over. */
const rollQuotaIfNeeded = (user) => {
  const today = todayStr();
  if (user.matchQuotaDate !== today) {
    user.matchQuotaDate = today;
    user.profilesViewedToday = [];
  }
};

/**
 * Resolves the daily view limit for a user. `user.dailyMatchLimit` is set by
 * paymentService on subscription activation; 0 means "never resolved" (no
 * paid activation yet), in which case we fall back to the Free plan's limit.
 */
const resolveDailyLimit = async (user) => {
  if (user.dailyMatchLimit && user.dailyMatchLimit !== 0) {
    return user.dailyMatchLimit;
  }

  const freePlan = await Plan.findOne({ name: SUBSCRIPTION_PLANS.FREE });
  if (freePlan && typeof freePlan.dailyMatchLimit === 'number') {
    return freePlan.dailyMatchLimit;
  }

  return FALLBACK_LIMIT;
};

/**
 * Attempts to charge one unit of daily quota for viewing `profileId`.
 * Saves `user` when its counters changed. Returns the resulting status.
 */
const consumeView = async (user, profileId) => {
  rollQuotaIfNeeded(user);

  const limit = await resolveDailyLimit(user);

  if (limit === -1) {
    return { allowed: true, unlimited: true, limit: -1, used: 0, remaining: null };
  }

  const idStr = profileId.toString();
  const alreadyViewed = user.profilesViewedToday.some((id) => id.toString() === idStr);

  if (alreadyViewed) {
    await user.save();
    return {
      allowed: true,
      unlimited: false,
      limit,
      used: user.profilesViewedToday.length,
      remaining: Math.max(0, limit - user.profilesViewedToday.length)
    };
  }

  if (user.profilesViewedToday.length >= limit) {
    await user.save();
    return { allowed: false, unlimited: false, limit, used: user.profilesViewedToday.length, remaining: 0 };
  }

  user.profilesViewedToday.push(profileId);
  await user.save();

  return {
    allowed: true,
    unlimited: false,
    limit,
    used: user.profilesViewedToday.length,
    remaining: Math.max(0, limit - user.profilesViewedToday.length)
  };
};

/** Read-only quota status, without charging anything. */
const getQuotaStatus = async (user) => {
  rollQuotaIfNeeded(user);
  const limit = await resolveDailyLimit(user);

  if (limit === -1) {
    return { unlimited: true, limit: -1, used: 0, remaining: null };
  }

  const used = user.profilesViewedToday.length;
  return { unlimited: false, limit, used, remaining: Math.max(0, limit - used) };
};

module.exports = {
  consumeView,
  getQuotaStatus,
  resolveDailyLimit
};
