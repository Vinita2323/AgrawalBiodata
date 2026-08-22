/**
 * Profile Controller
 * Candidate Biodata, Multi-Profile Management, Media Upload & Privacy Controls
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');
const Interest = require('../models/Interest');
const Shortlist = require('../models/Shortlist');
const Visitor = require('../models/Visitor');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const ContactUnlock = require('../models/ContactUnlock');
const Verification = require('../models/Verification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { calculateProfileCompletion } = require('../services/profileScoreService');
const matchQuotaService = require('../services/matchQuotaService');
const { getUserActiveProfile, areProfilesConnected } = require('../utils/profileHelper');
const { isValidGotra, normalizeGotra } = require('../utils/gotras');
const { success, created, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * Candidate profiles one account may run at once.
 *
 * Read per call rather than cached at module load so the limit can be tuned per
 * deployment through MAX_PROFILES_PER_ACCOUNT without a rebuild.
 */
const maxProfilesPerAccount = () => {
  const configured = parseInt(process.env.MAX_PROFILES_PER_ACCOUNT, 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 5;
};


/**
 * Helper to resolve profile by either MongoDB _id or string profileId
 */
const findProfileByIdOrCustomId = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byMongoId = await Profile.findById(id);
    if (byMongoId) return byMongoId;
  }
  return await Profile.findOne({ profileId: id });
};

/**
 * 1. Create a new candidate profile
 * POST /api/profiles
 */
