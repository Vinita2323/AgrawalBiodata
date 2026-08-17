/**
 * Payment Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getAdminPayments
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User Payment Endpoints
router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/history', auth, getPaymentHistory);

// Razorpay Webhook Endpoint (Public webhook callback)
router.post('/webhook', handleWebhook);

// Admin Payment Inspection
router.get('/admin/all', adminAuth(['Super Admin', 'Moderator']), getAdminPayments);

module.exports = router;
