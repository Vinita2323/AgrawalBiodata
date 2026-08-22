/**
 * Milestone 3 Challenger Adversarial & Stress Empirical Test Suite
 * Agrawal Matrimony Platform
 * 
 * Verifies:
 * 1. Gotra Exogamy Permutations (18x18 matrix, maternal vs paternal cross-matching, aliases & normalization)
 * 2. Edge Cases in Match Engine (Missing fields, extreme age gaps, education/income parsing, manglik matrix, score boundaries)
 * 3. Interest Lifecycle Edge Cases (Self-interest prevention, duplicate request blocking, re-expression, mutual auto-accept, unauthorized actions)
 * 4. Daily Visitor Deduplication (Same-day upsert count, multi-day isolation, self-visit exclusion, metrics)
 * 5. Bidirectional Blocking (Mutual profile invisibility, search/discovery exclusion, interest prohibition, cascading cancellations)
 * 6. Contact Unlocking Privacy & Security (Masked before connect, unmasked upon acceptance, hidden override, unauthenticated guests)
 */

const request = require('supertest');
const mongoose = require('mongoose');
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
const {
  AGARWAL_GOTRAS,
  GOTRA_NAMES_EN,
  normalizeGotra,
  isValidGotra,
  checkGotraExogamy
} = require('../utils/gotras');
const { INTEREST_STATUS } = require('../config/constants');

