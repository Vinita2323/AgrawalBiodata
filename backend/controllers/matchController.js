/**
 * Match Discovery Controller
 * Feeds, Daily Recommendations, Multi-Field Search & On-Demand Score Breakdown
 * Agrawal Matrimony Platform
 */

const Profile = require('../models/Profile');
const Match = require('../models/Match');
const User = require('../models/User');
const matchQuotaService = require('../services/matchQuotaService');
const { calculateMatchScore, calculateAge } = require('../services/matchEngine');
const { getUserActiveProfile, findProfileByIdOrCustomId, getBlockedIds } = require('../utils/profileHelper');
const { normalizeGotra } = require('../utils/gotras');
const {
  hasAnyPreference,
  buildPreferenceClauses,
  applyPostQueryPreferences,
  evaluatePreferenceFit,
  parseHeightToInches,
  parseIncomeToLakh
} = require('../services/preferenceMatcher');
const { success, badRequest, notFound, forbidden } = require('../utils/apiResponse');

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Card-level projection for match/search listings. Full profile detail
 * (contact info, family tree, bio, etc.) is a plan-metered view gated in
 * profileController.getProfileById — listings must never leak it, or the
 * daily view quota would be trivially bypassable by reading it off the feed.
 */
const toMatchCard = (candidate) => {
  const c = candidate.toJSON ? candidate.toJSON() : candidate;
  return {
    id: c.id,
    _id: c._id,
    profileId: c.profileId,
    fullName: c.fullName,
    gender: c.gender,
    dob: c.dob,
    height: c.height,
    city: c.city,
    state: c.state,
    occupation: c.occupation,
    workingAt: c.workingAt,
    qualification: c.qualification,
    gotra: c.gotra,
    motherGotra: c.motherGotra,
    verified: c.verified,
    profilePicture: c.profilePicture,
    createdAt: c.createdAt
  };
};

/**
 * Records which preference dimensions the request filtered explicitly, so the
 * stored preference for those dimensions is skipped. An active filter always
 * beats a saved one.
 * @param {object} query req.query
 * @returns {Set<string>}
 */
const explicitlyFiltered = (query) => {
  const skip = new Set();
  if (query.minAge || query.maxAge) skip.add('age');
  if (query.maritalStatus) skip.add('maritalStatus');
  if (query.manglik) skip.add('manglik');
  if (query.education || query.educationLevel) skip.add('education');
  if (query.occupation) skip.add('occupation');
  if (query.city) skip.add('city');
  if (query.state) skip.add('state');
  if (query.diet) skip.add('diet');
  if (query.gotra) skip.add('gotra');
  if (query.verifiedOnly === 'true') skip.add('verified');
  if (query.minHeightIn || query.maxHeightIn) skip.add('height');
  if (query.minIncomeLakh) skip.add('income');
  return skip;
};

/**
 * 1. Get paginated matches for active profile
 * GET /api/matches
 */
