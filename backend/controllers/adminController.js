/**
 * Admin Operations & Dashboard Controller
 * Agrawal Matrimony Platform
 */

const User = require('../models/User');
const Profile = require('../models/Profile');
const Verification = require('../models/Verification');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Interest = require('../models/Interest');
const Shortlist = require('../models/Shortlist');
const Visitor = require('../models/Visitor');
const Block = require('../models/Block');
const Match = require('../models/Match');
const auditService = require('../services/auditService');
const { success, badRequest, notFound, paginate } = require('../utils/apiResponse');

/**
 * 1. Admin Dashboard Metrics & Real-time KPIs
 * GET /api/admin/dashboard/metrics
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerifications,
      totalCandidateProfiles,
      verifiedProfiles,
      activeSubscriptions,
      pendingComplaints,
      revenueAgg
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ accountStatus: 'Active' }),
      User.countDocuments({ accountStatus: 'Suspended' }),
      Verification.countDocuments({ status: 'Pending' }),
      Profile.countDocuments({}),
      Profile.countDocuments({ verified: true }),
      Subscription.countDocuments({ status: 'Active', endDate: { $gt: new Date() } }),
      Complaint.countDocuments({ status: 'Pending' }),
      Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const metrics = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerifications,
      totalCandidateProfiles,
      totalProfiles: totalCandidateProfiles,
      verifiedProfiles,
      totalRevenue,
      activeSubscriptions,
      pendingComplaints
    };

    return success(res, 'Dashboard metrics fetched successfully', {
      kpis: metrics,
      ...metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. List Users with Search, Filters & Pagination
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, q, status, accountStatus, verificationStatus, subscriptionPlan, subscriptionStatus } = req.query;

    const filter = {};

    // Text search by name, phone or email
    const searchQuery = typeof search === 'string' ? search : typeof q === 'string' ? q : '';
    if (searchQuery && searchQuery.trim() !== '') {
      const sanitized = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { email: regex }
      ];
    }

    // Status filter
    const userStatus = typeof status === 'string' ? status : typeof accountStatus === 'string' ? accountStatus : '';
    if (userStatus && userStatus !== 'All') {
      filter.accountStatus = userStatus;
    }

    // Verification Status filter
    if (typeof verificationStatus === 'string' && verificationStatus !== 'All') {
      filter.verificationStatus = verificationStatus;
    }

    // Subscription Plan filter
    if (typeof subscriptionPlan === 'string' && subscriptionPlan !== 'All') {
      filter.subscriptionPlan = subscriptionPlan;
    }

    // Subscription Status filter
    if (typeof subscriptionStatus === 'string' && subscriptionStatus !== 'All') {
      filter.subscriptionStatus = subscriptionStatus;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('activeProfileId', 'fullName profileId gotra verified gender profilePicture completionPercentage')
      .populate('profiles', 'fullName profileId gotra verified gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, users, page, limit, total, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Inspect Detailed User Profile, Candidate Profiles, Subscriptions & Documents
 * GET /api/admin/users/:userId
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, `User not found with ID: ${userId}`);
    }

    const [candidateProfiles, subscriptions, verifications, payments, complaints] = await Promise.all([
      Profile.find({ userId }),
      Subscription.find({ userId }).populate('planId').sort({ createdAt: -1 }),
      Verification.find({ userId }).sort({ createdAt: -1 }),
      Payment.find({ userId }).populate('planId').sort({ createdAt: -1 }),
      Complaint.find({ $or: [{ reportedUserId: userId }, { reporterUserId: userId }] }).sort({ createdAt: -1 })
    ]);

    return success(res, 'User details retrieved successfully', {
      user,
      candidateProfiles,
      profiles: candidateProfiles,
      subscriptions,
      verifications,
      verificationDocuments: verifications,
      payments,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Toggle User Status (Active / Suspended) with Audit Logging
 * PUT /api/admin/users/:userId/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, accountStatus, reason = '', notes = '' } = req.body;

    const targetStatus = status || accountStatus;
    if (!targetStatus || !['Active', 'Suspended'].includes(targetStatus)) {
      return badRequest(res, 'Status must be either "Active" or "Suspended"');
    }

    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, `User not found with ID: ${userId}`);
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = targetStatus;
    await user.save();

    // Log immutable audit trail
    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: targetStatus === 'Suspended' ? 'User Suspended' : 'User Activated',
      target: user._id.toString(),
      details: `User (${user.mobile}) status updated from "${previousStatus}" to "${targetStatus}". Reason: ${reason || notes || 'Administrative Action'}`,
      ipAddress: req.ip,
      metadata: {
        userId: user._id,
        mobile: user.mobile,
        previousStatus,
        newStatus: targetStatus,
        reason: reason || notes
      }
    });

    return success(res, `User status updated to ${targetStatus} successfully`, {
      user,
      previousStatus,
      newStatus: targetStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Export User List to CSV
 * GET /api/admin/users/export/csv
 */
