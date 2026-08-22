/**
 * Payment Controller
 * Razorpay Order Creation, Verification, Webhooks & History
 * Agrawal Matrimony Platform
 */

const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const { success, created, badRequest, notFound, paginate, error: errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * 1. Create Razorpay order for purchasing subscription
 * POST /api/payments/create-order
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { planId, billingCycle = 'monthly', notes = {} } = req.body;

    if (!planId) {
      return badRequest(res, 'Plan ID is required to initiate order');
    }

    const orderData = await paymentService.createOrder({
      userId,
      planId,
      billingCycle,
      notes
    });

    return created(res, 'Razorpay order created successfully', {
      orderId: orderData.order.id,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      keyId: orderData.keyId,
      demoMode: env.DEMO_MODE,
      order: orderData.order,
      payment: orderData.payment,
      plan: {
        id: orderData.plan._id,
        name: orderData.plan.name,
        monthlyPrice: orderData.plan.monthlyPrice,
        yearlyPrice: orderData.plan.yearlyPrice
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return badRequest(res, error.message);
    }
    if (error.message.includes('Payment gateway is temporarily unavailable')) {
      return errorResponse(res, error.message, 503, 'PAYMENT_GATEWAY_UNAVAILABLE');
    }
    next(error);
  }
};

/**
 * 2. Verify payment signature & activate subscription
 * POST /api/payments/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return badRequest(res, 'orderId, paymentId, and signature are required for verification');
    }

    const result = await paymentService.verifyClientPayment({
      userId,
      orderId,
      paymentId,
      signature
    });

    return success(res, 'Payment verified and subscription activated successfully', {
      payment: result.payment,
      subscription: result.subscription
    });
  } catch (error) {
    if (error.message.includes('signature') || error.message.includes('mismatch')) {
      return badRequest(res, error.message, null, 'INVALID_SIGNATURE');
    }
    next(error);
  }
};

/**
 * 2b. Simulate a payment outcome without Razorpay (demo mode only)
 * POST /api/payments/demo-complete
 */
const demoCompletePayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, outcome } = req.body || {};

    if (!orderId || !['success', 'failed'].includes(outcome)) {
      return badRequest(res, 'orderId and a valid outcome ("success" or "failed") are required');
    }

    const result = await paymentService.simulateDemoPayment({ userId, orderId, outcome });

    if (!result.success) {
      return success(res, 'Simulated payment failed', { payment: result.payment });
    }

    return success(res, 'Simulated payment succeeded and subscription activated', {
      payment: result.payment,
      subscription: result.subscription
    });
  } catch (error) {
    if (
      error.message.includes('not enabled') ||
      error.message.includes('not found') ||
      error.message.includes('does not belong')
    ) {
      return badRequest(res, error.message);
    }
    next(error);
  }
};

/**
 * 3. Handle Razorpay Webhooks (HMAC SHA256 Verification with crypto.timingSafeEqual)
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return badRequest(res, 'Razorpay signature header missing');
    }

    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const isSignatureValid = paymentService.verifyWebhookSignature(rawPayload, signature);

    if (!isSignatureValid) {
      logger.warn('Razorpay webhook HMAC signature verification failed');
      return badRequest(res, 'Invalid webhook signature');
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await paymentService.processWebhookEvent(event);

    return res.status(200).json({
      status: 'ok',
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    next(error);
  }
};

/**
 * 4. Get payment transaction history for logged-in user
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments({ userId });
    const payments = await Payment.find({ userId })
      .populate('planId')
      .populate('subscriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, payments, page, limit, total, 'Payment history fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Admin: Get all platform payments with filters
 * GET /api/payments/admin/all
 */
const getAdminPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate('userId', 'name mobile email')
      .populate('planId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, payments, page, limit, total, 'Admin payment records fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  demoCompletePayment,
  handleWebhook,
  getPaymentHistory,
  getAdminPayments
};
