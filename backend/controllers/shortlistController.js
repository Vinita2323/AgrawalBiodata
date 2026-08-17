/**
 * Shortlist Controller
 * Profile Bookmarks & Favorites
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Shortlist = require('../models/Shortlist');
const Profile = require('../models/Profile');
const { calculateMatchScore } = require('../services/matchEngine');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const { success, created, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * 1. Add / update profile in shortlist
 * POST /api/shortlist
 */
const addToShortlist = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const shortlistedProfileId = req.body.shortlistedProfileId || req.body.targetProfileId;
    const notes = req.body.notes || '';

    if (!shortlistedProfileId) {
      return badRequest(res, 'Shortlisted profile ID is required');
    }

    const userProfileData = await getUserActiveProfile(req.user.userId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const targetProfile = await findProfileByIdOrCustomId(shortlistedProfileId);

    if (!targetProfile) {
      return notFound(res, 'Candidate profile to shortlist not found');
    }

    if (targetProfile.userId.toString() === req.user.userId) {
      return badRequest(res, 'You cannot shortlist your own profile');
    }

    let shortlist = await Shortlist.findOne({
      profileId: activeProfile._id,
      shortlistedProfileId: targetProfile._id
    });

    if (shortlist) {
      if (notes) shortlist.notes = notes;
      await shortlist.save();
      return success(res, 'Profile shortlist updated', { shortlist });
    }

    shortlist = new Shortlist({
      userId: req.user.userId,
      profileId: activeProfile._id,
      shortlistedProfileId: targetProfile._id,
      notes
    });

    await shortlist.save();

    return created(res, 'Profile shortlisted successfully', { shortlist });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Remove profile from shortlist
 * DELETE /api/shortlist/:targetProfileId
 */
const removeFromShortlist = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const userProfileData = await getUserActiveProfile(req.user.userId);
    const activeProfile = userProfileData?.activeProfile || null;

    let targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    const targetId = targetProfile ? targetProfile._id : (mongoose.Types.ObjectId.isValid(targetProfileId) ? targetProfileId : null);

    const queryOr = [];
    if (mongoose.Types.ObjectId.isValid(targetProfileId)) {
      queryOr.push({ _id: targetProfileId, userId: req.user.userId });
    }
    if (targetId) {
      queryOr.push({ userId: req.user.userId, shortlistedProfileId: targetId });
      if (activeProfile) {
        queryOr.push({ profileId: activeProfile._id, shortlistedProfileId: targetId });
      }
    }

    if (queryOr.length === 0) {
      return success(res, 'Profile removed from shortlist', {
        removed: false
      });
    }

    const deleted = await Shortlist.findOneAndDelete({ $or: queryOr });

    return success(res, 'Profile removed from shortlist', {
      removed: Boolean(deleted)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get all shortlisted profiles
 * GET /api/shortlist
 */
const getShortlists = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId);
    const activeProfile = userProfileData?.activeProfile || null;

    const query = { userId: req.user.userId };
    if (activeProfile) {
      query.profileId = activeProfile._id;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const total = await Shortlist.countDocuments(query);
    const shortlists = await Shortlist.find(query)
      .populate('shortlistedProfileId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedShortlists = shortlists.map(item => {
      const itemObj = item.toJSON();
      if (activeProfile && item.shortlistedProfileId) {
        const score = calculateMatchScore(activeProfile, item.shortlistedProfileId);
        itemObj.matchScore = score.totalScore;
        itemObj.isSagotra = score.isSagotra;
        itemObj.hasMaternalConflict = score.hasMaternalConflict;
      }
      return itemObj;
    });

    return success(res, 'Shortlisted profiles fetched successfully', {
      shortlists: formattedShortlists,
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
 * 4. Check if a profile is shortlisted
 * GET /api/shortlist/check/:targetProfileId
 */
const checkShortlistStatus = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    const targetId = targetProfile ? targetProfile._id : (mongoose.Types.ObjectId.isValid(targetProfileId) ? targetProfileId : null);

    if (!targetId) {
      return success(res, 'Shortlist status checked', { isShortlisted: false });
    }

    const isShortlisted = Boolean(
      await Shortlist.exists({
        userId: req.user.userId,
        shortlistedProfileId: targetId
      })
    );

    return success(res, 'Shortlist status checked', { isShortlisted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToShortlist,
  removeFromShortlist,
  getShortlists,
  checkShortlistStatus
};
