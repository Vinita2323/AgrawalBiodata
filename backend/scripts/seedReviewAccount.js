/**
 * Store-Review Account Seeder (Idempotent)
 * Agrawal Matrimony Platform
 *
 * Creates the single account a Google Play reviewer signs in to, so that the
 * app they see is a working app rather than an empty shell. Signing in is
 * handled by the REVIEW_MOBILE / REVIEW_OTP_CODE allowlist in config/env.js;
 * this script only gives that number something to log in to.
 *
 * Everything here is deliberately fictional and says so on its face. The
 * credentials are published to a third party, so anyone who reads the Play
 * Console listing can open this account - it must never hold a real person's
 * biodata, and the family names below are written to be unmistakably invented
 * rather than plausible.
 *
 * Run: node scripts/seedReviewAccount.js
 */

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Profile = require('../models/Profile');
const env = require('../config/env');
const logger = require('../utils/logger');
const { calculateProfileCompletion } = require('../services/profileScoreService');
const {
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLANS,
  MANGLIK_STATUS,
  GENDER
} = require('../config/constants');

/** Stable handle so re-running updates this profile instead of adding another. */
const REVIEW_PROFILE_ID = 'PRF-REVIEW-001';

function buildReviewProfile() {
  return {
    profileId: REVIEW_PROFILE_ID,
    profileFor: 'Self',
    fullName: 'Demo Reviewer Account',
    gender: GENDER.MALE,
    dob: new Date('1995-01-01'),
    tob: '12:00 PM',
    pob: 'Sample City',
    height: "5'9\"",
    complexion: 'Wheatish',
    maritalStatus: 'Never Married',
    bloodGroup: 'O+',
    diet: 'Vegetarian',
    hobbies: ['Reading'],
    bio:
      'This is a demonstration account created for Google Play app review. ' +
      'It does not represent a real person and holds no real personal data.',
    gotra: 'Garg',
    motherGotra: 'Bansal',
    manglik: MANGLIK_STATUS.NON_MANGLIK,
    rashi: 'Capricorn',
    nakshatra: 'Shravana',
    qualification: 'Graduate',
    educationLevel: 'Graduate',
    workingAt: 'Sample Employer',
    occupation: 'Sample Occupation',
    occupationType: 'Private Job',
    income: 'Not disclosed',
    // Placeholders by design. A reviewer needs the family section populated to
    // see that it renders; naming it "Sample" keeps it from ever reading as a
    // real family's details.
    grandfather: 'Sample Grandfather',
    grandmother: 'Sample Grandmother',
    maternalGrandfather: 'Sample Maternal Grandfather',
    maternalGrandmother: 'Sample Maternal Grandmother',
    father: 'Sample Father',
    fatherOccupation: 'Business',
    mother: 'Sample Mother',
    motherOccupation: 'Homemaker',
    familyType: 'Nuclear Family',
    familyValues: 'Moderate',
    familyOrigin: 'Sample City',
    city: 'Sample City',
    state: 'Rajasthan',
    // Never a reachable address or number - this account is publicly readable.
    residentialAddress: 'Sample Address, Sample City',
    mobileNumber: env.REVIEW_MOBILE
  };
}

const seedReviewAccount = async () => {
  if (!env.REVIEW_MOBILE) {
    logger.error(
      '[SEED] REVIEW_MOBILE is not set. Configure REVIEW_MOBILE and REVIEW_OTP_CODE in backend/.env before seeding the review account.'
    );
    return false;
  }

  try {
    /**
     * Never adopt a number that already belongs to somebody.
     *
     * This seeder overwrites identity and subscription fields, which is only
     * safe on an account it created. Run once against a number that was already
     * a live member, it silently rewrote that member's name, email and plan.
     * An account carrying profiles is a real account - refuse it and say so.
     */
    const occupant = await User.findOne({ mobile: env.REVIEW_MOBILE });
    if (occupant && occupant.profiles?.length > 0) {
      const ownsOnlyReviewProfile =
        occupant.profiles.length === 1 &&
        (await Profile.findOne({ profileId: REVIEW_PROFILE_ID, userId: occupant._id }));

      if (!ownsOnlyReviewProfile) {
        logger.error(
          `[SEED] ${env.REVIEW_MOBILE} is already a member account with ${occupant.profiles.length} profile(s). Refusing to overwrite it.`
        );
        logger.error(
          '[SEED] Pick a REVIEW_MOBILE that nobody has registered. The review credentials are published to Google, so this account must not hold anyone real.'
        );
        return false;
      }
    }

    /**
     * Retire a review account left behind under a previous REVIEW_MOBILE.
     *
     * The number is expected to change - a placeholder during setup, the real
     * one before submission. Without this the old user stays behind holding a
     * profile it no longer owns, and its mobile is still in the unique index.
     */
    const existingProfile = await Profile.findOne({ profileId: REVIEW_PROFILE_ID });
    if (existingProfile?.userId) {
      const previousOwner = await User.findById(existingProfile.userId);
      if (previousOwner && previousOwner.mobile !== env.REVIEW_MOBILE) {
        await User.deleteOne({ _id: previousOwner._id });
        logger.info(
          `[SEED] Removed the previous review account (${previousOwner.mobile}); REVIEW_MOBILE is now ${env.REVIEW_MOBILE}.`
        );
      }
    }

    let user = await User.findOne({ mobile: env.REVIEW_MOBILE });

    const userData = {
      mobile: env.REVIEW_MOBILE,
      name: 'Demo Reviewer Account',
      email: 'play-review@example.com',
      gender: GENDER.MALE,
      isMobileVerified: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      // Approved so the reviewer sees the verified state of the UI without
      // anyone having to hand-approve a KYC submission mid-review.
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
      subscriptionStatus: SUBSCRIPTION_STATUS.FREE
    };

    if (!user) {
      user = new User(userData);
      await user.save();
      logger.info(`[SEED] Created review account user for ${env.REVIEW_MOBILE}`);
    } else {
      Object.assign(user, userData);
      await user.save();
      logger.info(`[SEED] Updated existing review account user for ${env.REVIEW_MOBILE}`);
    }

    let profile = await Profile.findOne({ profileId: REVIEW_PROFILE_ID });
    const profileData = { ...buildReviewProfile(), userId: user._id };
    profileData.completionPercentage = calculateProfileCompletion(profileData).percentage;

    if (!profile) {
      profile = new Profile(profileData);
      await profile.save();
      logger.info('[SEED] Created review account profile');
    } else {
      Object.assign(profile, profileData);
      await profile.save();
      logger.info('[SEED] Updated review account profile');
    }

    if (!user.profiles.includes(profile._id)) {
      user.profiles.push(profile._id);
    }
    user.activeProfileId = profile._id;
    await user.save();

    logger.info(
      `[SEED] Review account ready: mobile ${env.REVIEW_MOBILE}, profile ${profile.fullName} (${profileData.completionPercentage}% complete).`
    );
    logger.warn(
      '[SEED] These credentials are published to Google. Keep no real data on this account and rotate REVIEW_OTP_CODE once the review is done.'
    );
    return true;
  } catch (error) {
    logger.error(`[SEED] Failed to seed the review account: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedReviewAccount();
      await disconnectDB();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  })();
}

module.exports = seedReviewAccount;
