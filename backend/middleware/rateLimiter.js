/**
 * API Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const { tooManyRequests } = require('../utils/apiResponse');

// General API Rate Limiter (300 requests per 15 mins)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return tooManyRequests(
      res,
      'Too many requests from this IP, please try again after 15 minutes',
      'GENERAL_RATE_LIMIT_EXCEEDED'
    );
  }
});

// OTP Request Rate Limiter (5 requests per 10 minutes per IP/Mobile)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  keyGenerator: (req) => {
    // Rate limit based on mobile number if available in body, else fallback to client IP
    const mobile = req.body && req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : null;
    return mobile || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return tooManyRequests(
      res,
      'Too many OTP requests for this mobile number. Maximum 5 requests allowed per 10 minutes.',
      'OTP_RATE_LIMIT_EXCEEDED'
    );
  }
});

// Admin Auth Rate Limiter (10 failed attempts per 15 minutes)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return tooManyRequests(
      res,
      'Too many login attempts. Please try again after 15 minutes.',
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  }
});

module.exports = {
  generalLimiter,
  otpLimiter,
  adminAuthLimiter
};
