/**
 * User Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { otpLimiter } = require('../middleware/rateLimiter');

// Validation rules
const sendOtpValidation = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isString()
    .withMessage('Mobile number must be a valid string')
];

const verifyOtpValidation = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
];

const registerValidation = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required'),
  body('fullName')
    .optional()
    .isString()
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Routes
router.post('/send-otp', otpLimiter, validate(sendOtpValidation), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpValidation), authController.verifyOtp);
router.post('/register', validate(registerValidation), authController.register);
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
