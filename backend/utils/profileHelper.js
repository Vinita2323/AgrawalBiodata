/**
 * Profile & Interaction Helper Utilities
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');

/**
 * Resolves a profile by MongoDB _id or custom string profileId (e.g., "PRF-123456")
 */
const findProfileByIdOrCustomId = async (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id._id) return id; // Already a profile document
  const idStr = id.toString().trim();

  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const byMongoId = await Profile.findById(idStr);
    if (byMongoId) return byMongoId;
  }
  return await Profile.findOne({ profileId: idStr });
};

/**
 * Gets the active profile for a user ID
 */
const getUserActiveProfile = async (userId) => {
  if (!userId) return null;
  const user = await User.findById(userId);
  if (!user) return null;

  let profile = null;
  if (user.activeProfileId) {
    profile = await Profile.findById(user.activeProfileId);
  }

  if (!profile) {
    profile = await Profile.findOne({ userId: user._id });
    if (profile && !user.activeProfileId) {
      user.activeProfileId = profile._id;
      await user.save();
    }
  }

  return { user, activeProfile: profile };
};

/**
 * Gets all user and profile IDs involved in a block relationship with given user
 */
const getBlockedIds = async (userId) => {
  if (!userId) return { blockedUserIds: [], blockedProfileIds: [] };

  const blocks = await Block.find({
    $or: [{ blockerUserId: userId }, { blockedUserId: userId }]
  });

  const blockedUserIds = new Set();
  const blockedProfileIds = new Set();

  for (const b of blocks) {
    blockedUserIds.add(b.blockerUserId.toString());
    blockedUserIds.add(b.blockedUserId.toString());
    blockedProfileIds.add(b.blockerProfileId.toString());
    blockedProfileIds.add(b.blockedProfileId.toString());
  }

  // Remove self user ID from blocked list
  blockedUserIds.delete(userId.toString());

  return {
    blockedUserIds: Array.from(blockedUserIds),
    blockedProfileIds: Array.from(blockedProfileIds)
  };
};

/**
 * Checks if bidirectional block exists between two users or profiles
 */
const isBlockedBetween = async (user1Id, user2Id, profile1Id, profile2Id) => {
  const query = [];
  if (user1Id && user2Id) {
    query.push(
      { blockerUserId: user1Id, blockedUserId: user2Id },
      { blockerUserId: user2Id, blockedUserId: user1Id }
    );
  }
  if (profile1Id && profile2Id) {
    query.push(
      { blockerProfileId: profile1Id, blockedProfileId: profile2Id },
      { blockerProfileId: profile2Id, blockedProfileId: profile1Id }
    );
  }

  if (query.length === 0) return false;
  return Boolean(await Block.exists({ $or: query }));
};

module.exports = {
  findProfileByIdOrCustomId,
  getUserActiveProfile,
  getBlockedIds,
  isBlockedBetween
};
