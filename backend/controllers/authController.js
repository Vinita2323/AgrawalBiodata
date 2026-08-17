/**
 * User Authentication Controller (Passwordless OTP & Registration)
 */

const mongoose = require('mongoose');
const otpService = require('../services/otpService');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const { success, created, badRequest, unauthorized, forbidden } = require('../utils/apiResponse');
const { ACCOUNT_STATUS } = require('../config/constants');

/**
 * @desc    Request a 6-digit OTP for mobile verification
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return badRequest(res, 'Mobile number is required');
    }

    const result = await otpService.requestOtp(mobile);

    if (!result.success) {
      if (result.code === 'OTP_COOLDOWN_ACTIVE') {
        return badRequest(res, result.error, null, result.code);
      }
      if (result.code === 'OTP_RATE_LIMIT_EXCEEDED') {
        return res.status(429).json({
          success: false,
          error: result.error,
          code: result.code
        });
      }
      return badRequest(res, result.error, null, result.code);
    }

    return success(res, 'OTP sent successfully', result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and authenticate/login user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return badRequest(res, 'Both mobile number and OTP are required');
    }

    const verification = await otpService.verifyOtp(mobile, otp);

    if (!verification.isValid) {
      return badRequest(res, verification.error, null, verification.code);
    }

    const normalizedMobile = verification.mobile;
    let user = await User.findOne({ mobile: normalizedMobile });
    let isNewUser = false;

    if (!user) {
      // First-time user registration
      user = new User({
        mobile: normalizedMobile,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        lastLoginAt: new Date()
      });
      await user.save();
      isNewUser = true;
    } else {
      // Existing user
      if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        return forbidden(res, 'Your account has been suspended. Please contact platform support.');
      }

      // Logging back in is the documented way to undo a self-deactivation,
      // so reactivate here rather than making the user find a settings toggle.
      if (user.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
        user.accountStatus = ACCOUNT_STATUS.ACTIVE;
        user.deactivatedAt = null;
        await Profile.updateMany({ userId: user._id }, { $set: { isHidden: false } });
      }

      user.lastLoginAt = new Date();
    }

    // Generate JWT access and refresh tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Persist refresh token in user document (capped at 5 tokens per user)
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    return success(res, 'OTP verified successfully', {
      accessToken,
      token: accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register initial user account details
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { fullName, gender, dob, mobile, email, createdFor } = req.body;

    if (!mobile) {
      return badRequest(res, 'Mobile number is required for registration');
    }

    const normalizedMobile = otpService.normalizeMobile(mobile);
    if (normalizedMobile.length !== 10) {
      return badRequest(res, 'Invalid 10-digit mobile number format');
    }

    let user = await User.findOne({ mobile: normalizedMobile });

    if (!user) {
      user = new User({
        mobile: normalizedMobile,
        name: fullName || '',
        gender: gender || '',
        dob: dob ? new Date(dob) : undefined,
        email: email || '',
        createdFor: createdFor || 'Myself',
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        lastLoginAt: new Date()
      });
    } else {
      if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        return forbidden(res, 'Your account has been suspended.');
      }
      if (fullName) user.name = fullName;
      if (gender) user.gender = gender;
      if (dob) user.dob = new Date(dob);
      if (email) user.email = email;
      if (createdFor) user.createdFor = createdFor;
      user.lastLoginAt = new Date();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    return created(res, 'Account created successfully', {
      accessToken,
      token: accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdFor: user.createdFor,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rotate and refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return badRequest(res, 'Refresh token is required');
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded || !decoded.userId) {
      return unauthorized(res, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return unauthorized(res, 'User account not found');
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      return forbidden(res, 'Your account has been suspended.');
    }

    // Check if refresh token exists in user's saved list
    const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
    if (tokenIndex === -1) {
      return unauthorized(res, 'Refresh token has been revoked or invalidated');
    }

    // Rotate refresh token
    user.refreshTokens.splice(tokenIndex, 1);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
    await user.save();

    return success(res, 'Tokens refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user and invalidate refresh token
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const userId = req.user.userId;

    if (token) {
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token } }
      });
    } else {
      // Clear all active sessions if no specific token provided
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: [] }
      });
    }

    return success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    let query = User.findById(req.user.userId);
    if (mongoose.models && mongoose.models.Profile) {
      query = query.populate('profiles');
    }
    const user = await query;
    if (!user) {
      return unauthorized(res, 'User not found');
    }

    return success(res, 'User profile fetched successfully', {
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        createdFor: user.createdFor,
        accountStatus: user.accountStatus,
        verificationStatus: user.verificationStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        contactViewLimit: user.contactViewLimit,
        contactViewsUsed: user.contactViewsUsed,
        activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null,
        profiles: user.profiles || []
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  refreshToken,
  logout,
  getMe
};
