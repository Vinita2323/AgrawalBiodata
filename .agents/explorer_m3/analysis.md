# Milestone 3 Architecture & Design Analysis
## Agrawal Biodata Matrimony Platform — Weighted Match Engine, Social Interactions & Discovery

---

## 1. Executive Summary

Milestone 3 implements the core matrimonial matching engine, discovery systems, and interpersonal interactions for the Agrawal Matrimony platform. Building upon Milestone 1 (Core Infrastructure & OTP Auth) and Milestone 2 (Candidate Biodata & 18 Gotras Multi-Profile Management), Milestone 3 delivers:

1. **6-Factor Weighted Match Engine (`services/matchEngine.js`)**: Real-time compatibility scoring (0–100%) incorporating strict Gotra exogamy (30%), age alignment (20%), education compatibility (15%), location proximity (15%), income bracket alignment (10%), and Manglik astrological harmony (10%).
2. **Gotra Exogamy Rules**: Zero tolerance (0 pts + Sagotra conflict flag) for paternal Gotra matches; 50% score penalty (15 pts) for maternal Gotra overlaps (2-Gotra rule).
3. **Match Discovery Endpoints (`matchController.js` & `matchRoutes.js`)**: Paginated matching feed (`GET /api/matches`), curated daily recommendation carousel (`GET /api/matches/today`), multi-field search engine (`GET /api/matches/search`), and on-demand score breakdown (`GET /api/matches/score/:targetProfileId`).
4. **Interest Lifecycle System (`interestController.js` & `interestRoutes.js`)**: Full state machine (Pending → Accepted / Declined / Cancelled) with sent/received tracking and mutual contact unlocking upon acceptance.
5. **Social & Privacy Interactivity**: Shortlist/favorites (`shortlistController.js`), deduplicated daily visitor tracking (`visitorController.js`), bidirectional blocking & filtering (`blockController.js`), and privacy masking/unmasking rules in `profileController.js`.
6. **Comprehensive Automated Test Suite (`tests/matches.test.js`)**: 4-tier testing + adversarial coverage verifying calculation accuracy, discovery filtering, interest lifecycle, privacy unlocking, and security barriers.

---

## 2. Match Engine Architecture (`services/matchEngine.js`)

### 2.1 6-Factor Compatibility Scoring Formula

The total compatibility score $S_{\text{total}} \in [0, 100]$ is computed as:
$$S_{\text{total}} = S_{\text{gotra}} + S_{\text{age}} + S_{\text{education}} + S_{\text{location}} + S_{\text{income}} + S_{\text{manglik}}$$

| Factor | Weight | Max Pts | Core Criteria & Scoring Rubric |
|---|---|---|---|
| **1. Gotra Exogamy** | 30% | 30 | • **Distinct Paternal & Maternal Gotras**: 30 pts<br>• **Maternal Gotra Overlap (2-Gotra Rule)**: 15 pts (50% penalty)<br>• **Sagotra Paternal Conflict**: 0 pts (Strictly forbidden, `isSagotra: true`) |
| **2. Age Alignment** | 20% | 20 | • **$\Delta \le 2$ years**: 20 pts (Perfect alignment)<br>• **$\Delta \le 4$ years**: 15 pts (Good alignment)<br>• **$\Delta \le 6$ years**: 10 pts (Moderate alignment)<br>• **$\Delta \le 8$ years**: 5 pts (Acceptable alignment)<br>• **$\Delta > 8$ years**: 0 pts (Significant age gap)<br>• **Missing DOB**: 10 pts (Neutral fallback) |
| **3. Education Alignment** | 15% | 15 | • **Matching Tier (Tiers 1–3)**: 15 pts<br>• **Adjacent Tier ($\pm 1$ level)**: 10 pts<br>• **Diverse Tiers ($\pm 2+$ levels)**: 5 pts<br>• **Unspecified/Missing**: 5 pts |
| **4. Location Proximity** | 15% | 15 | • **Same City (case-insensitive)**: 15 pts<br>• **Same State**: 10 pts<br>• **Different States**: 5 pts<br>• **Unspecified/Missing**: 5 pts |
| **5. Income Bracket Alignment** | 10% | 10 | • **Same Income Bracket**: 10 pts<br>• **Adjacent Bracket ($\pm 1$ tier)**: 7 pts<br>• **Diverse Brackets ($\pm 2+$ tiers)**: 4 pts<br>• **Unspecified/Missing**: 5 pts |
| **6. Manglik Alignment** | 10% | 10 | • **Both Non-Manglik / Both Manglik / Both Anshik**: 10 pts<br>• **Anshik Manglik + Non-Manglik / Manglik**: 6 pts<br>• **"Don't Know" + Any**: 6 pts<br>• **Manglik + Non-Manglik**: 0 pts (Astrological Dosha Conflict) |

