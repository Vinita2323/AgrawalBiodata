/**
 * User Authentication Middleware (JWT Bearer Token)
 */

const { verifyAccessToken } = require('../utils/token');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const User = require('../models/User');
const { readRequestedProfileId } = require('./activeProfile');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Authentication required. No Bearer token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return unauthorized(res, 'Invalid or expired access token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return unauthorized(res, 'User account associated with this token not found');
    }

    if (user.accountStatus === 'Suspended') {
      return forbidden(res, 'Your account has been suspended. Please contact platform support.');
    }

    // Which of the account's candidate profiles this request is acting as.
    const { profileId: requestedProfileId, foreign } = await readRequestedProfileId(req, user);
    if (foreign) {
      return forbidden(res, 'You do not have access to the requested profile');
    }

    req.user = {
      userId: user._id.toString(),
      mobile: user.mobile,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null,
      requestedProfileId,
      userDoc: user
    };

    next();
  } catch (error) {
    return unauthorized(res, 'Authentication verification failed');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId);
        if (user && user.accountStatus !== 'Suspended') {
          const { profileId: requestedProfileId } = await readRequestedProfileId(req, user);
          req.user = {
            userId: user._id.toString(),
            mobile: user.mobile,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            accountStatus: user.accountStatus,
            verificationStatus: user.verificationStatus,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            activeProfileId: user.activeProfileId ? user.activeProfileId.toString() : null,
            requestedProfileId,
            userDoc: user
          };
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  auth,
  optionalAuth
};
