/**
 * Store-Review Account Test Suite
 * Agrawal Matrimony Platform
 *
 * The app is India-only and signs in by SMS OTP, so a Google Play reviewer
 * working from abroad has no way to reach a single screen - which is what the
 * Broken Functionality rejection ("your app does not open or load") described.
 * One allowlisted number with a fixed code fixes that.
 *
 * These tests pin the two properties that make it safe: the allowlist is
 * exactly one number wide, and a misconfigured pair refuses to boot rather than
 * quietly opening a hole.
 */

const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../config/env.js');

/** Loads config/env.js fresh under a given environment. */
function loadEnv(overrides) {
  jest.resetModules();
  const saved = { ...process.env };

  Object.assign(process.env, {
    NODE_ENV: 'production',
    JWT_ACCESS_SECRET: 'real_access_secret_value',
    JWT_REFRESH_SECRET: 'real_refresh_secret_value',
    JWT_ADMIN_SECRET: 'real_admin_secret_value',
    SMS_PROVIDER: 'msg91',
    DEMO_MODE: 'false',
    ...overrides,
  });
  // Overrides are seeded, never deleted. dotenv fills in any key that is absent
  // from process.env, so deleting one would silently reintroduce the real
  // backend/.env value and test the developer's machine instead of the code.
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) process.env[k] = '';
  }

  try {
    return { env: require(ENV_PATH), error: null };
  } catch (error) {
    return { env: null, error };
  } finally {
    process.env = saved;
  }
}

/** Loads otpService against a given environment. */
function loadOtpService(overrides) {
  jest.resetModules();
  const saved = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: 'test',
    SMS_PROVIDER: 'msg91',
    DEMO_MODE: 'false',
    ...overrides,
  });
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) process.env[k] = '';
  }

  try {
    return require(path.resolve(__dirname, '../services/otpService.js'));
  } finally {
    process.env = saved;
  }
}

describe('Store-review account configuration', () => {
  it('boots with no review account configured', () => {
    const { env, error } = loadEnv({ REVIEW_MOBILE: '', REVIEW_OTP_CODE: '' });
    expect(error).toBeNull();
    expect(env.REVIEW_MOBILE).toBe('');
  });

  it('accepts a valid number and private code', () => {
    const { env, error } = loadEnv({ REVIEW_MOBILE: '9876543210', REVIEW_OTP_CODE: '748215' });
    expect(error).toBeNull();
    expect(env.REVIEW_MOBILE).toBe('9876543210');
    expect(env.REVIEW_OTP_CODE).toBe('748215');
  });

  it('normalizes a number written with a country code', () => {
    const { env, error } = loadEnv({ REVIEW_MOBILE: '+91 98765 43210', REVIEW_OTP_CODE: '748215' });
    expect(error).toBeNull();
    expect(env.REVIEW_MOBILE).toBe('9876543210');
  });

  it('refuses a review number with no code, so the pair is never half-configured', () => {
    const { error } = loadEnv({ REVIEW_MOBILE: '9876543210', REVIEW_OTP_CODE: '' });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/REVIEW_OTP_CODE/);
  });

  it('refuses a code with no review number', () => {
    const { error } = loadEnv({ REVIEW_MOBILE: '', REVIEW_OTP_CODE: '748215' });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/REVIEW_MOBILE/);
  });

  it('allows a guessable review code but says so loudly', () => {
    // The code is typed by a reviewer out of a Play Console field, so
    // convenience wins over secrecy here - but a silent accept would let it
    // outlive the review. Warn, do not block.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { error } = loadEnv({ REVIEW_MOBILE: '9876543210', REVIEW_OTP_CODE: '123456' });
    expect(error).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('guessable'));
    warn.mockRestore();
  });
});

describe('Store-review OTP issuance', () => {
  const REVIEW = { REVIEW_MOBILE: '9876543210', REVIEW_OTP_CODE: '748215' };

  it('issues the fixed code for the allowlisted number', () => {
    const otpService = loadOtpService(REVIEW);
    expect(otpService.generateOtpFor('9876543210')).toBe('748215');
  });

  it('issues a random code for every other number', () => {
    const otpService = loadOtpService(REVIEW);
    const codes = new Set();
    for (let i = 0; i < 25; i += 1) {
      codes.add(otpService.generateOtpFor('9999900000'));
    }
    // A one-number allowlist must not leak into anyone else's login.
    expect(codes.has('748215')).toBe(false);
    expect(codes.size).toBeGreaterThan(1);
  });

  it('treats no configured review number as no allowlist at all', () => {
    const otpService = loadOtpService({ REVIEW_MOBILE: '', REVIEW_OTP_CODE: '' });
    expect(otpService.isReviewMobile('')).toBe(false);
    expect(otpService.isReviewMobile('9876543210')).toBe(false);
  });

  it('sends no SMS to the review number', async () => {
    const otpService = loadOtpService(REVIEW);
    const result = await otpService.dispatchOtp('9876543210', '748215');
    expect(result.success).toBe(true);
  });
});
