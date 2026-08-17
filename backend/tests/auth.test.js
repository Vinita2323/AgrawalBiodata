/**
 * Comprehensive Authentication & Core Infrastructure Integration Tests
 * Covers User Passwordless OTP, Token Issuance, Refresh Token Rotation,
 * Admin Authentication, Password Hashing, Gotra Validation, and Security Middleware.
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const seedAdmin = require('../scripts/seedAdmin');
const { AGARWAL_GOTRAS, GOTRA_NAMES_EN } = require('../config/constants');
const { normalizeGotra, isValidGotra, checkGotraExogamy } = require('../utils/gotras');

describe('Milestone 1: Core Infrastructure & Authentication Test Suite', () => {

  describe('1. Health Check & 18 Gotras Reference Endpoints', () => {
    it('GET /api/health should return operational status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /api/gotras should return all 18 authentic Agarwal Gotras', async () => {
      const res = await request(app).get('/api/gotras');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(18);
      expect(res.body.data.gotras).toHaveLength(18);

      const gotraNames = res.body.data.gotras.map(g => g.english);
      expect(gotraNames).toContain('Garg');
      expect(gotraNames).toContain('Goyal');
      expect(gotraNames).toContain('Bansal');
      expect(gotraNames).toContain('Mittal');
      expect(gotraNames).toContain('Singhal');
      expect(gotraNames).toContain('Jindal');
      expect(gotraNames).toContain('Bhandal');
    });

    it('Gotra normalization should handle bilingual, Hindi, and alias formats', () => {
      expect(normalizeGotra('Garg')).toBe('Garg');
      expect(normalizeGotra('गर्ग (Garg)')).toBe('Garg');
      expect(normalizeGotra('गर्ग')).toBe('Garg');
      expect(normalizeGotra('Goel')).toBe('Goyal');
      expect(normalizeGotra('Kushal')).toBe('Kuchhal');
      expect(normalizeGotra('Nagal')).toBe('Nangal');
      expect(normalizeGotra('InvalidGotra')).toBeNull();

      expect(isValidGotra('Bansal')).toBe(true);
      expect(isValidGotra('Sharma')).toBe(false);
    });

    it('Gotra Exogamy logic should enforce Sagotra 0 score and maternal 50% penalty', () => {
      // Sagotra violation (same paternal gotra)
      const sagotraResult = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Mittal');
      expect(sagotraResult.isSagotra).toBe(true);
      expect(sagotraResult.score).toBe(0);

      // Maternal overlap penalty
      const maternalConflict = checkGotraExogamy('Garg', 'Bansal', 'Bansal', 'Mittal');
      expect(maternalConflict.hasMaternalConflict).toBe(true);
      expect(maternalConflict.score).toBe(15);

      // Fully distinct lineages
      const compatible = checkGotraExogamy('Garg', 'Bansal', 'Mittal', 'Jindal');
      expect(compatible.isSagotra).toBe(false);
      expect(compatible.hasMaternalConflict).toBe(false);
      expect(compatible.score).toBe(30);
    });
  });

  describe('2. User Passwordless OTP Authentication Flow', () => {
    const testMobile = '9876543210';

    it('POST /api/auth/send-otp should generate and send 6-digit OTP', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mobile).toBe(testMobile);
      expect(res.body.data.cooldown).toBeDefined();
      expect(res.body.data.expiresIn).toBeDefined();

      const otpDoc = await OTP.findOne({ mobile: testMobile });
      expect(otpDoc).toBeTruthy();
      expect(otpDoc.otp).toHaveLength(6);
      expect(otpDoc.isUsed).toBe(false);
    });

    it('POST /api/auth/send-otp should reject immediate duplicate request within cooldown period', async () => {
      // First request
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      // Immediate second request within cooldown
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_COOLDOWN_ACTIVE');
    });

    it('POST /api/auth/send-otp should reject invalid phone numbers', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/verify-otp should reject incorrect OTP code', async () => {
      // Request OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      // Verify with wrong OTP
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_OTP');
    });

    it('POST /api/auth/verify-otp should verify correct OTP, create User, and issue JWT tokens', async () => {
      // Request OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      const otpDoc = await OTP.findOne({ mobile: testMobile });

      // Verify with correct OTP
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: otpDoc.otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isNewUser).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.mobile).toBe(testMobile);
      expect(res.body.data.user.accountStatus).toBe('Active');

      // Verify OTP is marked as used
      const updatedOtp = await OTP.findById(otpDoc._id);
      expect(updatedOtp.isUsed).toBe(true);

      // Verify user was persisted in DB
      const user = await User.findOne({ mobile: testMobile });
      expect(user).toBeTruthy();
      expect(user.refreshTokens).toHaveLength(1);
    });

    it('POST /api/auth/verify-otp should recognize existing user on subsequent logins', async () => {
      // Create user first
      const existingUser = new User({
        mobile: testMobile,
        name: 'Rajesh Agrawal',
        accountStatus: 'Active'
      });
      await existingUser.save();

      // Request OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      const otpDoc = await OTP.findOne({ mobile: testMobile });

      // Verify OTP
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: otpDoc.otp });

      expect(res.status).toBe(200);
      expect(res.body.data.isNewUser).toBe(false);
      expect(res.body.data.user.name).toBe('Rajesh Agrawal');
    });

    it('POST /api/auth/verify-otp should reject expired OTP', async () => {
      // Request OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: testMobile });

      // Manually backdate expiry to the past
      await OTP.updateOne(
        { mobile: testMobile },
        { expiresAt: new Date(Date.now() - 10000) }
      );

      const otpDoc = await OTP.findOne({ mobile: testMobile });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ mobile: testMobile, otp: otpDoc.otp });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });
  });

  describe('3. User Registration, Token Refresh, and Protected Access', () => {
    let accessToken;
    let refreshToken;
    const regMobile = '9812345678';

    beforeEach(async () => {
      // Register a user and acquire tokens
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Vikram Agrawal',
          gender: 'Male',
          dob: '1995-06-15',
          mobile: regMobile,
          email: 'vikram@example.com',
          createdFor: 'Myself'
        });

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('POST /api/auth/register should create user account and return tokens', async () => {
      const user = await User.findOne({ mobile: regMobile });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Vikram Agrawal');
      expect(user.email).toBe('vikram@example.com');
      expect(user.gender).toBe('Male');
    });

    it('GET /api/auth/me should fetch profile with valid access token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Vikram Agrawal');
      expect(res.body.data.user.email).toBe('vikram@example.com');
      expect(res.body.data.user.mobile).toBe(regMobile);
    });

    it('GET /api/auth/me should reject request without token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should reject invalid/forged token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_forged_token_xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/refresh-token should rotate tokens successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(refreshToken);

      // Verify that the new access token works
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.mobile).toBe(regMobile);
    });

    it('POST /api/auth/refresh-token should reject reused/old refresh token', async () => {
      // First refresh
      await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      // Attempt second refresh using old token
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/logout should revoke active sessions', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Try refreshing with revoked token
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    it('Suspended user account should be forbidden from accessing protected endpoints', async () => {
      // Suspend user
      await User.updateOne({ mobile: regMobile }, { accountStatus: 'Suspended' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Admin Authentication, Bcrypt Password & Audit Trail', () => {
    let adminToken;

    beforeEach(async () => {
      await seedAdmin();
    });

    it('POST /api/admin/auth/login should authenticate default Super Admin with bcrypt', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.email).toBe('admin@matrimonyhub.com');
      expect(res.body.data.admin.role).toBe('Super Admin');
      expect(res.body.data.admin.password).toBeUndefined(); // Password hash must never leak

      adminToken = res.body.data.token;

      // Verify audit log was recorded for login
      const logs = await AuditLog.find({ action: 'Admin Login' });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('POST /api/admin/auth/login should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'wrong_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/auth/login should reject non-existent admin email', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'unknown_admin@example.com',
          password: 'admin123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/auth/profile should return admin profile with valid admin token', async () => {
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      const token = loginRes.body.data.token;

      const profileRes = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.admin.email).toBe('admin@matrimonyhub.com');
      expect(profileRes.body.data.admin.role).toBe('Super Admin');
    });

    it('PUT /api/admin/auth/password should update admin password and allow login with new password', async () => {
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      const token = loginRes.body.data.token;

      // Update password
      const changePassRes = await request(app)
        .put('/api/admin/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'admin123',
          newPassword: 'newSecretPassword2026'
        });

      expect(changePassRes.status).toBe(200);
      expect(changePassRes.body.success).toBe(true);

      // Old password should now fail
      const oldLoginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });
      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'newSecretPassword2026'
        });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.data.token).toBeDefined();

      // Check audit log
      const auditLog = await AuditLog.findOne({ action: 'Updated Password' });
      expect(auditLog).toBeTruthy();
    });

    it('PUT /api/admin/settings/preferences should save admin notification triggers', async () => {
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@matrimonyhub.com',
          password: 'admin123'
        });

      const token = loginRes.body.data.token;

      const prefRes = await request(app)
        .put('/api/admin/settings/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          notifyVerifications: true,
          notifyComplaints: false,
          notifyPayments: true
        });

      expect(prefRes.status).toBe(200);
      expect(prefRes.body.data.preferences.notifyComplaints).toBe(false);
      expect(prefRes.body.data.preferences.notifyVerifications).toBe(true);
    });
  });

  describe('5. Error Handling & Security Middleware', () => {
    it('Should return 404 for undefined routes in standard JSON envelope', async () => {
      const res = await request(app).get('/api/unknown-route-nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('Should return 401 when accessing admin endpoint with user token', async () => {
      // Register user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          mobile: '9899999999',
          fullName: 'Test User'
        });

      const userToken = userRes.body.data.accessToken;

      // Attempt to access admin profile
      const res = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
