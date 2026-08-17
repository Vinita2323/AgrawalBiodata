/**
 * Complaint & Abuse Moderation Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaintController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User Endpoints
router.post('/', auth, complaintController.submitComplaint);
router.post('/report', auth, complaintController.submitComplaint);
router.get('/my-reports', auth, complaintController.getMyReports);

// Admin Endpoints
router.get('/admin', adminAuth(), complaintController.getAdminComplaints);
router.get('/:id', adminAuth(), complaintController.getAdminComplaintById);
router.put('/:id/resolve', adminAuth(), complaintController.resolveComplaint);

module.exports = router;
