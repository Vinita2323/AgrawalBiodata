/**
 * Adversarial Security & Edge Case Test Suite for Milestone 1
 * Challenging:
 * 1. NoSQL Injection Attacks ($gt, $ne, $regex in JSON bodies)
 * 2. Malformed / Tampered Authorization Headers & JWT Attacks
 * 3. Duplicate User Registration & Phone Normalization Edge Cases
 * 4. Seed Script Idempotency
 * 5. Token Rotation & Replay Vulnerabilities
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const seedAdmin = require('../scripts/seedAdmin');
const { normalizeMobile } = require('../services/otpService');

describe('Milestone 1 Adversarial & Security Challenge Suite', () => {

  beforeEach(async () => {
    await seedAdmin();
  });

  describe('1. NoSQL Injection Resistance', () => {
    it('Should reject NoSQL injection in /api/auth/send-otp body ($gt operator)', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: { $gt: '' } });

      // Must not accept object as mobile or bypass validation
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject NoSQL injection in /api/auth/verify-otp ($ne operator for mobile and otp)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          mobile: { $ne: null },
          otp: { $ne: null }
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject NoSQL injection in /api/auth/register ($ne operator)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: { $ne: null },
          fullName: 'Hacked User'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject NoSQL injection in /api/auth/refresh-token ($ne operator)', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: { $ne: null } });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject NoSQL injection in /api/admin/auth/login ($ne and $gt operator bypass)', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: { $ne: null },
          password: { $gt: '' }
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should reject NoSQL regex injection in /api/admin/auth/login', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: { $regex: '.*' },
          password: 'admin'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('Should safely handle numeric mobile in /api/auth/send-otp without rateLimiter crash', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({
          mobile: 9876543210
        });

      // Should be processed or validated safely without 500 TypeError crash
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('2. Malformed & Tampered Authorization Headers', () => {
    it('Should reject missing Authorization header on protected /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject "Bearer" with no token on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject "Bearer " (only spaces) on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer   ');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject "Bearer invalid.jwt.here" on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.here');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject Basic auth format "Basic dXNlcjpwYXNz" on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject "Bearer None" algorithm forged token (alg: none)', async () => {
      const unsignedNoneToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        '',
        { algorithm: 'none' }
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${unsignedNoneToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject token signed with wrong JWT secret', async () => {
      const rogueToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        'wrong_untrusted_secret_key',
        { expiresIn: '1h' }
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${rogueToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Should reject malformed token on admin endpoint /api/admin/auth/profile', async () => {
      const res = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', 'Bearer invalid.admin.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Duplicate User Registration & Phone Sanitization', () => {
    it('normalizeMobile should sanitize all variations (+91, 0, spaces, dashes)', () => {
      expect(normalizeMobile('+91 98765 43210')).toBe('9876543210');
      expect(normalizeMobile('+91-98765-43210')).toBe('9876543210');
      expect(normalizeMobile('09876543210')).toBe('9876543210');
      expect(normalizeMobile('919876543210')).toBe('9876543210');
      expect(normalizeMobile('9876543210')).toBe('9876543210');
      expect(normalizeMobile('12345')).toBe('12345'); // length check catches this
      expect(normalizeMobile(null)).toBe('');
      expect(normalizeMobile(undefined)).toBe('');
      expect(normalizeMobile(12345)).toBe('');
      expect(normalizeMobile({})).toBe('');
    });

    it('Registering multiple times with different formats of same number updates account without duplication error', async () => {
      // 1st Registration with +91 format
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '+91 98765 43210',
          fullName: 'Initial Name',
          gender: 'Male'
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.user.mobile).toBe('9876543210');

      // 2nd Registration with 0-prefixed format
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '09876543210',
          fullName: 'Updated Name',
          email: 'updated@example.com'
        });
      expect(res2.status).toBe(201);
      expect(res2.body.data.user.mobile).toBe('9876543210');
      expect(res2.body.data.user.name).toBe('Updated Name');

      // 3rd Registration with standard 10-digit format
      const res3 = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9876543210',
          fullName: 'Final Name'
        });
      expect(res3.status).toBe(201);

      // Verify only ONE User document exists in database
      const users = await User.find({ mobile: '9876543210' });
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Final Name');
      expect(users[0].email).toBe('updated@example.com');
    });

    it('Should reject registration with invalid phone numbers', async () => {
      const resShort = await request(app)
        .post('/api/auth/register')
        .send({ mobile: '12345', fullName: 'Short Phone' });
      expect(resShort.status).toBe(400);

      const resAlpha = await request(app)
        .post('/api/auth/register')
        .send({ mobile: 'abcdefghij', fullName: 'Alpha Phone' });
      expect(resAlpha.status).toBe(400);
    });
  });

  describe('4. Seed Script Idempotency', () => {
    it('seedAdmin should be callable multiple times sequentially without duplicate key error', async () => {
      // 1st run
      const admin1 = await seedAdmin();
      expect(admin1).toBeDefined();
      expect(admin1.email).toBe('admin@matrimonyhub.com');

      // 2nd run
      const admin2 = await seedAdmin();
      expect(admin2).toBeDefined();
      expect(admin2.email).toBe('admin@matrimonyhub.com');

      // 3rd run
      const admin3 = await seedAdmin();
      expect(admin3).toBeDefined();
      expect(admin3.email).toBe('admin@matrimonyhub.com');

      // Verify only 1 Super Admin in DB
      const count = await Admin.countDocuments({ email: 'admin@matrimonyhub.com' });
      expect(count).toBe(1);

      // Verify login works with default password after multiple runs
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.admin.role).toBe('Super Admin');
    });
  });

  describe('5. Security Edge Cases: Token Rotation & GET /me Profile Population', () => {
    it('GET /api/auth/me should return 200 even when user has no profiles', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9988776655',
          fullName: 'Profile Test User'
        });
      const token = regRes.body.data.accessToken;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.name).toBe('Profile Test User');
    });

    it('Refresh token rotation should generate a unique refresh token even within the same second', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9911223344',
          fullName: 'Token User'
        });
      const oldRefreshToken = regRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

      // Old refresh token must now be rejected
      const replayRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.success).toBe(false);
    });
  });

});
