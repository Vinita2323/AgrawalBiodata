/**
 * Partner Preference Application Test Suite
 * Agrawal Matrimony Platform
 *
 * Verifies that stored partnerPreferences actually change what a user sees:
 * 1. Each preference dimension filters the match feed
 * 2. Daily recommendations honour preferences
 * 3. Explicit request filters override the stored preference
 * 4. Search applies preferences only on opt-in
 * 5. preferenceFit annotation and the narrowed-feed counters
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { signAccessToken } = require('../utils/token');
const {
  hasAnyPreference,
  evaluatePreferenceFit,
  parseHeightToInches,
  parseIncomeToLakh
} = require('../services/preferenceMatcher');

describe('Partner Preference Application', () => {
  let seeker, seekerToken, seekerProfile;

  /** Creates a candidate profile owned by its own user account. */
  async function makeCandidate(index, overrides = {}) {
    const user = await User.create({
      mobile: `98555000${String(index).padStart(2, '0')}`,
      name: overrides.fullName || `Candidate ${index}`,
      accountStatus: 'Active'
    });

    const profile = await Profile.create({
      userId: user._id,
      profileId: `PRF-94000${index}`,
      fullName: overrides.fullName || `Candidate ${index}`,
      gender: 'Female',
      dob: new Date('1996-01-15'),
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      maritalStatus: 'Never Married',
      manglik: 'Non-Manglik',
      height: "5'4\"",
      city: 'Jaipur',
      state: 'Rajasthan',
      diet: 'Vegetarian',
      educationLevel: 'Graduate',
      qualification: 'B.Tech',
      occupation: 'Software Engineer',
      income: '15 LPA',
      verified: false,
      ...overrides
    });

    user.activeProfileId = profile._id;
    user.profiles = [profile._id];
    await user.save();

    return profile;
  }

  /** Saves partner preferences onto the seeker's profile. */
  async function setPreferences(preferences) {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send(preferences);
    expect(res.status).toBe(200);
  }

  /** Returns the full-name list currently in the seeker's match feed. */
  async function feedNames(query = '') {
    const res = await request(app)
      .get(`/api/matches${query}`)
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(200);
    return {
      names: res.body.data.matches.map((m) => m.profile.fullName).sort(),
      body: res.body.data
    };
  }

  beforeEach(async () => {
    seeker = await User.create({
      mobile: '9855500099',
      name: 'Seeker Garg',
      accountStatus: 'Active'
    });
    seekerToken = signAccessToken(seeker);

    seekerProfile = await Profile.create({
      userId: seeker._id,
      profileId: 'PRF-940099',
      fullName: 'Seeker Garg',
      gender: 'Male',
      dob: new Date('1993-05-10'),
      gotra: 'Garg',
      motherGotra: 'Goyal',
      city: 'Jaipur',
      state: 'Rajasthan'
    });

    seeker.activeProfileId = seekerProfile._id;
    seeker.profiles = [seekerProfile._id];
    await seeker.save();
  });

  describe('1. Preferences filter the match feed', () => {
    it('shows every candidate when no preference is set', async () => {
      await makeCandidate(1, { fullName: 'Anita' });
      await makeCandidate(2, { fullName: 'Bhavna' });

      const { names, body } = await feedNames();

      expect(names).toEqual(['Anita', 'Bhavna']);
      expect(body.preferencesApplied).toBe(false);
    });

    it('filters by age range', async () => {
      await makeCandidate(1, { fullName: 'Young', dob: new Date('2003-01-01') });
      await makeCandidate(2, { fullName: 'InRange', dob: new Date('1996-01-01') });
      await makeCandidate(3, { fullName: 'Older', dob: new Date('1980-01-01') });

      await setPreferences({ minAge: 25, maxAge: 33 });
      const { names, body } = await feedNames();

      expect(names).toEqual(['InRange']);
      expect(body.preferencesApplied).toBe(true);
    });

    it('filters by city', async () => {
      await makeCandidate(1, { fullName: 'Jaipuri', city: 'Jaipur' });
      await makeCandidate(2, { fullName: 'Delhiite', city: 'Delhi' });

      await setPreferences({ cities: ['Delhi'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Delhiite']);
    });

    it('matches city case-insensitively', async () => {
      await makeCandidate(1, { fullName: 'Delhiite', city: 'Delhi' });

      await setPreferences({ cities: ['delhi'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Delhiite']);
    });

    it('filters by diet', async () => {
      await makeCandidate(1, { fullName: 'Veg', diet: 'Vegetarian' });
      await makeCandidate(2, { fullName: 'NonVeg', diet: 'Non-Vegetarian' });

      await setPreferences({ diet: ['Vegetarian'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Veg']);
    });

    it('filters by marital status across multiple accepted values', async () => {
      await makeCandidate(1, { fullName: 'Never', maritalStatus: 'Never Married' });
      await makeCandidate(2, { fullName: 'Divorced', maritalStatus: 'Divorced' });
      await makeCandidate(3, { fullName: 'Widowed', maritalStatus: 'Widowed' });

      await setPreferences({ maritalStatus: ['Never Married', 'Divorced'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Divorced', 'Never']);
    });

    it('filters by manglik status', async () => {
      await makeCandidate(1, { fullName: 'NonManglik', manglik: 'Non-Manglik' });
      await makeCandidate(2, { fullName: 'Manglik', manglik: 'Manglik' });

      await setPreferences({ manglik: 'Non-Manglik' });
      const { names } = await feedNames();

      expect(names).toEqual(['NonManglik']);
    });

    it('filters by education level against either education field', async () => {
      await makeCandidate(1, { fullName: 'Grad', educationLevel: 'Graduate', qualification: 'B.Com' });
      await makeCandidate(2, { fullName: 'PostGrad', educationLevel: 'Post Graduate', qualification: 'MBA' });

      await setPreferences({ educationLevels: ['Post Graduate'] });
      const { names } = await feedNames();

      expect(names).toEqual(['PostGrad']);
    });

    it('filters by occupation', async () => {
      await makeCandidate(1, { fullName: 'Engineer', occupation: 'Software Engineer' });
      await makeCandidate(2, { fullName: 'Doctor', occupation: 'Physician' });

      await setPreferences({ occupations: ['Physician'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Doctor']);
    });

    it('filters by verifiedOnly', async () => {
      await makeCandidate(1, { fullName: 'Verified', verified: true });
      await makeCandidate(2, { fullName: 'Unverified', verified: false });

      await setPreferences({ verifiedOnly: true });
      const { names } = await feedNames();

      expect(names).toEqual(['Verified']);
    });

    it('excludes unwanted gotras', async () => {
      await makeCandidate(1, { fullName: 'Bansal', gotra: 'Bansal' });
      await makeCandidate(2, { fullName: 'Mittal', gotra: 'Mittal' });

      await setPreferences({ excludeGotras: ['Mittal'] });
      const { names } = await feedNames();

      expect(names).toEqual(['Bansal']);
    });

    it('filters by height range despite height being a display string', async () => {
      await makeCandidate(1, { fullName: 'Short', height: "4'11\"" });
      await makeCandidate(2, { fullName: 'Average', height: "5'5\"" });
      await makeCandidate(3, { fullName: 'Tall', height: "6'1\"" });

      // 157cm - 175cm covers roughly 5'2" to 5'9".
      await setPreferences({ minHeightCm: 157, maxHeightCm: 175 });
      const { names } = await feedNames();

      expect(names).toEqual(['Average']);
    });

    it('filters by minimum income parsed from the band string', async () => {
      await makeCandidate(1, { fullName: 'Low', income: '6-8 LPA' });
      await makeCandidate(2, { fullName: 'High', income: '25-30 LPA' });

      await setPreferences({ minIncomeLakh: 20 });
      const { names } = await feedNames();

      expect(names).toEqual(['High']);
    });

    it('combines several preference dimensions', async () => {
      await makeCandidate(1, { fullName: 'PerfectFit', city: 'Delhi', verified: true, diet: 'Vegetarian' });
      await makeCandidate(2, { fullName: 'WrongCity', city: 'Jaipur', verified: true, diet: 'Vegetarian' });
      await makeCandidate(3, { fullName: 'Unverified', city: 'Delhi', verified: false, diet: 'Vegetarian' });
      await makeCandidate(4, { fullName: 'WrongDiet', city: 'Delhi', verified: true, diet: 'Non-Vegetarian' });

      await setPreferences({ cities: ['Delhi'], verifiedOnly: true, diet: ['Vegetarian'] });
      const { names } = await feedNames();

      expect(names).toEqual(['PerfectFit']);
    });

    it('reports how far preferences narrowed the feed', async () => {
      await makeCandidate(1, { fullName: 'A', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'B', city: 'Jaipur' });
      await makeCandidate(3, { fullName: 'C', city: 'Jaipur' });

      await setPreferences({ cities: ['Delhi'] });
      const { names, body } = await feedNames();

      expect(names).toEqual(['A']);
      expect(body.pagination.total).toBe(1);
      // Lets the client say "3 matches, 1 fits your preferences".
      expect(body.totalBeforePreferences).toBe(3);
    });

    it('can be bypassed with ignorePreferences', async () => {
      await makeCandidate(1, { fullName: 'Anita', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'Bhavna', city: 'Jaipur' });

      await setPreferences({ cities: ['Delhi'] });
      const { names, body } = await feedNames('?ignorePreferences=true');

      expect(names).toEqual(['Anita', 'Bhavna']);
      expect(body.preferencesApplied).toBe(false);
    });
  });

  describe('2. Explicit filters override stored preferences', () => {
    it('lets an explicit city filter win over the saved city', async () => {
      await makeCandidate(1, { fullName: 'Delhiite', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'Jaipuri', city: 'Jaipur' });

      await setPreferences({ cities: ['Delhi'] });
      const { names } = await feedNames('?city=Jaipur');

      // The active filter wins; the saved preference must not also apply and
      // produce an impossible "Delhi AND Jaipur" query.
      expect(names).toEqual(['Jaipuri']);
    });

    it('lets an explicit age range win over the saved age range', async () => {
      await makeCandidate(1, { fullName: 'Young', dob: new Date('2002-01-01') });
      await makeCandidate(2, { fullName: 'Older', dob: new Date('1990-01-01') });

      await setPreferences({ minAge: 30, maxAge: 40 });
      const { names } = await feedNames('?minAge=20&maxAge=26');

      expect(names).toEqual(['Young']);
    });

    it('still applies untouched preference dimensions alongside an explicit filter', async () => {
      await makeCandidate(1, { fullName: 'Match', city: 'Delhi', verified: true });
      await makeCandidate(2, { fullName: 'NotVerified', city: 'Delhi', verified: false });

      await setPreferences({ cities: ['Jaipur'], verifiedOnly: true });
      const { names } = await feedNames('?city=Delhi');

      // City comes from the request, verifiedOnly still comes from preferences.
      expect(names).toEqual(['Match']);
    });
  });

  describe('3. Daily recommendations', () => {
    it('honours preferences', async () => {
      await makeCandidate(1, { fullName: 'Delhiite', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'Jaipuri', city: 'Jaipur' });

      await setPreferences({ cities: ['Delhi'] });

      const res = await request(app)
        .get('/api/matches/today')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferencesApplied).toBe(true);
      expect(res.body.data.recommendations.map((r) => r.profile.fullName)).toEqual(['Delhiite']);
    });

    it('can be bypassed', async () => {
      await makeCandidate(1, { fullName: 'Delhiite', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'Jaipuri', city: 'Jaipur' });

      await setPreferences({ cities: ['Delhi'] });

      const res = await request(app)
        .get('/api/matches/today?ignorePreferences=true')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.body.data.recommendations).toHaveLength(2);
      expect(res.body.data.preferencesApplied).toBe(false);
    });
  });

  describe('4. Search is opt-in', () => {
    beforeEach(async () => {
      await makeCandidate(1, { fullName: 'Anita Sharma', city: 'Delhi' });
      await makeCandidate(2, { fullName: 'Anita Verma', city: 'Jaipur' });
      await setPreferences({ cities: ['Delhi'] });
    });

    it('ignores preferences by default so an active search is not silently narrowed', async () => {
      const res = await request(app)
        .get('/api/matches/search?query=Anita')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferencesApplied).toBe(false);
      expect(res.body.data.results).toHaveLength(2);
    });

    it('applies preferences when explicitly requested', async () => {
      const res = await request(app)
        .get('/api/matches/search?query=Anita&usePreferences=true')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferencesApplied).toBe(true);
      expect(res.body.data.results.map((r) => r.profile.fullName)).toEqual(['Anita Sharma']);
    });
  });

  describe('5. preferenceFit annotation', () => {
    it('reports which dimensions a candidate satisfies', async () => {
      const candidate = await makeCandidate(1, {
        fullName: 'Partial',
        city: 'Delhi',
        verified: false
      });

      await setPreferences({ cities: ['Delhi'], verifiedOnly: false, diet: ['Vegetarian'] });

      const res = await request(app)
        .get(`/api/matches/score/${candidate._id}`)
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferenceFit.matched).toEqual(
        expect.arrayContaining(['city', 'diet'])
      );
      expect(res.body.data.preferenceFit.score).toBe(100);
    });

    it('scores a partial fit below 100', async () => {
      await makeCandidate(1, { fullName: 'Half', city: 'Delhi', diet: 'Non-Vegetarian' });

      await setPreferences({ cities: ['Delhi'], diet: ['Vegetarian'] });

      // Bypass filtering so the partially-fitting candidate is still returned.
      const { body } = await feedNames('?ignorePreferences=true');
      const entry = body.matches.find((m) => m.profile.fullName === 'Half');

      expect(entry.preferenceFit.total).toBe(2);
      expect(entry.preferenceFit.matched).toEqual(['city']);
      expect(entry.preferenceFit.score).toBe(50);
    });

    it('returns a perfect fit when nothing is constrained', async () => {
      await makeCandidate(1, { fullName: 'Anyone' });

      const { body } = await feedNames();
      expect(body.matches[0].preferenceFit.score).toBe(100);
      expect(body.matches[0].preferenceFit.total).toBe(0);
    });
  });

  describe('6. Matcher unit behaviour', () => {
    it('treats an untouched preferences object as unconstrained', () => {
      expect(hasAnyPreference(null)).toBe(false);
      expect(hasAnyPreference({})).toBe(false);
      expect(hasAnyPreference({ cities: [], maritalStatus: [], verifiedOnly: false })).toBe(false);
      expect(hasAnyPreference({ minAge: 25 })).toBe(true);
      expect(hasAnyPreference({ cities: ['Delhi'] })).toBe(true);
    });

    it('parses the height formats the app stores', () => {
      expect(parseHeightToInches("5'6\"")).toBe(66);
      expect(parseHeightToInches('5 ft 6 in')).toBe(66);
      expect(parseHeightToInches("6'")).toBe(72);
      expect(Math.round(parseHeightToInches('168 cm'))).toBe(66);
      expect(parseHeightToInches('')).toBeNull();
      expect(parseHeightToInches('unknown')).toBeNull();
    });

    it('parses the income band formats the app stores', () => {
      expect(parseIncomeToLakh('15-20 LPA')).toBe(15);
      expect(parseIncomeToLakh('30+ LPA')).toBe(30);
      expect(parseIncomeToLakh('12 LPA')).toBe(12);
      expect(parseIncomeToLakh('')).toBeNull();
      expect(parseIncomeToLakh('Not disclosed')).toBeNull();
    });

    it('does not credit a fit it cannot verify', () => {
      const fit = evaluatePreferenceFit(
        { minHeightCm: 160 },
        { height: 'not a height' },
        28
      );
      expect(fit.matched).toEqual([]);
      expect(fit.score).toBe(0);
    });
  });
});
