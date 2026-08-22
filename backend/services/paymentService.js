/**
 * Payment & Razorpay Service
 * Handles Order Creation, Signature Verification, Webhooks & Subscription Activation
 * Agrawal Matrimony Platform
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const env = require('../config/env');
const { razorpayInstance } = require('../config/razorpay');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Helper: Generate a cryptographically secure mock Razorpay order
   */
  generateMockOrder(amountInPaise, notes = {}) {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    return {
      id: `order_${timestamp}_${randomHex}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${timestamp}`,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(timestamp / 1000)
    };
  }

  /**
   * Helper: Resolve Plan by ObjectId, 24-hex string, planId slug, or name
   * @param {string|object} planIdentifier
   * @returns {Promise<object|null>}
   */
  async resolvePlan(planIdentifier) {
    if (!planIdentifier) return null;

    if (planIdentifier._id && planIdentifier.name) {
      return planIdentifier;
    }

    if (mongoose.isValidObjectId(planIdentifier)) {
      try {
        const plan = await Plan.findById(planIdentifier);
        if (plan) return plan;
      } catch (err) {
        // Continue fallback
      }
    }

    const idStr = planIdentifier.toString ? planIdentifier.toString() : String(planIdentifier);

    if (typeof idStr === 'string' && idStr.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const plan = await Plan.findById(idStr);
        if (plan) return plan;
      } catch (err) {
        // Continue fallback
      }
    }

    let plan = await Plan.findOne({ planId: idStr });
    if (plan) return plan;

    plan = await Plan.findOne({ planId: idStr.toLowerCase() });
    if (plan) return plan;

    plan = await Plan.findOne({ name: new RegExp(`^${idStr}$`, 'i') });
    return plan;
  }

  /**
   * Create Razorpay Order and record pending Payment
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.planId
   * @param {string} [params.billingCycle='monthly'] - 'monthly' | 'quarterly' | 'yearly'
   * @param {object} [params.notes={}]
   * @returns {Promise<object>}
   */
  async createOrder({ userId, planId, billingCycle = 'monthly', notes = {} }) {
    // 1. Resolve Plan
    const plan = await this.resolvePlan(planId);

    if (!plan) {
      throw new Error(`Plan not found for ID: ${planId}`);
    }

    if (!plan.isActive) {
      throw new Error(`Plan "${plan.name}" is currently inactive`);
    }

    // 2. Determine Price
    let amountInRupees = plan.monthlyPrice;
    if (billingCycle === 'yearly') {
      amountInRupees = plan.yearlyPrice;
    } else if (billingCycle === 'quarterly') {
      amountInRupees = plan.quarterlyPrice || Math.round(plan.monthlyPrice * 3 * 0.9);
    }

    const amountInPaise = Math.round(amountInRupees * 100);

    // 3. Create Razorpay order
    let order = null;
    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${userId.toString().slice(-4)}`,
      notes: {
        userId: userId.toString(),
        planId: plan._id.toString(),
        planName: plan.name,
        billingCycle,
        ...notes
      }
    };

    if (env.DEMO_MODE) {
      // Demo mode deliberately skips the real gateway entirely - the order
      // is completed later via simulateDemoPayment, never the real checkout
      // widget, so there is no live API call to attempt here.
      order = this.generateMockOrder(amountInPaise, orderPayload.notes);
    } else if (razorpayInstance && env.RAZORPAY_KEY_ID && !env.RAZORPAY_KEY_ID.includes('placeholder')) {
      try {
        order = await razorpayInstance.orders.create(orderPayload);
      } catch (err) {
        // The Razorpay SDK rejects with a plain {statusCode, error} object,
        // not an Error, so err.message is always undefined - pull the real
        // reason out of err.error.description instead.
        const reason = err?.error?.description || err?.message || JSON.stringify(err);
        logger.error(`Razorpay order creation failed: ${reason}`);

        // A mock order can never work with the real client-side Razorpay
        // checkout widget - it always calls Razorpay's live API for the
        // given order_id, which 401s for an order Razorpay never created.
        // Outside tests, a real gateway failure must surface as an error,
        // not silently hand the frontend a checkout that's guaranteed to fail.
        if (env.NODE_ENV === 'test') {
          order = this.generateMockOrder(amountInPaise, orderPayload.notes);
        } else {
          throw new Error('Payment gateway is temporarily unavailable. Please try again shortly.');
        }
      }
    } else {
      order = this.generateMockOrder(amountInPaise, orderPayload.notes);
    }

    // 4. Record Payment Document
    const payment = new Payment({
      userId,
      orderId: order.id,
      amount: amountInRupees,
      currency: 'INR',
      status: 'Created',
      planId: plan._id,
      billingCycle,
      metadata: {
        razorpayOrder: order,
        notes: orderPayload.notes
      }
    });

    await payment.save();

    return {
      order,
      payment,
      plan,
      keyId: env.RAZORPAY_KEY_ID
    };
  }

  /**
   * Verify Client Payment Signature (HMAC SHA256)
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.orderId
   * @param {string} params.paymentId
   * @param {string} params.signature
   * @returns {Promise<object>}
   */
  async verifyClientPayment({ userId, orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) {
      throw new Error('orderId, paymentId, and signature are required for payment verification');
    }

    // 1. Calculate Expected Signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // 2. Timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    const isValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      // Record failed payment attempt if payment exists
      await Payment.findOneAndUpdate(
        { orderId },
        {
          paymentId,
          signature,
          status: 'Failed',
          errorDetails: { message: 'Signature verification mismatch' }
        }
      );
      throw new Error('Invalid payment signature verification failed');
    }

    // 3. Find and Update Payment
    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      payment = new Payment({
        userId,
        orderId,
        paymentId,
        signature,
        amount: 0,
        currency: 'INR',
        status: 'Success'
      });
    } else {
      payment.paymentId = paymentId;
      payment.signature = signature;
      payment.status = 'Success';
    }

    // 4. Activate Subscription
    const subscription = await this.activateUserSubscription({
      userId: payment.userId || userId,
      planId: payment.planId,
      billingCycle: payment.billingCycle || 'monthly',
      paymentId: paymentId,
      orderId: orderId,
      amountPaid: payment.amount
    });

    payment.subscriptionId = subscription._id;
    await payment.save();

    const plan = payment.planId ? await Plan.findById(payment.planId) : null;
    await notificationService.paymentSucceeded({
      userId: payment.userId || userId,
      planName: plan ? plan.name : 'Premium',
      amount: payment.amount
    });

    return {
      success: true,
      payment,
      subscription
    };
  }

  /**
   * Simulate a payment outcome without Razorpay, for demo/testing while no
   * real payment gateway is configured. Reuses the exact same subscription
   * activation path a real successful payment takes, so the rest of the app
   * behaves identically either way.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.orderId
   * @param {'success'|'failed'} params.outcome
   */
  async simulateDemoPayment({ userId, orderId, outcome }) {
    if (!env.DEMO_MODE) {
      throw new Error('Demo payments are not enabled');
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      throw new Error('Order not found');
    }
    if (payment.userId.toString() !== userId.toString()) {
      throw new Error('This order does not belong to you');
    }

    if (outcome !== 'success') {
      payment.status = 'Failed';
      payment.errorDetails = { message: 'Simulated demo payment failure' };
      await payment.save();
      return { success: false, payment };
    }

    payment.paymentId = `demo_pay_${Date.now()}`;
    payment.status = 'Success';

    const subscription = await this.activateUserSubscription({
      userId: payment.userId,
      planId: payment.planId,
      billingCycle: payment.billingCycle || 'monthly',
      paymentId: payment.paymentId,
      orderId,
      amountPaid: payment.amount
    });

    payment.subscriptionId = subscription._id;
    await payment.save();

    const plan = payment.planId ? await Plan.findById(payment.planId) : null;
    await notificationService.paymentSucceeded({
      userId: payment.userId,
      planName: plan ? plan.name : 'Premium',
      amount: payment.amount
    });

    return { success: true, payment, subscription };
  }

  /**
   * Verify Razorpay Webhook HMAC SHA256 Signature using crypto.timingSafeEqual
   * @param {string|Buffer} rawBody
   * @param {string} signatureHeader
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!rawBody || !signatureHeader) {
      return false;
    }

    const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const headerBuf = Buffer.from(signatureHeader, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    if (headerBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(headerBuf, expectedBuf);
  }

  /**
   * Process Razorpay Webhook Event Idempotently
   * @param {object} event
   * @returns {Promise<object>}
   */
  async processWebhookEvent(event) {
    const eventType = event.event;
    const eventId = event.id || `evt_${Date.now()}`;

    logger.info(`Processing Razorpay Webhook Event: ${eventType} (ID: ${eventId})`);

    // Handle payment.captured or order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || '';
      const method = paymentEntity?.method || '';

      if (!orderId) {
        return { success: false, message: 'No orderId in webhook payload' };
      }

      // Check if payment already processed
      let payment = await Payment.findOne({ orderId });

      if (payment && payment.status === 'Success') {
        logger.info(`Webhook order ${orderId} already processed successfully. Returning idempotent response.`);
        return { success: true, idempotent: true, payment };
      }

      if (!payment) {
        // Fallback: search by notes
        const userId = paymentEntity?.notes?.userId;
        const planId = paymentEntity?.notes?.planId;
        const amount = (paymentEntity?.amount || 0) / 100;

        payment = new Payment({
          userId,
          orderId,
          paymentId,
          amount,
          currency: paymentEntity?.currency || 'INR',
          status: 'Success',
          method,
          planId,
          webhookEventId: eventId,
          metadata: event.payload
        });
      } else {
        payment.paymentId = paymentId || payment.paymentId;
        payment.method = method || payment.method;
        payment.status = 'Success';
        payment.webhookEventId = eventId;
        payment.metadata = { ...payment.metadata, webhookPayload: event.payload };
      }

      // Activate user subscription
      const subscription = await this.activateUserSubscription({
        userId: payment.userId,
        planId: payment.planId,
        billingCycle: payment.billingCycle || 'monthly',
        paymentId: paymentId,
        orderId: orderId,
        amountPaid: payment.amount
      });

      payment.subscriptionId = subscription._id;
      await payment.save();

      // Record audit log
      await auditService.logAction({
        action: 'Razorpay Payment Captured (Webhook)',
        target: orderId,
        details: `Activated plan for user ${payment.userId} via webhook ${eventType}`,
        metadata: { orderId, paymentId, eventId, eventType }
      });

      return {
        success: true,
        processed: true,
        payment,
        subscription
      };
    }

    return {
      success: true,
      message: `Event ${eventType} received and ignored`
    };
  }

  /**
   * Activate User Subscription and update User account limits & status
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.planId
   * @param {string} [params.billingCycle='monthly']
   * @param {string} [params.paymentId='']
   * @param {string} [params.orderId='']
   * @param {number} [params.amountPaid=0]
   * @returns {Promise<object>}
   */
  async activateUserSubscription({
    userId,
    planId,
    billingCycle = 'monthly',
    paymentId = '',
    orderId = '',
    amountPaid = 0
  }) {
    // 1. Resolve Plan
    let plan = await this.resolvePlan(planId);

    // Default to Gold if plan not specified
    if (!plan) {
      plan = await Plan.findOne({ name: 'Gold' }) || await Plan.findOne();
    }

    if (!plan) {
      throw new Error('No available subscription plan found to activate');
    }

    // 2. Calculate Expiry Date
    let durationDays = 30;
    if (billingCycle === 'yearly') {
      durationDays = 365;
    } else if (billingCycle === 'quarterly') {
      durationDays = 90;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 3. Deactivate previous active subscriptions for this user
    await Subscription.updateMany(
      { userId, status: 'Active' },
      { status: 'Expired' }
    );

    // 4. Create new Subscription
    const subscription = new Subscription({
      userId,
      planId: plan._id,
      billingCycle,
      startDate,
      endDate,
      status: 'Active',
      paymentId,
      orderId,
      amountPaid: amountPaid || (billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice),
      features: plan.features,
      contactViewLimit: plan.contactViewLimit,
      dailyMatchLimit: plan.dailyMatchLimit
    });

    await subscription.save();

    // 5. Update User Account Status & Limits
    const user = await User.findById(userId);
    if (user) {
      user.subscriptionPlan = plan.name;
      user.subscriptionPlanId = plan._id;
      user.subscriptionStatus = 'Active';
      user.subscriptionExpiresAt = endDate;

      // Update contact view limits
      if (plan.contactViewLimit === -1) {
        user.contactViewLimit = 999999;
      } else {
        user.contactViewLimit = Math.max(user.contactViewLimit || 0, plan.contactViewLimit);
      }

      // Daily view quota reflects the current plan directly (not cumulative,
      // unlike contactViewLimit) and resets so an upgrade applies today.
      user.dailyMatchLimit = plan.dailyMatchLimit;
      user.matchQuotaDate = '';
      user.profilesViewedToday = [];

      await user.save();
    }

    logger.info(`Subscription activated for User ${userId}: ${plan.name} (${billingCycle}) until ${endDate.toISOString()}`);

    return subscription;
  }
}

module.exports = new PaymentService();
