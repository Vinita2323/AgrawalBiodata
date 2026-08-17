/**
 * 6-Factor Weighted Match Engine
 * Agrawal Matrimony Platform
 *
 * Weights & Factors:
 * 1. Gotra Exogamy: 30% (Strict 0 pts + Sagotra flag for paternal collision; 15 pts for maternal overlap; 30 pts for clean distinct gotras)
 * 2. Age Compatibility: 20% (Delta <= 2: 20 pts, <= 4: 15 pts, <= 6: 10 pts, <= 8: 5 pts, > 8: 0 pts)
 * 3. Education Tier: 15% (Same tier: 15 pts, Adjacent tier: 10 pts, Diverse tier: 5 pts)
 * 4. Location Proximity: 15% (Same city: 15 pts, Same state: 10 pts, Different state: 5 pts)
 * 5. Income Bracket: 10% (Same bracket: 10 pts, Adjacent bracket: 7 pts, Diverse: 4 pts)
 * 6. Manglik Astrological Compatibility: 10% (Harmonious: 10 pts, Partial/Anshik/Don't Know: 6 pts, Dosha conflict: 0 pts)
 */

const { normalizeGotra, checkGotraExogamy } = require('../utils/gotras');

/**
 * 1. Gotra Exogamy Evaluation (30%)
 */
const checkGotraCompatibility = (p1, p2) => {
  if (!p1 || !p2) {
    return {
      score: 0,
      maxScore: 30,
      isSagotra: false,
      hasMaternalConflict: false,
      details: 'Missing profile data for Gotra evaluation.'
    };
  }

  return checkGotraExogamy(p1.gotra, p2.gotra, p1.motherGotra, p2.motherGotra);
};

/**
 * Helper to calculate age in years from DOB
 */
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

/**
 * 2. Age Compatibility Evaluation (20%)
 */
