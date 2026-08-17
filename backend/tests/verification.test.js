/**
 * Milestone 4 Integration Test Suite: KYC Document Verification & Profile Badge Synchronization
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. User KYC Document Submission (Multipart Upload / ID Proof / Profession Proof)
 * 2. User Status & Submission History Endpoints
 * 3. Admin Verification Queue (Pagination, Status Filter & Side-by-Side Review Inspection)
 * 4. One-Click Admin Approval & Multi-Profile Badge Synchronization (Profile.verified = true)
 * 5. Admin Rejection with Categorized Reasons & Audit Logging
 * 6. Edge Cases, Security & Access Control
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Verification = require('../models/Verification');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { signAccessToken, signAdminToken } = require('../utils/token');

describe('Milestone 4: KYC Document Verification & Profile Badge Synchronization Test Suite', () => {
  let user1, user2, admin;
  let token1, token2, adminToken;
  let profile1A, profile1B, profile2;
  let sampleDocBuffer;

  beforeAll(() => {
    // 1x1 transparent PNG buffer to simulate uploaded document image / file
    sampleDocBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  beforeEach(async () => {
    // 1. Create User 1 with 2 candidate profiles (Self and Sister)
    user1 = await User.create({
      mobile: '9811100001',
      name: 'Amit Agrawal',
      email: 'amit@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Unverified'
    });
    token1 = signAccessToken(user1);

    profile1A = await Profile.create({
      userId: user1._id,
      profileId: 'PRF-VER-001',
      fullName: 'Amit Agrawal',
      gender: 'Male',
      dob: new Date('1996-03-10'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      verified: false
    });

    profile1B = await Profile.create({
      userId: user1._id,
      profileId: 'PRF-VER-002',
      fullName: 'Pooja Agrawal',
      gender: 'Female',
      dob: new Date('1999-08-20'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      profileFor: 'Sister',
      verified: false
    });

    await User.findByIdAndUpdate(user1._id, {
      activeProfileId: profile1A._id,
      profiles: [profile1A._id, profile1B._id]
    });

    // 2. Create User 2 with 1 candidate profile
    user2 = await User.create({
      mobile: '9811100002',
      name: 'Sneha Goyal',
      email: 'sneha@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Unverified'
    });
    token2 = signAccessToken(user2);

    profile2 = await Profile.create({
      userId: user2._id,
      profileId: 'PRF-VER-003',
      fullName: 'Sneha Goyal',
      gender: 'Female',
      dob: new Date('1997-11-12'),
      gotra: 'Goyal',
      motherGotra: 'Mittal',
      verified: false
    });

    // 3. Create Super Admin
    admin = await Admin.create({
      name: 'Chief Compliance Officer',
      email: 'compliance@matrimonyhub.com',
      password: 'admin_pass_hash',
      role: 'Super Admin',
      status: 'Active'
    });
    adminToken = signAdminToken(admin);
  });

  describe('1. User KYC Document Submission Flow', () => {
    it('POST /api/verification/submit should accept multipart file upload for ID proof and profession proof', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .field('documentType', 'Aadhaar Card')
        .field('documentNumber', '1234-5678-9012')
        .attach('idProof', sampleDocBuffer, 'aadhaar_card.png')
        .attach('professionProof', sampleDocBuffer, 'degree_certificate.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.status).toBe('Pending');
      expect(res.body.data.verification.documentType).toBe('Aadhaar Card');
      expect(res.body.data.verification.idProofUrl).toMatch(/^\/uploads\/documents\//);
      expect(res.body.data.verification.professionProofUrl).toMatch(/^\/uploads\/documents\//);

      // Verify User record updated to Pending verificationStatus
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.verificationStatus).toBe('Pending');
    });

    it('POST /api/verification/submit should accept JSON payload with URL paths', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          documentType: 'Passport',
          documentNumber: 'Z1234567',
          idProofUrl: '/uploads/documents/passport-test.jpg',
          professionProofUrl: '/uploads/documents/degree-test.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.documentType).toBe('Passport');
    });

    it('POST /api/verification/submit should reject submission if no document is provided', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          documentType: 'Aadhaar Card'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/verification/submit should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .send({ idProofUrl: '/uploads/doc.jpg' });

      expect(res.status).toBe(401);
    });

    it('GET /api/verification/status should return current user verification status & latest submission', async () => {
      // First submit
      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          documentType: 'Voter ID',
          idProofUrl: '/uploads/documents/voter-id.jpg'
        });

      const res = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('Pending');
      expect(res.body.data.isVerified).toBe(false);
      expect(res.body.data.latestSubmission).toBeTruthy();
    });

    it('GET /api/verification/my-submissions should return history of submissions for logged-in user', async () => {
      // Submit two items
      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({ documentType: 'Aadhaar', idProofUrl: '/uploads/doc1.jpg' });

      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({ documentType: 'Passport', idProofUrl: '/uploads/doc2.jpg' });

      const res = await request(app)
        .get('/api/verification/my-submissions')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
      expect(res.body.data.submissions).toHaveLength(2);
    });
  });

  describe('2. Admin KYC Verification Queue & Side-by-Side Inspection', () => {
    let ver1, ver2;

    beforeEach(async () => {
      // User 1 submission
      const sub1 = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({ documentType: 'Aadhaar Card', idProofUrl: '/uploads/user1.jpg' });
      ver1 = sub1.body.data.verification;

      // User 2 submission
      const sub2 = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token2}`)
        .send({ documentType: 'Driving License', idProofUrl: '/uploads/user2.jpg' });
      ver2 = sub2.body.data.verification;
    });

    it('GET /api/admin/verifications should return pending queue with pagination and candidate details', async () => {
      const res = await request(app)
        .get('/api/admin/verifications?status=Pending&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('GET /api/admin/verifications/:id should return full side-by-side details with all candidate profiles', async () => {
      const res = await request(app)
        .get(`/api/admin/verifications/${ver1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.documentType).toBe('Aadhaar Card');
      expect(res.body.data.verification.userId.name).toBe('Amit Agrawal');

      // Side-by-side candidate profiles check (User 1 has 2 profiles)
      expect(res.body.data.candidateProfiles.length).toBe(2);
    });

    it('GET /api/admin/verifications should reject non-admin access with 401', async () => {
      const res = await request(app)
        .get('/api/admin/verifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(401);
    });
  });

  describe('3. One-Click Approval & Multi-Profile Badge Synchronization', () => {
    let verId;

    beforeEach(async () => {
      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          documentType: 'Aadhaar Card',
          documentNumber: '9999-8888-7777',
          idProofUrl: '/uploads/documents/verified_aadhaar.png'
        });
      verId = subRes.body.data.verification._id;
    });

    it('PUT /api/admin/verifications/:id/approve should approve verification and automatically set verified=true for ALL candidate profiles of the user', async () => {
      // Prior check: both Profile 1A and Profile 1B are verified: false
      const pre1A = await Profile.findById(profile1A._id);
      const pre1B = await Profile.findById(profile1B._id);
      expect(pre1A.verified).toBe(false);
      expect(pre1B.verified).toBe(false);

      // Admin approves verification
      const res = await request(app)
        .put(`/api/admin/verifications/${verId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Aadhaar number and DOB match government records perfectly.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.status).toBe('Approved');
      expect(res.body.data.userVerificationStatus).toBe('Approved');

      // Verify User record in DB
      const user = await User.findById(user1._id);
      expect(user.verificationStatus).toBe('Approved');

      // CRITICAL CONTRACT: Verify ALL candidate profiles belonging to User 1 are now verified = true
      const post1A = await Profile.findById(profile1A._id);
      const post1B = await Profile.findById(profile1B._id);
      expect(post1A.verified).toBe(true);
      expect(post1B.verified).toBe(true);

      // Verify other user (User 2) is NOT affected
      const post2 = await Profile.findById(profile2._id);
      expect(post2.verified).toBe(false);

      // Verify immutable AuditLog was generated
      const auditLog = await AuditLog.findOne({ action: 'Approved KYC Verification' });
      expect(auditLog).toBeTruthy();
      expect(auditLog.adminName).toBe(admin.name);
      expect(auditLog.target).toBe(verId.toString());
    });

    it('PUT /api/admin/verifications/:id/approve should return 404 for non-existent verification ID', async () => {
      const res = await request(app)
        .put('/api/admin/verifications/65f000000000000000000000/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Admin KYC Rejection & Categorization', () => {
    let verId;

    beforeEach(async () => {
      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          documentType: 'PAN Card',
          idProofUrl: '/uploads/documents/blurry_pan.png'
        });
      verId = subRes.body.data.verification._id;
    });

    it('PUT /api/admin/verifications/:id/reject should reject verification and record categorized reason', async () => {
      const res = await request(app)
        .put(`/api/admin/verifications/${verId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Blurred / Unreadable Document',
          rejectionCategory: 'Image Quality',
          notes: 'Please upload a clear scanned copy of your PAN card.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification.status).toBe('Rejected');
      expect(res.body.data.verification.rejectionReason).toBe('Blurred / Unreadable Document');
      expect(res.body.data.verification.rejectionCategory).toBe('Image Quality');

      // Verify User record
      const user = await User.findById(user2._id);
      expect(user.verificationStatus).toBe('Rejected');

      // Verify candidate profile remains verified: false
      const profile = await Profile.findById(profile2._id);
      expect(profile.verified).toBe(false);

      // Verify AuditLog generated
      const log = await AuditLog.findOne({ action: 'Rejected KYC Verification' });
      expect(log).toBeTruthy();
      expect(log.target).toBe(verId.toString());
    });

    it('PUT /api/admin/verifications/:id/reject should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .put('/api/admin/verifications/65f000000000000000000000/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
    });
  });
});
