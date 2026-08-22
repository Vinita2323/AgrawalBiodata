/**
 * Subscription Controller
 * Agrawal Matrimony Platform
 */

const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Plan = require('../models/Plan');
const matchQuotaService = require('../services/matchQuotaService');
const { success, badRequest, notFound, paginate } = require('../utils/apiResponse');

/**
 * 1. Get current active subscription for authenticated user
 * GET /api/subscriptions/current
 */
const getCurrentSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return notFound(res, 'User account not found');
    }

    const activeSubscription = await Subscription.findOne({
      userId,
      status: 'Active',
      endDate: { $gt: new Date() }
    })
      .populate('planId')
      .sort({ createdAt: -1 });

    const matchQuota = await matchQuotaService.getQuotaStatus(user);

    const subscriptionData = {
      planName: user.subscriptionPlan || 'Free',
      status: user.subscriptionStatus || 'Free',
      expiresAt: user.subscriptionExpiresAt || null,
      contactViewLimit: user.contactViewLimit || 0,
      contactViewsUsed: user.contactViewsUsed || 0,
      remainingContactViews: Math.max(0, (user.contactViewLimit || 0) - (user.contactViewsUsed || 0)),
      matchQuota,
      activeSubscription: activeSubscription || null
    };

    return success(res, 'Current subscription details retrieved successfully', {
      subscription: subscriptionData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get user's subscription billing history
 * GET /api/subscriptions/history
 */
const getSubscriptionHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Subscription.countDocuments({ userId });
    const subscriptions = await Subscription.find({ userId })
      .populate('planId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, subscriptions, page, limit, total, 'Subscription history fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Cancel active subscription
 * POST /api/subscriptions/cancel
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reason = 'Cancelled by user' } = req.body;

    const activeSubscription = await Subscription.findOne({
      userId,
      status: 'Active'
    }).sort({ createdAt: -1 });

    if (!activeSubscription) {
      return badRequest(res, 'No active subscription found to cancel');
    }

    activeSubscription.status = 'Cancelled';
    activeSubscription.cancelledAt = new Date();
    activeSubscription.cancellationReason = reason;
    await activeSubscription.save();

    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'Cancelled'
    });

    return success(res, 'Subscription cancelled successfully', {
      subscription: activeSubscription
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentSubscription,
  getSubscriptionHistory,
  cancelSubscription
};
