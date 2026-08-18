/**
 * Block Controller
 * Profile Blocking, Cascading Restrictions & Moderation
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Block = require('../models/Block');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const Shortlist = require('../models/Shortlist');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const { INTEREST_STATUS, BLOCK_REASONS } = require('../config/constants');
const { success, created, badRequest, notFound } = require('../utils/apiResponse');

/**
 * 1. Block a candidate profile
 * POST /api/blocks
 */
const blockProfile = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const blockedProfileId = req.body.blockedProfileId || req.body.targetProfileId;
    const reason = req.body.reason || 'Other';
    const notes = req.body.notes || '';

    if (!blockedProfileId) {
      return badRequest(res, 'Blocked profile ID is required');
    }

    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const targetProfile = await findProfileByIdOrCustomId(blockedProfileId);

    if (!targetProfile) {
      return notFound(res, 'Candidate profile to block not found');
    }

    if (targetProfile.userId.toString() === req.user.userId) {
      return badRequest(res, 'You cannot block your own profile');
    }

    // Check if already blocked
    let existingBlock = await Block.findOne({
      blockerUserId: req.user.userId,
      blockedUserId: targetProfile.userId
    });

    if (existingBlock) {
      return success(res, 'Profile is already blocked', { block: existingBlock });
    }

    const block = new Block({
      blockerUserId: req.user.userId,
      blockerProfileId: activeProfile._id,
      blockedUserId: targetProfile.userId,
      blockedProfileId: targetProfile._id,
      reason: BLOCK_REASONS.includes(reason) ? reason : 'Other',
      notes
    });

    await block.save();

    // Cascading actions on block:
    // 1. Transition pending interests to Cancelled
    await Interest.updateMany(
      {
        $or: [
          { senderUserId: req.user.userId, recipientUserId: targetProfile.userId },
          { senderUserId: targetProfile.userId, recipientUserId: req.user.userId }
        ],
        status: INTEREST_STATUS.PENDING
      },
      {
        status: INTEREST_STATUS.CANCELLED,
        respondedAt: new Date()
      }
    );

    // 2. Remove shortlist entries between them
    await Shortlist.deleteMany({
      $or: [
        { userId: req.user.userId, shortlistedProfileId: targetProfile._id },
        { userId: targetProfile.userId, shortlistedProfileId: activeProfile._id }
      ]
    });

    return created(res, 'Profile blocked successfully', { block });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Unblock a candidate profile
 * DELETE /api/blocks/:targetProfileId
 */
const unblockProfile = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    const targetId = targetProfile ? targetProfile._id : (mongoose.Types.ObjectId.isValid(targetProfileId) ? targetProfileId : null);
    const targetUserId = targetProfile ? targetProfile.userId : null;

    const queryOr = [];
    if (mongoose.Types.ObjectId.isValid(targetProfileId)) {
      queryOr.push({ _id: targetProfileId });
    }
    if (targetId) {
      queryOr.push({ blockedProfileId: targetId });
    }
    if (targetUserId) {
      queryOr.push({ blockedUserId: targetUserId });
    }

    if (queryOr.length === 0) {
      return success(res, 'Profile unblocked successfully', {
        unblocked: false
      });
    }

    const query = {
      blockerUserId: req.user.userId,
      $or: queryOr
    };

    const deleted = await Block.findOneAndDelete(query);

    return success(res, 'Profile unblocked successfully', {
      unblocked: Boolean(deleted)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get all blocked profiles
 * GET /api/blocks
 */
const getBlockedProfiles = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = { blockerUserId: req.user.userId };

    const total = await Block.countDocuments(query);
    const blocks = await Block.find(query)
      .populate('blockedProfileId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(res, 'Blocked profiles retrieved successfully', {
      blocks,
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
 * 4. Check if candidate is blocked
 * GET /api/blocks/check/:targetProfileId
 */
const checkBlockStatus = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    const targetId = targetProfile ? targetProfile._id : (mongoose.Types.ObjectId.isValid(targetProfileId) ? targetProfileId : null);
    const targetUserId = targetProfile ? targetProfile.userId : null;

    let isBlockedByMe = false;
    if (targetId || targetUserId) {
      const myBlockOr = [];
      if (targetId) myBlockOr.push({ blockedProfileId: targetId });
      if (targetUserId) myBlockOr.push({ blockedUserId: targetUserId });
      isBlockedByMe = Boolean(
        await Block.exists({
          blockerUserId: req.user.userId,
          $or: myBlockOr
        })
      );
    }

    let isBlockedByThem = false;
    if (targetUserId) {
      isBlockedByThem = Boolean(
        await Block.exists({
          blockerUserId: targetUserId,
          blockedUserId: req.user.userId
        })
      );
    }

    return success(res, 'Block status checked', {
      isBlocked: isBlockedByMe || isBlockedByThem,
      isBlockedByMe,
      isBlockedByThem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  blockProfile,
  unblockProfile,
  getBlockedProfiles,
  checkBlockStatus
};
