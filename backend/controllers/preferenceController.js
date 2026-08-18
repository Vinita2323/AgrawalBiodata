/**
 * Partner Preferences & Saved Searches Controller
 * Agrawal Matrimony Platform
 */

const SavedSearch = require('../models/SavedSearch');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const { success, created, badRequest, notFound } = require('../utils/apiResponse');

const PREFERENCE_FIELDS = [
  'minAge',
  'maxAge',
  'minHeightCm',
  'maxHeightCm',
  'maritalStatus',
  'manglik',
  'educationLevels',
  'occupations',
  'minIncomeLakh',
  'cities',
  'states',
  'diet',
  'excludeGotras',
  'verifiedOnly'
];

/**
 * 1. Read partner preferences for the active (or named) candidate profile
 * GET /api/preferences  |  GET /api/preferences/:profileId
 */
const getPreferences = async (req, res, next) => {
  try {
    const profile = req.params.profileId
      ? await findProfileByIdOrCustomId(req.params.profileId)
      : (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile;

    if (!profile) {
      return notFound(res, 'Candidate profile not found');
    }
    if (profile.userId.toString() !== req.user.userId) {
      return notFound(res, 'Candidate profile not found');
    }

    return success(res, 'Partner preferences retrieved', {
      profileId: profile._id,
      preferences: profile.partnerPreferences || {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Update partner preferences
 * PUT /api/preferences  |  PUT /api/preferences/:profileId
 */
const updatePreferences = async (req, res, next) => {
  try {
    const profile = req.params.profileId
      ? await findProfileByIdOrCustomId(req.params.profileId)
      : (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile;

    if (!profile) {
      return notFound(res, 'Candidate profile not found');
    }
    if (profile.userId.toString() !== req.user.userId) {
      return notFound(res, 'Candidate profile not found');
    }

    const incoming = req.body || {};
    const applied = {};

    PREFERENCE_FIELDS.forEach((field) => {
      if (incoming[field] === undefined) return;
      profile.partnerPreferences[field] = incoming[field];
      applied[field] = incoming[field];
    });

    if (Object.keys(applied).length === 0) {
      return badRequest(
        res,
        `Provide at least one preference field. Valid fields: ${PREFERENCE_FIELDS.join(', ')}`
      );
    }

    if (
      profile.partnerPreferences.minAge &&
      profile.partnerPreferences.maxAge &&
      profile.partnerPreferences.minAge > profile.partnerPreferences.maxAge
    ) {
      return badRequest(res, 'Minimum age cannot be greater than maximum age');
    }

    await profile.save();

    return success(res, 'Partner preferences updated', {
      profileId: profile._id,
      preferences: profile.partnerPreferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Recent and saved searches
 * GET /api/preferences/searches?saved=true
 */
const getSearches = async (req, res, next) => {
  try {
    const filter = { userId: req.user.userId };
    if (req.query.saved === 'true') filter.isSaved = true;

    const searches = await SavedSearch.find(filter)
      .sort({ lastRunAt: -1 })
      .limit(Math.min(parseInt(req.query.limit, 10) || 20, 50));

    return success(res, 'Searches retrieved', { count: searches.length, searches });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Record a search. Re-running an identical search bumps the existing entry
 * instead of filling the history with duplicates.
 * POST /api/preferences/searches
 */
const recordSearch = async (req, res, next) => {
  try {
    const { query = '', filters = {}, label = '', isSaved = false, resultCount = 0 } = req.body || {};

    if (!query && Object.keys(filters).length === 0) {
      return badRequest(res, 'A search query or at least one filter is required');
    }

    const profileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    const signature = JSON.stringify({ query: query.trim().toLowerCase(), filters });

    const existing = await SavedSearch.findOne({
      userId: req.user.userId,
      query: query.trim(),
      isSaved
    });

    if (existing && JSON.stringify({ query: existing.query.toLowerCase(), filters: existing.filters }) === signature) {
      existing.lastRunAt = new Date();
      existing.resultCount = resultCount;
      await existing.save();
      return success(res, 'Search history updated', { search: existing });
    }

    const search = await SavedSearch.create({
      userId: req.user.userId,
      profileId: profileData?.activeProfile?._id || null,
      query: query.trim(),
      filters,
      label: label || query.trim() || 'Filtered search',
      isSaved,
      resultCount,
      lastRunAt: new Date()
    });

    // Keep unsaved history short - it is a convenience strip, not an archive.
    if (!isSaved) {
      const history = await SavedSearch.find({ userId: req.user.userId, isSaved: false })
        .sort({ lastRunAt: -1 })
        .skip(10)
        .select('_id');

      if (history.length > 0) {
        await SavedSearch.deleteMany({ _id: { $in: history.map((h) => h._id) } });
      }
    }

    return created(res, 'Search recorded', { search });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete a recent or saved search
 * DELETE /api/preferences/searches/:id
 */
const deleteSearch = async (req, res, next) => {
  try {
    const removed = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!removed) {
      return notFound(res, 'Search not found');
    }

    return success(res, 'Search removed', { deletedId: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  getSearches,
  recordSearch,
  deleteSearch
};
