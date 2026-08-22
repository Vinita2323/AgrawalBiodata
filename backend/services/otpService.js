/**
 * OTP Generation, Validation, and Rate Limiting Service
 */

const crypto = require('crypto');
const OTP = require('../models/OTP');
const smsService = require('./smsService');
const env = require('../config/env');
const logger = require('../utils/logger');

class OtpService {
  /**
   * Generates a secure random 6-digit OTP
   * @returns {string}
   */
  generate6DigitOtp() {
    if (env.DEMO_MODE) return env.DEMO_OTP_CODE;
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Normalizes mobile phone number to standard 10-digit format
   * @param {string} mobile 
   * @returns {string}
   */
  normalizeMobile(mobile) {
    if (!mobile || typeof mobile !== 'string') return '';
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return digits;
  }

  /**
   * Dispatches the OTP SMS and converts a delivery failure into a caller-visible
   * error. Reporting "OTP sent" when the gateway rejected the message leaves the
   * user staring at an input box for a code that will never arrive.
   * @param {string} mobile
   * @param {string} otpCode
   * @returns {Promise<{ success: boolean, error?: string, code?: string }>}
   */
  async dispatchOtp(mobile, otpCode) {
    if (env.DEMO_MODE) {
      logger.info(`[DEMO MODE] OTP for ${mobile} is ${otpCode} (no SMS sent)`);
      return { success: true };
    }

    const result = await smsService.sendOtpSms(
      mobile,
      otpCode,
      Math.round(env.OTP_EXPIRY_SECONDS / 60)
    );

    if (!result.success) {
      logger.error(`OTP delivery failed for ${mobile}: ${result.error}`);
      return {
        success: false,
        error: 'We could not deliver the verification code right now. Please try again shortly.',
        code: 'OTP_DELIVERY_FAILED'
      };
    }

    return { success: true };
  }

  /**
   * Requests a new OTP for a given mobile number
   * Enforces 30s cooldown and 5 requests / 10 min window
   * @param {string} rawMobile 
   * @returns {Promise<{ success: boolean, data?: object, error?: string, code?: string, remainingCooldown?: number }>}
   */
  async requestOtp(rawMobile) {
    const mobile = this.normalizeMobile(rawMobile);
    if (!mobile || mobile.length !== 10) {
      return {
        success: false,
        error: 'Please provide a valid 10-digit mobile number',
        code: 'INVALID_MOBILE'
      };
    }

    const now = new Date();
    const windowMs = env.OTP_WINDOW_MINUTES * 60 * 1000;
    const expiryMs = env.OTP_EXPIRY_SECONDS * 1000;
    const cooldownMs = env.OTP_COOLDOWN_SECONDS * 1000;

    let otpDoc = await OTP.findOne({ mobile }).sort({ createdAt: -1 });

    if (otpDoc) {
      // 1. Check Cooldown enforcement
      if (otpDoc.cooldownUntil && now < otpDoc.cooldownUntil) {
        const remainingSeconds = Math.ceil((otpDoc.cooldownUntil.getTime() - now.getTime()) / 1000);
        return {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
          code: 'OTP_COOLDOWN_ACTIVE',
          remainingCooldown: remainingSeconds
        };
      }

      // 2. Check 10-minute window rate limit (Max 5 requests)
      const windowStart = otpDoc.windowStart ? otpDoc.windowStart.getTime() : otpDoc.createdAt.getTime();
      if (now.getTime() - windowStart < windowMs) {
        if (otpDoc.requestCount >= env.OTP_MAX_ATTEMPTS) {
          const resetMinutes = Math.ceil((windowStart + windowMs - now.getTime()) / 60000);
          return {
            success: false,
            error: `Maximum OTP requests reached (${env.OTP_MAX_ATTEMPTS} requests per ${env.OTP_WINDOW_MINUTES} minutes). Please try again after ${resetMinutes} minutes.`,
            code: 'OTP_RATE_LIMIT_EXCEEDED'
          };
        }
        otpDoc.requestCount += 1;
      } else {
        // Window expired, reset rate limit counter
        otpDoc.windowStart = now;
        otpDoc.requestCount = 1;
      }

      // Generate new OTP
      const otpCode = this.generate6DigitOtp();
      otpDoc.otp = otpCode;
      otpDoc.expiresAt = new Date(now.getTime() + expiryMs);
      otpDoc.cooldownUntil = new Date(now.getTime() + cooldownMs);
      otpDoc.attempts = 0;
      otpDoc.isUsed = false;
      await otpDoc.save();

      // Dispatch SMS
      const resend = await this.dispatchOtp(mobile, otpCode);
      if (!resend.success) return resend;

      return {
        success: true,
        data: {
          mobile,
          cooldown: env.OTP_COOLDOWN_SECONDS,
          expiresIn: env.OTP_EXPIRY_SECONDS,
          // Expose OTP in test/development logs for automated integration testing
          ...(env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {})
        }
      };
    }

    // First time OTP request for this mobile
    const otpCode = this.generate6DigitOtp();
    otpDoc = new OTP({
      mobile,
      otp: otpCode,
      expiresAt: new Date(now.getTime() + expiryMs),
      cooldownUntil: new Date(now.getTime() + cooldownMs),
      attempts: 0,
      requestCount: 1,
      windowStart: now,
      isUsed: false
    });
    await otpDoc.save();

    // Dispatch SMS
    const firstSend = await this.dispatchOtp(mobile, otpCode);
    if (!firstSend.success) return firstSend;

    return {
      success: true,
      data: {
        mobile,
        cooldown: env.OTP_COOLDOWN_SECONDS,
        expiresIn: env.OTP_EXPIRY_SECONDS,
        ...(env.NODE_ENV !== 'production' ? { devOtp: otpCode } : {})
      }
    };
  }

  /**
   * Verifies an OTP submitted by user
   * @param {string} rawMobile 
   * @param {string} inputOtp 
   * @returns {Promise<{ isValid: boolean, error?: string, code?: string, mobile?: string }>}
   */
  async verifyOtp(rawMobile, inputOtp) {
    const mobile = this.normalizeMobile(rawMobile);
    const cleanOtp = String(inputOtp || '').trim();

    if (!mobile || mobile.length !== 10) {
      return {
        isValid: false,
        error: 'Invalid mobile number',
        code: 'INVALID_MOBILE'
      };
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      return {
        isValid: false,
        error: 'OTP must be a 6-digit numeric code',
        code: 'INVALID_OTP_FORMAT'
      };
    }

    const now = new Date();
    const otpDoc = await OTP.findOne({ mobile, isUsed: false }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return {
        isValid: false,
        error: 'No active OTP request found for this mobile number. Please request a new OTP.',
        code: 'OTP_NOT_FOUND'
      };
    }

    // Check expiry
    if (now > otpDoc.expiresAt) {
      return {
        isValid: false,
        error: 'OTP has expired. Please request a new OTP.',
        code: 'OTP_EXPIRED'
      };
    }

    // Check maximum failed verification attempts (e.g. 5 attempts)
    if (otpDoc.attempts >= 5) {
      return {
        isValid: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    // Check OTP match
    if (otpDoc.otp !== cleanOtp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return {
        isValid: false,
        error: 'Invalid OTP code entered. Please check and try again.',
        code: 'INVALID_OTP'
      };
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    return {
      isValid: true,
      mobile
    };
  }
}

module.exports = new OtpService();
