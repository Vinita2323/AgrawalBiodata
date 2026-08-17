/**
 * Account Lifecycle Controller
 * Contact changes, deactivation and permanent deletion
 * Agrawal Matrimony Platform
 */

const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const Shortlist = require('../models/Shortlist');
const Visitor = require('../models/Visitor');
const Block = require('../models/Block');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const otpService = require('../services/otpService');
const { ACCOUNT_STATUS } = require('../config/constants');
const { success, badRequest, notFound } = require('../utils/apiResponse');

/**
 * 1. Request an OTP to the NEW mobile number before changing it.
 * POST /api/account/mobile/request-otp
 * body: { mobile }
 *
 * The code is sent to the new number, so possession of that number is what
 * authorises the change - not possession of the old one.
 */
const requestMobileChangeOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body || {};
    if (!mobile) {
      return badRequest(res, 'New mobile number is required');
    }

    const normalized = otpService.normalizeMobile(mobile);
    if (normalized.length !== 10) {
      return badRequest(res, 'Please provide a valid 10-digit mobile number');
    }

    const current = await User.findById(req.user.userId).select('mobile');
    if (current && current.mobile === normalized) {
      return badRequest(res, 'This is already your registered mobile number');
    }

    const taken = await User.findOne({ mobile: normalized, _id: { $ne: req.user.userId } });
    if (taken) {
      return badRequest(res, 'This mobile number is already registered to another account');
    }

    const result = await otpService.requestOtp(normalized);
    if (!result.success) {
      return badRequest(res, result.error, null, result.code);
    }

    return success(res, 'Verification code sent to the new mobile number', result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Confirm the OTP and switch the account's mobile number.
 * PUT /api/account/mobile
 * body: { mobile, otp }
 */
const changeMobile = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body || {};
    if (!mobile || !otp) {
      return badRequest(res, 'Mobile number and OTP are both required');
    }

    const verification = await otpService.verifyOtp(mobile, otp);
    if (!verification.isValid) {
      return badRequest(res, verification.error, null, verification.code);
    }

    // Re-check availability: another account could have claimed the number
    // between the OTP request and this confirmation.
    const taken = await User.findOne({
      mobile: verification.mobile,
      _id: { $ne: req.user.userId }
    });
    if (taken) {
      return badRequest(res, 'This mobile number is already registered to another account');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    user.mobile = verification.mobile;
    await user.save();

    return success(res, 'Mobile number updated successfully', {
      mobile: user.mobile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Change the account email address.
 * PUT /api/account/email
 * body: { email }
 */
const changeEmail = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return badRequest(res, 'Email address is required');
    }

    const clean = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return badRequest(res, 'Please provide a valid email address');
    }

    const taken = await User.findOne({ email: clean, _id: { $ne: req.user.userId } });
    if (taken) {
      return badRequest(res, 'This email address is already in use');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    user.email = clean;
    await user.save();

    return success(res, 'Email address updated successfully', { email: user.email });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Deactivate the account: hide every candidate profile from discovery.
 * PUT /api/account/deactivate
 *
 * Reversible - see reactivate below. Data is retained untouched.
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      return badRequest(
        res,
        'A suspended account cannot be deactivated. Please contact support.',
        null,
        'ACCOUNT_SUSPENDED'
      );
    }

    user.accountStatus = ACCOUNT_STATUS.DEACTIVATED;
    user.deactivatedAt = new Date();
    // Revoking refresh tokens ends every other signed-in device.
    user.refreshTokens = [];
    await user.save();

    const hidden = await Profile.updateMany({ userId: user._id }, { $set: { isHidden: true } });

    return success(res, 'Your profile is now hidden. Log in again at any time to reactivate.', {
      accountStatus: user.accountStatus,
      profilesHidden: hidden.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Reactivate a deactivated account.
 * PUT /api/account/reactivate
 */
const reactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      return badRequest(
        res,
        'A suspended account cannot be reactivated here. Please contact support.',
        null,
        'ACCOUNT_SUSPENDED'
      );
    }

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.deactivatedAt = null;
    await user.save();

    const shown = await Profile.updateMany({ userId: user._id }, { $set: { isHidden: false } });

    return success(res, 'Your profile is visible again', {
      accountStatus: user.accountStatus,
      profilesRestored: shown.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Permanently delete the account and all personal data.
 * DELETE /api/account
 * body: { confirm: "DELETE" }
 *
 * Payments and audit logs are deliberately retained as financial and
 * compliance records; everything that identifies the person is removed.
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { confirm } = req.body || {};
    if (confirm !== 'DELETE') {
      return badRequest(
        res,
        'Send { "confirm": "DELETE" } to permanently delete this account',
        null,
        'CONFIRMATION_REQUIRED'
      );
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    const profileIds = await Profile.find({ userId }).distinct('_id');
    const conversationIds = await Conversation.find({ 'participants.userId': userId }).distinct('_id');

    await Promise.all([
      Profile.deleteMany({ userId }),
      Interest.deleteMany({ $or: [{ senderUserId: userId }, { recipientUserId: userId }] }),
      Shortlist.deleteMany({
        $or: [{ userId }, { shortlistedProfileId: { $in: profileIds } }]
      }),
      Visitor.deleteMany({
        $or: [{ visitorUserId: userId }, { visitedProfileId: { $in: profileIds } }]
      }),
      Block.deleteMany({ $or: [{ blockerUserId: userId }, { blockedUserId: userId }] }),
      Match.deleteMany({ $or: [{ userId }, { matchedProfileId: { $in: profileIds } }] }),
      Notification.deleteMany({ userId }),
      Message.deleteMany({ conversationId: { $in: conversationIds } }),
      Conversation.deleteMany({ _id: { $in: conversationIds } })
    ]);

    await User.findByIdAndDelete(userId);

    return success(res, 'Your account and all associated data have been permanently deleted', {
      deletedUserId: userId,
      profilesDeleted: profileIds.length,
      conversationsDeleted: conversationIds.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestMobileChangeOtp,
  changeMobile,
  changeEmail,
  deactivateAccount,
  reactivateAccount,
  deleteAccount
};
