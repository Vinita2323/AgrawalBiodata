/**
/**
 * Milestone 1 Empirical Challenger Adversarial Test Suite
 * Stress-tests Rate Limiting, OTP Spam, Token Security, Admin Auth,
 * Suspended Accounts, 18 Gotras Variations, and Boundary Attack Scenarios.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const seedAdmin = require('../scripts/seedAdmin');
const env = require('../config/env');
const { AGARWAL_GOTRAS } = require('../config/constants');
const { normalizeGotra, isValidGotra, checkGotraExogamy } = require('../utils/gotras');
const { signAccessToken } = require('../utils/token');

describe('Milestone 1 Adversarial & Boundary Empirical Test Suite', () => {

  // ==========================================
  // SECTION 1: OTP Spam Attacks & Rate Limiting
  // ==========================================
  describe('1. OTP Spam Attacks & Window Rate Limiting', () => {
    const spamMobile = '9876500001';

    beforeEach(async () => {
      await OTP.deleteMany({});
      await User.deleteMany({});
    });

    it('OTP Spam 1.1: First OTP request succeeds with 200 OK', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: spamMobile });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cooldown).toBe(30);
    });

    it('OTP Spam 1.2: Immediate second OTP request strictly rejected with 400 and OTP_COOLDOWN_ACTIVE', async () => {
      // 1st request
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: spamMobile });

      // Immediate 2nd request (cooldown active)
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: spamMobile });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_COOLDOWN_ACTIVE');
    });

    it('OTP Spam 1.3: Enforces 5 requests per 10-minute window and returns 429 on 6th attempt', async () => {
      // Simulate 5 legitimate requests across time by advancing cooldown
      for (let i = 1; i <= 5; i++) {
        // Fast-forward cooldown by clearing cooldownUntil in DB
        await OTP.updateOne(
          { mobile: spamMobile },
          { cooldownUntil: new Date(Date.now() - 1000) }
        );

        const res = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: spamMobile });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }

      // 6th request within the 10-minute window (clear cooldown to test window limit)
      await OTP.updateOne(
        { mobile: spamMobile },
        { cooldownUntil: new Date(Date.now() - 1000) }
      );

      const res6 = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: spamMobile });

      expect(res6.status).toBe(429);
      expect(res6.body.success).toBe(false);
      expect(res6.body.code).toBe('OTP_RATE_LIMIT_EXCEEDED');
    });

    it('OTP Spam 1.4: 10-minute window reset allows requests after window expires', async () => {
      // Create OTP document with 5 requests but windowStart 11 minutes ago
      const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
      await OTP.create({
        mobile: spamMobile,
        otp: '123456',
        expiresAt: new Date(Date.now() - 6 * 60 * 1000),
        cooldownUntil: elevenMinutesAgo,
        requestCount: 5,
        windowStart: elevenMinutesAgo,
        isUsed: false
      });

      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: spamMobile });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await OTP.findOne({ mobile: spamMobile });
      expect(updated.requestCount).toBe(1);
    });

    it('OTP Spam 1.5: Phone number variations (+91, 0 prefix, spaces) normalize to same mobile', async () => {
      // Send OTP to +91 9876500001
      const res1 = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '+919876500001' });
      expect(res1.status).toBe(200);

      // Attempt to bypass cooldown using 09876500001
      const res2 = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '09876500001' });
      expect(res2.status).toBe(400);
      expect(res2.body.code).toBe('OTP_COOLDOWN_ACTIVE');
    });

    it('OTP Spam 1.6: Malformed, non-numeric, or invalid length phone numbers rejected with 400', async () => {
      const invalidMobiles = ['', '123', 'abcdefghij', '9876543210123', '00000'];
      for (const mobile of invalidMobiles) {
        const res = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });
  });

  // ==========================================
  // SECTION 2: OTP Verification & Replay Attacks
  // ==========================================
  describe('2. OTP Verification Boundary, Brute Force & Replay Attacks', () => {
    const testMobile = '9876500002';

    beforeEach(async () => {
      await OTP.deleteMany({});
      await User.deleteMany({});
    });

    it('OTP Verify 2.1: Rejects verification when no OTP was requested', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_NOT_FOUND');
    });

    it('OTP Verify 2.2: Rejects wrong OTP code and increments failure attempts', async () => {
      await request(app).post('/api/auth/send-otp').send({ mobile: testMobile });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OTP');

      const otpDoc = await OTP.findOne({ mobile: testMobile });
      expect(otpDoc.attempts).toBe(1);
    });

    it('OTP Verify 2.3: Brute force lockout after 5 consecutive failed attempts', async () => {
      await request(app).post('/api/auth/send-otp').send({ mobile: testMobile });
      const otpDoc = await OTP.findOne({ mobile: testMobile });
      const correctOtp = otpDoc.otp;

      // Fail 5 times
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: testMobile, otp: '111111' });
        expect(res.status).toBe(400);
      }

      // 6th attempt with correct OTP MUST be locked out
      const res6 = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: correctOtp });

      expect(res6.status).toBe(400);
      expect(res6.body.code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });

    it('OTP Verify 2.4: Rejects expired OTP code (>5 minutes old)', async () => {
      await request(app).post('/api/auth/send-otp').send({ mobile: testMobile });

      // Expire OTP
      await OTP.updateOne(
        { mobile: testMobile },
        { expiresAt: new Date(Date.now() - 1000) }
      );

      const otpDoc = await OTP.findOne({ mobile: testMobile });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: otpDoc.otp });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    it('OTP Verify 2.5: Strictly forbids OTP reuse (Replay Attack)', async () => {
      await request(app).post('/api/auth/send-otp').send({ mobile: testMobile });
      const otpDoc = await OTP.findOne({ mobile: testMobile });
      const validOtp = otpDoc.otp;

      // First verification succeeds
      const res1 = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: validOtp });
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      // Replay attempt with same OTP MUST fail
      const res2 = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: validOtp });
      expect(res2.status).toBe(400);
      expect(res2.body.code).toBe('OTP_NOT_FOUND');
    });
  });

  // ==========================================
  // SECTION 3: Admin Auth, Passwords & Tokens
  // ==========================================
  describe('3. Admin Authentication, Passwords, Security & Deactivation', () => {
    beforeEach(async () => {
      await Admin.deleteMany({});
      await AuditLog.deleteMany({});
      await seedAdmin();
    });

    it('Admin 3.1: Super Admin login returns signed token and hides password hash', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.password).toBeUndefined();

      // Verify Audit Log
      const log = await AuditLog.findOne({ action: 'Admin Login' });
      expect(log).toBeTruthy();
      expect(log.adminEmail || log.target).toContain('admin@matrimonyhub.com');
    });

    it('Admin 3.2: Case-insensitive email handles uppercase/mixed login', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'ADMIN@MATRIMONYHUB.COM',
          password: 'admin123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe('admin@matrimonyhub.com');
    });

    it('Admin 3.3: Rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'incorrectPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Admin 3.4: Deactivated admin login returns 403 Forbidden', async () => {
      await Admin.updateOne(
        { email: 'admin@matrimonyhub.com' },
        { status: 'Inactive' }
      );

      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Admin 3.5: Deactivated admin with existing token rejected with 403 Forbidden on protected routes', async () => {
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });
      const token = loginRes.body.data.token;

      // Deactivate admin in DB
      await Admin.updateOne(
        { email: 'admin@matrimonyhub.com' },
        { status: 'Inactive' }
      );

      // Attempt protected call
      const profileRes = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(403);
      expect(profileRes.body.success).toBe(false);
    });

    it('Admin 3.6: Malformed, forged, or expired admin tokens return 401 Unauthorized', async () => {
      // 1. Missing header
      const res1 = await request(app).get('/api/admin/auth/profile');
      expect(res1.status).toBe(401);

      // 2. Forged token with invalid signature
      const res2 = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake');
      expect(res2.status).toBe(401);

      // 3. User token used on admin route
      const fakeUserToken = signAccessToken({ userId: '507f1f77bcf86cd799439011', mobile: '9876543210' });
      const res3 = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${fakeUserToken}`);
      expect(res3.status).toBe(401);

      // 4. Expired admin token
      const expiredAdminToken = jwt.sign(
        { adminId: '507f1f77bcf86cd799439011', email: 'admin@matrimonyhub.com' },
        env.JWT_ADMIN_SECRET,
        { expiresIn: '-1s' }
      );
      const res4 = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${expiredAdminToken}`);
      expect(res4.status).toBe(401);
    });
  });

  // ==========================================
  // SECTION 4: Suspended User Access Control
  // ==========================================
  describe('4. Suspended User Account Access Barrier', () => {
    const suspendedMobile = '9876500003';
    let userAccessToken;
    let userRefreshToken;

    beforeEach(async () => {
      await User.deleteMany({});
      await OTP.deleteMany({});

      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: suspendedMobile,
          fullName: 'Suspended Candidate',
          email: 'suspended@example.com'
        });

      userAccessToken = regRes.body.data.accessToken;
      userRefreshToken = regRes.body.data.refreshToken;

      // Suspend user
      await User.updateOne(
        { mobile: suspendedMobile },
        { accountStatus: 'Suspended' }
      );
    });

    it('Suspended 4.1: Accessing /api/auth/me returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Suspended 4.2: Refreshing tokens returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: userRefreshToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Suspended 4.3: Login via OTP verification returns 403 Forbidden', async () => {
      await request(app).post('/api/auth/send-otp').send({ mobile: suspendedMobile });
      const otpDoc = await OTP.findOne({ mobile: suspendedMobile });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: suspendedMobile, otp: otpDoc.otp });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Suspended 4.4: Re-registering with suspended mobile returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: suspendedMobile,
          fullName: 'Attempt Re-register'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // SECTION 5: 18 Authentic Gotras Variations & Exogamy Engine
  // ==========================================
  describe('5. 18 Authentic Gotras Validation & Exogamy Boundary Tests', () => {
    const expected18 = [
      'Garg', 'Goyal', 'Bansal', 'Bindal', 'Mittal', 'Singhal',
      'Jindal', 'Tingal', 'Tayal', 'Airan', 'Dharan', 'Madhukul',
      'Goyan', 'Kuchhal', 'Kansal', 'Nangal', 'Mangal', 'Bhandal'
    ];

    it('Gotra 5.1: Exactly 18 authentic Gotras returned by /api/gotras', async () => {
      const res = await request(app).get('/api/gotras');
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(18);
      expect(res.body.data.gotras).toHaveLength(18);

      const returnedNames = res.body.data.gotras.map(g => g.english);
      expected18.forEach(name => {
        expect(returnedNames).toContain(name);
      });
    });

    it('Gotra 5.2: Normalizes all 18 authentic Gotras in English (case-insensitive)', () => {
      expected18.forEach(gotra => {
        expect(normalizeGotra(gotra)).toBe(gotra);
        expect(normalizeGotra(gotra.toLowerCase())).toBe(gotra);
        expect(normalizeGotra(gotra.toUpperCase())).toBe(gotra);
        expect(isValidGotra(gotra)).toBe(true);
      });
    });

    it('Gotra 5.3: Normalizes Hindi Devanagari script for all 18 Gotras', () => {
      const hindiMap = {
        'गर्ग': 'Garg',
        'गोयल': 'Goyal',
        'बंसल': 'Bansal',
        'बिंदल': 'Bindal',
        'मित्तल': 'Mittal',
        'सिंघल': 'Singhal',
        'जिंदल': 'Jindal',
        'तिंगल': 'Tingal',
        'तायल': 'Tayal',
        'ऐरन': 'Airan',
        'धारण': 'Dharan',
        'मधुकुल': 'Madhukul',
        'गोयन': 'Goyan',
        'कुच्छल': 'Kuchhal',
        'कंसल': 'Kansal',
        'नांगल': 'Nangal',
        'मंगल': 'Mangal',
        'भंदल': 'Bhandal'
      };

      for (const [hindi, english] of Object.entries(hindiMap)) {
        expect(normalizeGotra(hindi)).toBe(english);
        expect(isValidGotra(hindi)).toBe(true);
      }
    });

    it('Gotra 5.4: Normalizes bilingual formats and common spelling aliases', () => {
      expect(normalizeGotra('गर्ग (Garg)')).toBe('Garg');
      expect(normalizeGotra('Garg (गर्ग)')).toBe('Garg');
      expect(normalizeGotra('Goel')).toBe('Goyal');
      expect(normalizeGotra('Kushal')).toBe('Kuchhal');
      expect(normalizeGotra('Nagal')).toBe('Nangal');
      expect(normalizeGotra('Dhingan')).toBe('Goyan');
    });

    it('Gotra 5.5: Strictly rejects non-Agarwal gotras, empty values, and malicious inputs', () => {
      const nonAgarwalGotras = [
        'Sharma', 'Verma', 'Gupta', 'Kashyap', 'Saxena', 'Jain',
        'Chauhan', 'Yadav', 'Khan', 'Smith', '', '   ', null, undefined,
        '<script>alert(1)</script>', "{'$gt': ''}"
      ];

      nonAgarwalGotras.forEach(input => {
        expect(normalizeGotra(input)).toBeNull();
        expect(isValidGotra(input)).toBe(false);
      });
    });

    it('Gotra 5.6: Gotra Exogamy Engine correctly handles all 4 boundary conditions', () => {
      // 1. Sagotra Paternal Collision (Garg vs Garg) -> Score 0
      const sagotra = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Mittal');
      expect(sagotra.isSagotra).toBe(true);
      expect(sagotra.score).toBe(0);

      // 2. Maternal overlap (Candidate 1 Gotra = Candidate 2 Mother Gotra) -> Score 15
      const maternal1 = checkGotraExogamy('Garg', 'Bansal', 'Mittal', 'Garg');
      expect(maternal1.hasMaternalConflict).toBe(true);
      expect(maternal1.score).toBe(15);

      // 3. Maternal overlap (Candidate 1 Mother Gotra = Candidate 2 Gotra) -> Score 15
      const maternal2 = checkGotraExogamy('Garg', 'Bansal', 'Bansal', 'Mittal');
      expect(maternal2.hasMaternalConflict).toBe(true);
      expect(maternal2.score).toBe(15);

      // 4. Clean Exogamy (4 distinct gotras) -> Score 30
      const clean = checkGotraExogamy('Garg', 'Singhal', 'Bansal', 'Mittal');
      expect(clean.isSagotra).toBe(false);
      expect(clean.hasMaternalConflict).toBe(false);
      expect(clean.score).toBe(30);
    });
  });

  // ==========================================
  // SECTION 6: Integration Bug Reproduction Suite
  // ==========================================
  describe('6. Empirical Bug Reproduction on User Token Operations', () => {
    it('Bug Repro 6.1: GET /api/auth/me should return 200 without 500 crashes from unpopulated profiles', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9876500004',
          fullName: 'Test User Profile'
        });

      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // We empirically record whether this fails or succeeds
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobile).toBe('9876500004');
    });

    it('Bug Repro 6.2: POST /api/auth/refresh-token rotation must produce distinct token string and reject old token', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9876500005',
          fullName: 'Test Token Rotation'
        });

      const oldRefreshToken = regRes.body.data.refreshToken;

      // Refresh immediately
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshRes.status).toBe(200);
      const newRefreshToken = refreshRes.body.data.refreshToken;

      // Distinctness assertion
      expect(newRefreshToken).not.toBe(oldRefreshToken);

      // Replay of old refresh token must be rejected
      const replayRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.success).toBe(false);
    });
  });

  // ==========================================
  // SECTION 7: Admin Settings & Token Attack Vectors
  // ==========================================
  describe('7. Admin Profile Conflicts & Token Tampering', () => {
    let adminToken;

    beforeEach(async () => {
      await Admin.deleteMany({});
      await AuditLog.deleteMany({});
      await seedAdmin();

      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });
      adminToken = loginRes.body.data.token;
    });

    it('Admin 7.1: Rejects updating admin email to an already taken email', async () => {
      // Create second admin
      await Admin.create({
        name: 'Moderator Admin',
        email: 'moderator@matrimonyhub.com',
        password: 'password123',
        role: 'Moderator'
      });

      // Super admin tries to update email to moderator's email
      const res = await request(app)
        .put('/api/admin/settings/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'moderator@matrimonyhub.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already in use');
    });

    it('Token 7.2: Rejects non-JWT string in refresh-token endpoint with 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'not-a-valid-jwt-string' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

