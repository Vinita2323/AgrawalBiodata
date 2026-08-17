/**
 * Admin Verification Queue Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const {
  getAdminVerifications,
  getAdminVerificationById,
  approveVerification,
  rejectVerification
} = require('../controllers/verificationController');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth(['Super Admin', 'Moderator']));

router.get('/', getAdminVerifications);
router.get('/:id', getAdminVerificationById);
router.put('/:id/approve', approveVerification);
router.put('/:id/reject', rejectVerification);

module.exports = router;