const createProfile = async (req, res, next) => {
  try {
    const {
      profileFor = 'Self',
      fullName,
      gender,
      dob,
      tob,
      pob,
      height,
      complexion,
      maritalStatus,
      bloodGroup,
      diet,
      hobbies,
      bio,
      gotra,
      motherGotra,
      manglik,
      rashi,
      nakshatra,
      qualification,
      educationLevel,
      workingAt,
      occupation,
      occupationType,
      income,
      grandfather,
      grandmother,
      maternalGrandfather,
      maternalGrandmother,
      father,
      fatherOccupation,
      fatherOccupationDetails,
      mother,
      motherOccupation,
      familyType,
      familyValues,
      familyOrigin,
      brotherList,
      sisterList,
      taujiList,
      chachaList,
      buajiList,
      mamajiList,
      masijiList,
      residentialAddress,
      city,
      state,
      mobileNumber,
      email,
      privacySettings,
      profilePicture,
      gallery,
      galleryPhotos
    } = req.body;

    // Validate Required Fields
    if (!fullName || !fullName.trim()) {
      return badRequest(res, 'Full name is required', null, 'VALIDATION_ERROR');
    }
    if (!gender) {
      return badRequest(res, 'Gender is required', null, 'VALIDATION_ERROR');
    }
    if (!dob) {
      return badRequest(res, 'Date of birth is required', null, 'VALIDATION_ERROR');
    }
    if (!gotra || !gotra.trim()) {
      return badRequest(res, 'Gotra is required', null, 'VALIDATION_ERROR');
    }

    // Validate Gotra against authentic 18 Gotras
    if (!isValidGotra(gotra)) {
      return badRequest(
        res,
        `Invalid Gotra "${gotra}". Must be one of the authentic 18 Agarwal Gotras.`,
        null,
        'INVALID_GOTRA'
      );
    }

    // Validate Mother's Gotra if provided
    if (motherGotra && motherGotra.trim() !== '' && !isValidGotra(motherGotra)) {
      return badRequest(
        res,
        `Invalid Mother's Gotra "${motherGotra}". Must be one of the authentic 18 Agarwal Gotras.`,
        null,
        'INVALID_GOTRA'
      );
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User account not found');
    }

    // Counted from the Profile collection rather than user.profiles, which can
    // be short for profiles created before that array was maintained.
    const limit = maxProfilesPerAccount();
    const existingCount = await Profile.countDocuments({ userId: user._id });
    if (existingCount >= limit) {
      return badRequest(
        res,
        `You can manage at most ${limit} candidate profiles on one account.`,
        null,
        'PROFILE_LIMIT_REACHED'
      );
    }

    // Generate unique profileId
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedProfileId = `PRF-${randomSuffix}`;

    // Prepare profile document
    const newProfileData = {
      userId: user._id,
      profileId: generatedProfileId,
      profileFor: profileFor === 'Myself' ? 'Self' : profileFor,
      fullName: fullName.trim(),
      gender,
      dob: new Date(dob),
      tob: tob || '',
      pob: pob || '',
      height: height || '',
      complexion: complexion || '',
      maritalStatus: maritalStatus || 'Never Married',
      bloodGroup: bloodGroup || '',
      diet: diet || '',
      hobbies: Array.isArray(hobbies) ? hobbies : (typeof hobbies === 'string' ? hobbies.split(',').map(h => h.trim()) : []),
      bio: bio || '',
      gotra: normalizeGotra(gotra) || gotra,
      motherGotra: motherGotra ? (normalizeGotra(motherGotra) || motherGotra) : '',
      manglik: (manglik === 'No' || manglik === 'Non-Manglik' || !manglik) ? 'Non-Manglik' : (manglik === 'Yes' || manglik === 'Manglik' ? 'Manglik' : (manglik === 'Anshik' ? 'Anshik Manglik' : manglik)),
      rashi: rashi || '',
      nakshatra: nakshatra || '',
      qualification: qualification || '',
      educationLevel: educationLevel || '',
      workingAt: workingAt || '',
      occupation: occupation || '',
      occupationType: occupationType || '',
      income: income || '',
      grandfather: grandfather || '',
      grandmother: grandmother || '',
      maternalGrandfather: maternalGrandfather || '',
      maternalGrandmother: maternalGrandmother || '',
      father: father || '',
      fatherOccupation: fatherOccupation || '',
      fatherOccupationDetails: fatherOccupationDetails || '',
      mother: mother || '',
      motherOccupation: motherOccupation || '',
      familyType: familyType || '',
      familyValues: familyValues || '',
      familyOrigin: familyOrigin || '',
      brotherList: Array.isArray(brotherList) ? brotherList : [],
      sisterList: Array.isArray(sisterList) ? sisterList : [],
      taujiList: Array.isArray(taujiList) ? taujiList : [],
      chachaList: Array.isArray(chachaList) ? chachaList : [],
      buajiList: Array.isArray(buajiList) ? buajiList : [],
      mamajiList: Array.isArray(mamajiList) ? mamajiList : [],
      masijiList: Array.isArray(masijiList) ? masijiList : [],
      residentialAddress: residentialAddress || '',
      city: city || '',
      state: state || '',
      mobileNumber: mobileNumber || user.mobile || '',
      email: email || user.email || '',
      privacySettings: {
        phoneVisibility: privacySettings?.phoneVisibility || 'Connected Members Only',
        addressVisibility: privacySettings?.addressVisibility || 'Connected Members Only',
        photoVisibility: privacySettings?.photoVisibility || 'Visible to All'
      },
      profilePicture: profilePicture || '',
      gallery: Array.isArray(gallery) ? gallery : (Array.isArray(galleryPhotos) ? galleryPhotos : [])
    };

    // Calculate Completion Score
    const scoreResult = calculateProfileCompletion(newProfileData);
    newProfileData.completionPercentage = scoreResult.percentage;

    const profile = new Profile(newProfileData);
    await profile.save();

    // Link profile to user
    user.profiles.push(profile._id);
    if (!user.activeProfileId) {
      user.activeProfileId = profile._id;
    }
    await user.save();

    return created(res, 'Candidate profile created successfully', {
      profile,
      profileId: profile.profileId,
      completionPercentage: profile.completionPercentage,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return badRequest(res, error.message, error.errors, 'VALIDATION_ERROR');
    }
    next(error);
  }
};

/**
 * 2. Get active candidate profile for logged-in user
 * GET /api/profiles/me
 */
const getMeProfile = async (req, res, next) => {
  try {
    const userProfileData = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
    if (!userProfileData) {
      return notFound(res, 'User not found');
    }

    const profile = userProfileData.activeProfile;

    if (!profile) {
      return success(res, 'No candidate profile found for this user', {
        profile: null,
        completionPercentage: 0,
        breakdown: {
          personal: 0,
          astrology: 0,
          education: 0,
          family: 0,
          media: 0
        }
      });
    }

    const scoreResult = calculateProfileCompletion(profile);
    if (profile.completionPercentage !== scoreResult.percentage) {
      profile.completionPercentage = scoreResult.percentage;
      await profile.save();
    }

    return success(res, 'Active candidate profile fetched successfully', {
      profile,
      completionPercentage: scoreResult.percentage,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get all profiles owned by logged-in user
 * GET /api/profiles/my-profiles or GET /api/profiles/user/all
 */
const getUserProfiles = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    const profiles = await Profile.find({ userId: user._id }).sort({ createdAt: -1 });

    const formattedProfiles = profiles.map(p => {
      const pObj = p.toJSON();
      pObj.isActive = user.activeProfileId ? p._id.toString() === user.activeProfileId.toString() : false;
      return pObj;
    });

    return success(res, 'User profiles retrieved successfully', {
      profiles: formattedProfiles,
      activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null,
      totalCount: formattedProfiles.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Switch active profile for logged-in user
 * POST /api/profiles/switch-active or PUT /api/profiles/switch/:profileId
 */
const switchActiveProfile = async (req, res, next) => {
  try {
    const profileIdToSwitch = req.params.profileId || req.body.profileId;
    if (!profileIdToSwitch) {
      return badRequest(res, 'Profile ID is required to switch active profile');
    }

    const profile = await findProfileByIdOrCustomId(profileIdToSwitch);
    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to activate a profile owned by another user');
    }

    const user = await User.findById(req.user.userId);
    user.activeProfileId = profile._id;

    // Profiles created before this list was maintained are absent from it;
    // backfill on switch so ownership checks can trust the cached array.
    if (!user.profiles.some((p) => p.toString() === profile._id.toString())) {
      user.profiles.push(profile._id);
    }
    await user.save();

    return success(res, `Switched active profile to ${profile.fullName} (${profile.profileId})`, {
      activeProfileId: profile._id.toString(),
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Get public / detailed profile by ID (with privacy masking)
 * GET /api/profiles/:profileId
 */
const getProfileById = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findProfileByIdOrCustomId(profileId);

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    // Check if blocked in either direction
    if (req.user && req.user.userId) {
      const isBlocked = await Block.exists({
        $or: [
          { blockerUserId: req.user.userId, blockedUserId: profile.userId },
          { blockerUserId: profile.userId, blockedUserId: req.user.userId }
        ]
      });

      if (isBlocked) {
        return notFound(res, 'Profile not found');
      }
    }

    const isOwner = Boolean(req.user && profile.userId.toString() === req.user.userId);
    const profileData = profile.toJSON();

    // Connection is judged between the viewer's active candidate profile and
    // this one, never between the two accounts: on a parent's account, the
    // son's accepted interest must not unmask contact details for the daughter.
    let isConnected = false;
    if (req.user && !isOwner) {
      const viewerProfile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile;
      if (viewerProfile) {
        isConnected = await areProfilesConnected(viewerProfile._id, profile._id);
      }
    }

    // Full profile detail is a plan-metered view (search and the match feed
    // stay unlimited). Owners and already-connected matches never pay for it.
    let matchQuota = null;
    if (req.user && !isOwner && !isConnected) {
      const viewer = await User.findById(req.user.userId);
      if (viewer) {
        matchQuota = await matchQuotaService.consumeView(viewer, profile._id);
        if (!matchQuota.allowed) {
          return forbidden(
            res,
            `You have viewed all ${matchQuota.limit} profiles included in your plan today. Upgrade your membership or come back tomorrow.`,
            'MATCH_VIEW_LIMIT_REACHED'
          );
        }
      }
    }

    if (!isOwner) {
      // Apply Privacy Protections for non-owners
      const privacy = profile.privacySettings || {};

      // 1. Phone number visibility - mobile numbers are never shared between
      // members, regardless of connection status, privacy setting, or plan.
      profileData.mobileNumber = 'Protected';
      profileData.phoneMasked = true;

      // 2. Address visibility
      if (privacy.addressVisibility === 'Hidden') {
        profileData.residentialAddress = 'Protected';
        profileData.addressMasked = true;
      } else if (
        privacy.addressVisibility === 'Connected Members Only' ||
        privacy.addressVisibility === 'Connected Only'
      ) {
        if (isConnected) {
          profileData.addressMasked = false;
        } else {
          profileData.residentialAddress = 'Protected (Available on Connection)';
          profileData.addressMasked = true;
        }
      } else {
        profileData.addressMasked = false;
      }

      // 3. Photo visibility
      if (privacy.photoVisibility === 'Request Access') {
        profileData.photoMasked = true;
      } else if (
        privacy.photoVisibility === 'Visible to Connected' ||
        privacy.photoVisibility === 'Connected Only'
      ) {
        profileData.photoMasked = !isConnected;
      } else {
        profileData.photoMasked = false;
      }
    }

    return success(res, 'Profile fetched successfully', {
      profile: profileData,
      isOwner: Boolean(isOwner),
      isConnected: Boolean(isConnected),
      matchQuota
    });
  } catch (error) {
    next(error);
  }
};


/**
 * 6. Update candidate profile
 * PUT /api/profiles/:profileId
 */
const updateProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    let profile = null;

    if (profileId === 'me') {
      profile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile || null;

    } else {
      profile = await findProfileByIdOrCustomId(profileId);
    }

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to edit this profile');
    }

    const {
      fullName,
      gender,
      dob,
      tob,
      pob,
      height,
      complexion,
      maritalStatus,
      bloodGroup,
      diet,
      hobbies,
      bio,
      gotra,
      motherGotra,
      manglik,
      rashi,
      nakshatra,
      qualification,
      educationLevel,
      workingAt,
      occupation,
      occupationType,
      income,
      grandfather,
      grandmother,
      maternalGrandfather,
      maternalGrandmother,
      father,
      fatherOccupation,
      fatherOccupationDetails,
      mother,
      motherOccupation,
      familyType,
      familyValues,
      familyOrigin,
      brotherList,
      sisterList,
      taujiList,
      chachaList,
      buajiList,
      mamajiList,
      masijiList,
      residentialAddress,
      city,
      state,
      mobileNumber,
      email,
      privacySettings,
      profilePicture,
      gallery,
      galleryPhotos,
      profileFor
    } = req.body;

    // Validate Gotra if updated
    if (gotra !== undefined) {
      if (!isValidGotra(gotra)) {
        return badRequest(
          res,
          `Invalid Gotra "${gotra}". Must be one of the authentic 18 Agarwal Gotras.`,
          null,
          'INVALID_GOTRA'
        );
      }
      profile.gotra = normalizeGotra(gotra) || gotra;
    }

    // Validate Mother Gotra if updated
    if (motherGotra !== undefined) {
      if (motherGotra && motherGotra.trim() !== '' && !isValidGotra(motherGotra)) {
        return badRequest(
          res,
          `Invalid Mother's Gotra "${motherGotra}". Must be one of the authentic 18 Agarwal Gotras.`,
          null,
          'INVALID_GOTRA'
        );
      }
      profile.motherGotra = motherGotra ? (normalizeGotra(motherGotra) || motherGotra) : '';
    }

    if (fullName !== undefined) profile.fullName = fullName.trim();
    if (gender !== undefined) profile.gender = gender;
    if (dob !== undefined) profile.dob = new Date(dob);
    if (tob !== undefined) profile.tob = tob;
    if (pob !== undefined) profile.pob = pob;
    if (height !== undefined) profile.height = height;
    if (complexion !== undefined) profile.complexion = complexion;
    if (maritalStatus !== undefined) profile.maritalStatus = maritalStatus;
    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (diet !== undefined) profile.diet = diet;
    if (hobbies !== undefined) {
      profile.hobbies = Array.isArray(hobbies) ? hobbies : (typeof hobbies === 'string' ? hobbies.split(',').map(h => h.trim()) : []);
    }
    if (bio !== undefined) profile.bio = bio;
    if (manglik !== undefined) {
      profile.manglik = (manglik === 'No' || manglik === 'Non-Manglik' || !manglik) ? 'Non-Manglik' : (manglik === 'Yes' || manglik === 'Manglik' ? 'Manglik' : (manglik === 'Anshik' ? 'Anshik Manglik' : manglik));
    }
    if (rashi !== undefined) profile.rashi = rashi;
    if (nakshatra !== undefined) profile.nakshatra = nakshatra;

    if (qualification !== undefined) profile.qualification = qualification;
    if (educationLevel !== undefined) profile.educationLevel = educationLevel;
    if (workingAt !== undefined) profile.workingAt = workingAt;
    if (occupation !== undefined) profile.occupation = occupation;
    if (occupationType !== undefined) profile.occupationType = occupationType;
    if (income !== undefined) profile.income = income;

    if (grandfather !== undefined) profile.grandfather = grandfather;
    if (grandmother !== undefined) profile.grandmother = grandmother;
    if (maternalGrandfather !== undefined) profile.maternalGrandfather = maternalGrandfather;
    if (maternalGrandmother !== undefined) profile.maternalGrandmother = maternalGrandmother;
    if (father !== undefined) profile.father = father;
    if (fatherOccupation !== undefined) profile.fatherOccupation = fatherOccupation;
    if (fatherOccupationDetails !== undefined) profile.fatherOccupationDetails = fatherOccupationDetails;
    if (mother !== undefined) profile.mother = mother;
    if (motherOccupation !== undefined) profile.motherOccupation = motherOccupation;
    if (familyType !== undefined) profile.familyType = familyType;
    if (familyValues !== undefined) profile.familyValues = familyValues;
    if (familyOrigin !== undefined) profile.familyOrigin = familyOrigin;

    if (brotherList !== undefined) profile.brotherList = brotherList;
    if (sisterList !== undefined) profile.sisterList = sisterList;
    if (taujiList !== undefined) profile.taujiList = taujiList;
    if (chachaList !== undefined) profile.chachaList = chachaList;
    if (buajiList !== undefined) profile.buajiList = buajiList;
    if (mamajiList !== undefined) profile.mamajiList = mamajiList;
    if (masijiList !== undefined) profile.masijiList = masijiList;

    if (residentialAddress !== undefined) profile.residentialAddress = residentialAddress;
    if (city !== undefined) profile.city = city;
    if (state !== undefined) profile.state = state;
    if (mobileNumber !== undefined) profile.mobileNumber = mobileNumber;
    if (email !== undefined) profile.email = email.trim().toLowerCase();

    if (privacySettings !== undefined) {
      profile.privacySettings = {
        ...profile.privacySettings,
        ...privacySettings
      };
    }

    if (profilePicture !== undefined) profile.profilePicture = profilePicture;
    if (gallery !== undefined) profile.gallery = gallery;
    if (galleryPhotos !== undefined) profile.gallery = galleryPhotos;
    if (profileFor !== undefined) profile.profileFor = profileFor === 'Myself' ? 'Self' : profileFor;

    // Recalculate score
    const scoreResult = calculateProfileCompletion(profile);
    profile.completionPercentage = scoreResult.percentage;

    await profile.save();

    return success(res, 'Profile updated successfully', {
      profile,
      completionPercentage: profile.completionPercentage,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return badRequest(res, error.message, error.errors, 'VALIDATION_ERROR');
    }
    next(error);
  }
};

/**
 * 7. Delete candidate profile
 * DELETE /api/profiles/:profileId
 */
const deleteProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await findProfileByIdOrCustomId(profileId);

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to delete this profile');
    }

    const user = await User.findById(req.user.userId);

    // Everything keyed to this candidate goes with it. Left behind, these
    // records surface as blank rows wherever they are populated.
    const conversationIds = await Conversation.find({
      'participants.profileId': profile._id
    }).distinct('_id');

    await Promise.all([
      Interest.deleteMany({
        $or: [{ senderProfileId: profile._id }, { recipientProfileId: profile._id }]
      }),
      Shortlist.deleteMany({
        $or: [{ profileId: profile._id }, { shortlistedProfileId: profile._id }]
      }),
      Visitor.deleteMany({
        $or: [{ visitorProfileId: profile._id }, { visitedProfileId: profile._id }]
      }),
      Block.deleteMany({
        $or: [{ blockerProfileId: profile._id }, { blockedProfileId: profile._id }]
      }),
      Match.deleteMany({
        $or: [{ profileId: profile._id }, { matchedProfileId: profile._id }]
      }),
      Notification.deleteMany({
        $or: [{ profileId: profile._id }, { actorProfileId: profile._id }]
      }),
      ContactUnlock.deleteMany({ unlockedProfileId: profile._id }),
      Verification.deleteMany({ profileId: profile._id }),
      Message.deleteMany({ conversationId: { $in: conversationIds } }),
      Conversation.deleteMany({ _id: { $in: conversationIds } })
    ]);

    await Profile.findByIdAndDelete(profile._id);

    // Update user's profile list & activeProfileId
    user.profiles = user.profiles.filter(p => p.toString() !== profile._id.toString());
    if (user.activeProfileId && user.activeProfileId.toString() === profile._id.toString()) {
      const fallback = await Profile.findOne({ userId: user._id }).select('_id');
      user.activeProfileId = fallback ? fallback._id : null;
    }
    await user.save();

    return success(res, 'Candidate profile deleted successfully', {
      deletedProfileId: profile.profileId,
      activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Upload Profile Picture
 * POST /api/profiles/:profileId/photo or POST /api/profiles/me/photo
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return badRequest(res, 'No image file uploaded');
    }

    const { profileId } = req.params;
    let profile = null;

    if (!profileId || profileId === 'me') {
      profile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile || null;

    } else {
      profile = await findProfileByIdOrCustomId(profileId);
    }

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to update photos on this profile');
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    profile.profilePicture = photoUrl;

    const scoreResult = calculateProfileCompletion(profile);
    profile.completionPercentage = scoreResult.percentage;
    await profile.save();

    return success(res, 'Profile photo uploaded successfully', {
      url: photoUrl,
      profilePicture: photoUrl,
      completionPercentage: profile.completionPercentage,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Upload Gallery Photo (Max 6 photos)
 * POST /api/profiles/:profileId/gallery or POST /api/profiles/me/gallery
 */
const uploadGalleryPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return badRequest(res, 'No image file uploaded');
    }

    const { profileId } = req.params;
    let profile = null;

    if (!profileId || profileId === 'me') {
      profile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile || null;

    } else {
      profile = await findProfileByIdOrCustomId(profileId);
    }

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to add gallery photos to this profile');
    }

    if (profile.gallery && profile.gallery.length >= 6) {
      return badRequest(res, 'Maximum 6 gallery photos allowed per profile');
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true;

    const newPhoto = {
      id: new mongoose.Types.ObjectId().toString(),
      url: photoUrl,
      caption: req.body.caption || '',
      isPrimary
    };

    if (isPrimary && profile.gallery.length > 0) {
      profile.gallery.forEach(p => { p.isPrimary = false; });
    }

    profile.gallery.push(newPhoto);

    const scoreResult = calculateProfileCompletion(profile);
    profile.completionPercentage = scoreResult.percentage;
    await profile.save();

    return success(res, 'Gallery photo added successfully', {
      photo: newPhoto,
      gallery: profile.gallery,
      completionPercentage: profile.completionPercentage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Delete Gallery Photo
 * DELETE /api/profiles/:profileId/gallery/:photoId
 */
const deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { profileId, photoId } = req.params;
    let profile = null;

    if (profileId === 'me') {
      profile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile || null;

    } else {
      profile = await findProfileByIdOrCustomId(profileId);
    }

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    if (profile.userId.toString() !== req.user.userId) {
      return forbidden(res, 'You do not have permission to delete photos on this profile');
    }

    const initialCount = profile.gallery.length;
    profile.gallery = profile.gallery.filter(
      p => p.id !== photoId && p._id?.toString() !== photoId
    );

    if (profile.gallery.length === initialCount) {
      return notFound(res, 'Gallery photo not found');
    }

    const scoreResult = calculateProfileCompletion(profile);
    profile.completionPercentage = scoreResult.percentage;
    await profile.save();

    return success(res, 'Gallery photo removed successfully', {
      gallery: profile.gallery,
      completionPercentage: profile.completionPercentage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. Get Profile Completion Score Breakdown
 * GET /api/profiles/:profileId/completion or GET /api/profiles/me/completion
 */
const getCompletionScore = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    let profile = null;

    if (!profileId || profileId === 'me') {
      profile = (await getUserActiveProfile(req.user.userId, req.user.requestedProfileId))?.activeProfile || null;

    } else {
      profile = await findProfileByIdOrCustomId(profileId);
    }

    if (!profile) {
      return notFound(res, 'Profile not found');
    }

    const scoreResult = calculateProfileCompletion(profile);

    return success(res, 'Profile completion score calculated successfully', {
      percentage: scoreResult.percentage,
      breakdown: scoreResult.breakdown
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getMeProfile,
  getUserProfiles,
  switchActiveProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  uploadProfilePhoto,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  getCompletionScore
};
