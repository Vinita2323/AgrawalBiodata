# Milestone 3 Handoff Report: Match Engine, Interests & Candidate Discovery
**Agrawal Biodata Matrimony Platform**
**Agent:** Explorer M3
**Date:** 2026-08-14

---

## 1. Observation

1. **Existing Base Implementation & Test Suite Status**:
   - Ran `npm test` across test suite:
     ```
     Test Suites: 5 passed, 5 total
     Tests:       130 passed, 130 total
     Snapshots:   0 total
     Time:        15.068 s
     ```
   - Verified that Milestones 1 and 2 are 100% complete and green in `tests/auth.test.js`, `tests/profile.test.js`, `tests/challenger_m1.test.js`, and `tests/challenger_m2.test.js`.

2. **Gotra Exogamy Foundations in `utils/gotras.js`**:
   - `utils/gotras.js:78-117` already contains the `checkGotraExogamy(gotra1, gotra2, motherGotra1, motherGotra2)` function with canonical Gotra normalization and 2-Gotra rule penalty handling:
     ```javascript
     // Self Paternal Sagotra check (strictly forbidden)
     if (normG1 && normG2 && normG1 === normG2) {
       return { score: 0, maxScore: 30, isSagotra: true, hasMaternalConflict: false, details: `Sagotra Conflict: Both belong to the same Gotra (${normG1}). Traditional marriage is forbidden.` };
     }
     ```
3. **Multi-Profile & Privacy Schema in `models/Profile.js`**:
   - `models/Profile.js:336-353` specifies privacy controls:
     ```javascript
     privacySettings: {
       phoneVisibility: { type: String, enum: ['All Members', 'Connected Members Only', 'Connected Only', 'Premium Members Only', 'Hidden'], default: 'Connected Members Only' },
       addressVisibility: { type: String, enum: ['All Members', 'Connected Members Only', 'Connected Only', 'Hidden'], default: 'Connected Members Only' },
       photoVisibility: { type: String, enum: ['Visible to All', 'All Members', 'Visible to Connected', 'Connected Only', 'Request Access'], default: 'Visible to All' }
     }
     ```
4. **Master Router Status in `routes/index.js`**:
   - Currently mounts `/auth`, `/admin/auth`, `/admin/settings`, `/profiles`.
   - Milestone 3 routes (`/matches`, `/interests`, `/shortlist`, `/visitors`, `/blocks`) are ready to be mounted.
5. **Project Specifications in `ORIGINAL_REQUEST.md` and `PROJECT.md`**:
   - Section R3 defines the 6-factor matching engine (Gotra 30%, Age 20%, Edu 15%, Loc 15%, Inc 10%, Manglik 10%), match discovery endpoints (`GET /api/matches`, `GET /api/matches/today`, `GET /api/matches/search`), interest lifecycle, shortlist, visitor tracking with daily deduplication, and block list management.

---

## 2. Logic Chain

1. **Requirement Mapping**:
   - Building from Observations #1 and #5, Milestone 3 represents the core matching and discovery domain of the application, connecting candidates via algorithmic scoring and managing social interactions.
2. **Algorithm Design (`services/matchEngine.js`)**:
   - Observation #2 provides the 30% Gotra exogamy logic.
   - We synthesize the remaining 5 factors (Age 20%, Education 15%, Location 15%, Income 10%, Manglik 10%) into a deterministic, high-performance pure scoring service (`calculateMatchScore(p1, p2)`) that returns both a cumulative 0–100 integer score and an itemized breakdown dictionary.
3. **Data Model Architecture**:
   - Observations #3 and #5 demonstrate the need for 5 new Mongoose models:
     - `Match.js`: Stores computed scores and daily recommendations.
     - `Interest.js`: Enforces the 4-state lifecycle (`Pending` -> `Accepted` / `Declined` / `Cancelled`) with unique compound indexes (`senderProfileId`, `recipientProfileId`).
     - `Shortlist.js`: Stores candidate bookmarks.
     - `Visitor.js`: Implements daily deduplication with compound unique index on `{ visitedProfileId, visitorProfileId, visitDate }` (normalized to UTC midnight).
     - `Block.js`: Implements bidirectional user and profile blocking.
4. **Privacy & Mutual Unlocking**:
   - Observation #3 establishes that phone and address visibility defaults to `'Connected Members Only'`.
   - By querying `Interest.exists({ status: 'Accepted', ... })`, the system determines whether two candidates are connected. If connected, `profileController.js` unmasks the phone number and residential address.
5. **Bidirectional Protection & Filtering**:
   - `blockController.js` creates a block and immediately cancels pending interests between parties.
   - `matchController.js` queries `Block` to extract both blocker and blocked profile IDs and excludes them from discovery feeds and search results.

---

## 3. Caveats

1. **Profile Completeness Impact on Matching**: Candidates with missing DOB, income, or education will receive default baseline points (e.g. 10 for DOB, 5 for income/education) to prevent artificial 0-scoring when partial data is present.
2. **Asymmetric vs Symmetric Matching**: While compatibility is largely symmetric, age scoring uses absolute difference `|age1 - age2|` to remain fair across both male and female active profiles.
3. **Database Indexing**: Compound unique indexes require MongoDB to reject duplicate active interests or duplicate same-day visitor records; controllers also handle upserts gracefully.

---

## 4. Conclusion

The architecture for Milestone 3 is fully formulated, documented, and ready for clean, modular implementation:
- **Service**: `services/matchEngine.js`
- **Models**: `models/Match.js`, `models/Interest.js`, `models/Shortlist.js`, `models/Visitor.js`, `models/Block.js`
- **Controllers**: `controllers/matchController.js`, `controllers/interestController.js`, `controllers/shortlistController.js`, `controllers/visitorController.js`, `controllers/blockController.js`
- **Routes**: `routes/matchRoutes.js`, `routes/interestRoutes.js`, `routes/shortlistRoutes.js`, `routes/visitorRoutes.js`, `routes/blockRoutes.js`
- **Privacy Integration**: Update `profileController.js` to unmask contact/address upon `Interest` acceptance.
- **Routing**: Update `routes/index.js` to mount all 5 subrouters.
- **Tests**: Create `tests/matches.test.js` covering all 6 test sections.

---

## 5. Verification Method

### Independent Verification Commands
1. Run full test suite:
   ```bash
   npm test
   ```
2. Run only the Milestone 3 test suite once implemented:
   ```bash
   npx jest tests/matches.test.js --runInBand --detectOpenHandles
   ```

### Files to Inspect
- Architectural analysis: `.agents/explorer_m3/analysis.md`
- Handoff report: `.agents/explorer_m3/handoff.md`

### Invalidation Conditions
- Any match algorithm score yielding `< 0` or `> 100`.
- Sagotra paternal match returning a non-zero Gotra score.
- Two users with an `Accepted` interest failing to see unmasked phone/address.
- Blocked candidate appearing in `GET /api/matches` or able to send interest.
