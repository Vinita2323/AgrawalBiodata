/**
 * Production Configuration Guard Test Suite
 * Agrawal Matrimony Platform
 *
 * Booting live without an SMS gateway is a real pre-launch situation. The
 * tempting shortcut - NODE_ENV=development - returns the OTP in the send-otp
 * response, which is a full account takeover for anyone who can call the API.
 * These tests pin the only safe way out: production stays production, and a
 * gateway-less deployment must opt in explicitly with a private demo code.
 */

const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../config/env.js');

/** Loads config/env.js fresh under a given environment. */
function loadEnv(overrides) {
  jest.resetModules();
  const saved = { ...process.env };

  // dotenv does not overwrite existing vars, so seeding them here wins over
  // whatever the developer happens to have in backend/.env.
  Object.assign(process.env, {
    NODE_ENV: 'production',
    JWT_ACCESS_SECRET: 'real_access_secret_value',
    JWT_REFRESH_SECRET: 'real_refresh_secret_value',
    JWT_ADMIN_SECRET: 'real_admin_secret_value',
    SMS_PROVIDER: 'none',
    DEMO_MODE: 'false',
    ...overrides,
  });
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
  }

  try {
    return { env: require(ENV_PATH), error: null };
  } catch (error) {
    return { env: null, error };
  } finally {
    process.env = saved;
  }
}

describe('Production configuration guards', () => {
  it('refuses to start with no SMS gateway and no demo mode', () => {
    const { error } = loadEnv({});
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/SMS_PROVIDER is not configured/i);
  });

  it('refuses demo mode that still uses the well-known 123456 default', () => {
    const { error } = loadEnv({ DEMO_MODE: 'true', DEMO_OTP_CODE: undefined });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/DEMO_OTP_CODE/i);
  });

  it('refuses demo mode when DEMO_OTP_CODE is explicitly set to 123456', () => {
    const { error } = loadEnv({ DEMO_MODE: 'true', DEMO_OTP_CODE: '123456' });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/123456/);
  });

  it('starts with demo mode plus a private code', () => {
    const { env, error } = loadEnv({ DEMO_MODE: 'true', DEMO_OTP_CODE: '748215' });
    expect(error).toBeNull();
    expect(env.DEMO_MODE).toBe(true);
    expect(env.DEMO_OTP_CODE).toBe('748215');
  });

  it('starts with a real SMS gateway and no demo mode', () => {
    const { env, error } = loadEnv({ SMS_PROVIDER: 'msg91', MSG91_AUTH_KEY: 'k' });
    expect(error).toBeNull();
    expect(env.SMS_PROVIDER).toBe('msg91');
  });

  it('still refuses default JWT secrets regardless of demo mode', () => {
    const { error } = loadEnv({
      DEMO_MODE: 'true',
      DEMO_OTP_CODE: '748215',
      JWT_ACCESS_SECRET: 'default_jwt_access_secret_for_dev_only',
    });
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/JWT_ACCESS_SECRET/);
  });
});

describe('OTP exposure', () => {
  it('never returns devOtp in a production response', () => {
    // The guard above only matters because production hides the code; if this
    // ever changes, demo mode becomes an open door rather than a shared secret.
    const source = require('fs').readFileSync(
      path.resolve(__dirname, '../services/otpService.js'),
      'utf8'
    );
    const exposures = source.match(/devOtp/g) || [];
    expect(exposures.length).toBeGreaterThan(0);
    for (const line of source.split('\n')) {
      if (line.includes('devOtp')) {
        expect(line).toMatch(/NODE_ENV !== 'production'/);
      }
    }
  });
});