---

### 2.2 Detailed Factor Algorithms

#### Factor 1: Gotra Exogamy
```javascript
const checkGotraCompatibility = (p1, p2) => {
  const normG1 = normalizeGotra(p1.gotra);
  const normG2 = normalizeGotra(p2.gotra);
  const normMG1 = normalizeGotra(p1.motherGotra);
  const normMG2 = normalizeGotra(p2.motherGotra);

  // 1. Paternal Sagotra Check
  if (normG1 && normG2 && normG1 === normG2) {
    return {
      score: 0,
      maxScore: 30,
      isSagotra: true,
      hasMaternalConflict: false,
      details: `Sagotra Conflict: Both belong to the same Gotra (${normG1}). Traditional marriage is forbidden.`
    };
  }

  // 2. Maternal Gotra Overlap (2-Gotra Rule)
  const maternalConflict1 = (normMG1 && normG2 && normMG1 === normG2);
  const maternalConflict2 = (normG1 && normMG2 && normG1 === normMG2);
  const maternalMaternalConflict = (normMG1 && normMG2 && normMG1 === normMG2);

  if (maternalConflict1 || maternalConflict2 || maternalMaternalConflict) {
    return {
      score: 15,
      maxScore: 30,
      isSagotra: false,
      hasMaternalConflict: true,
      details: 'Maternal Gotra overlap detected. 50% Gotra score reduction applied.'
    };
  }

  // 3. Fully Distinct Gotras
  return {
    score: 30,
    maxScore: 30,
    isSagotra: false,
    hasMaternalConflict: false,
    details: `Distinct Paternal and Maternal Gotras (${normG1 || p1.gotra} vs ${normG2 || p2.gotra}). Fully compatible.`
  };
};
```

