/**
 * Subscription Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const {
  getCurrentSubscription,
  getSubscriptionHistory,
  cancelSubscription
} = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

// Protected User Subscription Endpoints
router.get('/current', auth, getCurrentSubscription);
router.get('/history', auth, getSubscriptionHistory);
router.post('/cancel', auth, cancelSubscription);

module.exports = router;
