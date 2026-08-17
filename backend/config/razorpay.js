/**
 * Razorpay Payment Gateway Configuration
 */

const Razorpay = require('razorpay');
const env = require('./env');
const logger = require('../utils/logger');

let razorpayInstance = null;

try {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }
} catch (error) {
  logger.warn(`Razorpay initialization warning: ${error.message}`);
}

module.exports = {
  razorpayInstance,
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,
  webhookSecret: env.RAZORPAY_WEBHOOK_SECRET
};
