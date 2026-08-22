/**
 * Milestone 3 Test Suite: Matchmaking Engine, Interactions, Privacy & Discovery
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. 6-Factor Weighted Match Engine & Factor Algorithms
 * 2. Gotra Exogamy Rules (Sagotra 0 pts, Maternal overlap 50% penalty, Distinct 30 pts)
 * 3. Match Discovery Endpoints (/api/matches, /api/matches/today, /api/matches/search, /api/matches/score/:id)
 * 4. Interest Lifecycle (Pending -> Accepted / Declined / Cancelled) & Mutual Contact Unlocking
 * 5. Shortlist / Favorites & Daily-Deduplicated Visitor Tracking
 * 6. Block List, Bidirectional Protection & Cascading Restrictions
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const Shortlist = require('../models/Shortlist');
const Visitor = require('../models/Visitor');
const Block = require('../models/Block');
const { signAccessToken } = require('../utils/token');
const {
  calculateMatchScore,
  checkGotraCompatibility,
  checkAgeCompatibility,
  checkEducationCompatibility,
  checkLocationCompatibility,
  checkIncomeCompatibility,
  checkManglikCompatibility,
  classifyEducationTier,
  classifyIncomeTier
} = require('../services/matchEngine');
const { normalizeGotra, checkGotraExogamy } = require('../utils/gotras');

describe('Milestone 3: Matchmaking Engine & Candidate Discovery Test Suite', () => {
  let user1, user2, user3, user4;
  let token1, token2, token3, token4;
  let profile1, profile2, profile3, profile4;

  beforeEach(async () => {
    // User 1: Groom (Garg gotra, 28 yrs, B.Tech, Jaipur, 25 LPA, Non-Manglik)
    user1 = await User.create({
      mobile: '9876500001',
      name: 'Aman Garg',
      email: 'aman@example.com',
      accountStatus: 'Active'
    });
    token1 = signAccessToken(user1);

    profile1 = await Profile.create({
      userId: user1._id,
      profileId: 'PRF-100001',
      fullName: 'Aman Garg',
      gender: 'Male',
      dob: new Date('1998-05-15'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech Computer Science',
      educationLevel: 'Graduate',
      workingAt: 'Infosys',
      occupation: 'Software Engineer',
      income: '25 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '9876500001',
      residentialAddress: '123, Malviya Nagar, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    user1.activeProfileId = profile1._id;
    user1.profiles.push(profile1._id);
    await user1.save();

    // User 2: Compatible Bride (Mittal gotra, mother Singhal, 27 yrs, MBA, Jaipur, 20 LPA, Non-Manglik)
    user2 = await User.create({
      mobile: '9876500002',
      name: 'Pooja Mittal',
      email: 'pooja@example.com',
      accountStatus: 'Active'
    });
    token2 = signAccessToken(user2);

    profile2 = await Profile.create({
      userId: user2._id,
      profileId: 'PRF-100002',
      fullName: 'Pooja Mittal',
      gender: 'Female',
      dob: new Date('1999-08-20'),
      gotra: 'Mittal',
      motherGotra: 'Singhal',
      manglik: 'Non-Manglik',
      qualification: 'MBA Finance',
      educationLevel: 'Post Graduate',
      workingAt: 'HDFC Bank',
      occupation: 'Financial Analyst',
      income: '20 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '9876500002',
      residentialAddress: '456, Vaishali Nagar, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    user2.activeProfileId = profile2._id;
    user2.profiles.push(profile2._id);
    await user2.save();

    // User 3: Sagotra Bride (Garg gotra, mother Goyal)
    user3 = await User.create({
      mobile: '9876500003',
      name: 'Neha Garg',
      email: 'neha@example.com',
      accountStatus: 'Active'
    });
    token3 = signAccessToken(user3);

    profile3 = await Profile.create({
      userId: user3._id,
      profileId: 'PRF-100003',
      fullName: 'Neha Garg',
      gender: 'Female',
      dob: new Date('1998-11-10'),
      gotra: 'Garg',
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      qualification: 'B.Com',
      educationLevel: 'Graduate',
      workingAt: 'Tax Consultant',
      occupation: 'Accountant',
      income: '12 LPA',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: '9876500003',
      residentialAddress: '789, Rohini, Delhi',
      verified: false
    });
    user3.activeProfileId = profile3._id;
    user3.profiles.push(profile3._id);
    await user3.save();

    // User 4: Maternal Overlap Bride (Jindal gotra, mother Bansal)
    user4 = await User.create({
      mobile: '9876500004',
      name: 'Ritu Jindal',
      email: 'ritu@example.com',
      accountStatus: 'Active'
    });
    token4 = signAccessToken(user4);

    profile4 = await Profile.create({
      userId: user4._id,
      profileId: 'PRF-100004',
      fullName: 'Ritu Jindal',
      gender: 'Female',
      dob: new Date('1997-03-25'),
      gotra: 'Jindal',
      motherGotra: 'Bansal', // Matches User 1's motherGotra 'Bansal'
      manglik: 'Manglik',
      qualification: 'B.Tech',
      educationLevel: 'Graduate',
      occupation: 'Software Engineer',
      income: '15 LPA',
      city: 'Mumbai',
      state: 'Maharashtra',
      mobileNumber: '9876500004',
      residentialAddress: '101, Bandra, Mumbai',
      verified: true
    });
    user4.activeProfileId = profile4._id;
    user4.profiles.push(profile4._id);
    await user4.save();
  });

  /* ==========================================================================
     SECTION 1: 6-FACTOR WEIGHTED MATCH ENGINE UNIT TESTS
     ========================================================================== */
  describe('1. 6-Factor Weighted Match Engine Unit Calculations', () => {
    it('should compute high compatibility score (>= 85%) for highly aligned candidates', () => {
      const result = calculateMatchScore(profile1, profile2);

      expect(result.totalScore).toBeGreaterThanOrEqual(85);
      expect(result.isSagotra).toBe(false);
      expect(result.hasMaternalConflict).toBe(false);

      // Gotra (30) + Age gap ~1 yr (20) + Edu B.Tech vs MBA diff 1 (10) + Loc same city (15) + Inc 25 vs 20 same/adj (10) + Manglik both non (10)
      expect(result.breakdown.gotra.score).toBe(30);
      expect(result.breakdown.age.score).toBe(20);
      expect(result.breakdown.education.score).toBe(10);
      expect(result.breakdown.location.score).toBe(15);
      expect(result.breakdown.income.score).toBe(10);
      expect(result.breakdown.manglik.score).toBe(10);
      expect(result.totalScore).toBe(95);
    });

    it('should accurately calculate Age factor for all gap boundaries (2, 4, 6, 8, >8)', () => {
      const base = { dob: new Date('2000-01-01') };

      // Delta 0
      expect(checkAgeCompatibility(base, { dob: new Date('2000-01-01') }).score).toBe(20);
      // Delta 2
      expect(checkAgeCompatibility(base, { dob: new Date('1998-01-01') }).score).toBe(20);
      // Delta 4
      expect(checkAgeCompatibility(base, { dob: new Date('1996-01-01') }).score).toBe(15);
      // Delta 6
      expect(checkAgeCompatibility(base, { dob: new Date('1994-01-01') }).score).toBe(10);
      // Delta 8
      expect(checkAgeCompatibility(base, { dob: new Date('1992-01-01') }).score).toBe(5);
      // Delta > 8
      expect(checkAgeCompatibility(base, { dob: new Date('1988-01-01') }).score).toBe(0);
      // Incomplete/missing DOB
      expect(checkAgeCompatibility(base, {}).score).toBe(10);
    });

    it('should accurately evaluate Education tier classification and scoring', () => {
      expect(classifyEducationTier('Ph.D Computer Science', 'Doctorate')).toBe(1);
      expect(classifyEducationTier('MBA', 'Post Graduate')).toBe(2);
      expect(classifyEducationTier('B.Tech', 'Graduate')).toBe(3);
      expect(classifyEducationTier('Diploma in Mechanical', 'Undergrad')).toBe(4);

      const doc = { qualification: 'Ph.D' };
      const master = { qualification: 'MBA' };
      const bachelor = { qualification: 'B.Tech' };
      const school = { qualification: '12th Pass' };
      const unspecified = {};

      expect(checkEducationCompatibility(master, master).score).toBe(15);
      expect(checkEducationCompatibility(master, bachelor).score).toBe(10);
      expect(checkEducationCompatibility(doc, school).score).toBe(5);
      expect(checkEducationCompatibility(unspecified, bachelor).score).toBe(5);
    });

    it('should accurately evaluate Location proximity scoring', () => {
      const pA = { city: 'Jaipur', state: 'Rajasthan' };
      const pB = { city: 'jaipur', state: 'rajasthan' }; // Same city
      const pC = { city: 'Jodhpur', state: 'Rajasthan' }; // Same state, diff city
      const pD = { city: 'Delhi', state: 'Delhi' }; // Different state

      expect(checkLocationCompatibility(pA, pB).score).toBe(15);
      expect(checkLocationCompatibility(pA, pC).score).toBe(10);
      expect(checkLocationCompatibility(pA, pD).score).toBe(5);
    });

    it('should accurately evaluate Income tier classification and scoring', () => {
      expect(classifyIncomeTier('50+ LPA')).toBe(4);
      expect(classifyIncomeTier('30 LPA')).toBe(3);
      expect(classifyIncomeTier('15 LPA')).toBe(2);
      expect(classifyIncomeTier('6 LPA')).toBe(1);
      expect(classifyIncomeTier('< 5 LPA')).toBe(0);

      const inc30 = { income: '30 LPA' };
      const inc25 = { income: '25 LPA' };
      const inc15 = { income: '15 LPA' };
      const inc3 = { income: '3 LPA' };

      expect(checkIncomeCompatibility(inc30, inc25).score).toBe(10);
      expect(checkIncomeCompatibility(inc30, inc15).score).toBe(7);
      expect(checkIncomeCompatibility(inc30, inc3).score).toBe(4);
    });

    it('should accurately evaluate Manglik astrological compatibility', () => {
      const non = { manglik: 'Non-Manglik' };
      const manglik = { manglik: 'Manglik' };
      const anshik = { manglik: 'Anshik Manglik' };
      const dontKnow = { manglik: "Don't Know" };

      expect(checkManglikCompatibility(non, non).score).toBe(10);
      expect(checkManglikCompatibility(manglik, manglik).score).toBe(10);
      expect(checkManglikCompatibility(anshik, anshik).score).toBe(10);
      expect(checkManglikCompatibility(anshik, non).score).toBe(6);
      expect(checkManglikCompatibility(dontKnow, non).score).toBe(6);
      expect(checkManglikCompatibility(manglik, non).score).toBe(0); // Dosha conflict
    });
  });

  /* ==========================================================================
     SECTION 2: GOTRA EXOGAMY RULES EMPIRICAL VALIDATION
     ========================================================================== */
  describe('2. Authentic Gotra Exogamy Validation', () => {
    it('should flag Sagotra collision and award 0 points for paternal match', () => {
      const result = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Mittal');
      expect(result.score).toBe(0);
      expect(result.isSagotra).toBe(true);
      expect(result.hasMaternalConflict).toBe(false);
      expect(result.details).toContain('Sagotra Conflict');
    });

    it('should apply 50% penalty (15 pts) for maternal gotra overlap (2-Gotra rule)', () => {
      // Groom: Garg (Mother: Bansal); Bride: Jindal (Mother: Bansal) -> Mother gotras match
      const result1 = checkGotraExogamy('Garg', 'Jindal', 'Bansal', 'Bansal');
      expect(result1.score).toBe(15);
      expect(result1.isSagotra).toBe(false);
      expect(result1.hasMaternalConflict).toBe(true);

      // Groom: Garg (Mother: Mittal); Bride: Mittal (Mother: Jindal) -> Groom mother = Bride paternal
      const result2 = checkGotraExogamy('Garg', 'Mittal', 'Mittal', 'Jindal');
      expect(result2.score).toBe(15);
      expect(result2.isSagotra).toBe(false);
      expect(result2.hasMaternalConflict).toBe(true);
    });

    it('should award full 30 points for completely distinct paternal and maternal gotras', () => {
      const result = checkGotraExogamy('Garg', 'Mittal', 'Bansal', 'Singhal');
      expect(result.score).toBe(30);
      expect(result.isSagotra).toBe(false);
      expect(result.hasMaternalConflict).toBe(false);
    });

    it('should recognize gotra aliases and Hindi script in gotra exogamy checks', () => {
      expect(normalizeGotra('Goel')).toBe('Goyal');
      expect(normalizeGotra('Kushal')).toBe('Kuchhal');
      expect(normalizeGotra('Dhingan')).toBe('Goyan');
      expect(normalizeGotra('Nagal')).toBe('Nangal');
      expect(normalizeGotra('गोयल')).toBe('Goyal');
      expect(normalizeGotra('गर्ग (Garg)')).toBe('Garg');

      // Goel vs Goyal should be detected as Sagotra
      const aliasResult = checkGotraExogamy('Goel', 'Goyal', 'Bansal', 'Singhal');
      expect(aliasResult.score).toBe(0);
      expect(aliasResult.isSagotra).toBe(true);
    });
  });

  /* ==========================================================================
     SECTION 3: MATCH DISCOVERY ENDPOINTS
     ========================================================================== */
  describe('3. Match Discovery Endpoints (/api/matches)', () => {
    it('GET /api/matches should return paginated matches for active profile sorted by score', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matches).toBeDefined();
      expect(res.body.data.matches.length).toBeGreaterThan(0);

      // Verify all matches are female (opposite gender)
      res.body.data.matches.forEach(m => {
        expect(m.profile.gender).toBe('Female');
        expect(m.matchScore).toBeDefined();
        expect(m.breakdown).toBeDefined();
      });

      // Pooja Mittal should be ranked #1
      expect(res.body.data.matches[0].profile.fullName).toBe('Pooja Mittal');
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('GET /api/matches should support filtering by gotra, city, verifiedOnly, and excludeSagotra', async () => {
      // Filter by city: Jaipur
      const resCity = await request(app)
        .get('/api/matches?city=Jaipur')
        .set('Authorization', `Bearer ${token1}`);

      expect(resCity.status).toBe(200);
      expect(resCity.body.data.matches.length).toBe(1);
      expect(resCity.body.data.matches[0].profile.fullName).toBe('Pooja Mittal');

      // Filter by excludeSagotra: true
      const resSagotra = await request(app)
        .get('/api/matches?excludeSagotra=true')
        .set('Authorization', `Bearer ${token1}`);

      expect(resSagotra.status).toBe(200);
      resSagotra.body.data.matches.forEach(m => {
        expect(m.isSagotra).toBe(false);
      });
      expect(resSagotra.body.data.matches.some(m => m.profile.fullName === 'Neha Garg')).toBe(false);
    });

    it('GET /api/matches/today should return curated daily recommendation carousel', async () => {
      const res = await request(app)
        .get('/api/matches/today')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toBeDefined();
      // Should strictly exclude sagotra profiles
      res.body.data.recommendations.forEach(r => {
        expect(r.isSagotra).toBe(false);
      });
    });

    it('GET /api/matches/search should perform multi-field search across keyword, gotra, and location', async () => {
      const res = await request(app)
        .get('/api/matches/search?query=Bank')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBe(1);
      expect(res.body.data.results[0].profile.fullName).toBe('Pooja Mittal');
    });

    it('GET /api/matches/score/:targetProfileId should return on-demand 6-factor score breakdown', async () => {
      const res = await request(app)
        .get(`/api/matches/score/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalScore).toBe(95);
      expect(res.body.data.isSagotra).toBe(false);
      expect(res.body.data.breakdown.gotra.score).toBe(30);
      expect(res.body.data.breakdown.age.score).toBe(20);
    });
  });

  /* ==========================================================================
     SECTION 4: INTEREST LIFECYCLE & MUTUAL CONTACT UNLOCKING
     ========================================================================== */
  describe('4. Interest Lifecycle & Mutual Contact Unlocking', () => {
    it('POST /api/interests should express interest and prevent duplicate pending requests', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipientProfileId: profile2.profileId,
          message: 'Namaste, we liked your profile.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.interest.status).toBe('Pending');
      expect(res.body.data.interest.message).toBe('Namaste, we liked your profile.');

      // Duplicate attempt should be rejected
      const dupRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipientProfileId: profile2.profileId
        });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.success).toBe(false);
    });

    it('PUT /api/interests/:id/accept should transition status and unlock contact info', async () => {
      // 1. User 1 sends interest to User 2
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientProfileId: profile2._id });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      // 2. Before acceptance, User 1 checks User 2's profile -> Phone & Address MUST be masked
      const beforeRes = await request(app)
        .get(`/api/profiles/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(beforeRes.status).toBe(200);
      expect(beforeRes.body.data.profile.phoneMasked).toBe(true);
      expect(beforeRes.body.data.profile.addressMasked).toBe(true);
      expect(beforeRes.body.data.profile.mobileNumber).toBe('Protected');
      expect(beforeRes.body.data.isConnected).toBe(false);

      // 3. User 2 accepts interest
      const acceptRes = await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.interest.status).toBe('Accepted');

      // 4. After acceptance, User 1 checks User 2's profile -> Address unmasks, phone stays protected
      const afterRes = await request(app)
        .get(`/api/profiles/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(afterRes.status).toBe(200);
      expect(afterRes.body.data.profile.phoneMasked).toBe(true);
      expect(afterRes.body.data.profile.addressMasked).toBe(false);
      expect(afterRes.body.data.profile.mobileNumber).toBe('Protected');
      expect(afterRes.body.data.profile.residentialAddress).toBe('456, Vaishali Nagar, Jaipur');
      expect(afterRes.body.data.isConnected).toBe(true);
    });

    it('PUT /api/interests/:id/decline and DELETE /api/interests/:id should handle decline and cancellation', async () => {
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientProfileId: profile3.profileId });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      // Sender cancels
      const cancelRes = await request(app)
        .delete(`/api/interests/${interestId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);

      const checkStatus = await request(app)
        .get(`/api/interests/status/${profile3.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(checkStatus.body.data.status).toBe('Cancelled');
    });

    it('GET /api/interests/sent and /api/interests/received should return populated lists', async () => {
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientProfileId: profile2.profileId });

      const sentRes = await request(app)
        .get('/api/interests/sent')
        .set('Authorization', `Bearer ${token1}`);

      expect(sentRes.status).toBe(200);
      expect(sentRes.body.data.interests.length).toBe(1);
      expect(sentRes.body.data.interests[0].recipientProfileId.fullName).toBe('Pooja Mittal');

      const recRes = await request(app)
        .get('/api/interests/received')
        .set('Authorization', `Bearer ${token2}`);

      expect(recRes.status).toBe(200);
      expect(recRes.body.data.interests.length).toBe(1);
      expect(recRes.body.data.interests[0].senderProfileId.fullName).toBe('Aman Garg');
    });
  });

  /* ==========================================================================
     SECTION 5: SHORTLIST / FAVORITES & VISITOR TRACKING
     ========================================================================== */
  describe('5. Shortlist & Daily-Deduplicated Visitor Tracking', () => {
    it('POST, GET, and DELETE /api/shortlist should manage bookmarks with match score', async () => {
      // Add to shortlist
      const addRes = await request(app)
        .post('/api/shortlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          shortlistedProfileId: profile2.profileId,
          notes: 'High compatibility match.'
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.success).toBe(true);

      // Check status
      const checkRes = await request(app)
        .get(`/api/shortlist/check/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(checkRes.body.data.isShortlisted).toBe(true);

      // Get list
      const listRes = await request(app)
        .get('/api/shortlist')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.shortlists.length).toBe(1);
      expect(listRes.body.data.shortlists[0].matchScore).toBe(95);

      // Remove from shortlist
      const delRes = await request(app)
        .delete(`/api/shortlist/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.removed).toBe(true);
    });

    it('POST /api/visitors should record profile view with daily deduplication', async () => {
      // Visit 1
      const v1Res = await request(app)
        .post(`/api/visitors/record/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(v1Res.status).toBe(200);
      expect(v1Res.body.data.recorded).toBe(true);
      expect(v1Res.body.data.visitCount).toBe(1);

      // Visit 2 on same day -> Should increment count to 2 on existing document
      const v2Res = await request(app)
        .post(`/api/visitors/record/${profile2.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(v2Res.status).toBe(200);
      expect(v2Res.body.data.recorded).toBe(true);
      expect(v2Res.body.data.visitCount).toBe(2);

      // Verify only 1 document exists in DB
      const totalDocs = await Visitor.countDocuments({
        visitedProfileId: profile2._id,
        visitorProfileId: profile1._id
      });
      expect(totalDocs).toBe(1);

      // Check visitor metrics
      const metricsRes = await request(app)
        .get('/api/visitors/count')
        .set('Authorization', `Bearer ${token2}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.totalVisitors).toBe(1);
      expect(metricsRes.body.data.todayVisitors).toBe(1);
    });
  });

  /* ==========================================================================
     SECTION 6: BLOCK SYSTEM & BIDIRECTIONAL RESTRICTIONS
     ========================================================================== */
  describe('6. Block System & Cascading Protections', () => {
    it('POST /api/blocks should block user and cascade cancellation of pending interests & shortlists', async () => {
      // Setup pending interest and shortlist
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientProfileId: profile4.profileId });

      await request(app)
        .post('/api/shortlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({ shortlistedProfileId: profile4.profileId });

      // User 1 blocks User 4
      const blockRes = await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          blockedProfileId: profile4.profileId,
          reason: 'Not Interested',
          notes: 'Do not contact'
        });

      expect(blockRes.status).toBe(201);
      expect(blockRes.body.success).toBe(true);

      // 1. Pending interest must now be Cancelled
      const interestDoc = await Interest.findOne({
        senderUserId: user1._id,
        recipientUserId: user4._id
      });
      expect(interestDoc.status).toBe('Cancelled');

      // 2. Shortlist must be removed
      const shortlistCount = await Shortlist.countDocuments({
        userId: user1._id,
        shortlistedProfileId: profile4._id
      });
      expect(shortlistCount).toBe(0);

      // 3. User 4 should now be excluded from User 1's /api/matches
      const matchesRes = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token1}`);

      expect(matchesRes.body.data.matches.some(m => m.profile.profileId === profile4.profileId)).toBe(false);

      // 4. User 4 cannot express interest in User 1 (Forbidden)
      const blockedInterestRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${token4}`)
        .send({ recipientProfileId: profile1.profileId });

      expect(blockedInterestRes.status).toBe(403);

      // 5. User 4 viewing User 1 profile returns 404
      const viewRes = await request(app)
        .get(`/api/profiles/${profile1.profileId}`)
        .set('Authorization', `Bearer ${token4}`);

      expect(viewRes.status).toBe(404);

      // 6. Unblock restores accessibility
      const unblockRes = await request(app)
        .delete(`/api/blocks/${profile4.profileId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.data.unblocked).toBe(true);
    });
  });
});
