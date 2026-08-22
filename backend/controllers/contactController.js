/**
 * Contact Unlock Controller
 * Agrawal Matrimony Platform
 *
 * Reveals a candidate's masked contact details, consuming one of the viewer's
 * plan-allotted contact views. An unlock is permanent for that viewer: paying
 * twice to see the same number would be indefensible, so previously unlocked
 * profiles are returned without consuming a further view.
 */

const ContactUnlock = require('../models/ContactUnlock');
const User = require('../models/User');
const {
  findProfileByIdOrCustomId,
  isBlockedBetween,
  getUserActiveProfile,
  areProfilesConnected
} = require('../utils/profileHelper');
const { success, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * 1. Unlock a candidate's contact details
 * POST /api/contacts/unlock
 * body: { targetProfileId }
 */
const unlockContact = async (req, res, next) => {
  try {
    const { targetProfileId } = req.body || {};
    if (!targetProfileId) {
      return badRequest(res, 'Target profile ID is required');
    }

    const profile = await findProfileByIdOrCustomId(targetProfileId);
    if (!profile) {
      return notFound(res, 'Candidate profile not found');
    }

    if (profile.userId.toString() === req.user.userId) {
      return badRequest(res, 'This is your own profile');
    }

    const blocked = await isBlockedBetween(req.user.userId, profile.userId, null, profile._id);
    if (blocked) {
      return forbidden(res, 'Contact details are unavailable for this profile');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Mobile numbers are never shared between members, regardless of plan -
    // only email and address are ever unlocked here.
    const buildContact = () => ({
      email: profile.email || '',
      residentialAddress: profile.residentialAddress || ''
    });

    // Already unlocked - return without charging again.
    const existing = await ContactUnlock.findOne({
      userId: user._id,
      unlockedProfileId: profile._id
    });

    if (existing) {
      return success(res, 'Contact details unlocked', {
        alreadyUnlocked: true,
        contact: buildContact(),
        remainingUnlocks: remaining(user)
      });
    }

    // Mutual connections see contacts without spending an unlock. Judged
    // profile-to-profile: an interest the son had accepted must not hand this
    // family's number to the daughter's profile for free.
    const viewerProfile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile;

    if (viewerProfile && (await areProfilesConnected(viewerProfile._id, profile._id))) {
      await ContactUnlock.create({
        userId: user._id,
        unlockedProfileId: profile._id,
        unlockedUserId: profile.userId,
        source: 'Connection'
      });

      return success(res, 'Contact details unlocked through your accepted interest', {
        viaConnection: true,
        contact: buildContact(),
        remainingUnlocks: remaining(user)
      });
    }

    // Otherwise this costs a plan allowance. -1 means unlimited.
    const limit = user.contactViewLimit || 0;
    const used = user.contactViewsUsed || 0;

    if (limit !== -1 && used >= limit) {
      return forbidden(
        res,
        limit === 0
          ? 'Contact viewing is a premium feature. Upgrade your membership to unlock contact details.'
          : `You have used all ${limit} contact views included in your plan. Upgrade to unlock more.`,
        'CONTACT_LIMIT_REACHED'
      );
    }

    if (limit !== -1) {
      user.contactViewsUsed = used + 1;
      await user.save();
    }

    await ContactUnlock.create({
      userId: user._id,
      unlockedProfileId: profile._id,
      unlockedUserId: profile.userId,
      source: 'Subscription'
    });

    return success(res, 'Contact details unlocked', {
      contact: buildContact(),
      remainingUnlocks: remaining(user)
    });
  } catch (error) {
    next(error);
  }
};

/** Remaining unlocks for a user, or null when the plan is unlimited. */
function remaining(user) {
  if (user.contactViewLimit === -1) return null;
  return Math.max(0, (user.contactViewLimit || 0) - (user.contactViewsUsed || 0));
}

/**
 * 2. Contact-view quota for the current user
 * GET /api/contacts/quota
 */
const getQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('contactViewLimit contactViewsUsed');
    if (!user) {
      return notFound(res, 'User not found');
    }

    return success(res, 'Contact view quota retrieved', {
      limit: user.contactViewLimit || 0,
      used: user.contactViewsUsed || 0,
      remaining: remaining(user),
      unlimited: user.contactViewLimit === -1
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Whether a specific profile is already unlocked
 * GET /api/contacts/status/:targetProfileId
 */
const getUnlockStatus = async (req, res, next) => {
  try {
    const profile = await findProfileByIdOrCustomId(req.params.targetProfileId);
    if (!profile) {
      return notFound(res, 'Candidate profile not found');
    }

    const unlock = await ContactUnlock.findOne({
      userId: req.user.userId,
      unlockedProfileId: profile._id
    });

    return success(res, 'Unlock status retrieved', {
      isUnlocked: Boolean(unlock),
      unlockedAt: unlock ? unlock.createdAt : null,
      source: unlock ? unlock.source : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Every profile this user has unlocked
 * GET /api/contacts/unlocked
 */
const getUnlockedContacts = async (req, res, next) => {
  try {
    const unlocks = await ContactUnlock.find({ userId: req.user.userId })
      .populate('unlockedProfileId', 'fullName profileId profilePicture email city')
      .sort({ createdAt: -1 });

    return success(res, 'Unlocked contacts retrieved', {
      count: unlocks.length,
      unlocks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  unlockContact,
  getQuota,
  getUnlockStatus,
  getUnlockedContacts
};
