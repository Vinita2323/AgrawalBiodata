/**
 * JWT Token Generation and Verification Utilities
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId || payload._id,
      mobile: payload.mobile,
      role: payload.role || 'user'
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

const signRefreshToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId || payload._id,
      mobile: payload.mobile,
      type: 'refresh',
      jti: crypto.randomUUID()
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

const signAdminToken = (payload) => {
  return jwt.sign(
    {
      adminId: payload.adminId || payload._id,
      email: payload.email,
      role: payload.role || 'Super Admin'
    },
    env.JWT_ADMIN_SECRET,
    { expiresIn: env.JWT_ADMIN_EXPIRES_IN }
  );
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const verifyAccessToken = (token) => {
  return verifyToken(token, env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
};

const verifyAdminToken = (token) => {
  return verifyToken(token, env.JWT_ADMIN_SECRET);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signAdminToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyAdminToken
};
