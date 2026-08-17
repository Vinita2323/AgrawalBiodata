/**
 * KYC Document Verification Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const {
  submitVerification,
  getVerificationStatus,
  getMySubmissions,
  getAdminVerifications,
  getAdminVerificationById,
  approveVerification,
  rejectVerification
} = require('../controllers/verificationController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { uploadVerificationDocs } = require('../middleware/upload');

// User KYC Submission & Status
router.post('/submit', auth, uploadVerificationDocs, submitVerification);
router.get('/status', auth, getVerificationStatus);
router.get('/my-submissions', auth, getMySubmissions);

// Admin KYC Queue & Review (when mounted at /api/verification/admin or directly)
router.get('/admin', adminAuth(['Super Admin', 'Moderator']), getAdminVerifications);
router.get('/admin/:id', adminAuth(['Super Admin', 'Moderator']), getAdminVerificationById);
router.put('/admin/:id/approve', adminAuth(['Super Admin', 'Moderator']), approveVerification);
router.put('/admin/:id/reject', adminAuth(['Super Admin', 'Moderator']), rejectVerification);

module.exports = router;
