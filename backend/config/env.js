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
  EMAIL_FROM: process.env.EMAIL_FROM || 'Agrawal Matrimony <no-reply@agarwalbiodata.com>'
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
    throw new Error(
      'Refusing to start in production: SMS_PROVIDER is not configured. OTP login cannot work without a real SMS gateway. Set SMS_PROVIDER to msg91, twilio, or fast2sms.'
    );
  }
}

module.exports = env;