const exportUsersCSV = async (req, res, next) => {
  try {
    const { search, q, status, accountStatus, verificationStatus, subscriptionPlan } = req.query;

    const filter = {};

    const searchQuery = typeof search === 'string' ? search : typeof q === 'string' ? q : '';
    if (searchQuery && searchQuery.trim() !== '') {
      const sanitized = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { email: regex }
      ];
    }

    const userStatus = typeof status === 'string' ? status : typeof accountStatus === 'string' ? accountStatus : '';
    if (userStatus && userStatus !== 'All') {
      filter.accountStatus = userStatus;
    }

    if (typeof verificationStatus === 'string' && verificationStatus !== 'All') {
      filter.verificationStatus = verificationStatus;
    }

    if (typeof subscriptionPlan === 'string' && subscriptionPlan !== 'All') {
      filter.subscriptionPlan = subscriptionPlan;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    const headers = [
      'User ID',
      'Mobile',
      'Name',
      'Email',
      'Account Status',
      'Verification Status',
      'Subscription Plan',
      'Subscription Status',
      'Profiles Count',
      'Registered At'
    ];

    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return '""';
      const stringValue = String(field).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const rows = users.map((u) => [
      escapeCsvField(u._id),
      escapeCsvField(u.mobile),
      escapeCsvField(u.name),
      escapeCsvField(u.email),
      escapeCsvField(u.accountStatus),
      escapeCsvField(u.verificationStatus),
      escapeCsvField(u.subscriptionPlan),
      escapeCsvField(u.subscriptionStatus),
      escapeCsvField(u.profiles ? u.profiles.length : 0),
      escapeCsvField(u.createdAt ? u.createdAt.toISOString() : '')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_export_${Date.now()}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Delete a User Account and its dependent records
 * DELETE /api/admin/users/:userId
 *
 * Payments and audit logs are intentionally retained: they are financial and
 * compliance records that must outlive the account they refer to.
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason = '' } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, `User not found with ID: ${userId}`);
    }

    const profileIds = await Profile.find({ userId }).distinct('_id');

    await Promise.all([
      Profile.deleteMany({ userId }),
      Verification.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      Interest.deleteMany({ $or: [{ senderUserId: userId }, { recipientUserId: userId }] }),
      Shortlist.deleteMany({ $or: [{ userId }, { shortlistedProfileId: { $in: profileIds } }] }),
      Visitor.deleteMany({ $or: [{ visitorUserId: userId }, { visitedProfileId: { $in: profileIds } }] }),
      Block.deleteMany({ $or: [{ blockerUserId: userId }, { blockedUserId: userId }] }),
      Match.deleteMany({ $or: [{ userId }, { matchedProfileId: { $in: profileIds } }] })
    ]);

    await User.findByIdAndDelete(userId);

    await auditService.logAction({
      adminId: req.admin ? req.admin.adminId : null,
      adminName: req.admin ? req.admin.name : 'System',
      adminRole: req.admin ? req.admin.role : 'Super Admin',
      action: 'User Account Deleted',
      target: userId,
      details: `User (${user.mobile}) and ${profileIds.length} candidate profile(s) permanently deleted. Reason: ${reason || 'Administrative Action'}`,
      ipAddress: req.ip,
      metadata: { userId, mobile: user.mobile, profilesDeleted: profileIds.length, reason }
    });

    return success(res, 'User account and associated records deleted successfully', {
      deletedUserId: userId,
      profilesDeleted: profileIds.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. List Subscriptions with Plan & Subscriber Details
 * GET /api/admin/subscriptions
 */
const getSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }
    if (req.query.planId) {
      filter.planId = req.query.planId;
    }

    const [total, subscriptions] = await Promise.all([
      Subscription.countDocuments(filter),
      Subscription.find(filter)
        .populate('userId', 'name mobile email accountStatus')
        .populate('planId', 'name monthlyPrice yearlyPrice badge')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return paginate(res, subscriptions, page, limit, total, 'Subscriptions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 8. List Block Records for Abuse Moderation
 * GET /api/admin/blocks
 */
const getBlocks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [total, blocks] = await Promise.all([
      Block.countDocuments({}),
      Block.find({})
        .populate('blockerUserId', 'name mobile')
        .populate('blockedUserId', 'name mobile')
        .populate('blockedProfileId', 'fullName profileId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return paginate(res, blocks, page, limit, total, 'Block records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Toggle Featured Placement on a Candidate Profile
 * PUT /api/admin/profiles/:profileId/featured
 */
const setProfileFeatured = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { isFeatured } = req.body || {};

    if (typeof isFeatured !== 'boolean') {
      return badRequest(res, 'isFeatured must be a boolean value');
    }

    let profile = null;
    if (/^[0-9a-fA-F]{24}$/.test(profileId)) {
      profile = await Profile.findById(profileId);
    }
    if (!profile) {
      profile = await Profile.findOne({ profileId });
    }
    if (!profile) {
      return notFound(res, `Candidate profile not found with ID: ${profileId}`);
    }

    profile.isFeatured = isFeatured;
    await profile.save();

    await auditService.logAction({
      adminId: req.admin ? req.admin.adminId : null,
      adminName: req.admin ? req.admin.name : 'System',
      adminRole: req.admin ? req.admin.role : 'Super Admin',
      action: isFeatured ? 'Profile Featured' : 'Profile Unfeatured',
      target: profile._id.toString(),
      details: `Candidate profile "${profile.fullName}" ${isFeatured ? 'added to' : 'removed from'} featured placement`,
      ipAddress: req.ip,
      metadata: { profileId: profile._id, isFeatured }
    });

    return success(res, `Profile ${isFeatured ? 'featured' : 'unfeatured'} successfully`, { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. List Computed Match Pairs
 * GET /api/admin/matches
 *
 * The Match collection stores one row per (profile -> matchedProfile) direction.
 * Only rows above the score threshold are surfaced, and reciprocal duplicates
 * are collapsed so each pair appears once.
 */
const getMatchPairs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const minScore = parseInt(req.query.minScore, 10) || 0;

    const filter = {};
    if (minScore > 0) {
      filter.matchScore = { $gte: minScore };
    }

    const matches = await Match.find(filter)
      .populate('profileId', 'fullName profileId gender dob gotra profilePicture userId')
      .populate('matchedProfileId', 'fullName profileId gender dob gotra profilePicture userId')
      .sort({ matchScore: -1, createdAt: -1 })
      .limit(1000);

    // Collapse A->B and B->A into a single pair, keeping the higher score.
    const pairs = new Map();
    matches.forEach((m) => {
      if (!m.profileId || !m.matchedProfileId) return;

      const a = m.profileId._id.toString();
      const b = m.matchedProfileId._id.toString();
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;

      const existing = pairs.get(key);
      if (existing && existing.matchScore >= m.matchScore) return;

      pairs.set(key, {
        id: m._id,
        matchScore: m.matchScore,
        isSagotra: m.isSagotra,
        hasMaternalConflict: m.hasMaternalConflict,
        createdAt: m.createdAt,
        lastCalculatedAt: m.lastCalculatedAt,
        profile: m.profileId,
        matchedProfile: m.matchedProfileId
      });
    });

    const all = Array.from(pairs.values());
    const total = all.length;
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    // Attach the owning account name so the admin table can show whose profile it is.
    const ownerIds = new Set();
    items.forEach((p) => {
      if (p.profile?.userId) ownerIds.add(p.profile.userId.toString());
      if (p.matchedProfile?.userId) ownerIds.add(p.matchedProfile.userId.toString());
    });

    const owners = await User.find({ _id: { $in: Array.from(ownerIds) } }).select('name');
    const ownerNameById = Object.fromEntries(owners.map((u) => [u._id.toString(), u.name]));

    const enriched = items.map((p) => ({
      ...p,
      profile: p.profile
        ? { ...p.profile.toObject(), ownerName: ownerNameById[p.profile.userId?.toString()] || '' }
        : null,
      matchedProfile: p.matchedProfile
        ? { ...p.matchedProfile.toObject(), ownerName: ownerNameById[p.matchedProfile.userId?.toString()] || '' }
        : null
    }));

    return paginate(res, enriched, page, limit, total, 'Match pairs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  getUserById,
  updateUserStatus,
  exportUsersCSV,
  deleteUser,
  getSubscriptions,
  getBlocks,
  setProfileFeatured,
  getMatchPairs
};