#### Factor 2: Age Compatibility
```javascript
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const diffMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const checkAgeCompatibility = (p1, p2) => {
  const age1 = calculateAge(p1.dob);
  const age2 = calculateAge(p2.dob);

  if (age1 === null || age2 === null) {
    return { score: 10, maxScore: 20, age1, age2, ageDiff: null, details: 'Age information incomplete; default moderate score applied.' };
  }

  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff <= 2) {
    return { score: 20, maxScore: 20, age1, age2, ageDiff, details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Perfect age alignment.` };
  }
  if (ageDiff <= 4) {
    return { score: 15, maxScore: 20, age1, age2, ageDiff, details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Good age alignment.` };
  }
  if (ageDiff <= 6) {
    return { score: 10, maxScore: 20, age1, age2, ageDiff, details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Moderate age alignment.` };
  }
  if (ageDiff <= 8) {
    return { score: 5, maxScore: 20, age1, age2, ageDiff, details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Acceptable age alignment.` };
  }
  return { score: 0, maxScore: 20, age1, age2, ageDiff, details: `Age gap: ${ageDiff} years (${age1} vs ${age2}). Significant age difference.` };
};
```

#### Factor 3: Education Classification & Scoring
```javascript
const classifyEducationTier = (qualification, educationLevel) => {
  const text = `${qualification || ''} ${educationLevel || ''}`.toLowerCase();
  if (text.match(/ph\.?d|doctorate|post doc|dm|mch|dnb/)) return 1; // Tier 1: Doctorate
  if (text.match(/mba|m\.?tech|ms|m\.?s|md|m\.?d|ca|chartered accountant|cs|icwa|llm|m\.?sc|m\.?com|mca|m\.?e|pgdm/)) return 2; // Tier 2: Postgraduate / Professional
  if (text.match(/b\.?tech|be|b\.?e|mbbs|bds|llb|bba|b\.?com|b\.?sc|ba|bca|b\.?arch|b\.?pharm/)) return 3; // Tier 3: Graduate / Bachelor
  if (text.match(/diploma|12th|10th|hsc|ssc/)) return 4; // Tier 4: Diploma / Undergrad
  return text.trim().length > 0 ? 3 : 0; // Default recognized qualification to Tier 3
};

const checkEducationCompatibility = (p1, p2) => {
  const t1 = classifyEducationTier(p1.qualification, p1.educationLevel);
  const t2 = classifyEducationTier(p2.qualification, p2.educationLevel);

  if (t1 === 0 || t2 === 0) {
    return { score: 5, maxScore: 15, tier1: t1, tier2: t2, details: 'Education details unspecified.' };
  }

  const diff = Math.abs(t1 - t2);
  if (diff === 0) {
    return { score: 15, maxScore: 15, tier1: t1, tier2: t2, details: 'Matching educational tier and background.' };
  }
  if (diff === 1) {
    return { score: 10, maxScore: 15, tier1: t1, tier2: t2, details: 'Adjacent educational tiers (Bachelor vs Master/Professional).' };
  }
  return { score: 5, maxScore: 15, tier1: t1, tier2: t2, details: 'Diverse educational backgrounds.' };
};
```

#### Factor 4: Location Proximity
```javascript
const checkLocationCompatibility = (p1, p2) => {
  const city1 = (p1.city || '').trim().toLowerCase();
  const city2 = (p2.city || '').trim().toLowerCase();
  const state1 = (p1.state || '').trim().toLowerCase();
  const state2 = (p2.state || '').trim().toLowerCase();

  if (city1 && city2 && city1 === city2) {
    return { score: 15, maxScore: 15, sameCity: true, sameState: true, details: `Same city (${p1.city}). Excellent proximity.` };
  }
  if (state1 && state2 && state1 === state2) {
    return { score: 10, maxScore: 15, sameCity: false, sameState: true, details: `Same state (${p1.state}). Good regional proximity.` };
  }
  if (state1 && state2) {
    return { score: 5, maxScore: 15, sameCity: false, sameState: false, details: `Different states (${p1.state} vs ${p2.state}).` };
  }
  return { score: 5, maxScore: 15, sameCity: false, sameState: false, details: 'Location details partially unspecified.' };
};
```

#### Factor 5: Income Bracket Classification
```javascript
const classifyIncomeTier = (incomeStr) => {
  if (!incomeStr) return -1;
  const clean = incomeStr.toLowerCase().replace(/,/g, '').trim();

  // Range matches
  if (clean.includes('50+') || clean.includes('50 l') || clean.includes('1 cr') || clean.includes('75 l')) return 4;
  if (clean.includes('20') || clean.includes('25') || clean.includes('30') || clean.includes('35') || clean.includes('40')) return 3;
  if (clean.includes('10') || clean.includes('12') || clean.includes('15') || clean.includes('18')) return 2;
  if (clean.includes('5') || clean.includes('6') || clean.includes('7') || clean.includes('8')) return 1;
  if (clean.includes('< 5') || clean.includes('below 5') || clean.includes('3') || clean.includes('4')) return 0;

  // Numeric fallback if raw number in lakhs
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    if (num >= 50) return 4;
    if (num >= 20) return 3;
    if (num >= 10) return 2;
    if (num >= 5) return 1;
    return 0;
  }
  return -1;
};

const checkIncomeCompatibility = (p1, p2) => {
  const inc1 = classifyIncomeTier(p1.income);
  const inc2 = classifyIncomeTier(p2.income);

  if (inc1 === -1 || inc2 === -1) {
    return { score: 5, maxScore: 10, details: 'Income details unspecified.' };
  }

  const diff = Math.abs(inc1 - inc2);
  if (diff === 0) {
    return { score: 10, maxScore: 10, details: 'Matching income bracket.' };
  }
  if (diff === 1) {
    return { score: 7, maxScore: 10, details: 'Adjacent/compatible income brackets.' };
  }
  return { score: 4, maxScore: 10, details: 'Different income brackets.' };
};
```

#### Factor 6: Manglik Compatibility
```javascript
const checkManglikCompatibility = (p1, p2) => {
  const m1 = p1.manglik || 'Non-Manglik';
  const m2 = p2.manglik || 'Non-Manglik';

  if (m1 === 'Non-Manglik' && m2 === 'Non-Manglik') {
    return { score: 10, maxScore: 10, status1: m1, status2: m2, details: 'Both Non-Manglik. Astrologically compatible.' };
  }
  if (m1 === 'Manglik' && m2 === 'Manglik') {
    return { score: 10, maxScore: 10, status1: m1, status2: m2, details: 'Both Manglik. Manglik dosha neutralized.' };
  }
  if (m1 === 'Anshik Manglik' && m2 === 'Anshik Manglik') {
    return { score: 10, maxScore: 10, status1: m1, status2: m2, details: 'Both Anshik Manglik. Astrologically compatible.' };
  }
  if (
    (m1 === 'Anshik Manglik' && (m2 === 'Non-Manglik' || m2 === 'Manglik')) ||
    (m2 === 'Anshik Manglik' && (m1 === 'Non-Manglik' || m1 === 'Manglik'))
  ) {
    return { score: 6, maxScore: 10, status1: m1, status2: m2, details: 'Partial Manglik compatibility (Anshik Dosha).' };
  }
  if (m1 === "Don't Know" || m2 === "Don't Know") {
    return { score: 6, maxScore: 10, status1: m1, status2: m2, details: 'Horoscope/Manglik status pending verification.' };
  }
  // Manglik vs Non-Manglik
  return { score: 0, maxScore: 10, status1: m1, status2: m2, details: 'Manglik Dosha conflict (Manglik vs Non-Manglik).' };
};
```

### 2.3 Master Score Function & Breakdown Payload
```javascript
const calculateMatchScore = (profile1, profile2) => {
  const gotraResult = checkGotraCompatibility(profile1, profile2);
  const ageResult = checkAgeCompatibility(profile1, profile2);
  const eduResult = checkEducationCompatibility(profile1, profile2);
  const locResult = checkLocationCompatibility(profile1, profile2);
  const incResult = checkIncomeCompatibility(profile1, profile2);
  const manglikResult = checkManglikCompatibility(profile1, profile2);

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      gotraResult.score +
      ageResult.score +
      eduResult.score +
      locResult.score +
      incResult.score +
      manglikResult.score
    )
  );

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
```

---

## 3. Mongoose Models Specification

### 3.1 `models/Match.js`
Stores cached match calculations and daily recommendations.
```javascript
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    matchedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
      index: true
    },
    isSagotra: {
      type: Boolean,
      default: false
    },
    hasMaternalConflict: {
      type: Boolean,
      default: false
    },
    isDailyRecommendation: {
      type: Boolean,
      default: false,
      index: true
    },
    breakdown: {
      gotra: { type: mongoose.Schema.Types.Mixed },
      age: { type: mongoose.Schema.Types.Mixed },
      education: { type: mongoose.Schema.Types.Mixed },
      location: { type: mongoose.Schema.Types.Mixed },
      income: { type: mongoose.Schema.Types.Mixed },
      manglik: { type: mongoose.Schema.Types.Mixed }
    },
    viewed: {
      type: Boolean,
      default: false
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

matchSchema.index({ profileId: 1, matchedProfileId: 1 }, { unique: true });
matchSchema.index({ profileId: 1, matchScore: -1 });

module.exports = mongoose.model('Match', matchSchema);
```

### 3.2 `models/Interest.js`
Tracks the complete lifecycle of matrimonial interests.
```javascript
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

interestSchema.index({ senderProfileId: 1, recipientProfileId: 1 }, { unique: true });
interestSchema.index({ recipientUserId: 1, status: 1, createdAt: -1 });
interestSchema.index({ senderUserId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Interest', interestSchema);
```

### 3.3 `models/Shortlist.js`
Handles profile bookmarks/favorites.
```javascript
const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    shortlistedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

shortlistSchema.index({ profileId: 1, shortlistedProfileId: 1 }, { unique: true });
shortlistSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Shortlist', shortlistSchema);
```

### 3.4 `models/Visitor.js`
Tracks profile views with deduplication per calendar day.
```javascript
const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    visitedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    visitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    visitorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    visitorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    visitDate: {
      type: Date,
      required: true,
      index: true // YYYY-MM-DD UTC midnight
    },
    visitCount: {
      type: Number,
      default: 1
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

visitorSchema.index({ visitedProfileId: 1, visitorProfileId: 1, visitDate: 1 }, { unique: true });
visitorSchema.index({ visitedProfileId: 1, lastVisitedAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);
```

### 3.5 `models/Block.js`
Manages blocking of offending or unwanted profiles.
```javascript
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    blockerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blockerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    blockedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ['Inappropriate Behavior', 'Spam/Fake Profile', 'Harassment', 'Not Interested', 'Other'],
      default: 'Other'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

blockSchema.index({ blockerUserId: 1, blockedUserId: 1 }, { unique: true });
blockSchema.index({ blockerProfileId: 1, blockedProfileId: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
```

---

## 4. API Endpoints & Route Contracts

### 4.1 Match Discovery Routes (`/api/matches`)

| Method | Endpoint | Auth | Description | Query / Body Params | Response Structure |
|---|---|---|---|---|---|
| `GET` | `/api/matches` | `Bearer` (User) | Get paginated matches for active profile | `page`, `limit`, `gotra`, `minAge`, `maxAge`, `city`, `state`, `manglik`, `education`, `minIncome`, `verifiedOnly`, `sort` (`score`, `recent`, `age`) | `{ success: true, data: { matches: [...], pagination: { total, page, limit, totalPages } } }` |
| `GET` | `/api/matches/today` | `Bearer` (User) | Get top daily recommendations carousel | `limit` (default 6) | `{ success: true, data: { recommendations: [...] } }` |
| `GET` | `/api/matches/search` | `Bearer` (User) | Multi-field search for candidates | `query`, `gotra`, `gender`, `minAge`, `maxAge`, `city`, `state`, `qualification`, `occupation`, `maritalStatus`, `manglik`, `income`, `page`, `limit` | `{ success: true, data: { results: [...], pagination: { ... } } }` |
| `GET` | `/api/matches/score/:targetProfileId` | `Bearer` (User) | On-demand 6-factor compatibility score | `:targetProfileId` (MongoDB ID or PRF-ID) | `{ success: true, data: { targetProfileId, totalScore, breakdown: { gotra, age, education, location, income, manglik } } }` |

---

### 4.2 Interest Lifecycle Routes (`/api/interests`)

| Method | Endpoint | Auth | Description | Payload / Params | Response Structure |
|---|---|---|---|---|---|
| `POST` | `/api/interests` | `Bearer` (User) | Express interest in a candidate | `{ recipientProfileId: string, message?: string }` | `201 Created` `{ success: true, message: 'Interest expressed successfully', data: { interest } }` |
| `PUT` | `/api/interests/:id/accept` | `Bearer` (User) | Accept incoming interest (unlocks contacts) | `:id` (Interest ID) | `200 OK` `{ success: true, message: 'Interest accepted. Contacts unlocked.', data: { interest } }` |
| `PUT` | `/api/interests/:id/decline` | `Bearer` (User) | Decline incoming interest | `:id` (Interest ID) | `200 OK` `{ success: true, message: 'Interest declined', data: { interest } }` |
| `DELETE` | `/api/interests/:id` | `Bearer` (User) | Cancel sent pending interest | `:id` (Interest ID) | `200 OK` `{ success: true, message: 'Interest cancelled' }` |
| `GET` | `/api/interests/received` | `Bearer` (User) | List received interests | `status` (Pending/Accepted/Declined), `page`, `limit` | `200 OK` `{ success: true, data: { interests: [...], pagination: { ... } } }` |
| `GET` | `/api/interests/sent` | `Bearer` (User) | List sent interests | `status`, `page`, `limit` | `200 OK` `{ success: true, data: { interests: [...], pagination: { ... } } }` |
| `GET` | `/api/interests/status/:targetProfileId` | `Bearer` (User) | Check interest status with candidate | `:targetProfileId` | `200 OK` `{ success: true, data: { status: 'None'\|'Pending'\|'Accepted'\|'Declined', isSender, interestId } }` |

---

### 4.3 Shortlist / Favorites Routes (`/api/shortlist`)

| Method | Endpoint | Auth | Description | Payload / Params | Response Structure |
|---|---|---|---|---|---|
| `POST` | `/api/shortlist` | `Bearer` (User) | Add candidate to shortlist | `{ shortlistedProfileId: string, notes?: string }` | `201/200` `{ success: true, message: 'Profile shortlisted', data: { shortlist } }` |
| `DELETE` | `/api/shortlist/:targetProfileId` | `Bearer` (User) | Remove candidate from shortlist | `:targetProfileId` | `200 OK` `{ success: true, message: 'Profile removed from shortlist' }` |
| `GET` | `/api/shortlist` | `Bearer` (User) | Get all shortlisted profiles | `page`, `limit` | `200 OK` `{ success: true, data: { shortlists: [...], pagination: { ... } } }` |
| `GET` | `/api/shortlist/check/:targetProfileId` | `Bearer` (User) | Check if candidate is shortlisted | `:targetProfileId` | `200 OK` `{ success: true, data: { isShortlisted: boolean } }` |

---

### 4.4 Profile Visitor Routes (`/api/visitors`)

| Method | Endpoint | Auth | Description | Payload / Params | Response Structure |
|---|---|---|---|---|---|
| `POST` | `/api/visitors/record/:targetProfileId` | `Bearer` (User) | Record profile view (daily deduplicated) | `:targetProfileId` | `200 OK` `{ success: true, message: 'Visit recorded', data: { recorded: boolean } }` |
| `GET` | `/api/visitors/recent` | `Bearer` (User) | Get recent profile visitors | `page`, `limit` | `200 OK` `{ success: true, data: { visitors: [...], pagination: { ... } } }` |
| `GET` | `/api/visitors/count` | `Bearer` (User) | Get aggregate visitor metrics | none | `200 OK` `{ success: true, data: { totalVisitors, todayVisitors, weeklyVisitors } }` |

---

### 4.5 Block / Blacklist Routes (`/api/blocks`)

| Method | Endpoint | Auth | Description | Payload / Params | Response Structure |
|---|---|---|---|---|---|
| `POST` | `/api/blocks` | `Bearer` (User) | Block a user / profile | `{ blockedProfileId: string, reason?: string, notes?: string }` | `201 Created` `{ success: true, message: 'Profile blocked successfully', data: { block } }` |
| `DELETE` | `/api/blocks/:targetProfileId` | `Bearer` (User) | Unblock a profile | `:targetProfileId` | `200 OK` `{ success: true, message: 'Profile unblocked successfully' }` |
| `GET` | `/api/blocks` | `Bearer` (User) | Get list of blocked profiles | `page`, `limit` | `200 OK` `{ success: true, data: { blocks: [...], pagination: { ... } } }` |
| `GET` | `/api/blocks/check/:targetProfileId` | `Bearer` (User) | Check block status | `:targetProfileId` | `200 OK` `{ success: true, data: { isBlocked: boolean } }` |

---

## 5. Privacy & Mutual Unlocking Logic

### 5.1 Mutual Unlocking Rules
When candidate profile $A$ and profile $B$ have an `Accepted` interest between them:
1. They are officially classified as **Connected Members**.
2. **Phone Number**: If `privacySettings.phoneVisibility` is `'Connected Members Only'` or `'Connected Only'`, the raw unmasked phone number is revealed.
3. **Residential Address**: If `privacySettings.addressVisibility` is `'Connected Members Only'` or `'Connected Only'`, the raw unmasked residential address is revealed.
4. **Photos**: If `privacySettings.photoVisibility` is `'Visible to Connected'` or `'Connected Only'`, photo URLs are unmasked (`photoMasked = false`).
5. If `phoneVisibility === 'Hidden'`, the phone number remains hidden/protected even for connected members.

### 5.2 Bidirectional Blocking Enforcement
If User $A$ blocks User $B$:
1. $B$ cannot view $A$'s profile (returns 404 Not Found or 403 Forbidden).
2. Neither $A$ nor $B$ appear in each other's `/api/matches`, `/api/matches/today`, `/api/matches/search`, or `/api/visitors/recent`.
3. Neither party can send an interest to the other.
4. Any active/pending interest between them is immediately transitioned to `Cancelled`.
5. Any existing shortlist entry between them is removed.

---

## 6. Implementation Architecture & File Layout

```
backend/
├── config/
│   └── constants.js            <-- Add INTEREST_STATUS, BLOCK_REASONS
├── models/
│   ├── User.js                 (Existing M1)
│   ├── Profile.js              (Existing M2)
│   ├── Match.js                <-- NEW: Match calculation & recommendation schema
│   ├── Interest.js             <-- NEW: Interest lifecycle schema
│   ├── Shortlist.js            <-- NEW: Shortlist / bookmarks schema
│   ├── Visitor.js              <-- NEW: Daily-deduplicated visitor schema
│   └── Block.js                <-- NEW: User blocking & moderation schema
├── controllers/
│   ├── matchController.js      <-- NEW: Discovery, feed, search, today carousel
│   ├── interestController.js   <-- NEW: Express, accept, decline, cancel, lists
│   ├── shortlistController.js  <-- NEW: Add, remove, list, check
│   ├── visitorController.js    <-- NEW: Record, recent, count
│   ├── blockController.js      <-- NEW: Block, unblock, list, check
│   └── profileController.js    <-- UPDATE: Integrate connection-aware privacy unmasking
├── routes/
│   ├── index.js                <-- UPDATE: Mount /matches, /interests, /shortlist, /visitors, /blocks
│   ├── matchRoutes.js          <-- NEW
│   ├── interestRoutes.js       <-- NEW
│   ├── shortlistRoutes.js      <-- NEW
│   ├── visitorRoutes.js        <-- NEW
│   └── blockRoutes.js          <-- NEW
├── services/
│   └── matchEngine.js          <-- NEW: 6-factor algorithm, Gotra exogamy, scoring
└── tests/
    └── matches.test.js         <-- NEW: Milestone 3 test suite
```

---

## 7. Comprehensive Test Plan (`tests/matches.test.js`)

The Milestone 3 test suite will encompass 6 rigorous sections:

### Section 1: 6-Factor Weighted Match Engine Unit Tests
- `calculateMatchScore` with perfect compatibility achieves 90–100% score.
- Age gap boundary tests ($\Delta = 0, 2, 4, 6, 8, 12$ years).
- Education tier matching, adjacent, and diverse combinations.
- Location matching: same city (15 pts), same state (10 pts), different state (5 pts).
- Income bracket alignment: same bracket (10 pts), $\pm 1$ tier (7 pts), $\pm 2$ tiers (4 pts).
- Manglik status combinations: Non-Manglik+Non-Manglik (10), Manglik+Manglik (10), Anshik+Anshik (10), Manglik+Non-Manglik (0 pts), Don't Know (6 pts).

### Section 2: Gotra Exogamy Rules Empirical Validation
- Sagotra paternal conflict strictly yields 0 Gotra pts and sets `isSagotra: true`.
- Maternal Gotra conflict (2-Gotra rule) applies 50% penalty (15 pts) and sets `hasMaternalConflict: true`.
- Distinct Gotras yield full 30 pts.
- Aliases, Hindi script, and bilingual formats correctly normalize before Gotra checks.

### Section 3: Match Discovery Endpoints
- `GET /api/matches`: Excludes same-gender profiles, user's own profiles, and blocked users; sorts by `matchScore` descending; paginates properly.
- `GET /api/matches/today`: Delivers top compatible carousel profiles (non-Sagotra, score $\ge 60$).
- `GET /api/matches/search`: Multi-field search across keyword text, gotra, age range, location, and income.
- `GET /api/matches/score/:targetProfileId`: Returns exact 6-factor breakdown payload.

### Section 4: Interest Lifecycle & Privacy Unlocking
- `POST /api/interests`: Creates Pending interest; prevents duplicate or self-interests.
- `PUT /api/interests/:id/accept`: Transitions status to Accepted; sets `respondedAt`.
- `PUT /api/interests/:id/decline`: Transitions status to Declined.
- `DELETE /api/interests/:id`: Cancels pending interest.
- `GET /api/interests/sent` and `GET /api/interests/received`: Return filtered and populated interests.
- **Privacy Unlocking Verification**: Before interest acceptance, `mobileNumber` and `residentialAddress` are masked; after acceptance, `GET /api/profiles/:profileId` returns unmasked mobile and address for connected partner.

### Section 5: Shortlist / Favorites & Visitor Tracking
- `POST /api/shortlist` & `DELETE /api/shortlist/:id`: Adds and removes bookmarks idempotently.
- `GET /api/shortlist`: Returns populated profiles with match scores.
- `POST /api/visitors/record/:id`: Deduplicates multiple visits on the same calendar day (increments `visitCount`, single document).
- `GET /api/visitors/recent` & `GET /api/visitors/count`: Return visitor logs and analytics.

### Section 6: Block List & Bidirectional Protection
- `POST /api/blocks`: Blocks user, cascades cancellation of pending interests, removes from shortlist.
- Blocked candidate is excluded from `GET /api/matches` and `GET /api/matches/search`.
- Blocked candidate cannot express interest (`403 Forbidden` or `400 Bad Request`).
- `DELETE /api/blocks/:id`: Restores unblocked status.
