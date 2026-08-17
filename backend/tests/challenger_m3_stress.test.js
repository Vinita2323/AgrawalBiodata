/**
 * Milestone 3 Challenger Adversarial, Stress & Boundary Test Suite
 * Discovery, 6-Factor Scoring Engine, Multi-Field Search & Social APIs
 * 
 * Agrawal Matrimony Platform
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
  classifyIncomeTier,
  calculateAge
} = require('../services/matchEngine');
const { normalizeGotra, checkGotraExogamy } = require('../utils/gotras');

describe('Milestone 3 Challenger Empirical Stress & Boundary Test Suite', () => {
  let userGroom, userBrideCompat, userBrideSagotra, userBrideMaternal, userBrideBlocked, userBrideOther;
  let tokenGroom, tokenBrideCompat, tokenBrideSagotra, tokenBrideMaternal, tokenBrideBlocked, tokenBrideOther;
  let profileGroom, profileBrideCompat, profileBrideSagotra, profileBrideMaternal, profileBrideBlocked, profileBrideOther;

  beforeEach(async () => {
    // 1. Groom: Aman Garg (28, B.Tech, Jaipur, Rajasthan, 25 LPA, Non-Manglik, Garg / Bansal)
    userGroom = await User.create({
      mobile: '9800000001',
      name: 'Aman Garg',
      email: 'aman.groom@test.com',
      accountStatus: 'Active'
    });
    tokenGroom = signAccessToken(userGroom);

    profileGroom = await Profile.create({
      userId: userGroom._id,
      profileId: 'PRF-M3-001',
      fullName: 'Aman Garg',
      gender: 'Male',
      dob: new Date('1998-01-15'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech in Computer Science',
      educationLevel: 'Graduate',
      workingAt: 'Google',
      occupation: 'Software Engineer',
      income: '25 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '9800000001',
      residentialAddress: '10, Malviya Nagar, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    userGroom.activeProfileId = profileGroom._id;
    userGroom.profiles.push(profileGroom._id);
    await userGroom.save();

    // 2. Bride 1 (High Compatibility): Pooja Mittal (27, MBA, Jaipur, Rajasthan, 20 LPA, Non-Manglik, Mittal / Singhal)
    userBrideCompat = await User.create({
      mobile: '9800000002',
      name: 'Pooja Mittal',
      email: 'pooja.compat@test.com',
      accountStatus: 'Active'
    });
    tokenBrideCompat = signAccessToken(userBrideCompat);

    profileBrideCompat = await Profile.create({
      userId: userBrideCompat._id,
      profileId: 'PRF-M3-002',
      fullName: 'Pooja Mittal',
      gender: 'Female',
      dob: new Date('1999-05-20'),
      gotra: 'Mittal',
      motherGotra: 'Singhal',
      manglik: 'Non-Manglik',
      qualification: 'MBA in Finance',
      educationLevel: 'Post Graduate',
      workingAt: 'HDFC Bank',
      occupation: 'Investment Banker',
      income: '20 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '9800000002',
      residentialAddress: '20, C-Scheme, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    userBrideCompat.activeProfileId = profileBrideCompat._id;
    userBrideCompat.profiles.push(profileBrideCompat._id);
    await userBrideCompat.save();

    // 3. Bride 2 (Sagotra Conflict): Neha Garg (26, B.Com, Delhi, Delhi, 12 LPA, Non-Manglik, Garg / Goyal)
    userBrideSagotra = await User.create({
      mobile: '9800000003',
      name: 'Neha Garg',
      email: 'neha.sagotra@test.com',
      accountStatus: 'Active'
    });
    tokenBrideSagotra = signAccessToken(userBrideSagotra);

    profileBrideSagotra = await Profile.create({
      userId: userBrideSagotra._id,
      profileId: 'PRF-M3-003',
      fullName: 'Neha Garg',
      gender: 'Female',
      dob: new Date('2000-03-10'),
      gotra: 'Garg', // Sagotra paternal conflict with Aman Garg
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      qualification: 'B.Com Honours',
      educationLevel: 'Graduate',
      workingAt: 'PwC',
      occupation: 'Tax Consultant',
      income: '12 LPA',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: '9800000003',
      residentialAddress: '30, Rohini, Delhi',
      verified: false
    });
    userBrideSagotra.activeProfileId = profileBrideSagotra._id;
    userBrideSagotra.profiles.push(profileBrideSagotra._id);
    await userBrideSagotra.save();

    // 4. Bride 3 (Maternal Gotra Overlap): Ritu Jindal (29, B.Tech, Mumbai, Maharashtra, 18 LPA, Manglik, Jindal / Bansal)
    userBrideMaternal = await User.create({
      mobile: '9800000004',
      name: 'Ritu Jindal',
      email: 'ritu.maternal@test.com',
      accountStatus: 'Active'
    });
    tokenBrideMaternal = signAccessToken(userBrideMaternal);

    profileBrideMaternal = await Profile.create({
      userId: userBrideMaternal._id,
      profileId: 'PRF-M3-004',
      fullName: 'Ritu Jindal',
      gender: 'Female',
      dob: new Date('1997-09-12'),
      gotra: 'Jindal',
      motherGotra: 'Bansal', // Mother gotra matches Groom's mother gotra
      manglik: 'Manglik',
      qualification: 'B.Tech IT',
      educationLevel: 'Graduate',
      workingAt: 'TCS',
      occupation: 'Systems Architect',
      income: '18 LPA',
      city: 'Mumbai',
      state: 'Maharashtra',
      mobileNumber: '9800000004',
      residentialAddress: '40, Powai, Mumbai',
      verified: true
    });
    userBrideMaternal.activeProfileId = profileBrideMaternal._id;
    userBrideMaternal.profiles.push(profileBrideMaternal._id);
    await userBrideMaternal.save();

    // 5. Bride 4 (Target for Block Testing): Sneha Goyal (25, MS, Bangalore, Karnataka, 35 LPA, Anshik Manglik, Goyal / Kansal)
    userBrideBlocked = await User.create({
      mobile: '9800000005',
      name: 'Sneha Goyal',
      email: 'sneha.blocked@test.com',
      accountStatus: 'Active'
    });
    tokenBrideBlocked = signAccessToken(userBrideBlocked);

    profileBrideBlocked = await Profile.create({
      userId: userBrideBlocked._id,
      profileId: 'PRF-M3-005',
      fullName: 'Sneha Goyal',
      gender: 'Female',
      dob: new Date('2001-11-22'),
      gotra: 'Goyal',
      motherGotra: 'Kansal',
      manglik: 'Anshik Manglik',
      qualification: 'MS Computer Science',
      educationLevel: 'Post Graduate',
      workingAt: 'Microsoft',
      occupation: 'AI Researcher',
      income: '35 LPA',
      city: 'Bangalore',
      state: 'Karnataka',
      mobileNumber: '9800000005',
      residentialAddress: '50, Indiranagar, Bangalore',
      verified: true
    });
    userBrideBlocked.activeProfileId = profileBrideBlocked._id;
    userBrideBlocked.profiles.push(profileBrideBlocked._id);
    await userBrideBlocked.save();

    // 6. Bride 5 (Edge case: Senior Candidate): Kavita Bansal (38, Ph.D, Jaipur, Rajasthan, 50+ LPA, Non-Manglik, Bansal / Goyan)
    userBrideOther = await User.create({
      mobile: '9800000006',
      name: 'Kavita Bansal',
      email: 'kavita.other@test.com',
      accountStatus: 'Active'
    });
    tokenBrideOther = signAccessToken(userBrideOther);

    profileBrideOther = await Profile.create({
      userId: userBrideOther._id,
      profileId: 'PRF-M3-006',
      fullName: 'Kavita Bansal',
      gender: 'Female',
      dob: new Date('1988-02-14'), // Age 38 (>8 yr diff from Aman 28)
      gotra: 'Bansal', // Paternal is Bansal, Groom's mother is Bansal -> Maternal conflict
      motherGotra: 'Goyan',
      manglik: 'Non-Manglik',
      qualification: 'Ph.D in Economics',
      educationLevel: 'Doctorate',
      workingAt: 'Rajasthan University',
      occupation: 'Professor',
      income: '50+ LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '9800000006',
      residentialAddress: '60, Tonk Road, Jaipur',
      verified: true
    });
    userBrideOther.activeProfileId = profileBrideOther._id;
    userBrideOther.profiles.push(profileBrideOther._id);
    await userBrideOther.save();
  });

  /* ==========================================================================
     TEST SUITE 1: GOTRA EXOGAMY & COMPATIBILITY CALCULATION BOUNDARIES
     ========================================================================== */
  describe('1. Gotra Exogamy & 6-Factor Compatibility Engine Stress Tests', () => {
    it('should correctly identify all 4 gotra cross-over overlap permutations', () => {
      // 1. Paternal vs Paternal: Garg vs Garg -> Sagotra (0 pts, isSagotra: true)
      const paternalPaternal = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Singhal');
      expect(paternalPaternal.score).toBe(0);
      expect(paternalPaternal.isSagotra).toBe(true);
      expect(paternalPaternal.hasMaternalConflict).toBe(false);

      // 2. Maternal vs Maternal: Groom Mother Bansal == Bride Mother Bansal -> 50% penalty (15 pts)
      const maternalMaternal = checkGotraExogamy('Garg', 'Mittal', 'Bansal', 'Bansal');
      expect(maternalMaternal.score).toBe(15);
      expect(maternalMaternal.isSagotra).toBe(false);
      expect(maternalMaternal.hasMaternalConflict).toBe(true);

      // 3. Groom Mother vs Bride Father: Groom Mother Bansal == Bride Father Bansal -> 50% penalty (15 pts)
      const maternalPaternal = checkGotraExogamy('Garg', 'Bansal', 'Bansal', 'Singhal');
      expect(maternalPaternal.score).toBe(15);
      expect(maternalPaternal.isSagotra).toBe(false);
      expect(maternalPaternal.hasMaternalConflict).toBe(true);

      // 4. Groom Father vs Bride Mother: Groom Father Garg == Bride Mother Garg -> 50% penalty (15 pts)
      const paternalMaternal = checkGotraExogamy('Garg', 'Mittal', 'Bansal', 'Garg');
      expect(paternalMaternal.score).toBe(15);
      expect(paternalMaternal.isSagotra).toBe(false);
      expect(paternalMaternal.hasMaternalConflict).toBe(true);

      // 5. Distinct 4 gotras: Garg, Mittal, Bansal, Singhal -> 30 pts
      const distinct = checkGotraExogamy('Garg', 'Mittal', 'Bansal', 'Singhal');
      expect(distinct.score).toBe(30);
      expect(distinct.isSagotra).toBe(false);
      expect(distinct.hasMaternalConflict).toBe(false);
    });

    it('should handle gotra aliases, bilingual strings, and whitespace in exogamy checks', () => {
      // Bilingual "गर्ग (Garg)" and "गोयल (Goyal)"
      expect(normalizeGotra('  गर्ग (Garg)  ')).toBe('Garg');
      expect(normalizeGotra('Goyal (गोयल)')).toBe('Goyal');
      expect(normalizeGotra('Goel')).toBe('Goyal');
      expect(normalizeGotra('Kushal')).toBe('Kuchhal');
      expect(normalizeGotra('Dhingan')).toBe('Goyan');
      expect(normalizeGotra('Nagal')).toBe('Nangal');
      expect(normalizeGotra('UnknownGotraXYZ')).toBe(null);

      // Exogamy between Goel and Goyal -> Sagotra
      const aliasSagotra = checkGotraExogamy('Goel', 'Goyal', 'Bansal', 'Mittal');
      expect(aliasSagotra.isSagotra).toBe(true);
      expect(aliasSagotra.score).toBe(0);
    });

    it('should calculate extreme age gap boundary values (0, 2, 4, 6, 8, 10, null, invalid date)', () => {
      const p1 = { dob: new Date('1998-01-01') }; // age 28 in 2026

      // Gap 0 (1998)
      expect(checkAgeCompatibility(p1, { dob: new Date('1998-01-01') }).score).toBe(20);
      // Gap 2 (2000)
      expect(checkAgeCompatibility(p1, { dob: new Date('2000-01-01') }).score).toBe(20);
      // Gap 4 (2002)
      expect(checkAgeCompatibility(p1, { dob: new Date('2002-01-01') }).score).toBe(15);
      // Gap 6 (2004)
      expect(checkAgeCompatibility(p1, { dob: new Date('2004-01-01') }).score).toBe(10);
      // Gap 8 (2006)
      expect(checkAgeCompatibility(p1, { dob: new Date('2006-01-01') }).score).toBe(5);
      // Gap 10 (2008)
      expect(checkAgeCompatibility(p1, { dob: new Date('2008-01-01') }).score).toBe(0);
      // Missing DOB -> fallback 10 pts
      expect(checkAgeCompatibility(p1, {}).score).toBe(10);
      expect(checkAgeCompatibility({}, {}).score).toBe(10);
      // Invalid Date string -> fallback 10 pts
      expect(checkAgeCompatibility(p1, { dob: 'invalid-date' }).score).toBe(10);
    });

    it('should evaluate full score breakdown for senior / diverse candidate', () => {
      const scoreRes = calculateMatchScore(profileGroom, profileBrideOther);
      // Age gap: 28 vs 38 = 10 yrs diff -> Age score = 0 pts
      // Gotra: Garg vs Bansal (Mother Bansal) -> 15 pts (Maternal conflict)
      // Education: B.Tech (Tier 3) vs Ph.D (Tier 1) -> 5 pts
      // Location: Jaipur vs Jaipur -> 15 pts
      // Income: 25 LPA (Tier 3) vs 50+ LPA (Tier 4) -> 7 pts (adjacent)
      // Manglik: Both Non-Manglik -> 10 pts
      // Total = 15 + 0 + 5 + 15 + 7 + 10 = 52
      expect(scoreRes.breakdown.age.score).toBe(0);
      expect(scoreRes.breakdown.gotra.score).toBe(15);
      expect(scoreRes.breakdown.education.score).toBe(5);
      expect(scoreRes.breakdown.location.score).toBe(15);
      expect(scoreRes.breakdown.income.score).toBe(7);
      expect(scoreRes.breakdown.manglik.score).toBe(10);
      expect(scoreRes.totalScore).toBe(52);
    });
  });

  /* ==========================================================================
     TEST SUITE 2: GET /api/matches QUERY FILTERS & PERMUTATIONS
     ========================================================================== */
  describe('2. GET /api/matches Filter Matrix & Boundary Tests', () => {
    it('should return all opposite gender non-blocked candidate profiles by default', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matches.length).toBe(5); // 5 female candidates
      res.body.data.matches.forEach(m => {
        expect(m.profile.gender).toBe('Female');
        expect(m.matchScore).toBeDefined();
      });
      // Sorted by score descending: Pooja Mittal (95) should be rank 1
      expect(res.body.data.matches[0].profile.profileId).toBe('PRF-M3-002');
    });

    it('should filter strictly by gotra and canonical normalized aliases', async () => {
      // Filter by gotra=Mittal
      const resMittal = await request(app)
        .get('/api/matches?gotra=Mittal')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resMittal.status).toBe(200);
      expect(resMittal.body.data.matches.length).toBe(1);
      expect(resMittal.body.data.matches[0].profile.gotra).toBe('Mittal');

      // Filter by alias gotra=Goel (should match Goyal)
      const resGoel = await request(app)
        .get('/api/matches?gotra=Goel')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resGoel.status).toBe(200);
      expect(resGoel.body.data.matches.length).toBe(1);
      expect(resGoel.body.data.matches[0].profile.gotra).toBe('Goyal');
    });

    it('should filter strictly by excludeSagotra=true', async () => {
      const res = await request(app)
        .get('/api/matches?excludeSagotra=true')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.matches.length).toBe(4); // 5 - 1 Sagotra (Neha Garg excluded)
      res.body.data.matches.forEach(m => {
        expect(m.isSagotra).toBe(false);
        expect(m.profile.gotra).not.toBe('Garg');
      });
    });

    it('should filter by age range boundaries (minAge, maxAge)', async () => {
      // Range: 26 to 28 (Pooja Mittal age 27, Neha Garg age 26, Ritu Jindal age 29)
      const res = await request(app)
        .get('/api/matches?minAge=26&maxAge=28')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.matches.length).toBeGreaterThanOrEqual(1);
      res.body.data.matches.forEach(m => {
        expect(m.age).toBeGreaterThanOrEqual(26);
        expect(m.age).toBeLessThanOrEqual(28);
      });

      // Inverted age range (minAge > maxAge) -> should safely return 0 matches without crashing
      const resInverted = await request(app)
        .get('/api/matches?minAge=35&maxAge=20')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resInverted.status).toBe(200);
      expect(resInverted.body.data.matches.length).toBe(0);
    });

    it('should filter by verifiedOnly=true', async () => {
      const res = await request(app)
        .get('/api/matches?verifiedOnly=true')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      // Neha Garg is verified: false, so should be excluded
      expect(res.body.data.matches.length).toBe(4);
      res.body.data.matches.forEach(m => {
        expect(m.profile.verified).toBe(true);
      });
    });

    it('should filter by manglik status', async () => {
      const resManglik = await request(app)
        .get('/api/matches?manglik=Manglik')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resManglik.status).toBe(200);
      expect(resManglik.body.data.matches.length).toBe(1);
      expect(resManglik.body.data.matches[0].profile.fullName).toBe('Ritu Jindal');

      const resAnshik = await request(app)
        .get('/api/matches?manglik=Anshik Manglik')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resAnshik.status).toBe(200);
      expect(resAnshik.body.data.matches.length).toBe(1);
      expect(resAnshik.body.data.matches[0].profile.fullName).toBe('Sneha Goyal');
    });

    it('should filter by minScore threshold', async () => {
      // minScore = 90
      const res90 = await request(app)
        .get('/api/matches?minScore=90')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res90.status).toBe(200);
      expect(res90.body.data.matches.length).toBe(1);
      expect(res90.body.data.matches[0].matchScore).toBeGreaterThanOrEqual(90);

      // minScore = 100
      const res100 = await request(app)
        .get('/api/matches?minScore=100')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res100.status).toBe(200);
      expect(res100.body.data.matches.length).toBe(0);
    });

    it('should support sorting by score, recent, and age', async () => {
      // Sort by age (ascending: youngest first)
      const resAge = await request(app)
        .get('/api/matches?sort=age')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resAge.status).toBe(200);
      const ages = resAge.body.data.matches.map(m => m.age);
      for (let i = 0; i < ages.length - 1; i++) {
        expect(ages[i]).toBeLessThanOrEqual(ages[i + 1]);
      }

      // Sort by recent (createdAt descending)
      const resRecent = await request(app)
        .get('/api/matches?sort=recent')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resRecent.status).toBe(200);
      const dates = resRecent.body.data.matches.map(m => new Date(m.profile.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should handle complex multi-filter combinations simultaneously', async () => {
      const res = await request(app)
        .get('/api/matches?city=Jaipur&gotra=Mittal&verifiedOnly=true&excludeSagotra=true&minScore=80&manglik=Non-Manglik')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.matches.length).toBe(1);
      expect(res.body.data.matches[0].profile.fullName).toBe('Pooja Mittal');
      expect(res.body.data.matches[0].profile.city).toBe('Jaipur');
      expect(res.body.data.matches[0].matchScore).toBeGreaterThanOrEqual(80);
    });
  });

  /* ==========================================================================
     TEST SUITE 3: PAGINATION BOUNDARY & STRESS CONDITIONS
     ========================================================================== */
  describe('3. Pagination Extremes & Boundary Stress Conditions', () => {
    it('should accurately paginate with page=1, limit=2 and page=2, limit=2', async () => {
      // Page 1
      const resP1 = await request(app)
        .get('/api/matches?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resP1.status).toBe(200);
      expect(resP1.body.data.matches.length).toBe(2);
      expect(resP1.body.data.pagination.page).toBe(1);
      expect(resP1.body.data.pagination.limit).toBe(2);
      expect(resP1.body.data.pagination.total).toBe(5);
      expect(resP1.body.data.pagination.totalPages).toBe(3);

      const firstPageIds = resP1.body.data.matches.map(m => m.profile.profileId);

      // Page 2
      const resP2 = await request(app)
        .get('/api/matches?page=2&limit=2')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resP2.status).toBe(200);
      expect(resP2.body.data.matches.length).toBe(2);
      expect(resP2.body.data.pagination.page).toBe(2);

      const secondPageIds = resP2.body.data.matches.map(m => m.profile.profileId);

      // Guarantee no overlap between pages
      firstPageIds.forEach(id => {
        expect(secondPageIds).not.toContain(id);
      });
    });

    it('should return empty matches array when page exceeds totalPages (e.g. page=999)', async () => {
      const res = await request(app)
        .get('/api/matches?page=999&limit=10')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.matches).toEqual([]);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.page).toBe(999);
    });

    it('should safely clamp negative or invalid page and limit values', async () => {
      const res = await request(app)
        .get('/api/matches?page=-5&limit=-10')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });

    it('should safely handle non-numeric page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/matches?page=invalid&limit=nonsense')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  /* ==========================================================================
     TEST SUITE 4: GET /api/matches/today RECOMMENDATIONS CAROUSEL
     ========================================================================== */
  describe('4. GET /api/matches/today Recommendations Carousel Tests', () => {
    it('should return curated recommendations strictly excluding sagotra candidates', async () => {
      const res = await request(app)
        .get('/api/matches/today')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      res.body.data.recommendations.forEach(r => {
        expect(r.isSagotra).toBe(false);
        expect(r.profile.gotra).not.toBe('Garg');
      });
    });

    it('should respect custom limit parameter in /api/matches/today', async () => {
      const res = await request(app)
        .get('/api/matches/today?limit=2')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBe(2);
      expect(res.body.data.count).toBe(2);
    });

    it('should reject request with 400 if user has no active candidate profile', async () => {
      const emptyUser = await User.create({
        mobile: '9800000099',
        name: 'Empty Profile User',
        accountStatus: 'Active'
      });
      const emptyToken = signAccessToken(emptyUser);

      const res = await request(app)
        .get('/api/matches/today')
        .set('Authorization', `Bearer ${emptyToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NO_ACTIVE_PROFILE');
    });
  });

  /* ==========================================================================
     TEST SUITE 5: GET /api/matches/search MULTI-FIELD & PRIVACY GUARANTEES
     ========================================================================== */
  describe('5. GET /api/matches/search Multi-Field & Privacy Guarantees', () => {
    it('should search by keyword across fullName, occupation, city, and profileId', async () => {
      // By occupation keyword: Banker
      const resOcc = await request(app)
        .get('/api/matches/search?query=Banker')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resOcc.status).toBe(200);
      expect(resOcc.body.data.results.length).toBe(1);
      expect(resOcc.body.data.results[0].profile.fullName).toBe('Pooja Mittal');

      // By exact Profile ID: PRF-M3-004
      const resId = await request(app)
        .get('/api/matches/search?query=PRF-M3-004')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resId.status).toBe(200);
      expect(resId.body.data.results.length).toBe(1);
      expect(resId.body.data.results[0].profile.fullName).toBe('Ritu Jindal');

      // By city keyword: Mumbai
      const resCity = await request(app)
        .get('/api/matches/search?query=Mumbai')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resCity.status).toBe(200);
      expect(resCity.body.data.results.length).toBe(1);
      expect(resCity.body.data.results[0].profile.fullName).toBe('Ritu Jindal');
    });

    it('STRICT PRIVACY: Blocked candidates must NEVER appear in search results, even with direct name query', async () => {
      // User Groom blocks Sneha Goyal (userBrideBlocked)
      await Block.create({
        blockerUserId: userGroom._id,
        blockerProfileId: profileGroom._id,
        blockedUserId: userBrideBlocked._id,
        blockedProfileId: profileBrideBlocked._id,
        reason: 'Harassment'
      });

      // 1. Groom searches explicitly for "Sneha Goyal"
      const resGroomSearch = await request(app)
        .get('/api/matches/search?query=Sneha')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resGroomSearch.status).toBe(200);
      expect(resGroomSearch.body.data.results.length).toBe(0);

      // 2. Groom requests general search -> Sneha Goyal must NOT be present
      const resAll = await request(app)
        .get('/api/matches/search')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resAll.body.data.results.some(r => r.profile.profileId === profileBrideBlocked.profileId)).toBe(false);

      // 3. Bidirectional protection: Sneha Goyal searches for "Aman Garg" -> Aman must NOT be returned
      const resBrideSearch = await request(app)
        .get('/api/matches/search?query=Aman')
        .set('Authorization', `Bearer ${tokenBrideBlocked}`);

      expect(resBrideSearch.status).toBe(200);
      expect(resBrideSearch.body.data.results.length).toBe(0);

      // 4. Blocked candidate in /api/matches feed must also be strictly excluded
      const resMatches = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resMatches.body.data.matches.some(m => m.profile.profileId === profileBrideBlocked.profileId)).toBe(false);
    });

    it('should search with multiple specific structured criteria (occupation, qualification, city, gotra, manglik)', async () => {
      const res = await request(app)
        .get('/api/matches/search?occupation=Software&city=Mumbai&state=Maharashtra&manglik=Manglik')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBe(1);
      expect(res.body.data.results[0].profile.fullName).toBe('Ritu Jindal');
    });

    it('should handle unauthenticated search query gracefully', async () => {
      const res = await request(app).get('/api/matches/search?query=Pooja');
      expect(res.status).toBe(401);
    });
  });

  /* ==========================================================================
     TEST SUITE 6: GET /api/matches/score/:targetProfileId ON-DEMAND BREAKDOWN
     ========================================================================== */
  describe('6. GET /api/matches/score/:targetProfileId On-Demand Scoring Tests', () => {
    it('should calculate deterministic score breakdown via MongoDB _id and custom profileId', async () => {
      // Via custom profileId
      const resCustom = await request(app)
        .get(`/api/matches/score/${profileBrideCompat.profileId}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resCustom.status).toBe(200);
      expect(resCustom.body.success).toBe(true);
      expect(resCustom.body.data.totalScore).toBe(95);
      expect(resCustom.body.data.isSagotra).toBe(false);
      expect(resCustom.body.data.hasMaternalConflict).toBe(false);

      // Via MongoDB ObjectId
      const resMongo = await request(app)
        .get(`/api/matches/score/${profileBrideCompat._id}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(resMongo.status).toBe(200);
      expect(resMongo.body.data.totalScore).toBe(95);
    });

    it('should return 404 for non-existent target profile ID', async () => {
      const res = await request(app)
        .get('/api/matches/score/PRF-NONEXISTENT-999')
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 NO_ACTIVE_PROFILE if requesting user has no active profile', async () => {
      const noProfileUser = await User.create({
        mobile: '9800000088',
        name: 'No Profile Candidate'
      });
      const noProfileToken = signAccessToken(noProfileUser);

      const res = await request(app)
        .get(`/api/matches/score/${profileBrideCompat.profileId}`)
        .set('Authorization', `Bearer ${noProfileToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_ACTIVE_PROFILE');
    });
  });

  /* ==========================================================================
     TEST SUITE 7: SOCIAL APIS (INTERESTS, SHORTLIST, VISITORS, BLOCKS)
     ========================================================================== */
  describe('7. Social APIs Boundary & Adversarial Tests', () => {
    it('SELF-ACTION REJECTION: should reject self-interest, self-shortlist, self-block, and self-visitor', async () => {
      // Self-interest
      const selfInterestRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenGroom}`)
        .send({ recipientProfileId: profileGroom.profileId });

      expect(selfInterestRes.status).toBe(400);

      // Self-shortlist
      const selfShortlistRes = await request(app)
        .post('/api/shortlist')
        .set('Authorization', `Bearer ${tokenGroom}`)
        .send({ shortlistedProfileId: profileGroom.profileId });

      expect(selfShortlistRes.status).toBe(400);

      // Self-block
      const selfBlockRes = await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenGroom}`)
        .send({ blockedProfileId: profileGroom.profileId });

      expect(selfBlockRes.status).toBe(400);

      // Self-visit
      const selfVisitRes = await request(app)
        .post(`/api/visitors/record/${profileGroom.profileId}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(selfVisitRes.status).toBe(200);
      expect(selfVisitRes.body.data.recorded).toBe(false);
    });

    it('INTEREST PERMISSION BOUNDARIES: Sender cannot accept/decline; Recipient cannot cancel', async () => {
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenGroom}`)
        .send({ recipientProfileId: profileBrideCompat.profileId });

      const interestId = createRes.body.data.interest._id || createRes.body.data.interest.id;

      // Sender (Groom) attempts to Accept own sent interest -> 403 Forbidden
      const unauthorizedAccept = await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(unauthorizedAccept.status).toBe(403);

      // Recipient (Bride) attempts to Cancel Groom's interest -> 403 Forbidden
      const unauthorizedCancel = await request(app)
        .delete(`/api/interests/${interestId}`)
        .set('Authorization', `Bearer ${tokenBrideCompat}`);

      expect(unauthorizedCancel.status).toBe(403);
    });

    it('MUTUAL INTEREST AUTO-ACCEPTANCE: If B sends interest to A who already sent to B -> auto-accept', async () => {
      // 1. Groom sends interest to Bride
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenGroom}`)
        .send({ recipientProfileId: profileBrideCompat.profileId });

      // 2. Bride sends interest back to Groom -> Should detect pending and auto-accept!
      const mutualRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenBrideCompat}`)
        .send({ recipientProfileId: profileGroom.profileId });

      expect(mutualRes.status).toBe(201);
      expect(mutualRes.body.data.interest.status).toBe('Accepted');
    });

    it('VISITOR DEDUPLICATION: Multiple visits on the same UTC day must increment count on 1 document', async () => {
      // Visit 1
      await request(app)
        .post(`/api/visitors/record/${profileBrideCompat.profileId}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      // Visit 2
      await request(app)
        .post(`/api/visitors/record/${profileBrideCompat.profileId}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      // Visit 3
      const v3 = await request(app)
        .post(`/api/visitors/record/${profileBrideCompat.profileId}`)
        .set('Authorization', `Bearer ${tokenGroom}`);

      expect(v3.status).toBe(200);
      expect(v3.body.data.visitCount).toBe(3);

      const count = await Visitor.countDocuments({
        visitedProfileId: profileBrideCompat._id,
        visitorProfileId: profileGroom._id
      });
      expect(count).toBe(1);
    });
  });
});
