/**
 * Milestone 2 Challenger Adversarial & Boundary Empirical Test Suite
 * Candidate Biodata & Multi-Profile Management
 * 
 * Conducts empirical stress-testing and boundary analysis on:
 * 1. Gotra Validation Boundaries (Reject 400 for non-authentic / invalid strings, verify normalization)
 * 2. Gallery Photo Upload Limit (Allow 1-6, strictly reject 7th photo with 400)
 * 3. Multi-Profile Ownership & Authorization (Reject 403 on cross-user profile activation, update, delete, media)
 * 4. Privacy Masking Engine (Phone and address masking for non-owners and unauthenticated guests)
 * 5. 5-Section Profile Completion Score Engine (Deterministic verification of 25+15+20+25+15 = 100%)
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { signAccessToken } = require('../utils/token');
const { calculateProfileCompletion } = require('../services/profileScoreService');
const { isValidGotra, normalizeGotra } = require('../utils/gotras');
const { AGARWAL_GOTRAS } = require('../config/constants');

describe('Milestone 2 Challenger Adversarial & Boundary Test Suite', () => {
  let user1, user2, user3;
  let token1, token2, token3;
  let sampleImageBuffer;

  beforeAll(() => {
    // 1x1 68-byte PNG transparent image buffer
    sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  beforeEach(async () => {
    // Clean and seed users
    user1 = await User.create({
      mobile: '9876543210',
      name: 'Adversarial Tester 1',
      email: 'tester1@agrawal.test',
      accountStatus: 'Active'
    });
    token1 = signAccessToken(user1);

    user2 = await User.create({
      mobile: '9876543211',
      name: 'Adversarial Tester 2',
      email: 'tester2@agrawal.test',
      accountStatus: 'Active'
    });
    token2 = signAccessToken(user2);

    user3 = await User.create({
      mobile: '9876543212',
      name: 'Adversarial Tester 3',
      email: 'tester3@agrawal.test',
      accountStatus: 'Suspended'
    });
    token3 = signAccessToken(user3);
  });

  // =========================================================================
  // 1. GOTRA VALIDATION BOUNDARY & ADVERSARIAL STRESS-TESTS
  // =========================================================================
  describe('1. Gotra Validation Boundaries & Edge Cases', () => {
    it('1.1 Should reject invalid / non-authentic Gotras on profile creation with 400 Bad Request', async () => {
      const invalidGotraCases = [
        'Gupta',
        'Sharma',
        'Verma',
        'Kashyap',
        'Agarwal',
        'Jat',
        'InvalidGotra',
        '12345',
        '<script>alert(1)</script>',
        'SELECT * FROM gotras',
        '{"$ne": null}'
      ];

      for (const invalidGotra of invalidGotraCases) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            fullName: 'Boundary Candidate',
            gender: 'Male',
            dob: '1995-05-15',
            gotra: invalidGotra
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('INVALID_GOTRA');
      }
    });

    it('1.2 Should reject empty, whitespace-only, or missing Gotra on creation with 400', async () => {
      const emptyCases = ['', '   ', null, undefined];

      for (const emptyGotra of emptyCases) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            fullName: 'Boundary Candidate',
            gender: 'Male',
            dob: '1995-05-15',
            gotra: emptyGotra
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('1.3 Should accept all 18 authentic Agarwal Gotras in English, Hindi, and canonical aliases', async () => {
      const testCases = [
        { input: 'Garg', expected: 'Garg' },
        { input: 'गर्ग', expected: 'Garg' },
        { input: 'garg', expected: 'Garg' },
        { input: 'गर्ग (Garg)', expected: 'Garg' },
        { input: 'Goel', expected: 'Goyal' }, // Alias
        { input: 'Goyal', expected: 'Goyal' },
        { input: 'Kushal', expected: 'Kuchhal' }, // Alias
        { input: 'Kuchhal', expected: 'Kuchhal' },
        { input: 'Mittal', expected: 'Mittal' },
        { input: 'Bansal', expected: 'Bansal' },
        { input: 'Singhal', expected: 'Singhal' },
        { input: 'Jindal', expected: 'Jindal' },
        { input: 'Tingal', expected: 'Tingal' },
        { input: 'Tayal', expected: 'Tayal' },
        { input: 'Airan', expected: 'Airan' },
        { input: 'Dharan', expected: 'Dharan' },
        { input: 'Madhukul', expected: 'Madhukul' },
        { input: 'Bindal', expected: 'Bindal' },
        { input: 'Goyan', expected: 'Goyan' },
        { input: 'Dhingan', expected: 'Goyan' }, // Alias
        { input: 'Nangal', expected: 'Nangal' },
        { input: 'Nagal', expected: 'Nangal' }, // Alias
        { input: 'Mangal', expected: 'Mangal' },
        { input: 'Kansal', expected: 'Kansal' },
        { input: 'Bhandal', expected: 'Bhandal' }
      ];

      for (const item of testCases) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            fullName: `Test for ${item.input}`,
            gender: 'Male',
            dob: '1996-01-01',
            gotra: item.input
          });

        expect(res.status).toBe(201);
        expect(res.body.data.profile.gotra).toBe(item.expected);
      }
    });

    it('1.4 Should reject invalid motherGotra when provided on creation or update', async () => {
      // Creation with invalid motherGotra
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Test Mother Gotra',
          gender: 'Female',
          dob: '1998-01-01',
          gotra: 'Garg',
          motherGotra: 'InvalidMother'
        });

      expect(createRes.status).toBe(400);
      expect(createRes.body.code).toBe('INVALID_GOTRA');

      // Valid creation
      const validCreate = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Test Mother Gotra Valid',
          gender: 'Female',
          dob: '1998-01-01',
          gotra: 'Garg',
          motherGotra: 'Bansal'
        });

      expect(validCreate.status).toBe(201);
      const profileId = validCreate.body.data.profile.profileId;

      // Update with invalid motherGotra
      const badUpdate = await request(app)
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          motherGotra: 'FakeGotra'
        });

      expect(badUpdate.status).toBe(400);
      expect(badUpdate.body.code).toBe('INVALID_GOTRA');
    });

    it('1.5 Should reject updating profile gotra to an invalid string and preserve existing gotra', async () => {
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Preserve Gotra Candidate',
          gender: 'Male',
          dob: '1994-04-04',
          gotra: 'Mittal'
        });

      const profileId = createRes.body.data.profile.profileId;

      const updateRes = await request(app)
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ gotra: 'NonExistentGotra' });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.code).toBe('INVALID_GOTRA');

      // Verify gotra remained Mittal
      const checkRes = await request(app)
        .get(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(checkRes.body.data.profile.gotra).toBe('Mittal');
    });
  });

  // =========================================================================
  // 2. GALLERY PHOTO UPLOAD LIMIT (MAX 6 PHOTOS, REJECT 7TH PHOTO)
  // =========================================================================
  describe('2. Gallery Photo Upload Boundary & 7th Photo Rejection', () => {
    let profileId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Gallery Boundary Candidate',
          gender: 'Male',
          dob: '1993-08-15',
          gotra: 'Bansal'
        });
      profileId = res.body.data.profile.profileId;
    });

    it('2.1 Should allow exactly 6 gallery photo uploads and strictly reject the 7th upload with 400', async () => {
      // Upload 6 photos
      for (let i = 1; i <= 6; i++) {
        const uploadRes = await request(app)
          .post(`/api/profiles/${profileId}/gallery`)
          .set('Authorization', `Bearer ${token1}`)
          .field('caption', `Photo #${i}`)
          .field('isPrimary', i === 1 ? 'true' : 'false')
          .attach('photo', sampleImageBuffer, `photo_${i}.png`);

        expect(uploadRes.status).toBe(200);
        expect(uploadRes.body.success).toBe(true);
        expect(uploadRes.body.data.gallery).toHaveLength(i);
      }

      // Attempt 7th photo upload - MUST fail with 400
      const seventhUpload = await request(app)
        .post(`/api/profiles/${profileId}/gallery`)
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', '7th Excessive Photo')
        .attach('photo', sampleImageBuffer, 'photo_7.png');

      expect(seventhUpload.status).toBe(400);
      expect(seventhUpload.body.success).toBe(false);
      expect(seventhUpload.body.error).toContain('Maximum 6 gallery photos allowed');

      // Verify gallery count remains exactly 6 in database
      const profileCheck = await Profile.findOne({ profileId });
      expect(profileCheck.gallery).toHaveLength(6);
    });

    it('2.2 Deleting one gallery photo should reduce count to 5 and permit uploading a 6th photo again', async () => {
      // Upload 6 photos
      let lastPhotoId = null;
      for (let i = 1; i <= 6; i++) {
        const uploadRes = await request(app)
          .post(`/api/profiles/${profileId}/gallery`)
          .set('Authorization', `Bearer ${token1}`)
          .field('caption', `Photo #${i}`)
          .attach('photo', sampleImageBuffer, `photo_${i}.png`);

        if (i === 6) {
          lastPhotoId = uploadRes.body.data.photo.id;
        }
      }

      // Verify 7th is rejected
      const rejectBeforeDelete = await request(app)
        .post(`/api/profiles/${profileId}/gallery`)
        .set('Authorization', `Bearer ${token1}`)
        .attach('photo', sampleImageBuffer, 'photo_excess.png');
      expect(rejectBeforeDelete.status).toBe(400);

      // Delete the 6th photo
      const deleteRes = await request(app)
        .delete(`/api/profiles/${profileId}/gallery/${lastPhotoId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.gallery).toHaveLength(5);

      // Now uploading a photo should succeed (restoring count to 6)
      const reUploadRes = await request(app)
        .post(`/api/profiles/${profileId}/gallery`)
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'New 6th Photo')
        .attach('photo', sampleImageBuffer, 'photo_reupload.png');

      expect(reUploadRes.status).toBe(200);
      expect(reUploadRes.body.data.gallery).toHaveLength(6);
    });

    it('2.3 Mongoose Schema validation should enforce maximum 6 gallery photos when array is assigned directly', async () => {
      const candidateProfile = await Profile.findOne({ profileId });
      const photoObjects = Array(7).fill(null).map((_, idx) => ({
        url: `/uploads/profiles/test_${idx}.png`,
        caption: `Pic ${idx}`
      }));

      candidateProfile.gallery = photoObjects;
      
      let validationError = null;
      try {
        await candidateProfile.save();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).not.toBeNull();
      expect(validationError.errors.gallery).toBeDefined();
    });
  });

  // =========================================================================
  // 3. MULTI-PROFILE OWNERSHIP & ACCESS CONTROL (403 FORBIDDEN)
  // =========================================================================
  describe('3. Multi-Profile Ownership & Authorization Controls', () => {
    let user1ProfileId, user2ProfileId;

    beforeEach(async () => {
      // User 1 creates profile
      const res1 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          profileFor: 'Self',
          fullName: 'User One Candidate',
          gender: 'Male',
          dob: '1995-01-01',
          gotra: 'Garg'
        });
      user1ProfileId = res1.body.data.profile.profileId;

      // User 2 creates profile
      const res2 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          profileFor: 'Self',
          fullName: 'User Two Candidate',
          gender: 'Female',
          dob: '1996-02-02',
          gotra: 'Bansal'
        });
      user2ProfileId = res2.body.data.profile.profileId;
    });

    it('3.1 Switching to a profile owned by another user must return 403 Forbidden', async () => {
      // User 1 tries to switch active profile to User 2's profile via POST /switch-active
      const res1 = await request(app)
        .post('/api/profiles/switch-active')
        .set('Authorization', `Bearer ${token1}`)
        .send({ profileId: user2ProfileId });

      expect(res1.status).toBe(403);
      expect(res1.body.success).toBe(false);

      // User 1 tries via PUT /switch/:profileId
      const res2 = await request(app)
        .put(`/api/profiles/switch/${user2ProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res2.status).toBe(403);
      expect(res2.body.success).toBe(false);

      // User 2 tries to activate User 1's profile
      const res3 = await request(app)
        .post('/api/profiles/switch-active')
        .set('Authorization', `Bearer ${token2}`)
        .send({ profileId: user1ProfileId });

      expect(res3.status).toBe(403);
      expect(res3.body.success).toBe(false);
    });

    it('3.2 Updating a profile owned by another user must return 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/profiles/${user2ProfileId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Malicious Hijack Attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify User 2 profile was NOT modified
      const checkRes = await request(app)
        .get(`/api/profiles/${user2ProfileId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(checkRes.body.data.profile.fullName).toBe('User Two Candidate');
    });

    it('3.3 Deleting a profile owned by another user must return 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/profiles/${user2ProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify User 2 profile still exists
      const checkRes = await Profile.findOne({ profileId: user2ProfileId });
      expect(checkRes).not.toBeNull();
    });

    it('3.4 Uploading media to another user profile must return 403 Forbidden', async () => {
      // Photo upload attempt on User 2 profile by User 1
      const photoRes = await request(app)
        .post(`/api/profiles/${user2ProfileId}/photo`)
        .set('Authorization', `Bearer ${token1}`)
        .attach('photo', sampleImageBuffer, 'hacked.png');

      expect(photoRes.status).toBe(403);

      // Gallery upload attempt on User 2 profile by User 1
      const galleryRes = await request(app)
        .post(`/api/profiles/${user2ProfileId}/gallery`)
        .set('Authorization', `Bearer ${token1}`)
        .attach('photo', sampleImageBuffer, 'hacked_gallery.png');

      expect(galleryRes.status).toBe(403);
    });

    it('3.5 Suspended user must be blocked with 403 Forbidden from all profile operations', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token3}`)
        .send({
          fullName: 'Suspended Candidate',
          gender: 'Male',
          dob: '1995-01-01',
          gotra: 'Garg'
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. PRIVACY MASKING FOR NON-OWNERS & UNAUTHENTICATED USERS
  // =========================================================================
  describe('4. Privacy Masking Engine (Phone & Address Masking)', () => {
    let privateProfileId;

    beforeEach(async () => {
      // User 2 creates profile with phone and address
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          fullName: 'Ananya Bansal',
          gender: 'Female',
          dob: '1997-07-20',
          gotra: 'Bansal',
          mobileNumber: '+91 98290 55443',
          residentialAddress: 'House 42, Civil Lines, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          privacySettings: {
            phoneVisibility: 'Connected Members Only',
            addressVisibility: 'Connected Members Only',
            photoVisibility: 'Visible to All'
          }
        });

      privateProfileId = res.body.data.profile.profileId;
    });

    it('4.1 Owner viewing own profile gets full unmasked phone and address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${privateProfileId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOwner).toBe(true);
      expect(res.body.data.profile.mobileNumber).toBe('+91 98290 55443');
      expect(res.body.data.profile.residentialAddress).toBe('House 42, Civil Lines, Jaipur');
      expect(res.body.data.profile.phoneMasked).toBeUndefined();
      expect(res.body.data.profile.addressMasked).toBeUndefined();
    });

    it('4.2 Authenticated non-owner receives masked phone (+91 98290 XXXXX) and protected address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${privateProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOwner).toBe(false);
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.mobileNumber).toMatch(/XXXXX$/);
      expect(res.body.data.profile.mobileNumber).toContain('+91 98290');
      expect(res.body.data.profile.addressMasked).toBe(true);
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
      // City and State should remain unmasked
      expect(res.body.data.profile.city).toBe('Jaipur');
      expect(res.body.data.profile.state).toBe('Rajasthan');
    });

    it('4.3 Unauthenticated public guest receives masked phone and protected address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${privateProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOwner).toBe(false);
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.mobileNumber).toMatch(/XXXXX$/);
      expect(res.body.data.profile.addressMasked).toBe(true);
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
    });

    it('4.4 When phoneVisibility is "Hidden", mobileNumber is masked as "Protected"', async () => {
      // Update privacy to Hidden
      await request(app)
        .put(`/api/profiles/${privateProfileId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          privacySettings: {
            phoneVisibility: 'Hidden',
            addressVisibility: 'Hidden'
          }
        });

      const res = await request(app)
        .get(`/api/profiles/${privateProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.mobileNumber).toBe('Protected');
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
    });
  });

  // =========================================================================
  // 5. PROFILE COMPLETION SCORE ACCURATELY REFLECTS ALL 5 SECTIONS
  // =========================================================================
  describe('5. Profile Completion Score 5-Section Weighted Engine', () => {
    it('5.1 Section 1 (Personal Details) accurately contributes up to 25%', () => {
      // Base required: fullName(5), gender(5), dob(5), gotra(5) = 20%
      const basePersonal = {
        fullName: 'Ravi Singhal',
        gender: 'Male',
        dob: '1995-01-01',
        gotra: 'Singhal'
      };
      const scoreBase = calculateProfileCompletion(basePersonal);
      expect(scoreBase.breakdown.personal).toBe(20);

      // With physical attributes: height(2.5), complexion(2.5) => +5 = 25%
      const fullPersonal = {
        ...basePersonal,
        height: "5'10\"",
        complexion: 'Fair'
      };
      const scoreFull = calculateProfileCompletion(fullPersonal);
      expect(scoreFull.breakdown.personal).toBe(25);
    });

    it('5.2 Section 2 (Astrology & Gotra) accurately contributes up to 15%', () => {
      const astrologyData = {
        tob: '07:30 AM', // 4
        pob: 'Delhi', // 4
        motherGotra: 'Garg', // 4
        manglik: 'Non-Manglik' // 3
      };
      const score = calculateProfileCompletion(astrologyData);
      expect(score.breakdown.astrology).toBe(15);
    });

    it('5.3 Section 3 (Education & Profession) accurately contributes up to 20%', () => {
      const eduData = {
        qualification: 'B.Tech + MBA', // 8
        occupation: 'Product Manager', // 4
        workingAt: 'Microsoft', // 3
        income: '35 LPA' // 5
      };
      const score = calculateProfileCompletion(eduData);
      expect(score.breakdown.education).toBe(20);
    });

    it('5.4 Section 4 (3-Gen Family Tree & Relatives) accurately contributes up to 25%', () => {
      const familyData = {
        father: 'Sh. Suresh Singhal', // 4
        fatherOccupation: 'Business', // 4
        mother: 'Smt. Usha Singhal', // 5
        grandfather: 'Late Sh. Ramdas Singhal', // 4
        brotherList: [ // Relative list with valid name: 8
          { name: 'Amit Singhal', status: 'Married' }
        ]
      };
      const score = calculateProfileCompletion(familyData);
      expect(score.breakdown.family).toBe(25);
    });

    it('5.5 Section 5 (Media & Contact) accurately contributes up to 15%', () => {
      const mediaData = {
        profilePicture: '/uploads/profiles/test.jpg', // 10
        residentialAddress: 'Jaipur', // 2.5
        mobileNumber: '9829012345' // 2.5
      };
      const score = calculateProfileCompletion(mediaData);
      expect(score.breakdown.media).toBe(15);
    });

    it('5.6 Total score combines exactly to 100% and matches breakdown sum', () => {
      const completeCandidate = {
        // Section 1: Personal (25)
        fullName: 'Varun Jindal',
        gender: 'Male',
        dob: new Date('1994-03-15'),
        gotra: 'Jindal',
        height: "6'0\"",
        complexion: 'Very Fair',

        // Section 2: Astrology (15)
        tob: '08:15 AM',
        pob: 'Jaipur',
        motherGotra: 'Bansal',
        manglik: 'Non-Manglik',

        // Section 3: Education & Career (20)
        qualification: 'Chartered Accountant (CA)',
        occupation: 'Senior Partner',
        workingAt: 'Jindal & Associates',
        income: '40 LPA',

        // Section 4: Family Tree & Relatives (25)
        father: 'Sh. Radheshyam Jindal',
        fatherOccupation: 'Senior Industrialist',
        mother: 'Smt. Kavita Jindal',
        grandfather: 'Late Sh. M.L. Jindal',
        brotherList: [{ name: 'Naveen Jindal', status: 'Married', occupation: 'Director' }],

        // Section 5: Media & Contact (15)
        profilePicture: '/uploads/profiles/varun.png',
        residentialAddress: 'Civil Lines, Jaipur',
        city: 'Jaipur',
        state: 'Rajasthan',
        mobileNumber: '+91 98290 99887'
      };

      const score = calculateProfileCompletion(completeCandidate);
      expect(score.percentage).toBe(100);
      expect(score.breakdown.personal).toBe(25);
      expect(score.breakdown.astrology).toBe(15);
      expect(score.breakdown.education).toBe(20);
      expect(score.breakdown.family).toBe(25);
      expect(score.breakdown.media).toBe(15);
      expect(
        score.breakdown.personal +
        score.breakdown.astrology +
        score.breakdown.education +
        score.breakdown.family +
        score.breakdown.media
      ).toBe(100);
    });

    it('5.7 GET /api/profiles/me/completion and GET /api/profiles/:profileId/completion return accurate scores via API', async () => {
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Score API Test Candidate',
          gender: 'Male',
          dob: '1995-10-10',
          gotra: 'Tayal',
          height: "5'9\"",
          complexion: 'Fair',
          qualification: 'B.Tech IIT',
          income: '30 LPA'
        });

      const profileId = createRes.body.data.profile.profileId;

      // Check /me/completion
      const meCompletion = await request(app)
        .get('/api/profiles/me/completion')
        .set('Authorization', `Bearer ${token1}`);

      expect(meCompletion.status).toBe(200);
      expect(meCompletion.body.data.breakdown.personal).toBe(25);
      expect(meCompletion.body.data.breakdown.astrology).toBe(3); // default Non-Manglik = 3
      expect(meCompletion.body.data.breakdown.education).toBe(13); // qualification(8) + income(5) = 13
      expect(meCompletion.body.data.breakdown.media).toBe(3); // mobileNumber populated from user.mobile = 3
      expect(meCompletion.body.data.percentage).toBe(44);

      // Check /:profileId/completion
      const byIdCompletion = await request(app)
        .get(`/api/profiles/${profileId}/completion`)
        .set('Authorization', `Bearer ${token1}`);

      expect(byIdCompletion.status).toBe(200);
      expect(byIdCompletion.body.data.percentage).toBe(44);
      expect(byIdCompletion.body.data.breakdown).toEqual(meCompletion.body.data.breakdown);
    });
  });
});
