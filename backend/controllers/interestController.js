/**
 * Interest Lifecycle Controller
 * Express, Accept, Decline, Cancel & Filter Matrimonial Interests
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Interest = require('../models/Interest');
const Profile = require('../models/Profile');
const { getUserActiveProfile, findProfileByIdOrCustomId, isBlockedBetween } = require('../utils/profileHelper');
const notificationService = require('../services/notificationService');
const { INTEREST_STATUS } = require('../config/constants');
const { success, created, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * 1. Express interest in a candidate
 * POST /api/interests
 */
const expressInterest = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const { recipientProfileId, message = '' } = req.body;

    if (!recipientProfileId) {
      return badRequest(res, 'Recipient profile ID is required');
    }

    const userProfileData = await getUserActiveProfile(req.user.userId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const recipientProfile = await findProfileByIdOrCustomId(recipientProfileId);

    if (!recipientProfile) {
      return notFound(res, 'Recipient candidate profile not found');
    }

    // Cannot express interest in own profile
    if (recipientProfile.userId.toString() === req.user.userId) {
      return badRequest(res, 'You cannot express interest in your own profile');
    }

    // Check if blocked in either direction
    const blocked = await isBlockedBetween(
      req.user.userId,
      recipientProfile.userId,
      activeProfile._id,
      recipientProfile._id
    );

    if (blocked) {
      return forbidden(res, 'Unable to express interest due to privacy / block restrictions');
    }

    // Check for existing interest from this profile to recipient
    let existingInterest = await Interest.findOne({
      senderProfileId: activeProfile._id,
      recipientProfileId: recipientProfile._id
    });

    if (existingInterest) {
      if (existingInterest.status === INTEREST_STATUS.PENDING) {
        return badRequest(res, 'Interest already sent and is pending response');
      }
      if (existingInterest.status === INTEREST_STATUS.ACCEPTED) {
        return badRequest(res, 'Interest already accepted and active');
      }

      // If Declined or Cancelled, allow re-expressing interest
      existingInterest.status = INTEREST_STATUS.PENDING;
      existingInterest.message = message;
      existingInterest.respondedAt = null;
      await existingInterest.save();

      await notificationService.interestReceived({
        recipientUserId: recipientProfile.userId,
        recipientProfileId: recipientProfile._id,
        senderProfile: activeProfile
      });

      return created(res, 'Interest expressed successfully', { interest: existingInterest });
    }

    // Check if reverse interest exists (recipient already sent interest to sender)
    const reverseInterest = await Interest.findOne({
      senderProfileId: recipientProfile._id,
      recipientProfileId: activeProfile._id,
      status: INTEREST_STATUS.PENDING
    });

    if (reverseInterest) {
      // Auto-accept the pending reverse interest since both parties expressed interest!
      reverseInterest.status = INTEREST_STATUS.ACCEPTED;
      reverseInterest.respondedAt = new Date();
      await reverseInterest.save();

      // Both sides are now connected, so both are told.
      await notificationService.emitMany([
        {
          userId: recipientProfile.userId,
          profileId: recipientProfile._id,
          type: 'InterestAccepted',
          title: `You and ${activeProfile.fullName} are now connected`,
          body: 'Mutual interest matched. You can start a conversation.',
          actorProfileId: activeProfile._id,
          linkTarget: '/chat'
        },
        {
          userId: req.user.userId,
          profileId: activeProfile._id,
          type: 'InterestAccepted',
          title: `You and ${recipientProfile.fullName} are now connected`,
          body: 'Mutual interest matched. You can start a conversation.',
          actorProfileId: recipientProfile._id,
          linkTarget: '/chat'
        }
      ]);

      return created(res, 'Mutual interest matched! Contacts unlocked.', { interest: reverseInterest });
    }

    // Create new Interest
    const interest = new Interest({
      senderUserId: req.user.userId,
      senderProfileId: activeProfile._id,
      recipientUserId: recipientProfile.userId,
      recipientProfileId: recipientProfile._id,
      message,
      status: INTEREST_STATUS.PENDING
    });

    await interest.save();

    await notificationService.interestReceived({
      recipientUserId: recipientProfile.userId,
      recipientProfileId: recipientProfile._id,
      senderProfile: activeProfile
    });

    return created(res, 'Interest expressed successfully', { interest });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Update interest status (Accept / Decline / Cancel)
 * PUT /api/interests/:interestId
 */
const updateInterest = async (req, res, next) => {
  try {
    const { interestId } = req.params;
    req.body = req.body || {};
    const { action, status } = req.body;

    const targetAction = (action || status || '').toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      return notFound(res, 'Interest request not found');
    }

    const interest = await Interest.findById(interestId);

    if (!interest) {
      return notFound(res, 'Interest request not found');
    }

    const currentUserId = req.user.userId;

    if (targetAction === 'accept' || targetAction === 'accepted') {
      if (interest.recipientUserId.toString() !== currentUserId) {
        return forbidden(res, 'Only the recipient can accept this interest');
      }
      interest.status = INTEREST_STATUS.ACCEPTED;
      interest.respondedAt = new Date();
      await interest.save();

      // The original sender is the one who needs to hear about the response.
      const responderProfile = await Profile.findById(interest.recipientProfileId);
      await notificationService.interestAccepted({
        senderUserId: interest.senderUserId,
        senderProfileId: interest.senderProfileId,
        recipientProfile: responderProfile
      });

      return success(res, 'Interest accepted. Contacts unlocked.', { interest });
    }

    if (targetAction === 'decline' || targetAction === 'declined') {
      if (interest.recipientUserId.toString() !== currentUserId) {
        return forbidden(res, 'Only the recipient can decline this interest');
      }
      interest.status = INTEREST_STATUS.DECLINED;
      interest.respondedAt = new Date();
      await interest.save();

      const declinerProfile = await Profile.findById(interest.recipientProfileId);
      await notificationService.interestDeclined({
        senderUserId: interest.senderUserId,
        senderProfileId: interest.senderProfileId,
        recipientProfile: declinerProfile
      });

      return success(res, 'Interest declined', { interest });
    }

    if (targetAction === 'cancel' || targetAction === 'cancelled') {
      if (interest.senderUserId.toString() !== currentUserId) {
        return forbidden(res, 'Only the sender can cancel this interest');
      }
      interest.status = INTEREST_STATUS.CANCELLED;
      interest.respondedAt = new Date();
      await interest.save();

      return success(res, 'Interest cancelled successfully', { interest });
    }

    return badRequest(res, 'Invalid action. Must be accept, decline, or cancel.');
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Accept incoming interest
 * PUT /api/interests/:interestId/accept
 */
const acceptInterest = async (req, res, next) => {
  req.body = req.body || {};
  req.body.action = 'accept';
  return updateInterest(req, res, next);
};

/**
 * 4. Decline incoming interest
 * PUT /api/interests/:interestId/decline
 */
const declineInterest = async (req, res, next) => {
  req.body = req.body || {};
  req.body.action = 'decline';
  return updateInterest(req, res, next);
};

/**
 * 5. Cancel sent interest
 * DELETE /api/interests/:interestId or PUT /api/interests/:interestId/cancel
 */
const cancelInterest = async (req, res, next) => {
  try {
    const { interestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      return notFound(res, 'Interest request not found');
    }

    const interest = await Interest.findById(interestId);

    if (!interest) {
      return notFound(res, 'Interest request not found');
    }

    if (interest.senderUserId.toString() !== req.user.userId) {
      return forbidden(res, 'Only the sender can cancel this interest');
    }

    interest.status = INTEREST_STATUS.CANCELLED;
    interest.respondedAt = new Date();
    await interest.save();

    return success(res, 'Interest cancelled successfully', { interest });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get interests list (Sent, Received, Accepted, etc.)
 * GET /api/interests, GET /api/interests/received, GET /api/interests/sent
 */
const getInterests = async (req, res, next) => {
  try {
    const type = req.query.type || (req.path.includes('sent') ? 'sent' : (req.path.includes('received') ? 'received' : 'all'));
    const status = req.query.status;
    const currentUserId = req.user.userId;

    const query = {};

    if (type === 'sent') {
      query.senderUserId = currentUserId;
    } else if (type === 'received') {
      query.recipientUserId = currentUserId;
    } else {
      query.$or = [{ senderUserId: currentUserId }, { recipientUserId: currentUserId }];
    }

    if (status) {
      query.status = status;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const total = await Interest.countDocuments(query);
    const interests = await Interest.find(query)
      .populate('senderProfileId')
      .populate('recipientProfileId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(res, 'Interests retrieved successfully', {
      interests,
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
 * 7. Get interest status with a specific candidate
 * GET /api/interests/status/:targetProfileId
 */
const getInterestStatus = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const userProfileData = await getUserActiveProfile(req.user.userId);
    const activeProfile = userProfileData?.activeProfile || null;

    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);
    if (!targetProfile) {
      return notFound(res, 'Target profile not found');
    }

    const query = {
      $or: [
        { senderUserId: req.user.userId, recipientUserId: targetProfile.userId },
        { senderUserId: targetProfile.userId, recipientUserId: req.user.userId }
      ]
    };

    if (activeProfile) {
      query.$or.push(
        { senderProfileId: activeProfile._id, recipientProfileId: targetProfile._id },
        { senderProfileId: targetProfile._id, recipientProfileId: activeProfile._id }
      );
    }

    const interest = await Interest.findOne(query).sort({ updatedAt: -1 });

    if (!interest) {
      return success(res, 'No interest history found', {
        status: 'None',
        isSender: false,
        interestId: null
      });
    }

    const isSender = interest.senderUserId.toString() === req.user.userId;

    return success(res, 'Interest status fetched successfully', {
      status: interest.status,
      isSender,
      interestId: interest._id.toString(),
      interest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  expressInterest,
  updateInterest,
  acceptInterest,
  declineInterest,
  cancelInterest,
  getInterests,
  getInterestStatus
};
