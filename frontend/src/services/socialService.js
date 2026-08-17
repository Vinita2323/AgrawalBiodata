/**
 * Social Interactivity Service (Shortlists, Visitors, Blocks)
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. Add candidate profile to shortlist
 * POST /api/shortlist
 * @param {string} targetProfileId Candidate profile ID
 * @param {string} [notes] Optional note
 */
export async function addToShortlist(targetProfileId, notes = '') {
  return api.post('/shortlist', {
    targetProfileId,
    shortlistedProfileId: targetProfileId,
    notes
  });
}

/**
 * 2. Remove candidate profile from shortlist
 * DELETE /api/shortlist/:targetProfileId
 * @param {string} targetProfileId Candidate profile ID
 */
export async function removeFromShortlist(targetProfileId) {
  return api.delete(`/shortlist/${targetProfileId}`);
}

/**
 * 3. Toggle candidate shortlist state
 * @param {string} targetProfileId Candidate profile ID
 * @param {boolean} [currentlyShortlisted] Current state if known
 * @param {string} [notes] Optional note when adding
 */
export async function toggleShortlist(targetProfileId, currentlyShortlisted, notes = '') {
  if (currentlyShortlisted === true) {
    return removeFromShortlist(targetProfileId);
  } else if (currentlyShortlisted === false) {
    return addToShortlist(targetProfileId, notes);
  }

  // If current state unknown, check status first
  try {
    const status = await checkShortlistStatus(targetProfileId);
    if (status?.isShortlisted) {
      return removeFromShortlist(targetProfileId);
    } else {
      return addToShortlist(targetProfileId, notes);
    }
  } catch {
    return addToShortlist(targetProfileId, notes);
  }
}

/**
 * 4. Get all shortlisted profiles
 * GET /api/shortlist
 * @param {Object} [params] Query filters (page, limit)
 */
export async function getShortlists(params = {}) {
  return api.get('/shortlist', params);
}

/**
 * 5. Check if candidate profile is shortlisted
 * GET /api/shortlist/check/:targetProfileId
 * @param {string} targetProfileId Candidate profile ID
 */
export async function checkShortlistStatus(targetProfileId) {
  return api.get(`/shortlist/check/${targetProfileId}`);
}

/**
 * 6. Record profile visit (deduplicated daily UTC)
 * POST /api/visitors
 * @param {string} visitedProfileId Visited candidate profile ID
 */
export async function recordVisitor(visitedProfileId) {
  return api.post('/visitors', { visitedProfileId });
}

export const recordVisit = recordVisitor;

/**
 * 7. Get visitors log for active candidate profile
 * GET /api/visitors
 * @param {Object} [params] Query filters (page, limit)
 */
export async function getVisitors(params = {}) {
  return api.get('/visitors', params);
}

/**
 * 8. Get visitor metrics / summary count
 * GET /api/visitors/count
 */
export async function getVisitorMetrics() {
  return api.get('/visitors/count');
}

/**
 * 9. Block a candidate user / profile
 * POST /api/blocks
 * @param {string} targetUserId Target user or profile ID
 * @param {string} [reason] Reason for blocking
 * @param {string} [notes] Additional context
 */
export async function blockUser(targetUserId, reason = '', notes = '') {
  return api.post('/blocks', {
    targetUserId,
    blockedProfileId: targetUserId,
    reason,
    notes
  });
}

export const blockProfile = blockUser;

/**
 * 10. Unblock a candidate user / profile
 * DELETE /api/blocks/:targetUserId
 * @param {string} targetUserId Target user or profile ID
 */
export async function unblockUser(targetUserId) {
  return api.delete(`/blocks/${targetUserId}`);
}

export const unblockProfile = unblockUser;

/**
 * 11. Get all blocked candidate profiles
 * GET /api/blocks
 * @param {Object} [params] Query filters (page, limit)
 */
export async function getBlockedUsers(params = {}) {
  return api.get('/blocks', params);
}

export const getBlockedProfiles = getBlockedUsers;

/**
 * 12. Check if a profile is blocked
 * GET /api/blocks/check/:targetProfileId
 * @param {string} targetProfileId Target profile ID
 */
export async function checkBlockStatus(targetProfileId) {
  return api.get(`/blocks/check/${targetProfileId}`);
}

export const socialService = {
  toggleShortlist,
  addToShortlist,
  removeFromShortlist,
  getShortlists,
  checkShortlistStatus,
  recordVisitor,
  recordVisit,
  getVisitors,
  getVisitorMetrics,
  blockUser,
  blockProfile,
  unblockUser,
  unblockProfile,
  getBlockedUsers,
  getBlockedProfiles,
  checkBlockStatus
};

export default socialService;