const checkAgeCompatibility = (p1, p2) => {
  const age1 = calculateAge(p1?.dob);
  const age2 = calculateAge(p2?.dob);

  if (age1 === null || age2 === null) {
    return {
      score: 10,
      maxScore: 20,
      age1,
      age2,
      ageDiff: null,
      details: 'Age information incomplete; default moderate score applied.'
    };
  }

  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff <= 2) {
    return {
      score: 20,
      maxScore: 20,
      age1,
      age2,
      ageDiff,
      details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Perfect age alignment.`
    };
  }
  if (ageDiff <= 4) {
    return {
      score: 15,
      maxScore: 20,
      age1,
      age2,
      ageDiff,
      details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Good age alignment.`
    };
  }
  if (ageDiff <= 6) {
    return {
      score: 10,
      maxScore: 20,
      age1,
      age2,
      ageDiff,
      details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Moderate age alignment.`
    };
  }
  if (ageDiff <= 8) {
    return {
      score: 5,
      maxScore: 20,
      age1,
      age2,
      ageDiff,
      details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Acceptable age alignment.`
    };
  }
  return {
    score: 0,
    maxScore: 20,
    age1,
    age2,
    ageDiff,
    details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Significant age difference.`
  };
};

/**
 * Classify education qualification into standard tiers (1 to 4)
 * Tier 1: Doctorate
 * Tier 2: Postgraduate / Professional Master
 * Tier 3: Graduate / Bachelor
 * Tier 4: Diploma / Undergrad / School
 */
const classifyEducationTier = (qualification, educationLevel) => {
  const qual = (qualification || '').toLowerCase();
  const level = (educationLevel || '').toLowerCase();
  const text = `${qual} ${level}`.trim();
  if (!text) return 0;

  // Tier 1: Doctorate
  if (/\b(ph\.?d|doctorate|post doc|dm|mch|dnb)\b/i.test(text) || text.includes('phd') || text.includes('doctorate')) {
    return 1;
  }

  // Tier 4: Diploma / School / Undergrad
  if (
    /\b(diploma|12th|10th|hsc|ssc|high school|school)\b/i.test(text) &&
    !/\b(b\.?tech|graduate|masters|post graduate)\b/i.test(text)
  ) {
    return 4;
  }

  // Explicit Bachelor/Graduate degrees (checked before Tier 2 so that 'B.Tech CS' is Tier 3)
  if (/\b(b\.?tech|be|b\.?e|mbbs|bds|llb|bba|b\.?com|b\.?sc|ba|bca|b\.?arch|b\.?pharm|bachelors?)\b/i.test(qual)) {
    return 3;
  }

  // Tier 2: Postgraduate / Professional Master
  if (
    /\b(mba|m\.?tech|ms|m\.?s|md|m\.?d|ca|chartered accountant|company secretary|icwa|llm|m\.?sc|m\.?com|mca|m\.?e|pgdm|post graduate|masters?|professional)\b/i.test(text) ||
    text.includes('m.tech') || text.includes('mtech') || text.includes('post graduate') || text.includes('masters')
  ) {
    return 2;
  }

  // Tier 3: Graduate / Bachelor
  if (/\b(graduate|bachelors?)\b/i.test(text) || text.includes('graduate') || text.includes('bachelor')) {
    return 3;
  }

  return 3; // Default recognized qualification to Tier 3
};

/**
 * 3. Education Compatibility Evaluation (15%)
 */
const checkEducationCompatibility = (p1, p2) => {
  const t1 = classifyEducationTier(p1?.qualification, p1?.educationLevel);
  const t2 = classifyEducationTier(p2?.qualification, p2?.educationLevel);

  if (t1 === 0 || t2 === 0) {
    return {
      score: 5,
      maxScore: 15,
      tier1: t1,
      tier2: t2,
      details: 'Education details unspecified.'
    };
  }

  const diff = Math.abs(t1 - t2);
  if (diff === 0) {
    return {
      score: 15,
      maxScore: 15,
      tier1: t1,
      tier2: t2,
      details: 'Matching educational tier and background.'
    };
  }
  if (diff === 1) {
    return {
      score: 10,
      maxScore: 15,
      tier1: t1,
      tier2: t2,
      details: 'Adjacent educational tiers (Bachelor vs Master/Professional).'
    };
  }
  return {
    score: 5,
    maxScore: 15,
    tier1: t1,
    tier2: t2,
    details: 'Diverse educational backgrounds.'
  };
};

/**
 * 4. Location Proximity Evaluation (15%)
 */
const checkLocationCompatibility = (p1, p2) => {
  const city1 = (p1?.city || '').trim().toLowerCase();
  const city2 = (p2?.city || '').trim().toLowerCase();
  const state1 = (p1?.state || '').trim().toLowerCase();
  const state2 = (p2?.state || '').trim().toLowerCase();

  if (city1 && city2 && city1 === city2) {
    return {
      score: 15,
      maxScore: 15,
      sameCity: true,
      sameState: true,
      details: `Same city (${p1.city}). Excellent proximity.`
    };
  }
  if (state1 && state2 && state1 === state2) {
    return {
      score: 10,
      maxScore: 15,
      sameCity: false,
      sameState: true,
      details: `Same state (${p1.state}). Good regional proximity.`
    };
  }
  if (state1 && state2) {
    return {
      score: 5,
      maxScore: 15,
      sameCity: false,
      sameState: false,
      details: `Different states (${p1.state} vs ${p2.state}).`
    };
  }
  return {
    score: 5,
    maxScore: 15,
    sameCity: false,
    sameState: false,
    details: 'Location details partially unspecified.'
  };
};

/**
 * Classify income string into standard tiers (0 to 4)
 * Tier 4: 50+ LPA / 1 Cr+
 * Tier 3: 20-50 LPA
 * Tier 2: 10-20 LPA
 * Tier 1: 5-10 LPA
 * Tier 0: < 5 LPA
 */
const classifyIncomeTier = (incomeStr) => {
  if (!incomeStr || typeof incomeStr !== 'string') return -1;
  const clean = incomeStr.toLowerCase().replace(/,/g, '').trim();
  if (!clean) return -1;

  if (clean.includes('not specified') || clean.includes('no income') || clean.includes('unemployed') || clean.includes('none')) {
    return 0;
  }

  if (clean.includes('< 5') || clean.includes('<5') || clean.includes('below 5') || clean.includes('less than 5') || clean.includes('under 5')) {
    return 0;
  }

  if (clean.includes('cr') || clean.includes('crore')) {
    return 4;
  }

  const match = clean.match(/(\d+(\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num)) {
      if (num >= 50) return 4;
      if (num >= 20) return 3;
      if (num >= 10) return 2;
      if (num >= 5) return 1;
      return 0;
    }
  }

  return -1;
};

/**
 * 5. Income Compatibility Evaluation (10%)
 */
const checkIncomeCompatibility = (p1, p2) => {
  const inc1 = classifyIncomeTier(p1?.income);
  const inc2 = classifyIncomeTier(p2?.income);

  if (inc1 === -1 || inc2 === -1) {
    return {
      score: 5,
      maxScore: 10,
      tier1: inc1,
      tier2: inc2,
      details: 'Income details unspecified.'
    };
  }

  const diff = Math.abs(inc1 - inc2);
  if (diff === 0) {
    return {
      score: 10,
      maxScore: 10,
      tier1: inc1,
      tier2: inc2,
      details: 'Matching income bracket.'
    };
  }
  if (diff === 1) {
    return {
      score: 7,
      maxScore: 10,
      tier1: inc1,
      tier2: inc2,
      details: 'Adjacent/compatible income brackets.'
    };
  }
  return {
    score: 4,
    maxScore: 10,
    tier1: inc1,
    tier2: inc2,
    details: 'Different income brackets.'
  };
};

/**
 * 6. Manglik Astrological Compatibility Evaluation (10%)
 */
const checkManglikCompatibility = (p1, p2) => {
  const m1 = p1?.manglik || 'Non-Manglik';
  const m2 = p2?.manglik || 'Non-Manglik';

  if (m1 === 'Non-Manglik' && m2 === 'Non-Manglik') {
    return {
      score: 10,
      maxScore: 10,
      status1: m1,
      status2: m2,
      details: 'Both Non-Manglik. Astrologically compatible.'
    };
  }
  if (m1 === 'Manglik' && m2 === 'Manglik') {
    return {
      score: 10,
      maxScore: 10,
      status1: m1,
      status2: m2,
      details: 'Both Manglik. Manglik dosha neutralized.'
    };
  }
  if (m1 === 'Anshik Manglik' && m2 === 'Anshik Manglik') {
    return {
      score: 10,
      maxScore: 10,
      status1: m1,
      status2: m2,
      details: 'Both Anshik Manglik. Astrologically compatible.'
    };
  }
  if (
    (m1 === 'Anshik Manglik' && (m2 === 'Non-Manglik' || m2 === 'Manglik')) ||
    (m2 === 'Anshik Manglik' && (m1 === 'Non-Manglik' || m1 === 'Manglik'))
  ) {
    return {
      score: 6,
      maxScore: 10,
      status1: m1,
      status2: m2,
      details: 'Partial Manglik compatibility (Anshik Dosha).'
    };
  }
  if (m1 === "Don't Know" || m2 === "Don't Know") {
    return {
      score: 6,
      maxScore: 10,
      status1: m1,
      status2: m2,
      details: 'Horoscope/Manglik status pending verification.'
    };
  }

  // Manglik vs Non-Manglik dosha conflict
  return {
    score: 0,
    maxScore: 10,
    status1: m1,
    status2: m2,
    details: 'Manglik Dosha conflict (Manglik vs Non-Manglik).'
  };
};

/**
 * Master 6-Factor Compatibility Calculation Function
 * @param {object} profile1 - Requesting/Source Candidate Profile
 * @param {object} profile2 - Target Candidate Profile
 * @returns {{ totalScore: number, isSagotra: boolean, hasMaternalConflict: boolean, breakdown: object }}
 */
const calculateMatchScore = (profile1, profile2) => {
  const gotraResult = checkGotraCompatibility(profile1, profile2);
  const ageResult = checkAgeCompatibility(profile1, profile2);
  const eduResult = checkEducationCompatibility(profile1, profile2);
  const locResult = checkLocationCompatibility(profile1, profile2);
  const incResult = checkIncomeCompatibility(profile1, profile2);
  const manglikResult = checkManglikCompatibility(profile1, profile2);

  const rawTotal =
    gotraResult.score +
    ageResult.score +
    eduResult.score +
    locResult.score +
    incResult.score +
    manglikResult.score;

  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  return {
    totalScore,
    isSagotra: gotraResult.isSagotra,
    hasMaternalConflict: gotraResult.hasMaternalConflict,
    breakdown: {
      gotra: gotraResult,
      age: ageResult,
      education: eduResult,
      location: locResult,
      income: incResult,
      manglik: manglikResult
    }
  };
};

module.exports = {
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
};
