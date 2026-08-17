/**
 * Partner Preference Matcher
 * Agrawal Matrimony Platform
 *
 * Translates a profile's stored `partnerPreferences` into discovery filters.
 *
 * Two-stage by necessity: most dimensions map onto Mongo query clauses, but
 * height and income are stored as display strings (`5'6"`, `15-20 LPA`), so
 * their range checks run in memory after the query returns.
 *
 * Explicit request filters always win over a stored preference for the same
 * dimension - when someone actively searches for "Delhi" they mean Delhi, even
 * if their saved preference says Jaipur.
 */

const escapeRegex = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Parses a display height into total inches.
 * Accepts `5'6"`, `5 ft 6 in`, `168 cm` and bare numbers (treated as cm).
 * @param {string} height
 * @returns {number|null} inches, or null when unparseable
 */
const parseHeightToInches = (height) => {
  if (!height) return null;
  const value = String(height).trim();

  const feetInches = value.match(/(\d+)\s*(?:'|ft|feet)\s*(\d+)?/i);
  if (feetInches) {
    return parseInt(feetInches[1], 10) * 12 + (feetInches[2] ? parseInt(feetInches[2], 10) : 0);
  }

  const cm = value.match(/(\d+(?:\.\d+)?)\s*cm/i);
  if (cm) return parseFloat(cm[1]) / 2.54;

  const plain = parseFloat(value);
  if (!Number.isNaN(plain) && plain > 90) return plain / 2.54;

  return null;
};

/**
 * Parses an income band into its lower bound in lakh.
 * Accepts `15-20 LPA`, `30+ LPA`, `12 LPA`.
 * @param {string} income
 * @returns {number|null}
 */
const parseIncomeToLakh = (income) => {
  if (!income) return null;
  const match = String(income).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

const CM_PER_INCH = 2.54;

/** True when the value is a non-empty array. */
const hasItems = (value) => Array.isArray(value) && value.length > 0;

/** Case-insensitive exact-match clause for a list of strings. */
const anyOf = (values) => ({
  $in: values.filter(Boolean).map((v) => new RegExp(`^${escapeRegex(String(v).trim())}$`, 'i'))
});

/**
 * Whether a preferences object constrains anything at all.
 * A profile that has never set preferences must not have its feed filtered.
 * @param {object} preferences
 * @returns {boolean}
 */
function hasAnyPreference(preferences) {
  if (!preferences) return false;

  return Boolean(
    preferences.minAge ||
      preferences.maxAge ||
      preferences.minHeightCm ||
      preferences.maxHeightCm ||
      hasItems(preferences.maritalStatus) ||
      preferences.manglik ||
      hasItems(preferences.educationLevels) ||
      hasItems(preferences.occupations) ||
      preferences.minIncomeLakh ||
      hasItems(preferences.cities) ||
      hasItems(preferences.states) ||
      hasItems(preferences.diet) ||
      hasItems(preferences.excludeGotras) ||
      preferences.verifiedOnly
  );
}

/**
 * Builds the Mongo clauses for the preference dimensions that can be queried.
 *
 * Clauses are returned as an array destined for `$and` rather than merged into
 * the caller's query object: several dimensions need `$or` internally, and
 * assigning `query.$or` twice would silently drop the first one.
 *
 * @param {object} preferences
 * @param {Set<string>} [skip] dimension keys the caller already filtered explicitly
 * @returns {Array<object>} clauses for `$and`
 */
function buildPreferenceClauses(preferences, skip = new Set()) {
  const clauses = [];
  if (!preferences) return clauses;

  const now = new Date();

  // Age -> date-of-birth window
  if (!skip.has('age') && (preferences.minAge || preferences.maxAge)) {
    const dob = {};
    if (preferences.minAge) {
      dob.$lte = new Date(now.getFullYear() - preferences.minAge, now.getMonth(), now.getDate());
    }
    if (preferences.maxAge) {
      dob.$gte = new Date(now.getFullYear() - preferences.maxAge - 1, now.getMonth(), now.getDate());
    }
    clauses.push({ dob });
  }

  if (!skip.has('maritalStatus') && hasItems(preferences.maritalStatus)) {
    clauses.push({ maritalStatus: anyOf(preferences.maritalStatus) });
  }

  if (!skip.has('manglik') && preferences.manglik) {
    clauses.push({ manglik: preferences.manglik });
  }

  if (!skip.has('education') && hasItems(preferences.educationLevels)) {
    clauses.push({
      $or: preferences.educationLevels.flatMap((level) => {
        const pattern = new RegExp(escapeRegex(String(level).trim()), 'i');
        return [{ educationLevel: pattern }, { qualification: pattern }];
      })
    });
  }

  if (!skip.has('occupation') && hasItems(preferences.occupations)) {
    clauses.push({
      $or: preferences.occupations.flatMap((occ) => {
        const pattern = new RegExp(escapeRegex(String(occ).trim()), 'i');
        return [{ occupation: pattern }, { workingAt: pattern }];
      })
    });
  }

  if (!skip.has('city') && hasItems(preferences.cities)) {
    clauses.push({ city: anyOf(preferences.cities) });
  }

  if (!skip.has('state') && hasItems(preferences.states)) {
    clauses.push({ state: anyOf(preferences.states) });
  }

  if (!skip.has('diet') && hasItems(preferences.diet)) {
    clauses.push({ diet: anyOf(preferences.diet) });
  }

  // Gotra exclusions are additive to the engine's own exogamy rules.
  if (!skip.has('gotra') && hasItems(preferences.excludeGotras)) {
    clauses.push({ gotra: { $nin: preferences.excludeGotras } });
  }

  if (!skip.has('verified') && preferences.verifiedOnly) {
    clauses.push({ verified: true });
  }

  return clauses;
}

/**
 * Applies the preference dimensions that cannot be expressed as Mongo clauses
 * because their source fields are display strings.
 *
 * @param {Array} candidates Mongoose Profile documents
 * @param {object} preferences
 * @param {Set<string>} [skip]
 * @returns {Array} the surviving candidates
 */
function applyPostQueryPreferences(candidates, preferences, skip = new Set()) {
  if (!preferences) return candidates;

  let result = candidates;

  const minIn = !skip.has('height') && preferences.minHeightCm
    ? preferences.minHeightCm / CM_PER_INCH
    : null;
  const maxIn = !skip.has('height') && preferences.maxHeightCm
    ? preferences.maxHeightCm / CM_PER_INCH
    : null;

  if (minIn !== null || maxIn !== null) {
    result = result.filter((c) => {
      const inches = parseHeightToInches(c.height);
      // An unparseable or missing height cannot be shown to satisfy a stated
      // range, so it is excluded rather than assumed to fit.
      if (inches === null) return false;
      if (minIn !== null && inches < minIn) return false;
      if (maxIn !== null && inches > maxIn) return false;
      return true;
    });
  }

  if (!skip.has('income') && preferences.minIncomeLakh) {
    result = result.filter((c) => {
      const lakh = parseIncomeToLakh(c.income);
      return lakh !== null && lakh >= preferences.minIncomeLakh;
    });
  }

  return result;
}

/**
 * Scores how well one candidate fits the stated preferences, and lists which
 * dimensions matched. Used to annotate results so the UI can explain a match
 * rather than presenting an opaque ranking.
 *
 * @param {object} preferences
 * @param {object} candidate Mongoose Profile document
 * @param {number|null} candidateAge
 * @returns {{ score: number, matched: string[], total: number }}
 */
function evaluatePreferenceFit(preferences, candidate, candidateAge = null) {
  const matched = [];
  let total = 0;

  if (!preferences) return { score: 100, matched, total };

  const check = (label, isConstrained, isSatisfied) => {
    if (!isConstrained) return;
    total += 1;
    if (isSatisfied) matched.push(label);
  };

  check(
    'age',
    Boolean(preferences.minAge || preferences.maxAge),
    candidateAge !== null &&
      (!preferences.minAge || candidateAge >= preferences.minAge) &&
      (!preferences.maxAge || candidateAge <= preferences.maxAge)
  );

  const inches = parseHeightToInches(candidate.height);
  check(
    'height',
    Boolean(preferences.minHeightCm || preferences.maxHeightCm),
    inches !== null &&
      (!preferences.minHeightCm || inches >= preferences.minHeightCm / CM_PER_INCH) &&
      (!preferences.maxHeightCm || inches <= preferences.maxHeightCm / CM_PER_INCH)
  );

  const matchesAny = (list, value) =>
    hasItems(list) &&
    list.some((item) => String(item).trim().toLowerCase() === String(value || '').trim().toLowerCase());

  check('maritalStatus', hasItems(preferences.maritalStatus), matchesAny(preferences.maritalStatus, candidate.maritalStatus));
  check('manglik', Boolean(preferences.manglik), preferences.manglik === candidate.manglik);
  check('city', hasItems(preferences.cities), matchesAny(preferences.cities, candidate.city));
  check('state', hasItems(preferences.states), matchesAny(preferences.states, candidate.state));
  check('diet', hasItems(preferences.diet), matchesAny(preferences.diet, candidate.diet));

  check(
    'education',
    hasItems(preferences.educationLevels),
    hasItems(preferences.educationLevels) &&
      preferences.educationLevels.some((level) => {
        const pattern = new RegExp(escapeRegex(String(level).trim()), 'i');
        return pattern.test(candidate.educationLevel || '') || pattern.test(candidate.qualification || '');
      })
  );

  check(
    'occupation',
    hasItems(preferences.occupations),
    hasItems(preferences.occupations) &&
      preferences.occupations.some((occ) => {
        const pattern = new RegExp(escapeRegex(String(occ).trim()), 'i');
        return pattern.test(candidate.occupation || '') || pattern.test(candidate.workingAt || '');
      })
  );

  const lakh = parseIncomeToLakh(candidate.income);
  check(
    'income',
    Boolean(preferences.minIncomeLakh),
    lakh !== null && lakh >= preferences.minIncomeLakh
  );

  check('verified', Boolean(preferences.verifiedOnly), Boolean(candidate.verified));

  return {
    // With nothing constrained every candidate fits equally.
    score: total === 0 ? 100 : Math.round((matched.length / total) * 100),
    matched,
    total
  };
}

module.exports = {
  hasAnyPreference,
  buildPreferenceClauses,
  applyPostQueryPreferences,
  evaluatePreferenceFit,
  parseHeightToInches,
  parseIncomeToLakh
};
