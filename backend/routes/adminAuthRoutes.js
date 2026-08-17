/**
 * Admin Authentication & Profile Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const adminAuthController = require('../controllers/adminAuthController');
const adminAuth = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const { adminAuthLimiter } = require('../middleware/rateLimiter');

// Validations
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Valid email format is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const passwordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Admin Auth Routes
router.post('/login', adminAuthLimiter, validate(loginValidation), adminAuthController.adminLogin);
router.get('/profile', adminAuth(), adminAuthController.getAdminProfile);
router.put('/password', adminAuth(), validate(passwordValidation), adminAuthController.updatePassword);

// Admin Profile Settings Routes (re-usable at /api/admin/settings)
router.put('/profile', adminAuth(), adminAuthController.updateProfile);
router.put('/preferences', adminAuth(), adminAuthController.updatePreferences);

module.exports = router;