describe('Milestone 3 Challenger Adversarial & Stress Test Suite', () => {
  let userA, userB, userC, userD;
  let tokenA, tokenB, tokenC, tokenD;
  let profileA, profileB, profileC, profileD;

  beforeEach(async () => {
    // Seed User A: Male Groom (Garg / mother Bansal, 28y, B.Tech, Jaipur, 25 LPA, Non-Manglik)
    userA = await User.create({
      mobile: '9876511111',
      name: 'Adversarial Groom A',
      email: 'groom_a@test.com',
      accountStatus: 'Active'
    });
    tokenA = signAccessToken(userA);

    profileA = await Profile.create({
      userId: userA._id,
      profileId: 'PRF-M3-001',
      fullName: 'Aman Garg',
      gender: 'Male',
      dob: new Date('1998-06-15'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech Computer Science',
      educationLevel: 'Graduate',
      occupation: 'Software Architect',
      workingAt: 'Tech Corp',
      income: '25 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '+91 98765 11111',
      residentialAddress: '101, C-Scheme, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    userA.activeProfileId = profileA._id;
    userA.profiles.push(profileA._id);
    await userA.save();

    // Seed User B: Female Bride (Mittal / mother Singhal, 27y, MBA, Jaipur, 20 LPA, Non-Manglik)
    userB = await User.create({
      mobile: '9876522222',
      name: 'Adversarial Bride B',
      email: 'bride_b@test.com',
      accountStatus: 'Active'
    });
    tokenB = signAccessToken(userB);

    profileB = await Profile.create({
      userId: userB._id,
      profileId: 'PRF-M3-002',
      fullName: 'Pooja Mittal',
      gender: 'Female',
      dob: new Date('1999-09-20'),
      gotra: 'Mittal',
      motherGotra: 'Singhal',
      manglik: 'Non-Manglik',
      qualification: 'MBA Finance',
      educationLevel: 'Post Graduate',
      occupation: 'Financial Analyst',
      workingAt: 'HDFC Bank',
      income: '20 LPA',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '+91 98765 22222',
      residentialAddress: '202, Civil Lines, Jaipur',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      verified: true
    });
    userB.activeProfileId = profileB._id;
    userB.profiles.push(profileB._id);
    await userB.save();

    // Seed User C: Sagotra Bride (Garg / mother Goyal, 26y, Delhi)
    userC = await User.create({
      mobile: '9876533333',
      name: 'Sagotra Bride C',
      email: 'bride_c@test.com',
      accountStatus: 'Active'
    });
    tokenC = signAccessToken(userC);

    profileC = await Profile.create({
      userId: userC._id,
      profileId: 'PRF-M3-003',
      fullName: 'Divya Garg',
      gender: 'Female',
      dob: new Date('2000-01-10'),
      gotra: 'Garg',
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      qualification: 'B.Com',
      educationLevel: 'Graduate',
      occupation: 'Accountant',
      income: '10 LPA',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: '+91 98765 33333',
      residentialAddress: '303, Rohini, Delhi',
      verified: false
    });
    userC.activeProfileId = profileC._id;
    userC.profiles.push(profileC._id);
    await userC.save();

    // Seed User D: Maternal Overlap Bride (Jindal / mother Bansal, 28y, Mumbai)
    userD = await User.create({
      mobile: '9876544444',
      name: 'Maternal Bride D',
      email: 'bride_d@test.com',
      accountStatus: 'Active'
    });
    tokenD = signAccessToken(userD);

    profileD = await Profile.create({
      userId: userD._id,
      profileId: 'PRF-M3-004',
      fullName: 'Sneha Jindal',
      gender: 'Female',
      dob: new Date('1998-04-15'),
      gotra: 'Jindal',
      motherGotra: 'Bansal',
      manglik: 'Manglik',
      qualification: 'B.Tech',
      educationLevel: 'Graduate',
      occupation: 'Developer',
      income: '15 LPA',
      city: 'Mumbai',
      state: 'Maharashtra',
      mobileNumber: '+91 98765 44444',
      residentialAddress: '404, Bandra West, Mumbai',
      verified: true
    });
    userD.activeProfileId = profileD._id;
    userD.profiles.push(profileD._id);
    await userD.save();
  });

  // =========================================================================
  // 1. GOTRA EXOGAMY PERMUTATIONS (ALL 18 GOTRAS MATRIX & CROSS-MATCHING)
  // =========================================================================
  describe('1. Gotra Exogamy Permutations & Combinations (All 18 Gotras)', () => {
    const all18Gotras = GOTRA_NAMES_EN;

    it('1.1 Should evaluate all 18x18 (324 pairs) Gotra combinations accurately', () => {
      expect(all18Gotras.length).toBe(18);

      for (const g1 of all18Gotras) {
        for (const g2 of all18Gotras) {
          const result = checkGotraExogamy(g1, g2, 'DifferentM1', 'DifferentM2');

          if (g1 === g2) {
            // Sagotra collision
            expect(result.score).toBe(0);
            expect(result.isSagotra).toBe(true);
            expect(result.hasMaternalConflict).toBe(false);
            expect(result.details).toContain('Sagotra Conflict');
          } else {
            // Distinct gotras
            expect(result.score).toBe(30);
            expect(result.isSagotra).toBe(false);
            expect(result.hasMaternalConflict).toBe(false);
          }
        }
      }
    });

    it('1.2 Maternal vs Paternal Gotra cross-matching permutations (2-Gotra Rule)', () => {
      // Case A: Groom motherGotra === Bride motherGotra (Mother-Mother overlap)
      const resMM = checkGotraExogamy('Garg', 'Mittal', 'Bansal', 'Bansal');
      expect(resMM.score).toBe(15);
      expect(resMM.isSagotra).toBe(false);
      expect(resMM.hasMaternalConflict).toBe(true);
      expect(resMM.details).toContain('Maternal Gotra overlap');

      // Case B: Groom motherGotra === Bride paternal gotra (Mother1-Paternal2 overlap)
      const resMP = checkGotraExogamy('Garg', 'Bansal', 'Bansal', 'Singhal');
      expect(resMP.score).toBe(15);
      expect(resMP.isSagotra).toBe(false);
      expect(resMP.hasMaternalConflict).toBe(true);

      // Case C: Groom paternal gotra === Bride motherGotra (Paternal1-Mother2 overlap)
      const resPM = checkGotraExogamy('Garg', 'Mittal', 'Singhal', 'Garg');
      expect(resPM.score).toBe(15);
      expect(resPM.isSagotra).toBe(false);
      expect(resPM.hasMaternalConflict).toBe(true);

      // Case D: Sagotra dominance: Paternal collision (Garg vs Garg) MUST override maternal match with 0 score
      const resSagotraDom = checkGotraExogamy('Garg', 'Garg', 'Bansal', 'Bansal');
      expect(resSagotraDom.score).toBe(0);
      expect(resSagotraDom.isSagotra).toBe(true);
      expect(resSagotraDom.hasMaternalConflict).toBe(false);
    });

    it('1.3 Normalization, Aliases, Hindi scripts, and composite gotra labels across all 18 Gotras', () => {
      const aliasTests = [
        { input1: 'Goel', input2: 'Goyal', expectedSagotra: true },
        { input1: 'Kushal', input2: 'Kuchhal', expectedSagotra: true },
        { input1: 'Dhingan', input2: 'Goyan', expectedSagotra: true },
        { input1: 'Nagal', input2: 'Nangal', expectedSagotra: true },
        { input1: 'गर्ग', input2: 'Garg', expectedSagotra: true },
        { input1: 'गर्ग (Garg)', input2: 'garg', expectedSagotra: true },
        { input1: 'Garg (गर्ग)', input2: 'Garg', expectedSagotra: true },
        { input1: 'Goyal (गोयल)', input2: 'Goel', expectedSagotra: true },
        { input1: 'Goel', input2: 'Bansal', expectedSagotra: false }
      ];

      for (const t of aliasTests) {
        const res = checkGotraExogamy(t.input1, t.input2, 'Airan', 'Bindal');
        expect(res.isSagotra).toBe(t.expectedSagotra);
        if (t.expectedSagotra) {
          expect(res.score).toBe(0);
        } else {
          expect(res.score).toBe(30);
        }
      }
    });

    it('1.4 Missing, null, or empty gotras handled safely without crashing', () => {
      const emptyCheck1 = checkGotraExogamy(null, 'Garg', null, null);
      expect(emptyCheck1.score).toBeDefined();

      const emptyCheck2 = checkGotraExogamy('', '', '', '');
      expect(emptyCheck2.score).toBeDefined();

      const nullCompat = checkGotraCompatibility(null, null);
      expect(nullCompat.score).toBe(0);
      expect(nullCompat.details).toContain('Missing profile data');
    });
  });

  // =========================================================================
  // 2. EDGE CASES IN MATCH ENGINE
  // =========================================================================
  describe('2. Edge Cases in Match Engine', () => {
    it('2.1 Handling missing and malformed profile fields gracefully', () => {
      const emptyProfile1 = {};
      const emptyProfile2 = {};

      const scoreResult = calculateMatchScore(emptyProfile1, emptyProfile2);
      expect(scoreResult).toBeDefined();
      expect(scoreResult.totalScore).toBeGreaterThanOrEqual(0);
      expect(scoreResult.totalScore).toBeLessThanOrEqual(100);
      expect(scoreResult.breakdown).toBeDefined();
      expect(scoreResult.breakdown.gotra).toBeDefined();
      expect(scoreResult.breakdown.age).toBeDefined();
      expect(scoreResult.breakdown.education).toBeDefined();
      expect(scoreResult.breakdown.location).toBeDefined();
      expect(scoreResult.breakdown.income).toBeDefined();
      expect(scoreResult.breakdown.manglik).toBeDefined();
    });

    it('2.2 Extreme age gaps, invalid DOB, future DOB, and exact birthday calculations', () => {
      const p1 = { dob: new Date('1990-01-01') };

      // Exact same DOB (Delta = 0) -> 20 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1990-01-01') }).score).toBe(20);

      // Delta 2 years -> 20 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1992-01-01') }).score).toBe(20);

      // Delta 4 years -> 15 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1994-01-01') }).score).toBe(15);

      // Delta 6 years -> 10 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1996-01-01') }).score).toBe(10);

      // Delta 8 years -> 5 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1998-01-01') }).score).toBe(5);

      // Delta > 8 years (e.g. 9 yrs, 25 yrs, 50 yrs) -> 0 pts
      expect(checkAgeCompatibility(p1, { dob: new Date('1999-01-01') }).score).toBe(0);
      expect(checkAgeCompatibility(p1, { dob: new Date('1965-01-01') }).score).toBe(0);
      expect(checkAgeCompatibility(p1, { dob: new Date('1940-01-01') }).score).toBe(0);

      // Invalid / Future DOB -> Returns fallback default score (10 pts)
      expect(checkAgeCompatibility(p1, { dob: 'invalid-date' }).score).toBe(10);
      expect(checkAgeCompatibility(p1, { dob: new Date('2099-01-01') }).score).toBe(10);
      expect(checkAgeCompatibility(p1, { dob: null }).score).toBe(10);
      expect(checkAgeCompatibility(p1, {}).score).toBe(10);
    });

    it('2.3 Education tier classification robustness across diverse credentials', () => {
      // Tier 1: Doctorates
      expect(classifyEducationTier('Ph.D Computer Science', 'Doctorate')).toBe(1);
      expect(classifyEducationTier('Post Doc in AI', 'Doctorate')).toBe(1);
      expect(classifyEducationTier('M.Ch Neurosurgery', 'Doctorate')).toBe(1);
      expect(classifyEducationTier('DM Cardiology', 'Doctorate')).toBe(1);

      // Tier 2: Postgraduate & Professional
      expect(classifyEducationTier('MBA Finance', 'Post Graduate')).toBe(2);
      expect(classifyEducationTier('M.Tech IIT', 'Post Graduate')).toBe(2);
      expect(classifyEducationTier('Chartered Accountant (CA)', 'Professional')).toBe(2);
      expect(classifyEducationTier('MS Software Engineering', 'Masters')).toBe(2);
      expect(classifyEducationTier('MD Medicine', 'Post Graduate')).toBe(2);

      // Tier 3: Graduate / Bachelor
      expect(classifyEducationTier('B.Tech CS', 'Graduate')).toBe(3);
      expect(classifyEducationTier('MBBS', 'Graduate')).toBe(3);
      expect(classifyEducationTier('B.Com (Hons)', 'Graduate')).toBe(3);
      expect(classifyEducationTier('BBA', 'Graduate')).toBe(3);

      // Tier 4: Undergrad / School
      expect(classifyEducationTier('Diploma in Mechanical', 'Diploma')).toBe(4);
      expect(classifyEducationTier('12th Pass', 'High School')).toBe(4);

      // Empty
      expect(classifyEducationTier('', '')).toBe(0);
    });

    it('2.4 Income bracket classification robustness across various representations', () => {
      // Tier 4: 50+ LPA / 1 Cr+
      expect(classifyIncomeTier('50+ LPA')).toBe(4);
      expect(classifyIncomeTier('75 LPA')).toBe(4);
      expect(classifyIncomeTier('1 Cr+')).toBe(4);
      expect(classifyIncomeTier('1.2 Crore')).toBe(4);

      // Tier 3: 20-50 LPA
      expect(classifyIncomeTier('25 LPA')).toBe(3);
      expect(classifyIncomeTier('35 LPA')).toBe(3);
      expect(classifyIncomeTier('40 LPA')).toBe(3);

      // Tier 2: 10-20 LPA
      expect(classifyIncomeTier('15 LPA')).toBe(2);
      expect(classifyIncomeTier('12 LPA')).toBe(2);
      expect(classifyIncomeTier('18 LPA')).toBe(2);

      // Tier 1: 5-10 LPA
      expect(classifyIncomeTier('6 LPA')).toBe(1);
      expect(classifyIncomeTier('8 LPA')).toBe(1);

      // Tier 0: < 5 LPA
      expect(classifyIncomeTier('< 5 LPA')).toBe(0);
      expect(classifyIncomeTier('3 LPA')).toBe(0);

      // Unspecified
      expect(classifyIncomeTier('')).toBe(-1);
      expect(classifyIncomeTier(null)).toBe(-1);
      expect(classifyIncomeTier('Confidential')).toBe(-1);
    });

    it('2.5 Astrological Manglik compatibility permutations matrix', () => {
      const non = { manglik: 'Non-Manglik' };
      const manglik = { manglik: 'Manglik' };
      const anshik = { manglik: 'Anshik Manglik' };
      const dontKnow = { manglik: "Don't Know" };

      // Harmonious (10 pts)
      expect(checkManglikCompatibility(non, non).score).toBe(10);
      expect(checkManglikCompatibility(manglik, manglik).score).toBe(10);
      expect(checkManglikCompatibility(anshik, anshik).score).toBe(10);

      // Partial (6 pts)
      expect(checkManglikCompatibility(anshik, non).score).toBe(6);
      expect(checkManglikCompatibility(non, anshik).score).toBe(6);
      expect(checkManglikCompatibility(anshik, manglik).score).toBe(6);
      expect(checkManglikCompatibility(manglik, anshik).score).toBe(6);
      expect(checkManglikCompatibility(dontKnow, non).score).toBe(6);
      expect(checkManglikCompatibility(dontKnow, manglik).score).toBe(6);

      // Dosha Conflict (0 pts)
      expect(checkManglikCompatibility(manglik, non).score).toBe(0);
      expect(checkManglikCompatibility(non, manglik).score).toBe(0);
    });

    it('2.6 Score clamping: Total score is strictly bounded between 0 and 100', () => {
      // Worst case: Sagotra (0) + Age > 8 (0) + Education diverse (5) + Location diff state (5) + Income diverse (4) + Manglik dosha (0) = 14
      const pWorst1 = {
        gotra: 'Garg',
        dob: new Date('1960-01-01'),
        qualification: 'Ph.D',
        city: 'Jaipur',
        state: 'Rajasthan',
        income: '50+ LPA',
        manglik: 'Manglik'
      };
      const pWorst2 = {
        gotra: 'Garg',
        dob: new Date('2000-01-01'),
        qualification: '12th Pass',
        city: 'Chennai',
        state: 'Tamil Nadu',
        income: '3 LPA',
        manglik: 'Non-Manglik'
      };

      const worstScore = calculateMatchScore(pWorst1, pWorst2);
      expect(worstScore.totalScore).toBe(14);
      expect(worstScore.isSagotra).toBe(true);

      // Best case: Distinct gotra (30) + Age gap <= 2 (20) + Same Edu tier (15) + Same city (15) + Same income (10) + Harmonious Manglik (10) = 100
      const pBest1 = {
        gotra: 'Garg',
        motherGotra: 'Bansal',
        dob: new Date('1998-01-01'),
        qualification: 'B.Tech',
        city: 'Jaipur',
        state: 'Rajasthan',
        income: '25 LPA',
        manglik: 'Non-Manglik'
      };
      const pBest2 = {
        gotra: 'Mittal',
        motherGotra: 'Singhal',
        dob: new Date('1998-06-01'),
        qualification: 'B.E Computer Science',
        city: 'Jaipur',
        state: 'Rajasthan',
        income: '25 LPA',
        manglik: 'Non-Manglik'
      };

      const bestScore = calculateMatchScore(pBest1, pBest2);
      expect(bestScore.totalScore).toBe(100);
      expect(bestScore.isSagotra).toBe(false);
      expect(bestScore.hasMaternalConflict).toBe(false);
    });
  });

  // =========================================================================
  // 3. INTEREST LIFECYCLE EDGE CASES
  // =========================================================================
  describe('3. Interest Lifecycle Edge Cases', () => {
    it('3.1 Prevent sending interest to own profile (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileA.profileId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot express interest in your own profile');
    });

    it('3.2 Prevent duplicate pending interest requests (400 Bad Request)', async () => {
      // 1st request
      const res1 = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId, message: 'First interest' });

      expect(res1.status).toBe(201);
      expect(res1.body.data.interest.status).toBe(INTEREST_STATUS.PENDING);

      // 2nd duplicate request
      const res2 = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId, message: 'Duplicate attempt' });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toContain('already sent and is pending');
    });

    it('3.3 Prevent expressing interest when already accepted (400 Bad Request)', async () => {
      // Create and accept interest
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Try sending new interest
      const dupRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toContain('already accepted');
    });

    it('3.4 Re-expressing interest after decline or cancel resets status to Pending (201 Created)', async () => {
      // 1. Send interest
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileC.profileId });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      // 2. User C declines interest
      const declineRes = await request(app)
        .put(`/api/interests/${interestId}/decline`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.data.interest.status).toBe(INTEREST_STATUS.DECLINED);

      // 3. User A re-expresses interest -> Should succeed and reset status to Pending
      const reExpressRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileC.profileId, message: 'Re-expressing interest with updated biodata' });

      expect(reExpressRes.status).toBe(201);
      expect(reExpressRes.body.data.interest.status).toBe(INTEREST_STATUS.PENDING);
      expect(reExpressRes.body.data.interest.message).toBe('Re-expressing interest with updated biodata');
    });

    it('3.5 Non-recipient cannot accept or decline interest (403 Forbidden)', async () => {
      // User A sends interest to User B
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      // User C (unauthorized third party) attempts to accept
      const badAccept = await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(badAccept.status).toBe(403);
      expect(badAccept.body.success).toBe(false);

      // User A (the sender) attempts to accept own sent interest
      const senderAccept = await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(senderAccept.status).toBe(403);
    });

    it('3.6 Non-sender cannot cancel interest (403 Forbidden)', async () => {
      // User A sends interest to User B
      const createRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      const interestId = createRes.body.data.interest.id || createRes.body.data.interest._id;

      // User B (recipient) attempts to cancel interest
      const badCancel = await request(app)
        .delete(`/api/interests/${interestId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(badCancel.status).toBe(403);
      expect(badCancel.body.success).toBe(false);
    });

    it('3.7 Mutual interest automatic acceptance when reverse interest already exists', async () => {
      // User A sends interest to User D
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileD.profileId });

      // User D sends interest back to User A -> Auto-accepts into Accepted status
      const mutualRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenD}`)
        .send({ recipientProfileId: profileA.profileId });

      expect(mutualRes.status).toBe(201);
      expect(mutualRes.body.data.interest.status).toBe(INTEREST_STATUS.ACCEPTED);
      expect(mutualRes.body.message).toContain('Mutual interest matched');
    });
  });

  // =========================================================================
  // 4. DAILY VISITOR DEDUPLICATION
  // =========================================================================
  describe('4. Daily Visitor Deduplication & Analytics', () => {
    it('4.1 Multiple visits on the same UTC day increment visitCount on a single document', async () => {
      // Visit 1
      const res1 = await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.recorded).toBe(true);
      expect(res1.body.data.visitCount).toBe(1);

      // Visit 2 (Same day)
      const res2 = await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.recorded).toBe(true);
      expect(res2.body.data.visitCount).toBe(2);

      // Visit 3 (Same day)
      const res3 = await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res3.status).toBe(200);
      expect(res3.body.data.visitCount).toBe(3);

      // Assert only 1 document exists in MongoDB
      const docCount = await Visitor.countDocuments({
        visitedProfileId: profileB._id,
        visitorProfileId: profileA._id
      });
      expect(docCount).toBe(1);
    });

    it('4.2 Self-profile visits must be ignored and return recorded: false', async () => {
      const res = await request(app)
        .post(`/api/visitors/record/${profileA.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recorded).toBe(false);

      // Assert no document created
      const docCount = await Visitor.countDocuments({
        visitedProfileId: profileA._id
      });
      expect(docCount).toBe(0);
    });

    it('4.3 Visits across different UTC calendar days create distinct records for time-series tracking', async () => {
      // Record today visit
      await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      // Seed a historical visit record from yesterday
      const yesterday = new Date(Date.UTC(2026, 7, 13)); // August 13, 2026 UTC
      await Visitor.create({
        visitedProfileId: profileB._id,
        visitedUserId: userB._id,
        visitorProfileId: profileA._id,
        visitorUserId: userA._id,
        visitDate: yesterday,
        visitCount: 2,
        lastVisitedAt: yesterday
      });

      // Total records for User A visiting User B should now be 2
      const docCount = await Visitor.countDocuments({
        visitedProfileId: profileB._id,
        visitorProfileId: profileA._id
      });
      expect(docCount).toBe(2);
    });

    it('4.4 GET /api/visitors/count returns accurate aggregated metrics', async () => {
      // Record visits from User A and User C to User B
      await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      await request(app)
        .post(`/api/visitors/record/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenC}`);

      const metricsRes = await request(app)
        .get('/api/visitors/count')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.totalVisitors).toBe(2);
      expect(metricsRes.body.data.todayVisitors).toBe(2);
      expect(metricsRes.body.data.weeklyVisitors).toBe(2);
    });
  });

  // =========================================================================
  // 5. BIDIRECTIONAL BLOCKING & CASCADING PROTECTIONS
  // =========================================================================
  describe('5. Bidirectional Blocking & Cascading Restrictions', () => {
    it('5.1 Self-blocking is rejected with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ blockedProfileId: profileA.profileId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot block your own profile');
    });

    it('5.2 A blocks B -> Mutual invisibility on profile views (404 Not Found for both)', async () => {
      // User A blocks User B
      const blockRes = await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          blockedProfileId: profileB.profileId,
          reason: 'Harassment',
          notes: 'Unwanted messages'
        });

      expect(blockRes.status).toBe(201);

      // 1. User B viewing User A profile -> 404
      const viewAfromB = await request(app)
        .get(`/api/profiles/${profileA.profileId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(viewAfromB.status).toBe(404);

      // 2. User A viewing User B profile -> 404
      const viewBfromA = await request(app)
        .get(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(viewBfromA.status).toBe(404);
    });

    it('5.3 A blocks B -> Mutual exclusion from match discovery and search endpoints', async () => {
      // Before block: User B appears in User A's matches
      const beforeMatches = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(beforeMatches.body.data.matches.some(m => m.profile.profileId === profileB.profileId)).toBe(true);

      // User A blocks User B
      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ blockedProfileId: profileB.profileId });

      // After block: User B excluded from User A's matches
      const afterMatchesA = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(afterMatchesA.body.data.matches.some(m => m.profile.profileId === profileB.profileId)).toBe(false);

      // After block: User A excluded from User B's matches
      const afterMatchesB = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(afterMatchesB.body.data.matches.some(m => m.profile.profileId === profileA.profileId)).toBe(false);

      // User A excluded from User B's search
      const searchRes = await request(app)
        .get('/api/matches/search?query=Garg')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(searchRes.body.data.results.some(r => r.profile.profileId === profileA.profileId)).toBe(false);
    });

    it('5.4 A blocks B -> Interest expression forbidden (403) in both directions', async () => {
      // User A blocks User B
      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ blockedProfileId: profileB.profileId });

      // User B tries to express interest in User A -> 403 Forbidden
      const interestFromB = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ recipientProfileId: profileA.profileId });

      expect(interestFromB.status).toBe(403);

      // User A tries to express interest in User B -> 403 Forbidden
      const interestFromA = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      expect(interestFromA.status).toBe(403);
    });

    it('5.5 Blocking cascades: Cancels pending interests and removes shortlists', async () => {
      // User A sends interest to User D
      await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileD.profileId });

      // User A shortlists User D
      await request(app)
        .post('/api/shortlist')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ shortlistedProfileId: profileD.profileId });

      // User A blocks User D
      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ blockedProfileId: profileD.profileId });

      // Assert interest is Cancelled
      const interestDoc = await Interest.findOne({
        senderUserId: userA._id,
        recipientUserId: userD._id
      });
      expect(interestDoc.status).toBe(INTEREST_STATUS.CANCELLED);

      // Assert shortlist is deleted
      const shortlistCount = await Shortlist.countDocuments({
        userId: userA._id,
        shortlistedProfileId: profileD._id
      });
      expect(shortlistCount).toBe(0);
    });

    it('5.6 Unblocking restores accessibility and discovery', async () => {
      // Block
      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ blockedProfileId: profileB.profileId });

      // Unblock
      const unblockRes = await request(app)
        .delete(`/api/blocks/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.data.unblocked).toBe(true);

      // View profile restored
      const viewRes = await request(app)
        .get(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.data.profile.fullName).toBe('Pooja Mittal');
    });
  });

  // =========================================================================
  // 6. CONTACT UNLOCKING PRIVACY & SECURITY CHECKS
  // =========================================================================
  describe('6. Contact Unlocking Privacy & Security Checks', () => {
    it('6.1 Non-connected authenticated user receives masked phone and protected address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(false);
      expect(res.body.data.isOwner).toBe(false);
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.mobileNumber).toBe('Protected');
      expect(res.body.data.profile.addressMasked).toBe(true);
      expect(res.body.data.profile.residentialAddress).toContain('Protected');
    });

    it('6.2 Unauthenticated public guest receives masked phone and protected address', async () => {
      const res = await request(app)
        .get(`/api/profiles/${profileB.profileId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(false);
      expect(res.body.data.isOwner).toBe(false);
      expect(res.body.data.profile.phoneMasked).toBe(true);
      expect(res.body.data.profile.mobileNumber).toBe('Protected');
      expect(res.body.data.profile.addressMasked).toBe(true);
    });

    it('6.3 Upon mutual interest acceptance, address unmasks for both parties but phone stays protected', async () => {
      // 1. User A sends interest to User B
      const interestRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      const interestId = interestRes.body.data.interest.id || interestRes.body.data.interest._id;

      // 2. User B accepts interest
      await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      // 3. User A views User B's profile -> Unmasked
      const viewB = await request(app)
        .get(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(viewB.status).toBe(200);
      expect(viewB.body.data.isConnected).toBe(true);
      expect(viewB.body.data.profile.phoneMasked).toBe(true);
      expect(viewB.body.data.profile.mobileNumber).toBe('Protected');
      expect(viewB.body.data.profile.addressMasked).toBe(false);
      expect(viewB.body.data.profile.residentialAddress).toBe('202, Civil Lines, Jaipur');

      // 4. User B views User A's profile -> Address unmasked, phone still protected
      const viewA = await request(app)
        .get(`/api/profiles/${profileA.profileId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(viewA.status).toBe(200);
      expect(viewA.body.data.isConnected).toBe(true);
      expect(viewA.body.data.profile.phoneMasked).toBe(true);
      expect(viewA.body.data.profile.mobileNumber).toBe('Protected');
      expect(viewA.body.data.profile.addressMasked).toBe(false);
      expect(viewA.body.data.profile.residentialAddress).toBe('101, C-Scheme, Jaipur');
    });

    it('6.4 "Hidden" privacy setting preserves masked status even for connected members', async () => {
      // Update User B privacy to Hidden
      await request(app)
        .put(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          privacySettings: {
            phoneVisibility: 'Hidden',
            addressVisibility: 'Hidden'
          }
        });

      // User A and User B connect
      const interestRes = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientProfileId: profileB.profileId });

      const interestId = interestRes.body.data.interest.id || interestRes.body.data.interest._id;

      await request(app)
        .put(`/api/interests/${interestId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      // User A views User B profile -> Phone and Address must still be Protected
      const viewB = await request(app)
        .get(`/api/profiles/${profileB.profileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(viewB.status).toBe(200);
      expect(viewB.body.data.profile.mobileNumber).toBe('Protected');
      expect(viewB.body.data.profile.residentialAddress).toContain('Protected');
    });
  });
});
