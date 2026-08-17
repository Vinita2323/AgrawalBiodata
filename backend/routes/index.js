/**
 * Master API Router
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminAuthRoutes = require('./adminAuthRoutes');
const profileRoutes = require('./profileRoutes');
const matchRoutes = require('./matchRoutes');
const interestRoutes = require('./interestRoutes');
const shortlistRoutes = require('./shortlistRoutes');
const visitorRoutes = require('./visitorRoutes');
const blockRoutes = require('./blockRoutes');
const planRoutes = require('./planRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const paymentRoutes = require('./paymentRoutes');
const verificationRoutes = require('./verificationRoutes');
const adminVerificationRoutes = require('./adminVerificationRoutes');
const adminRoutes = require('./adminRoutes');
const cmsRoutes = require('./cmsRoutes');
const complaintRoutes = require('./complaintRoutes');
const auditRoutes = require('./auditRoutes');
const notificationRoutes = require('./notificationRoutes');
const messageRoutes = require('./messageRoutes');
const accountRoutes = require('./accountRoutes');
const contactRoutes = require('./contactRoutes');
const preferenceRoutes = require('./preferenceRoutes');
const { AGARWAL_GOTRAS } = require('../config/constants');
const { success } = require('../utils/apiResponse');

// Health Check
router.get('/health', (req, res) => {
  return success(res, 'Agrawal Matrimony REST API is operational', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV
  });
});

// Authentic 18 Gotras Reference Endpoint
router.get('/gotras', (req, res) => {
  return success(res, '18 Authentic Agarwal Gotras fetched successfully', {
    count: AGARWAL_GOTRAS.length,
    gotras: AGARWAL_GOTRAS
  });
});

// Module Routes
router.use('/auth', authRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/settings', adminAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/profiles', profileRoutes);
router.use('/matches', matchRoutes);
router.use('/interests', interestRoutes);
router.use('/shortlist', shortlistRoutes);
router.use('/visitors', visitorRoutes);
router.use('/blocks', blockRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/verification', verificationRoutes);
router.use('/admin/verifications', adminVerificationRoutes);
router.use('/cms', cmsRoutes);
router.use('/complaints', complaintRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/account', accountRoutes);
router.use('/contacts', contactRoutes);
router.use('/preferences', preferenceRoutes);

module.exports = router;

