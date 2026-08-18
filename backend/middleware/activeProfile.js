/**
 * Active Profile Resolution
 * Agrawal Matrimony Platform
 *
 * One account can run several candidate profiles - a parent operating biodata
 * for both a son and a daughter. Which profile a request acts as is therefore
 * per-request state, not global account state: the client sends the profile it
 * is currently showing in an `X-Profile-Id` header.
 *
 * The persisted `user.activeProfileId` remains the fallback, so existing
 * clients that send no header keep working exactly as before, and a fresh
 * login still opens on the last profile the account used.
 */

const Profile = require('../models/Profile');

const PROFILE_HEADER = 'x-profile-id';

/**
 * Reads the requested profile id off a request, confirming the caller owns it.
 *
 * The account's cached `profiles` array answers the common case without a
 * query. It can be short for profiles created before that array was
 * maintained, so a miss falls through to the Profile collection rather than
 * being treated as a rejection - ownership is only ever denied on an
 * authoritative answer.
 *
 * @param {import('express').Request} req
 * @param {object} userDoc Mongoose User document
 * @returns {Promise<{ profileId: string|null, foreign: boolean }>}
 */
async function readRequestedProfileId(req, userDoc) {
  const raw = req.headers[PROFILE_HEADER];
  if (!raw || typeof raw !== 'string') {
    return { profileId: null, foreign: false };
  }

  const profileId = raw.trim();
  if (!profileId) {
    return { profileId: null, foreign: false };
  }

  const cached = new Set((userDoc.profiles || []).map((p) => p.toString()));
  if (cached.has(profileId)) {
    return { profileId, foreign: false };
  }

  const owned = await Profile.exists({
    ...(isObjectIdLike(profileId) ? { _id: profileId } : { profileId }),
    userId: userDoc._id
  });

  return { profileId, foreign: !owned };
}

/**
 * Whether a string looks like a Mongo ObjectId, as opposed to a custom
 * "PRF-123456" profileId.
 */
function isObjectIdLike(value) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

module.exports = {
  PROFILE_HEADER,
  readRequestedProfileId
};