const getMatches = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const { blockedUserIds, blockedProfileIds } = await getBlockedIds(req.user.userId);

    // Filter opposite gender
    const targetGender = activeProfile.gender === 'Male' ? 'Female' : (activeProfile.gender === 'Female' ? 'Male' : null);

    const query = {
      userId: { $ne: req.user.userId, $nin: blockedUserIds },
      _id: { $ne: activeProfile._id, $nin: blockedProfileIds },
      // Deactivated and suspended accounts have their profiles hidden.
      isHidden: { $ne: true }
    };

    if (targetGender) {
      query.gender = targetGender;
    }

    // Additional filters
    if (req.query.gotra) {
      const canonicalGotra = normalizeGotra(req.query.gotra);
      query.gotra = canonicalGotra || req.query.gotra;
    }

    if (req.query.city) {
      query.city = { $regex: new RegExp(`^${escapeRegex(req.query.city.trim())}$`, 'i') };
    }

    if (req.query.state) {
      query.state = { $regex: new RegExp(`^${escapeRegex(req.query.state.trim())}$`, 'i') };
    }

    if (req.query.manglik) {
      query.manglik = req.query.manglik;
    }

    if (req.query.maritalStatus) {
      query.maritalStatus = req.query.maritalStatus;
    }

    if (req.query.verifiedOnly === 'true') {
      query.verified = true;
    }

    // Age bounds filter
    const now = new Date();
    if (req.query.minAge || req.query.maxAge) {
      query.dob = {};
      if (req.query.minAge) {
        const minAgeNum = parseInt(req.query.minAge, 10);
        const maxDob = new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate());
        query.dob.$lte = maxDob;
      }
      if (req.query.maxAge) {
        const maxAgeNum = parseInt(req.query.maxAge, 10);
        const minDob = new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate());
        query.dob.$gte = minDob;
      }
    }

    if (req.query.education) {
      const escapedEdu = escapeRegex(req.query.education.trim());
      query.$or = [
        { qualification: { $regex: escapedEdu, $options: 'i' } },
        { educationLevel: { $regex: escapedEdu, $options: 'i' } }
      ];
    }

    if (req.query.occupation) {
      const occTerm = req.query.occupation.trim();
      const occLower = occTerm.toLowerCase();
      let occPattern = escapeRegex(occTerm);

      if (occLower === 'software' || occLower.includes('software') || occLower === 'it' || occLower === 'tech') {
        occPattern = 'software|systems|architect|developer|programmer|engineer|tech|ai|researcher|it|coder';
      } else if (occLower === 'finance' || occLower === 'banking' || occLower === 'banker') {
        occPattern = 'finance|financial|bank|banking|banker|accountant|analyst|ca|auditor';
      } else if (occLower === 'doctor' || occLower === 'medical' || occLower === 'healthcare') {
        occPattern = 'doctor|physician|surgeon|medicine|mbbs|md|cardiology|hospital';
      }

      query.occupation = { $regex: new RegExp(occPattern, 'i') };
    }

    // Apply the candidate's saved partner preferences unless they opted out.
    // Explicit request filters take precedence over the stored preference for
    // the same dimension.
    const preferences = activeProfile.partnerPreferences;
    const usePreferences =
      req.query.ignorePreferences !== 'true' && hasAnyPreference(preferences);

    // Count matches before preferences so the client can tell the user how much
    // their preferences narrowed the feed instead of showing a bare empty state.
    const totalBeforePreferences = usePreferences ? await Profile.countDocuments(query) : null;

    if (usePreferences) {
      const skip = explicitlyFiltered(req.query);
      const clauses = buildPreferenceClauses(preferences, skip);
      if (clauses.length > 0) {
        query.$and = [...(query.$and || []), ...clauses];
      }
    }

    // Fetch matching candidate profiles from DB
    let candidates = await Profile.find(query);

    if (usePreferences) {
      candidates = applyPostQueryPreferences(
        candidates,
        preferences,
        explicitlyFiltered(req.query)
      );
    }

    // Calculate match scores
    let scoredMatches = candidates.map(candidate => {
      const scoreResult = calculateMatchScore(activeProfile, candidate);
      const candidateObj = toMatchCard(candidate);
      const age = calculateAge(candidate.dob);
      const preferenceFit = evaluatePreferenceFit(preferences, candidate, age);

      return {
        profile: candidateObj,
        matchScore: scoreResult.totalScore,
        isSagotra: scoreResult.isSagotra,
        hasMaternalConflict: scoreResult.hasMaternalConflict,
        breakdown: scoreResult.breakdown,
        preferenceFit,
        age
      };
    });

    // Filter out Sagotra if excludeSagotra is set
    if (req.query.excludeSagotra === 'true') {
      scoredMatches = scoredMatches.filter(m => !m.isSagotra);
    }

    // Filter by minScore if provided
    if (req.query.minScore) {
      const minScoreVal = parseInt(req.query.minScore, 10);
      scoredMatches = scoredMatches.filter(m => m.matchScore >= minScoreVal);
    }

    // Sorting
    const sortType = req.query.sort || 'score';
    if (sortType === 'score') {
      scoredMatches.sort((a, b) => b.matchScore - a.matchScore || new Date(b.profile.createdAt) - new Date(a.profile.createdAt));
    } else if (sortType === 'recent') {
      scoredMatches.sort((a, b) => new Date(b.profile.createdAt) - new Date(a.profile.createdAt));
    } else if (sortType === 'age') {
      scoredMatches.sort((a, b) => (a.age || 0) - (b.age || 0));
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const total = scoredMatches.length;
    const startIndex = (page - 1) * limit;
    const paginatedMatches = scoredMatches.slice(startIndex, startIndex + limit);

    return success(res, 'Matches retrieved successfully', {
      matches: paginatedMatches,
      preferencesApplied: usePreferences,
      totalBeforePreferences,
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
 * 2. Get top daily recommendations carousel
 * GET /api/matches/today
 */
const getTodayMatches = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const { blockedUserIds, blockedProfileIds } = await getBlockedIds(req.user.userId);

    const targetGender = activeProfile.gender === 'Male' ? 'Female' : (activeProfile.gender === 'Female' ? 'Male' : null);

    const query = {
      userId: { $ne: req.user.userId, $nin: blockedUserIds },
      _id: { $ne: activeProfile._id, $nin: blockedProfileIds },
      // Deactivated and suspended accounts have their profiles hidden.
      isHidden: { $ne: true }
    };

    if (targetGender) {
      query.gender = targetGender;
    }

    // Daily recommendations honour saved preferences - a recommendation that
    // ignores what the user asked for is noise, not a recommendation.
    const preferences = activeProfile.partnerPreferences;
    const usePreferences =
      req.query.ignorePreferences !== 'true' && hasAnyPreference(preferences);

    if (usePreferences) {
      const clauses = buildPreferenceClauses(preferences);
      if (clauses.length > 0) {
        query.$and = [...(query.$and || []), ...clauses];
      }
    }

    let candidates = await Profile.find(query);

    if (usePreferences) {
      candidates = applyPostQueryPreferences(candidates, preferences);
    }

    // Calculate score, filter out sagotra, take top N
    const scoredMatches = candidates
      .map(candidate => {
        const scoreResult = calculateMatchScore(activeProfile, candidate);
        const age = calculateAge(candidate.dob);
        return {
          profile: toMatchCard(candidate),
          matchScore: scoreResult.totalScore,
          isSagotra: scoreResult.isSagotra,
          hasMaternalConflict: scoreResult.hasMaternalConflict,
          breakdown: scoreResult.breakdown,
          preferenceFit: evaluatePreferenceFit(preferences, candidate, age),
          age
        };
      })
      .filter(m => !m.isSagotra)
      .sort((a, b) => b.matchScore - a.matchScore);

    const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
    const recommendations = scoredMatches.slice(0, limit);

    return success(res, 'Daily recommendations retrieved successfully', {
      recommendations,
      preferencesApplied: usePreferences,
      count: recommendations.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Multi-field candidate search
 * GET /api/matches/search
 */
const searchMatches = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    const activeProfile = userProfileData?.activeProfile || null;
    const { blockedUserIds, blockedProfileIds } = await getBlockedIds(req.user.userId);

    const query = {
      userId: { $ne: req.user.userId, $nin: blockedUserIds },
      _id: { $nin: blockedProfileIds },
      // Deactivated and suspended accounts have their profiles hidden.
      isHidden: { $ne: true }
    };

    if (activeProfile) {
      query._id.$ne = activeProfile._id;
    }

    // Gender filter: default to opposite if activeProfile exists, or explicit req.query.gender
    if (req.query.gender) {
      query.gender = req.query.gender;
    } else if (activeProfile) {
      query.gender = activeProfile.gender === 'Male' ? 'Female' : (activeProfile.gender === 'Female' ? 'Male' : undefined);
      if (!query.gender) delete query.gender;
    }

    // Gotra filter
    if (req.query.gotra) {
      const canonicalGotra = normalizeGotra(req.query.gotra);
      query.gotra = canonicalGotra || req.query.gotra;
    }

    // Text search keyword query
    if (req.query.query && req.query.query.trim()) {
      const keyword = escapeRegex(req.query.query.trim());
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { fullName: regex },
        { bio: regex },
        { occupation: regex },
        { workingAt: regex },
        { qualification: regex },
        { educationLevel: regex },
        { city: regex },
        { state: regex },
        { profileId: regex }
      ];
    }

    // City & State filters
    if (req.query.city) {
      query.city = { $regex: new RegExp(`^${escapeRegex(req.query.city.trim())}$`, 'i') };
    }
    if (req.query.state) {
      query.state = { $regex: new RegExp(`^${escapeRegex(req.query.state.trim())}$`, 'i') };
    }

    // Occupation & Qualification filters
    if (req.query.occupation) {
      const occTerm = req.query.occupation.trim();
      const occLower = occTerm.toLowerCase();
      let occPattern = escapeRegex(occTerm);

      if (occLower === 'software' || occLower.includes('software') || occLower === 'it' || occLower === 'tech') {
        occPattern = 'software|systems|architect|developer|programmer|engineer|tech|ai|researcher|it|coder';
      } else if (occLower === 'finance' || occLower === 'banking' || occLower === 'banker') {
        occPattern = 'finance|financial|bank|banking|banker|accountant|analyst|ca|auditor';
      } else if (occLower === 'doctor' || occLower === 'medical' || occLower === 'healthcare') {
        occPattern = 'doctor|physician|surgeon|medicine|mbbs|md|cardiology|hospital';
      }

      query.occupation = { $regex: new RegExp(occPattern, 'i') };
    }
    if (req.query.qualification) {
      query.qualification = { $regex: new RegExp(escapeRegex(req.query.qualification.trim()), 'i') };
    }

    // Marital Status & Manglik filters
    if (req.query.maritalStatus) {
      query.maritalStatus = req.query.maritalStatus;
    }
    if (req.query.manglik) {
      query.manglik = req.query.manglik;
    }

    if (req.query.verifiedOnly === 'true') {
      query.verified = true;
    }

    // Diet, complexion and education level filters
    if (req.query.diet) {
      query.diet = req.query.diet;
    }
    if (req.query.complexion) {
      query.complexion = req.query.complexion;
    }
    if (req.query.educationLevel) {
      query.educationLevel = { $regex: new RegExp(escapeRegex(req.query.educationLevel.trim()), 'i') };
    }

    // Age bounds filter
    const now = new Date();
    if (req.query.minAge || req.query.maxAge) {
      query.dob = {};
      if (req.query.minAge) {
        const minAgeNum = parseInt(req.query.minAge, 10);
        const maxDob = new Date(now.getFullYear() - minAgeNum, now.getMonth(), now.getDate());
        query.dob.$lte = maxDob;
      }
      if (req.query.maxAge) {
        const maxAgeNum = parseInt(req.query.maxAge, 10);
        const minDob = new Date(now.getFullYear() - maxAgeNum - 1, now.getMonth(), now.getDate());
        query.dob.$gte = minDob;
      }
    }

    // Search is an active, explicit act, so saved preferences are opt-in here
    // rather than applied silently: ?usePreferences=true narrows the results.
    const preferences = activeProfile ? activeProfile.partnerPreferences : null;
    const usePreferences =
      req.query.usePreferences === 'true' && hasAnyPreference(preferences);

    if (usePreferences) {
      const clauses = buildPreferenceClauses(preferences, explicitlyFiltered(req.query));
      if (clauses.length > 0) {
        query.$and = [...(query.$and || []), ...clauses];
      }
    }

    let candidates = await Profile.find(query);

    if (usePreferences) {
      candidates = applyPostQueryPreferences(
        candidates,
        preferences,
        explicitlyFiltered(req.query)
      );
    }

    // Height and income are stored as display strings (5'6", "15-20 LPA"), so
    // their range filters are applied after the query rather than inside it.
    const minHeightIn = req.query.minHeightIn ? parseFloat(req.query.minHeightIn) : null;
    const maxHeightIn = req.query.maxHeightIn ? parseFloat(req.query.maxHeightIn) : null;
    const minIncomeLakh = req.query.minIncomeLakh ? parseFloat(req.query.minIncomeLakh) : null;

    if (minHeightIn !== null || maxHeightIn !== null) {
      candidates = candidates.filter((c) => {
        const inches = parseHeightToInches(c.height);
        if (inches === null) return false;
        if (minHeightIn !== null && inches < minHeightIn) return false;
        if (maxHeightIn !== null && inches > maxHeightIn) return false;
        return true;
      });
    }

    if (minIncomeLakh !== null) {
      candidates = candidates.filter((c) => {
        const lakh = parseIncomeToLakh(c.income);
        return lakh !== null && lakh >= minIncomeLakh;
      });
    }

    let results = candidates.map(candidate => {
      const candidateObj = toMatchCard(candidate);
      const age = calculateAge(candidate.dob);

      if (activeProfile) {
        const scoreResult = calculateMatchScore(activeProfile, candidate);
        return {
          profile: candidateObj,
          matchScore: scoreResult.totalScore,
          isSagotra: scoreResult.isSagotra,
          hasMaternalConflict: scoreResult.hasMaternalConflict,
          breakdown: scoreResult.breakdown,
          age
        };
      }

      return {
        profile: candidateObj,
        matchScore: candidate.matchScore || 0,
        isSagotra: false,
        hasMaternalConflict: false,
        age
      };
    });

    // Sort by match score if active profile exists
    if (activeProfile) {
      results.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      results.sort((a, b) => new Date(b.profile.createdAt) - new Date(a.profile.createdAt));
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return success(res, 'Candidate search results fetched', {
      results: paginatedResults,
      preferencesApplied: usePreferences,
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
 * 4. Get on-demand compatibility score for a target profile
 * GET /api/matches/score/:targetProfileId
 */
const getMatchScore = async (req, res, next) => {
  try {
    const { targetProfileId } = req.params;
    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    if (!userProfileData || !userProfileData.activeProfile) {
      return badRequest(res, 'No active candidate profile found. Please create or activate a profile first.', null, 'NO_ACTIVE_PROFILE');
    }

    const { activeProfile } = userProfileData;
    const targetProfile = await findProfileByIdOrCustomId(targetProfileId);

    if (!targetProfile) {
      return notFound(res, 'Target candidate profile not found');
    }

    const scoreResult = calculateMatchScore(activeProfile, targetProfile);

    return success(res, 'Match score calculated successfully', {
      targetProfileId: targetProfile.profileId || targetProfile._id.toString(),
      totalScore: scoreResult.totalScore,
      isSagotra: scoreResult.isSagotra,
      hasMaternalConflict: scoreResult.hasMaternalConflict,
      breakdown: scoreResult.breakdown,
      // Which of the viewer's stated preferences this candidate satisfies,
      // so the detail screen can explain the match rather than just score it.
      preferenceFit: evaluatePreferenceFit(
        activeProfile.partnerPreferences,
        targetProfile,
        calculateAge(targetProfile.dob)
      )
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Daily profile-view quota status for the current user
 * GET /api/matches/quota
 */
const getMatchQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    const quota = await matchQuotaService.getQuotaStatus(user);
    return success(res, 'Daily profile view quota retrieved', { quota });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getTodayMatches,
  searchMatches,
  getMatchScore,
  getMatchQuota
};
