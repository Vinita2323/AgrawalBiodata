/**
 * Subscription Plan Controller
 * Agrawal Matrimony Platform
 */

const Plan = require('../models/Plan');
const User = require('../models/User');
const { SUBSCRIPTION_STATUS } = require('../config/constants');
const auditService = require('../services/auditService');
const { success, created, badRequest, notFound } = require('../utils/apiResponse');

/** A plan quota field is either a non-negative number or -1 (unlimited). */
const isValidQuota = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && (num === -1 || num >= 0);
};

const QUOTA_FIELDS = [
  { key: 'contactViewLimit', label: 'Contact view limit' },
  { key: 'interestSendLimit', label: 'Interest send limit' },
  { key: 'dailyMatchLimit', label: 'Daily profile view limit' }
];

/** Validates the quota fields present in `body`. Returns an error message, or null. */
const validateQuotaFields = (body) => {
  for (const { key, label } of QUOTA_FIELDS) {
    if (body[key] !== undefined && !isValidQuota(body[key])) {
      return `${label} must be a non-negative number, or -1 for unlimited`;
    }
  }
  return null;
};

/**
 * 1. Get all subscription plans
 * GET /api/plans
 */
const getPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = {};

    // Only allow showing inactive plans if admin
    if (includeInactive === 'true' && req.admin) {
      // no isActive filter
    } else {
      filter.isActive = true;
    }

    const plans = await Plan.find(filter).sort({ sortOrder: 1, monthlyPrice: 1 });

    // Active subscriber count per plan. Counted from User, not the Plan
    // record itself - nothing on Plan tracks how many people are on it, and
    // this was previously never computed at all (the admin panel's "Active
    // Subscribers" always read an undefined field and showed 0 regardless
    // of real subscribers). subscriptionPlanId is the authoritative link
    // (set by every activation path); subscriptionPlan name is the fallback
    // for any legacy account that predates that field being backfilled.
    const [byPlanId, byPlanName] = await Promise.all([
      User.aggregate([
        { $match: { subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE, subscriptionPlanId: { $ne: null } } },
        { $group: { _id: '$subscriptionPlanId', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE, subscriptionPlanId: null } },
        { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }
      ])
    ]);
    const countByPlanId = Object.fromEntries(byPlanId.map((r) => [r._id.toString(), r.count]));
    const countByPlanName = Object.fromEntries(byPlanName.map((r) => [r._id, r.count]));

    const plansWithCounts = plans.map((plan) => {
      const obj = plan.toJSON();
      obj.activeSubscribers =
        (countByPlanId[plan._id.toString()] || 0) + (countByPlanName[plan.name] || 0);
      return obj;
    });

    return success(res, 'Subscription plans fetched successfully', {
      count: plans.length,
      plans: plansWithCounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get single subscription plan details
 * GET /api/plans/:id
 */
const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let plan = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await Plan.findById(id);
    }
    if (!plan) {
      plan = await Plan.findOne({ planId: id });
    }
    if (!plan) {
      plan = await Plan.findOne({ name: new RegExp(`^${id}$`, 'i') });
    }

    if (!plan) {
      return notFound(res, `Subscription plan not found for ID: ${id}`);
    }

    return success(res, 'Subscription plan fetched successfully', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Create new subscription plan (Admin Only)
 * POST /api/plans
 */
const createPlan = async (req, res, next) => {
  try {
    const {
      name,
      nameHindi,
      description,
      tagline,
      badge,
      monthlyPrice,
      quarterlyPrice,
      yearlyPrice,
      discountPercent,
      features,
      contactViewLimit,
      interestSendLimit,
      dailyMatchLimit,
      verifiedPriority,
      chatAccess,
      relationshipManager,
      profileBoost,
      isActive,
      sortOrder
    } = req.body;

    if (!name || monthlyPrice === undefined || yearlyPrice === undefined) {
      return badRequest(res, 'Plan name, monthlyPrice, and yearlyPrice are required');
    }

    const quotaError = validateQuotaFields(req.body);
    if (quotaError) {
      return badRequest(res, quotaError);
    }

    const existingPlan = await Plan.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingPlan) {
      return badRequest(res, `Plan with name "${name}" already exists`);
    }

    const plan = new Plan({
      name,
      nameHindi: nameHindi || '',
      description: description || '',
      tagline: tagline || '',
      badge: badge || '',
      monthlyPrice: Number(monthlyPrice),
      quarterlyPrice: quarterlyPrice !== undefined ? Number(quarterlyPrice) : 0,
      yearlyPrice: Number(yearlyPrice),
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : 0,
      features: Array.isArray(features) ? features : [],
      contactViewLimit: contactViewLimit !== undefined ? Number(contactViewLimit) : 0,
      interestSendLimit: interestSendLimit !== undefined ? Number(interestSendLimit) : 10,
      dailyMatchLimit: dailyMatchLimit !== undefined ? Number(dailyMatchLimit) : 5,
      verifiedPriority: Boolean(verifiedPriority),
      chatAccess: Boolean(chatAccess),
      relationshipManager: Boolean(relationshipManager),
      profileBoost: Boolean(profileBoost),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0
    });

    await plan.save();

    // Log admin action
    if (req.admin) {
      await auditService.logAction({
        adminId: req.admin.adminId,
        adminName: req.admin.name,
        adminRole: req.admin.role,
        action: 'Created Subscription Plan',
        target: plan._id.toString(),
        details: `Created plan "${plan.name}" (Monthly: ₹${plan.monthlyPrice}, Quarterly: ₹${plan.quarterlyPrice}, Yearly: ₹${plan.yearlyPrice}, Daily match limit: ${plan.dailyMatchLimit}, Contact views: ${plan.contactViewLimit})`
      });
    }

    return created(res, 'Subscription plan created successfully', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Update subscription plan (Admin Only)
 * PUT /api/plans/:id
 */
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    let plan = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await Plan.findById(id);
    }
    if (!plan) {
      plan = await Plan.findOne({ planId: id });
    }

    if (!plan) {
      return notFound(res, `Subscription plan not found for ID: ${id}`);
    }

    const quotaError = validateQuotaFields(req.body);
    if (quotaError) {
      return badRequest(res, quotaError);
    }

    const updateFields = [
      'name', 'nameHindi', 'description', 'tagline', 'badge',
      'monthlyPrice', 'quarterlyPrice', 'yearlyPrice', 'discountPercent',
      'features', 'contactViewLimit', 'interestSendLimit', 'dailyMatchLimit',
      'verifiedPriority', 'chatAccess', 'relationshipManager', 'profileBoost',
      'isActive', 'sortOrder'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    await plan.save();

    if (req.admin) {
      await auditService.logAction({
        adminId: req.admin.adminId,
        adminName: req.admin.name,
        adminRole: req.admin.role,
        action: 'Updated Subscription Plan',
        target: plan._id.toString(),
        details: `Updated plan "${plan.name}" (Monthly: ₹${plan.monthlyPrice}, Quarterly: ₹${plan.quarterlyPrice}, Yearly: ₹${plan.yearlyPrice}, Daily match limit: ${plan.dailyMatchLimit}, Contact views: ${plan.contactViewLimit})`
      });
    }

    return success(res, 'Subscription plan updated successfully', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete subscription plan (Admin Only)
 * DELETE /api/plans/:id
 */
const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    let plan = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await Plan.findById(id);
    }
    if (!plan) {
      plan = await Plan.findOne({ planId: id });
    }

    if (!plan) {
      return notFound(res, `Subscription plan not found for ID: ${id}`);
    }

    const planName = plan.name;

    if (permanent === 'true') {
      await Plan.findByIdAndDelete(plan._id);
    } else {
      plan.isActive = false;
      await plan.save();
    }

    if (req.admin) {
      await auditService.logAction({
        adminId: req.admin.adminId,
        adminName: req.admin.name,
        adminRole: req.admin.role,
        action: 'Deleted Subscription Plan',
        target: plan._id.toString(),
        details: `Deleted plan "${planName}" (Permanent: ${permanent === 'true'})`
      });
    }

    return success(res, `Subscription plan "${planName}" deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
