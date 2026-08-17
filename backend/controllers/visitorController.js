/**
 * Visitor Controller
 * Daily-Deduplicated Profile Visitor Tracking & Analytics
 * Agrawal Matrimony Platform
 */

const Visitor = require('../models/Visitor');
const Profile = require('../models/Profile');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const notificationService = require('../services/notificationService');
const { success, badRequest, notFound } = require('../utils/apiResponse');

/**
 * Helper to get UTC midnight date
 */
const getUTCMidnight = (d = new Date()) => {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * 1. Record profile view (daily deduplication)
 * POST /api/visitors or POST /api/visitors/record/:targetProfileId
 */
const recordVisit = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const targetProfileId = req.params.targetProfileId || req.body.visitedProfileId || req.body.targetProfileId;

    if (!targetProfileId) {
      return badRequest(res, 'Visited profile ID is required');
    }

    const visitedProfile = await findProfileByIdOrCustomId(targetProfileId);
    if (!visitedProfile) {
      return notFound(res, 'Visited candidate profile not found');
    }

    // Do not count self-profile views
    if (visitedProfile.userId.toString() === req.user.userId) {
      return success(res, 'Self-profile view not recorded', { recorded: false });
    }

    const userProfileData = await getUserActiveProfile(req.user.userId);
    const visitorActiveProfile = userProfileData?.activeProfile || null;

    const visitDate = getUTCMidnight();

    const filter = {
      visitedProfileId: visitedProfile._id,
      visitorProfileId: visitorActiveProfile ? visitorActiveProfile._id : null,
      visitDate
    };

    const update = {
      $setOnInsert: {
        visitedUserId: visitedProfile.userId,
        visitorUserId: req.user.userId,
        visitDate
      },
      $inc: { visitCount: 1 },
      $set: { lastVisitedAt: new Date() }
    };

    const visitorDoc = await Visitor.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true
    });

    // Notify only on the first view of the day, so a visitor refreshing a
    // profile does not spam the owner's feed.
    if (visitorDoc.visitCount === 1) {
      await notificationService.profileVisited({
        visitedUserId: visitedProfile.userId,
        visitedProfileId: visitedProfile._id,
        visitorProfile: visitorActiveProfile
      });
    }

    return success(res, 'Visit recorded successfully', {
      recorded: true,
      visitCount: visitorDoc.visitCount,
      lastVisitedAt: visitorDoc.lastVisitedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get recent visitors to active profile
 * GET /api/visitors or GET /api/visitors/recent
 */
const getVisitors = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;

    const query = {
      visitedProfileId: activeProfile._id,
      visitorUserId: { $ne: req.user.userId }
    };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .populate('visitorProfileId')
      .sort({ lastVisitedAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(res, 'Profile visitors retrieved successfully', {
      visitors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get aggregate visitor metrics for active profile
 * GET /api/visitors/count
 */
const getVisitorMetrics = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const today = getUTCMidnight();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const baseQuery = {
      visitedProfileId: activeProfile._id,
      visitorUserId: { $ne: req.user.userId }
    };

    const [totalVisitors, todayVisitors, weeklyVisitors] = await Promise.all([
      Visitor.countDocuments(baseQuery),
      Visitor.countDocuments({ ...baseQuery, visitDate: today }),
      Visitor.countDocuments({ ...baseQuery, visitDate: { $gte: sevenDaysAgo } })
    ]);

    return success(res, 'Visitor metrics fetched successfully', {
      totalVisitors,
      todayVisitors,
      weeklyVisitors
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordVisit,
  getVisitors,
  getVisitorMetrics
};
