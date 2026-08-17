/**
 * Milestone 2 Test Suite: Candidate Biodata & Multi-Profile Management
 * Covers:
 * 1. Profile creation with authentic 18 Gotras & rejection of invalid gotras
 * 2. 3-generation family tree & dynamic relative subdocuments
 * 3. Multi-profile management under one User (switch active profile, get user profiles)
 * 4. Profile completion score calculation and breakdown (5-section weighted engine)
 * 5. Photo upload endpoints (avatar & gallery max 6)
 * 6. Privacy settings visibility masking
 * 7. Security, ownership validation, and edge cases
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { signAccessToken } = require('../utils/token');
const { calculateProfileCompletion } = require('../services/profileScoreService');
const { AGARWAL_GOTRAS, GOTRA_NAMES_EN } = require('../config/constants');

describe('Milestone 2: Candidate Biodata & Multi-Profile Management Test Suite', () => {
  let user1, user2, token1, token2;
  let sampleImageBuffer;

  beforeAll(() => {
    // 1x1 transparent PNG buffer for upload testing
    sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  beforeEach(async () => {
    // Create test user 1
    user1 = await User.create({
      mobile: '9876543210',
      name: 'Rajesh Agrawal',
      email: 'rajesh@example.com',
      accountStatus: 'Active'
    });
    token1 = signAccessToken(user1);

    // Create test user 2
    user2 = await User.create({
      mobile: '9123456789',
      name: 'Sunita Bansal',
      email: 'sunita@example.com',
      accountStatus: 'Active'
    });
    token2 = signAccessToken(user2);
  });

  describe('1. 18 Authentic Gotras Validation & Profile Creation', () => {
    it('POST /api/profiles should create profile with valid 18 Gotra (English, Hindi, and Aliases)', async () => {
      const validGotraSamples = ['Garg', 'Bansal', 'Goel', 'Mittal', 'Singhal', 'Jindal'];

      for (const gotra of validGotraSamples) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            fullName: `Candidate ${gotra}`,
            gender: 'Male',
            dob: '1995-06-15',
            gotra: gotra,
            motherGotra: 'Bansal',
            qualification: 'B.Tech CS',
            occupation: 'Software Engineer',
            income: '20 LPA'
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.profile).toBeDefined();
        expect(res.body.data.profile.gotra).toBe(gotra === 'Goel' ? 'Goyal' : gotra);
        expect(res.body.data.profile.profileId).toMatch(/^PRF-\d+/);
        expect(res.body.data.completionPercentage).toBeGreaterThan(0);
      }
    });

    it('POST /api/profiles should strictly reject invalid/non-Agarwal gotras', async () => {
      const invalidGotras = ['Sharma', 'Verma', 'Kashyap', 'Gupta', 'RandomGotra123', ''];

      for (const gotra of invalidGotras) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            fullName: 'Invalid Candidate',
            gender: 'Male',
            dob: '1995-06-15',
            gotra: gotra
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('POST /api/profiles should reject invalid motherGotra if provided', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Candidate Test',
          gender: 'Female',
          dob: '1998-08-20',
          gotra: 'Garg',
          motherGotra: 'InvalidMotherGotra'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/profiles should reject creation when required fields are missing', async () => {
      // Missing fullName
      const res1 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ gender: 'Male', dob: '1995-06-15', gotra: 'Garg' });
      expect(res1.status).toBe(400);

      // Missing gender
      const res2 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Amit', dob: '1995-06-15', gotra: 'Garg' });
      expect(res2.status).toBe(400);

      // Missing dob
      const res3 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Amit', gender: 'Male', gotra: 'Garg' });
      expect(res3.status).toBe(400);
    });

    it('First created profile should automatically become activeProfileId for User', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Rajesh Agrawal',
          gender: 'Male',
          dob: '1994-01-01',
          gotra: 'Garg'
        });

      expect(res.status).toBe(201);
      const createdProfileId = res.body.data.profile.id || res.body.data.profile._id;

      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.activeProfileId.toString()).toBe(createdProfileId.toString());
      expect(updatedUser.profiles).toContainEqual(expect.objectContaining({}));
    });
  });

  describe('2. 3-Generation Family Tree & Dynamic Relative Subdocuments', () => {
    it('POST /api/profiles should store full 3-generation family tree and dynamic relative subdocuments', async () => {
      const fullFamilyPayload = {
        fullName: 'Priya Garg',
        gender: 'Female',
        dob: '1997-04-12',
        gotra: 'Garg',
        motherGotra: 'Bansal',
        grandfather: 'Late Sh. Ramcharan Garg',
        grandmother: 'Smt. Shanti Devi',
        maternalGrandfather: 'Sh. Kishorilal Bansal',
        maternalGrandmother: 'Smt. Pushpa Bansal',
        father: 'Sh. Rameshwar Garg',
        fatherOccupation: 'Business',
        fatherOccupationDetails: 'Owner, Garg Textile Mills',
        mother: 'Smt. Sunita Garg',
        motherOccupation: 'Homemaker',
        familyType: 'Joint Family',
        familyValues: 'Traditional',
        familyOrigin: 'Agroha / Jaipur',
        brotherList: [
          { name: 'Aman Garg', status: 'Married', spouseName: 'Pooja Garg', homePlace: 'Delhi', occupation: 'Software Engineer' }
        ],
        sisterList: [
          { name: 'Neha Garg', status: 'Married', spouseName: 'Rahul Agrawal', homePlace: 'Indore', occupation: 'Doctor' }
        ],
        taujiList: [
          { name: 'Sh. Suresh Garg', status: 'Married', spouseName: 'Smt. Anita Garg', homePlace: 'Jaipur', occupation: 'Business' }
        ],
        chachaList: [
          { name: 'Sh. Dinesh Garg', status: 'Married', spouseName: 'Smt. Meena Garg', homePlace: 'Ahmedabad', occupation: 'Govt Job' }
        ],
        buajiList: [
          { name: 'Smt. Rekha Agrawal', status: 'Married', spouseName: 'Sh. Mohan Agrawal', homePlace: 'Udaipur' }
        ],
        mamajiList: [
          { name: 'Sh. Vijay Bansal', status: 'Married', spouseName: 'Smt. Geeta Bansal', homePlace: 'Kota', occupation: 'Chartered Accountant' }
        ],
        masijiList: [
          { name: 'Smt. Saroj Mittal', status: 'Married', spouseName: 'Sh. Rakesh Mittal', homePlace: 'Surat' }
        ],
        residentialAddress: '104, Agrasen Nagar, Jaipur',
        city: 'Jaipur',
        state: 'Rajasthan',
        mobileNumber: '+91 98290 12345'
      };

      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send(fullFamilyPayload);

      expect(res.status).toBe(201);
      const profile = res.body.data.profile;

      expect(profile.grandfather).toBe('Late Sh. Ramcharan Garg');
      expect(profile.maternalGrandfather).toBe('Sh. Kishorilal Bansal');
      expect(profile.father).toBe('Sh. Rameshwar Garg');
      expect(profile.fatherOccupationDetails).toBe('Owner, Garg Textile Mills');
      expect(profile.brotherList).toHaveLength(1);
      expect(profile.brotherList[0].name).toBe('Aman Garg');
      expect(profile.brotherList[0].status).toBe('Married');
      expect(profile.brotherList[0].homePlace).toBe('Delhi');
      expect(profile.mamajiList).toHaveLength(1);
      expect(profile.mamajiList[0].name).toBe('Sh. Vijay Bansal');
      expect(profile.mamajiList[0].homePlace).toBe('Kota');
      expect(profile.masijiList).toHaveLength(1);
    });

    it('PUT /api/profiles/:profileId should update family tree and relatives subdocuments', async () => {
      // Create initial profile
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Vikas Jindal',
          gender: 'Male',
          dob: '1993-11-05',
          gotra: 'Jindal'
        });

      const profileId = createRes.body.data.profile.profileId;

      // Update with new relative list
      const updateRes = await request(app)
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          grandfather: 'Sh. Om Prakash Jindal',
          father: 'Sh. Satish Jindal',
          fatherOccupation: 'Business',
          mother: 'Smt. Kamlesh Jindal',
          chachaList: [
            { name: 'Sh. Anil Jindal', status: 'Married', spouseName: 'Smt. Seema Jindal', homePlace: 'Hisar' }
          ],
          hobbies: ['Chess', 'Reading', 'Cricket']
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.profile.grandfather).toBe('Sh. Om Prakash Jindal');
      expect(updateRes.body.data.profile.chachaList).toHaveLength(1);
      expect(updateRes.body.data.profile.chachaList[0].name).toBe('Sh. Anil Jindal');
      expect(updateRes.body.data.profile.hobbies).toContain('Chess');
    });
  });

  describe('3. Multi-Profile Management Under One User', () => {
    it('User can create multiple candidate profiles (Self, Son, Daughter, Brother)', async () => {
      // Create Profile 1 (Self)
      const res1 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          profileFor: 'Self',
          fullName: 'Rajesh Agrawal',
          gender: 'Male',
          dob: '1992-05-10',
          gotra: 'Garg'
        });
      expect(res1.status).toBe(201);
      const profile1Id = res1.body.data.profile.profileId;

      // Create Profile 2 (Brother)
      const res2 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          profileFor: 'Brother',
          fullName: 'Suresh Agrawal',
          gender: 'Male',
          dob: '1996-09-22',
          gotra: 'Garg'
        });
      expect(res2.status).toBe(201);
      const profile2Id = res2.body.data.profile.profileId;

      // Fetch all profiles for user
      const listRes = await request(app)
        .get('/api/profiles/my-profiles')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.profiles).toHaveLength(2);
      expect(listRes.body.data.totalCount).toBe(2);

      // Active profile is profile 1 initially
      const meRes1 = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(meRes1.status).toBe(200);
      expect(meRes1.body.data.profile.fullName).toBe('Rajesh Agrawal');

      // Switch active profile to Profile 2
      const switchRes = await request(app)
        .post('/api/profiles/switch-active')
        .set('Authorization', `Bearer ${token1}`)
        .send({ profileId: profile2Id });

      expect(switchRes.status).toBe(200);
      expect(switchRes.body.success).toBe(true);

      // Verify GET /api/profiles/me now returns Profile 2
      const meRes2 = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(meRes2.status).toBe(200);
      expect(meRes2.body.data.profile.fullName).toBe('Suresh Agrawal');
    });

    it('Switching to a profile owned by another user should return 403 Forbidden', async () => {
      // User 2 creates a profile
      const resUser2 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          fullName: 'Sunita Bansal',
          gender: 'Female',
          dob: '1996-03-15',
          gotra: 'Bansal'
        });

      const user2ProfileId = resUser2.body.data.profile.profileId;

      // User 1 attempts to activate User 2's profile
      const switchAttempt = await request(app)
        .post('/api/profiles/switch-active')
        .set('Authorization', `Bearer ${token1}`)
        .send({ profileId: user2ProfileId });

      expect(switchAttempt.status).toBe(403);
      expect(switchAttempt.body.success).toBe(false);
    });

    it('DELETE /api/profiles/:profileId should delete profile and update activeProfileId', async () => {
      // User creates two profiles
      const p1 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Profile To Keep', gender: 'Male', dob: '1995-01-01', gotra: 'Garg' });

      const p2 = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Profile To Delete', gender: 'Male', dob: '1997-01-01', gotra: 'Garg' });

      const deleteId = p2.body.data.profile.profileId;

      // Delete Profile 2
      const delRes = await request(app)
        .delete(`/api/profiles/${deleteId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify list has only 1 profile left
      const listRes = await request(app)
        .get('/api/profiles/my-profiles')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.body.data.profiles).toHaveLength(1);
      expect(listRes.body.data.profiles[0].fullName).toBe('Profile To Keep');
    });
  });

  describe('4. Profile Completion Score Engine & Breakdown', () => {
    it('Should accurately calculate completion breakdown across all 5 sections', () => {
      // Empty profile
      const emptyScore = calculateProfileCompletion({});
      expect(emptyScore.percentage).toBe(0);
      expect(emptyScore.breakdown.personal).toBe(0);
      expect(emptyScore.breakdown.astrology).toBe(0);
      expect(emptyScore.breakdown.education).toBe(0);
      expect(emptyScore.breakdown.family).toBe(0);
      expect(emptyScore.breakdown.media).toBe(0);

      // Fully populated profile
      const fullProfile = {
        fullName: 'Aman Mittal',
        gender: 'Male',
        dob: new Date('1994-05-12'),
        gotra: 'Mittal',
        height: "5'11\"",
        complexion: 'Fair',
        tob: '06:45 AM',
        pob: 'Delhi',
        motherGotra: 'Garg',
        manglik: 'Non-Manglik',
        qualification: 'B.Tech, IIT Delhi',
        workingAt: 'Google',
        occupation: 'Staff Software Engineer',
        income: '50+ LPA',
        father: 'Sh. K.K. Mittal',
        fatherOccupation: 'Business',
        mother: 'Smt. Nirmala Mittal',
        grandfather: 'Late Sh. R.L. Mittal',
        brotherList: [{ name: 'Deepak Mittal' }],
        profilePicture: 'https://example.com/avatar.jpg',
        residentialAddress: 'Civil Lines, Delhi',
        mobileNumber: '9876543210'
      };

      const fullScore = calculateProfileCompletion(fullProfile);
      expect(fullScore.percentage).toBe(100);
      expect(fullScore.breakdown.personal).toBe(25);
      expect(fullScore.breakdown.astrology).toBe(15);
      expect(fullScore.breakdown.education).toBe(20);
      expect(fullScore.breakdown.family).toBe(25);
      expect(fullScore.breakdown.media).toBe(15);
    });

    it('GET /api/profiles/me/completion should return section-by-section breakdown', async () => {
      await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Test Candidate',
          gender: 'Female',
          dob: '1998-02-14',
          gotra: 'Singhal',
          height: "5'5\"",
          complexion: 'Fair',
          qualification: 'MBA Finance',
          income: '15 LPA'
        });

      const res = await request(app)
        .get('/api/profiles/me/completion')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.percentage).toBeGreaterThanOrEqual(25);
      expect(res.body.data.breakdown).toBeDefined();
      expect(res.body.data.breakdown.personal).toBe(25); // fullName(5)+gender(5)+dob(5)+gotra(5)+height/comp(5)
    });
  });

  describe('5. Photo Upload Endpoints (Avatar & Gallery Max 6)', () => {
    it('POST /api/profiles/me/photo should upload profile avatar photo and update completion score', async () => {
      // Create profile
      await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Photo Test Candidate',
          gender: 'Male',
          dob: '1995-07-20',
          gotra: 'Tayal'
        });

      const res = await request(app)
        .post('/api/profiles/me/photo')
        .set('Authorization', `Bearer ${token1}`)
        .attach('photo', sampleImageBuffer, 'avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^\/uploads\/profiles\/profile-/);
      expect(res.body.data.profilePicture).toMatch(/^\/uploads\/profiles\/profile-/);

      // Verify in DB
      const meProfile = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(meProfile.body.data.profile.profilePicture).toMatch(/^\/uploads\/profiles\//);
    });

    it('POST /api/profiles/me/gallery should allow up to 6 gallery photos and reject 7th photo', async () => {
      // Create profile
      await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Gallery Test Candidate',
          gender: 'Female',
          dob: '1996-10-10',
          gotra: 'Airan'
        });

      // Upload 6 photos successfully
      for (let i = 1; i <= 6; i++) {
        const uploadRes = await request(app)
          .post('/api/profiles/me/gallery')
          .set('Authorization', `Bearer ${token1}`)
          .field('caption', `Photo ${i}`)
          .field('isPrimary', i === 1 ? 'true' : 'false')
          .attach('photo', sampleImageBuffer, `photo${i}.png`);

        expect(uploadRes.status).toBe(200);
        expect(uploadRes.body.success).toBe(true);
        expect(uploadRes.body.data.gallery).toHaveLength(i);
      }

      // 7th photo must be rejected with 400
      const rejectedRes = await request(app)
        .post('/api/profiles/me/gallery')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'Excess Photo')
        .attach('photo', sampleImageBuffer, 'excess.png');

      expect(rejectedRes.status).toBe(400);
      expect(rejectedRes.body.success).toBe(false);
      expect(rejectedRes.body.error).toContain('Maximum 6 gallery photos allowed');
    });

    it('DELETE /api/profiles/me/gallery/:photoId should delete gallery photo', async () => {
      await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Gallery Delete Candidate',
          gender: 'Male',
          dob: '1995-12-12',
          gotra: 'Dharan'
        });

      // Upload photo
      const uploadRes = await request(app)
        .post('/api/profiles/me/gallery')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'Delete Me')
        .attach('photo', sampleImageBuffer, 'todelete.png');

      const photoId = uploadRes.body.data.photo.id;

      // Delete photo
      const delRes = await request(app)
        .delete(`/api/profiles/me/gallery/${photoId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.data.gallery).toHaveLength(0);
    });
  });

  describe('6. Privacy Settings & Visibility Masking', () => {
    let candidateProfileId;

    beforeEach(async () => {
      // User 2 creates profile with restricted privacy
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          fullName: 'Sneha Bansal',
          gender: 'Female',
          dob: '1997-03-25',
          gotra: 'Bansal',
          motherGotra: 'Garg',
          mobileNumber: '+91 98765 43210',
          residentialAddress: 'Flat 502, Orchid Towers, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          privacySettings: {
            phoneVisibility: 'Connected Members Only',
            addressVisibility: 'Connected Members Only',
            photoVisibility: 'Request Access'
          }
        });

      candidateProfileId = res.body.data.profile.profileId;
    });

    it('Owner viewing own profile should see unmasked sensitive fields', async () => {
      const res = await request(app)
        .get(`/api/profiles/${candidateProfileId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOwner).toBe(true);
      expect(res.body.data.profile.mobileNumber).toBe('+91 98765 43210');
      expect(res.body.data.profile.residentialAddress).toBe('Flat 502, Orchid Towers, Jaipur');
    });

    it('Other user viewing profile should see masked phone number and protected address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${candidateProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOwner).toBe(false);
      expect(res.body.data.profile.mobileNumber).toContain('XXXXX');
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
      expect(res.body.data.profile.addressMasked).toBe(true);
      expect(res.body.data.profile.city).toBe('Jaipur'); // City & state remain accessible
    });

    it('Profile with Hidden phoneVisibility should return Protected for other users', async () => {
      // Update privacy to Hidden
      await request(app)
        .put(`/api/profiles/${candidateProfileId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          privacySettings: {
            phoneVisibility: 'Hidden',
            addressVisibility: 'Hidden'
          }
        });

      const res = await request(app)
        .get(`/api/profiles/${candidateProfileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.mobileNumber).toBe('Protected');
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
    });
  });

  describe('7. Security, Authorization & Edge Cases', () => {
    it('Unauthenticated requests to protected endpoints should return 401 Unauthorized', async () => {
      const res1 = await request(app).get('/api/profiles/me');
      expect(res1.status).toBe(401);

      const res2 = await request(app).post('/api/profiles').send({});
      expect(res2.status).toBe(401);

      const res3 = await request(app).put('/api/profiles/PRF-123456').send({});
      expect(res3.status).toBe(401);
    });

    it('Suspended user account should be forbidden (403) from accessing profile endpoints', async () => {
      const suspendedUser = await User.create({
        mobile: '9000000000',
        name: 'Suspended User',
        accountStatus: 'Suspended'
      });
      const suspendedToken = signAccessToken(suspendedUser);

      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${suspendedToken}`);

      expect(res.status).toBe(403);
    });

    it('Editing or deleting someone else profile should return 403 Forbidden', async () => {
      // User 2 creates profile
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          fullName: 'User 2 Candidate',
          gender: 'Female',
          dob: '1998-01-01',
          gotra: 'Madhukul'
        });

      const pId = createRes.body.data.profile.profileId;

      // User 1 tries to edit User 2's profile
      const editRes = await request(app)
        .put(`/api/profiles/${pId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Hacked Name' });

      expect(editRes.status).toBe(403);

      // User 1 tries to delete User 2's profile
      const deleteRes = await request(app)
        .delete(`/api/profiles/${pId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(403);
    });

    it('Non-existent profile ID should return 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/profiles/PRF-NONEXISTENT')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });

    it('Gotra validation should handle whitespace, mixed-case and bilingual input', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Bilingual Gotra Candidate',
          gender: 'Male',
          dob: '1995-01-01',
          gotra: '  गर्ग (Garg)  ',
          motherGotra: '  bAnSaL  '
        });

      expect(res.status).toBe(201);
      expect(res.body.data.profile.gotra).toBe('Garg');
      expect(res.body.data.profile.motherGotra).toBe('Bansal');
    });

    it('Updating gotra with invalid gotra in PUT should be rejected and not mutate data', async () => {
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Original Candidate',
          gender: 'Male',
          dob: '1995-01-01',
          gotra: 'Garg'
        });

      const pId = createRes.body.data.profile.profileId;

      const badUpdate = await request(app)
        .put(`/api/profiles/${pId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ gotra: 'InvalidGotra999' });

      expect(badUpdate.status).toBe(400);

      // Verify original gotra is unchanged
      const checkRes = await request(app)
        .get(`/api/profiles/${pId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(checkRes.body.data.profile.gotra).toBe('Garg');
    });

    it('Uploading invalid file format (e.g. text file) to avatar endpoint should return 400', async () => {
      const textBuffer = Buffer.from('This is not an image file', 'utf8');

      const res = await request(app)
        .post('/api/profiles/me/photo')
        .set('Authorization', `Bearer ${token1}`)
        .attach('photo', textBuffer, 'malicious.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid image type');
    });

    it('Unauthenticated public viewer on GET /api/profiles/:profileId should receive masked contact details', async () => {
      const createRes = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fullName: 'Public Candidate',
          gender: 'Male',
          dob: '1995-01-01',
          gotra: 'Kansal',
          mobileNumber: '+91 9988776655',
          residentialAddress: '22, Malviya Nagar, Jaipur',
          city: 'Jaipur',
          privacySettings: {
            phoneVisibility: 'Connected Members Only',
            addressVisibility: 'Connected Members Only'
          }
        });

      const pId = createRes.body.data.profile.profileId;

      // Unauthenticated request
      const publicRes = await request(app).get(`/api/profiles/${pId}`);

      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.isOwner).toBe(false);
      expect(publicRes.body.data.profile.mobileNumber).toContain('XXXXX');
      expect(publicRes.body.data.profile.residentialAddress).toContain('Protected');
    });

    it('Deleting all user profiles cascades activeProfileId to null', async () => {
      const p = await request(app)
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token1}`)
        .send({ fullName: 'Sole Profile', gender: 'Male', dob: '1995-01-01', gotra: 'Mangal' });

      const pId = p.body.data.profile.profileId;

      const del = await request(app)
        .delete(`/api/profiles/${pId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(del.status).toBe(200);
      expect(del.body.data.activeProfileId).toBeNull();

      const userAfter = await User.findById(user1._id);
      expect(userAfter.activeProfileId).toBeNull();
      expect(userAfter.profiles).toHaveLength(0);
    });
  });
});
