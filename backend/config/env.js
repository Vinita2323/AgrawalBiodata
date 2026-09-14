/**
 * Environment Configuration and Validation
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Demo mode: every OTP request/verify uses the fixed code below instead of
  // dispatching real SMS. For launch before a real SMS gateway is configured.
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  DEMO_OTP_CODE: process.env.DEMO_OTP_CODE || '123456',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agrawal_matrimony',
  
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_for_dev_only',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_for_dev_only',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || 'default_jwt_admin_secret_for_dev_only',
  JWT_ADMIN_EXPIRES_IN: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  
  // OTP
  OTP_EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10),
  OTP_COOLDOWN_SECONDS: parseInt(process.env.OTP_COOLDOWN_SECONDS || '30', 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  OTP_WINDOW_MINUTES: parseInt(process.env.OTP_WINDOW_MINUTES || '10', 10),

  // Store-review account. Google Play reviewers work from outside India and
  // cannot receive an OTP on an Indian number, so without a way in they file
  // the app as unusable. This grants exactly one allowlisted mobile a fixed
  // code; every other number still goes through the real SMS gateway. Declare
  // the pair in Play Console > App content > App access.
  REVIEW_MOBILE: (process.env.REVIEW_MOBILE || '').replace(/\D/g, '').slice(-10),
  REVIEW_OTP_CODE: process.env.REVIEW_OTP_CODE || '',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:5173', 'http://localhost:3000'],

  // Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // SMS Gateway (provider: msg91 | twilio | fast2sms | none)
  SMS_PROVIDER: (process.env.SMS_PROVIDER || 'none').toLowerCase(),
  SMS_SENDER_ID: process.env.SMS_SENDER_ID || 'AGRWLM',
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',

  // Email Gateway (provider: smtp | none)
  EMAIL_PROVIDER: (process.env.EMAIL_PROVIDER || 'none').toLowerCase(),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Agrawal Matrimony <no-reply@agarwalbiodata.com>',

  // Firebase Cloud Messaging (web push). Optional - set ONE of these two; if
  // neither is set, push sending is disabled and the in-app feed still works.
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || ''
};

/**
 * Fail fast in production when security-critical secrets are left at their
 * development defaults. A silently-defaulted JWT secret is a full auth bypass.
 */
const PRODUCTION_REQUIRED = [
  ['JWT_ACCESS_SECRET', 'default_jwt_access_secret_for_dev_only'],
  ['JWT_REFRESH_SECRET', 'default_jwt_refresh_secret_for_dev_only'],
  ['JWT_ADMIN_SECRET', 'default_jwt_admin_secret_for_dev_only']
];

if (env.NODE_ENV === 'production') {
  const unsafe = PRODUCTION_REQUIRED
    .filter(([key, devDefault]) => !env[key] || env[key] === devDefault)
    .map(([key]) => key);

  if (unsafe.length > 0) {
    throw new Error(
      `Refusing to start in production: the following secrets are missing or still set to their development defaults: ${unsafe.join(', ')}. Set them in the environment before deploying.`
    );
  }

  if (env.SMS_PROVIDER === 'none') {
    // Running live before an SMS gateway is contracted is a real situation.
    // The wrong way out is NODE_ENV=development, which returns the OTP in the
    // send-otp response and lets anyone sign in as anyone. Instead, allow a
    // deliberate demo login that keeps every other production protection.
    if (!env.DEMO_MODE) {
      throw new Error(
        'Refusing to start in production: SMS_PROVIDER is not configured. OTP login cannot work without a real SMS gateway. Set SMS_PROVIDER to msg91, twilio, or fast2sms - or, if you are still pre-launch, set DEMO_MODE=true together with a private DEMO_OTP_CODE.'
      );
    }

    // In demo mode every account shares one OTP, so a guessable code is a
    // full account takeover. Refuse the well-known default.
    if (!process.env.DEMO_OTP_CODE || env.DEMO_OTP_CODE === '123456') {
      throw new Error(
        'Refusing to start in production: DEMO_MODE is on with no SMS gateway, so one fixed code logs in to every account. Set DEMO_OTP_CODE to a private 6-digit value - the "123456" default is not acceptable outside local development.'
      );
    }
  }
}


/**
 * The review credential is a standing login handed to a third party, so it is
 * configured deliberately or not at all. Checked outside the production block
 * because a malformed pair should surface on a developer's machine, not on the
 * deploy that the store is waiting on.
 */
if (env.REVIEW_MOBILE || env.REVIEW_OTP_CODE) {
  if (env.REVIEW_MOBILE.length !== 10) {
    throw new Error(
      'Refusing to start: REVIEW_MOBILE must be a 10-digit Indian mobile number. It is the only number that can sign in with a fixed code.'
    );
  }
  if (!/^\d{6}$/.test(env.REVIEW_OTP_CODE)) {
    throw new Error(
      'Refusing to start: REVIEW_MOBILE is set but REVIEW_OTP_CODE is not a 6-digit code. Both are required, or neither.'
    );
  }
  // A guessable code is a deliberate trade-off, not a mistake to block on: the
  // reviewer has to type it from a Play Console field, and the blast radius is
  // one demo account. Warned about on every boot so it cannot be forgotten.
  if (env.NODE_ENV === 'production' && ['123456', '000000', '111111'].includes(env.REVIEW_OTP_CODE)) {
    console.warn(
      `[config] REVIEW_OTP_CODE is a guessable code (${env.REVIEW_OTP_CODE}). Anyone who tries it can open the review account ${env.REVIEW_MOBILE}. Keep only demo data on it.`
    );
  }
}

module.exports = env;
