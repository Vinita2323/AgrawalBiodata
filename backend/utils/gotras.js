/**
 * 18 Authentic Agarwal Gotras Utilities & Validation
 * Derived from Maharaja Agrasen's 18 sons & patron Rishis
 */

const { AGARWAL_GOTRAS, GOTRA_NAMES_EN } = require('../config/constants');

/**
 * Normalizes input gotra string (handles Hindi, bilingual "गर्ग (Garg)", lowercase, aliases)
 * @param {string} input 
 * @returns {string|null} Canonical English gotra name or null if invalid
 */
const normalizeGotra = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Check exact canonical English match (case-insensitive)
  const directMatch = AGARWAL_GOTRAS.find(
    g => g.english.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch.english;

  // Check Hindi script match
  const hindiMatch = AGARWAL_GOTRAS.find(g => g.hindi === trimmed);
  if (hindiMatch) return hindiMatch.english;

  // Check aliases (e.g. Goel -> Goyal, Kushal -> Kuchhal, Nagal -> Nangal, Dhingan -> Goyan)
  const aliasMatch = AGARWAL_GOTRAS.find(
    g => g.aliases && g.aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())
  );
  if (aliasMatch) return aliasMatch.english;

  // Check composite format like "गर्ग (Garg)" or "Garg (गर्ग)"
  for (const gotra of AGARWAL_GOTRAS) {
    const pattern = new RegExp('(^|[\\s\\(\\[\\/])' + gotra.english + '([\\s\\)\\]\\/]|$)', 'i');
    const hindiPattern = new RegExp('(^|[\\s\\(\\[\\/])' + gotra.hindi + '([\\s\\)\\]\\/]|$)', 'i');

    if (pattern.test(trimmed) || hindiPattern.test(trimmed)) {
      const cleaned = trimmed
        .replace(new RegExp(gotra.english, 'gi'), '')
        .replace(new RegExp(gotra.hindi, 'g'), '')
        .replace(/[\s\(\)\[\]\/\-,]/g, '');

      if (cleaned === '') {
        return gotra.english;
      }
    }

    if (gotra.aliases) {
      for (const alias of gotra.aliases) {
        const aliasPattern = new RegExp('(^|[\\s\\(\\[\\/])' + alias + '([\\s\\)\\]\\/]|$)', 'i');
        if (aliasPattern.test(trimmed)) {
          const cleaned = trimmed
            .replace(new RegExp(alias, 'gi'), '')
            .replace(/[\s\(\)\[\]\/\-,]/g, '');
          if (cleaned === '') {
            return gotra.english;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Check if a gotra string is one of the 18 authentic Agarwal gotras
 * @param {string} input 
 * @returns {boolean}
 */
const isValidGotra = (input) => {
  return normalizeGotra(input) !== null;
};

/**
 * Get full metadata for a gotra
 * @param {string} input 
 * @returns {object|null}
 */
const getGotraDetails = (input) => {
  const canonical = normalizeGotra(input);
  if (!canonical) return null;
  return AGARWAL_GOTRAS.find(g => g.english === canonical) || null;
};

/**
 * Evaluates Gotra Exogamy rules between two candidates
 * Rule 1: Self Paternal Gotra must NOT match (Sagotra penalty) -> 0 points
 * Rule 2: Maternal Gotra must NOT match cross-over (2-Gotra rule) -> 50% penalty
 * @param {string} gotra1 
 * @param {string} gotra2 
 * @param {string} motherGotra1 
 * @param {string} motherGotra2 
 * @returns {{ score: number, maxScore: number, isSagotra: boolean, hasMaternalConflict: boolean, details: string }}
 */
const checkGotraExogamy = (gotra1, gotra2, motherGotra1, motherGotra2) => {
  const normG1 = normalizeGotra(gotra1);
  const normG2 = normalizeGotra(gotra2);
  const normMG1 = normalizeGotra(motherGotra1);
  const normMG2 = normalizeGotra(motherGotra2);

  // Self Paternal Sagotra check (strictly forbidden)
  if (normG1 && normG2 && normG1 === normG2) {
    return {
      score: 0,
      maxScore: 30,
      isSagotra: true,
      hasMaternalConflict: false,
      details: `Sagotra Conflict: Both belong to the same Gotra (${normG1}). Traditional marriage is forbidden.`
    };
  }

  // Maternal Gotra check (2-Gotra rule)
  const maternalConflict1 = (normMG1 && normG2 && normMG1 === normG2);
  const maternalConflict2 = (normG1 && normMG2 && normG1 === normMG2);
  const maternalMaternalConflict = (normMG1 && normMG2 && normMG1 === normMG2);

  if (maternalConflict1 || maternalConflict2 || maternalMaternalConflict) {
    return {
      score: 15,
      maxScore: 30,
      isSagotra: false,
      hasMaternalConflict: true,
      details: `Maternal Gotra overlap detected. 50% Gotra score reduction applied.`
    };
  }

  return {
    score: 30,
    maxScore: 30,
    isSagotra: false,
    hasMaternalConflict: false,
    details: `Distinct Paternal and Maternal Gotras (${normG1 || gotra1} vs ${normG2 || gotra2}). Fully compatible.`
  };
};

module.exports = {
  AGARWAL_GOTRAS,
  GOTRA_NAMES_EN,
  normalizeGotra,
  isValidGotra,
  getGotraDetails,
  checkGotraExogamy
};
