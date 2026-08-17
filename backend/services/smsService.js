/**
 * SMS Notification Service (Pluggable Provider Interface)
 *
 * Supported providers (env SMS_PROVIDER): msg91 | twilio | fast2sms | none
 * In non-production environments an unconfigured provider logs to the console
 * so local OTP flows keep working. In production an unconfigured or failing
 * provider is reported as a failure - it never fakes success, because a silent
 * "sent" makes every login look fine while no user ever receives a code.
 */

const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Normalize an Indian mobile number to E.164 (+91XXXXXXXXXX).
 * Accepts "9876543210", "+91 98765 43210", "091-9876543210".
 */
function toE164(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * POST a JSON body and resolve the parsed response.
 * Uses the global fetch shipped with Node 18+ (see package.json engines).
 */
async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`Provider responded ${response.status}: ${detail}`);
  }

  return payload;
}

const providers = {
  /**
   * MSG91 Flow API - https://docs.msg91.com
   */
  async msg91(mobile, message) {
    if (!env.MSG91_AUTH_KEY) {
      throw new Error('MSG91_AUTH_KEY is not configured');
    }

    const payload = await postJson(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: env.MSG91_TEMPLATE_ID,
        sender: env.SMS_SENDER_ID,
        short_url: '0',
        recipients: [{ mobiles: toE164(mobile).replace('+', ''), MESSAGE: message }]
      },
      { authkey: env.MSG91_AUTH_KEY }
    );

    return { messageId: payload?.request_id || payload?.message || 'msg91_accepted' };
  },

  /**
   * Twilio Programmable SMS - form-encoded, HTTP Basic auth.
   */
  async twilio(mobile, message) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER must all be configured');
    }

    const credentials = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const form = new URLSearchParams({
      To: toE164(mobile),
      From: env.TWILIO_FROM_NUMBER,
      Body: message
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
      }
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Twilio responded ${response.status}: ${payload?.message || 'unknown error'}`);
    }

    return { messageId: payload?.sid || 'twilio_accepted' };
  },

  /**
   * Fast2SMS bulk route - https://docs.fast2sms.com
   */
  async fast2sms(mobile, message) {
    if (!env.FAST2SMS_API_KEY) {
      throw new Error('FAST2SMS_API_KEY is not configured');
    }

    const payload = await postJson(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: toE164(mobile).replace('+91', '')
      },
      { authorization: env.FAST2SMS_API_KEY }
    );

    if (payload && payload.return === false) {
      throw new Error(payload.message || 'Fast2SMS rejected the request');
    }

    return { messageId: payload?.request_id || 'fast2sms_accepted' };
  }
};

class SmsService {
  /**
   * Dispatches an SMS message to target phone number
   * @param {string} mobile
   * @param {string} message
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendSms(mobile, message) {
    const provider = providers[env.SMS_PROVIDER];

    // No gateway configured: log locally outside production so dev/test flows work.
    if (!provider) {
      if (env.NODE_ENV === 'production') {
        logger.error(`SMS provider "${env.SMS_PROVIDER}" is not configured. SMS to ${mobile} was NOT sent.`);
        return { success: false, error: 'SMS provider not configured' };
      }

      logger.info(`[SMS STUB] To: ${mobile} | Message: "${message}"`);
      return { success: true, messageId: `stub_msg_${Date.now()}`, stubbed: true };
    }

    try {
      const result = await provider(mobile, message);
      logger.info(`SMS dispatched via ${env.SMS_PROVIDER} to ${toE164(mobile)} (id: ${result.messageId})`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`SMS dispatch failed via ${env.SMS_PROVIDER} for ${mobile}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Formats and dispatches OTP authentication SMS
   * @param {string} mobile
   * @param {string} otp
   * @param {number} validityMinutes
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendOtpSms(mobile, otp, validityMinutes = 5) {
    const text = `Your Agrawal Matrimony verification code is: ${otp}. Valid for ${validityMinutes} minutes. Please do not share this OTP with anyone.`;
    return this.sendSms(mobile, text);
  }

  /**
   * True when SMS is being logged rather than actually delivered.
   */
  isStubbed() {
    return !providers[env.SMS_PROVIDER];
  }
}

module.exports = new SmsService();
module.exports.toE164 = toE164;
