# Milestone 3 Handoff Report: Match Engine, Interactions, Privacy & Candidate Discovery
**Agrawal Biodata Matrimony Platform Backend**
**Agent:** Worker M3
**Date:** 2026-08-14

---

## 1. Observation

1. **Match Engine & Gotra Exogamy Specification**:
   - `services/matchEngine.js` implements the authentic 6-factor weighted compatibility formula:
     - Gotra Exogamy: 30% (`utils/gotras.js:checkGotraExogamy` — Sagotra paternal match = 0 gotra score & `isSagotra: true`; maternal gotra overlap = 15/30 & `hasMaternalConflict: true`; distinct gotras = 30/30).
     - Age Alignment: 20% ($\Delta \le 2$: 20 pts, $\le 4$: 15 pts, $\le 6$: 10 pts, $\le 8$: 5 pts, $> 8$: 0 pts, missing DOB: 10 pts).
     - Education Tier: 15% (Matching tier: 15 pts, adjacent tier $\pm 1$: 10 pts, diverse tier: 5 pts).
     - Location Proximity: 15% (Same city: 15 pts, same state: 10 pts, different state: 5 pts).
     - Income Bracket: 10% (Same bracket: 10 pts, adjacent bracket $\pm 1$: 7 pts, diverse: 4 pts).
     - Manglik Compatibility: 10% (Harmonious: 10 pts, partial/anshik/don't know: 6 pts, dosha conflict: 0 pts).
   - The master scoring function `calculateMatchScore(p1, p2)` returns `{ totalScore, isSagotra, hasMaternalConflict, breakdown }`.

2. **Mongoose Models Implemented**:
   - `models/Match.js`: Schema for caching match scores, recommendations, and 6-factor breakdowns with compound index `{ profileId: 1, matchedProfileId: 1 }`.
   - `models/Interest.js`: Tracks 4-state lifecycle (`Pending` -> `Accepted` / `Declined` / `Cancelled`) with unique compound index `{ senderProfileId: 1, recipientProfileId: 1 }`.
   - `models/Shortlist.js`: Handles favorites/bookmarks with unique compound index `{ profileId: 1, shortlistedProfileId: 1 }`.
   - `models/Visitor.js`: Implements daily deduplication with compound unique index on `{ visitedProfileId: 1, visitorProfileId: 1, visitDate: 1 }` (normalized to UTC midnight).
   - `models/Block.js`: Implements moderation & user blocking with compound unique indexes on `{ blockerUserId: 1, blockedUserId: 1 }` and `{ blockerProfileId: 1, blockedProfileId: 1 }`.

3. **Controllers & Routes Implemented**:
   - `controllers/matchController.js` & `routes/matchRoutes.js`:
     - `GET /api/matches`: Paginated match feed for active profile, opposite-gender filtered, bidirectional block excluded, sorting by score/recent/age, filtering by gotra/city/state/age/manglik/verifiedOnly/excludeSagotra.
     - `GET /api/matches/today`: Top daily recommendations carousel (excluding sagotra & blocked).
     - `GET /api/matches/search`: Multi-field keyword and structured query search engine.
     - `GET /api/matches/score/:targetProfileId`: On-demand 6-factor score calculation.
   - `controllers/interestController.js` & `routes/interestRoutes.js`:
     - `POST /api/interests`: Express interest with duplicate prevention and mutual auto-matching.
     - `PUT /api/interests/:interestId/accept`, `PUT /api/interests/:interestId/decline`, `PUT /api/interests/:interestId/cancel`, `DELETE /api/interests/:interestId`.
     - `GET /api/interests`, `GET /api/interests/sent`, `GET /api/interests/received`.
     - `GET /api/interests/status/:targetProfileId`.
   - `controllers/shortlistController.js` & `routes/shortlistRoutes.js`:
     - `POST /api/shortlist`, `DELETE /api/shortlist/:targetProfileId`, `GET /api/shortlist` (with match scores), `GET /api/shortlist/check/:targetProfileId`.
   - `controllers/visitorController.js` & `routes/visitorRoutes.js`:
     - `POST /api/visitors` / `POST /api/visitors/record/:targetProfileId`: Daily-deduplicated atomic visit recording.
     - `GET /api/visitors` / `GET /api/visitors/recent`: Recent visitor logs.
     - `GET /api/visitors/count`: Aggregate metrics (`totalVisitors`, `todayVisitors`, `weeklyVisitors`).
   - `controllers/blockController.js` & `routes/blockRoutes.js`:
     - `POST /api/blocks`: Block user/profile with cascading cancellation of pending interests and shortlist removal.
     - `DELETE /api/blocks/:targetProfileId`: Unblock profile.
     - `GET /api/blocks`, `GET /api/blocks/check/:targetProfileId`.

4. **Mutual Contact Unlocking & Privacy Integration**:
   - In `controllers/profileController.js:getProfileById`:
     - Queries `Interest.exists({ status: 'Accepted', ... })` between requester and target profile.
     - If accepted (`isConnected: true`), raw phone number (`mobileNumber`) and residential address (`residentialAddress`) are revealed (`phoneMasked = false`, `addressMasked = false`).
     - If not accepted, masks phone number (`...XXXXX`) and residential address (`Protected (Available on Connection)`).
     - Checks `Block.exists`: if blocked in either direction, returns 404.

5. **Router Integration**:
   - `routes/index.js` mounts `/matches`, `/interests`, `/shortlist`, `/visitors`, and `/blocks`.

6. **Test Suite**:
   - `tests/matches.test.js` provides comprehensive 6-tier test coverage.

---

## 2. Logic Chain

1. **Match Engine Construction**:
   - The requirements specify a pure, weighted 6-factor algorithm that returns a 0–100 total score and itemized breakdown.
   - We integrated `utils/gotras.js:checkGotraExogamy` directly to preserve authentic Gotra exogamy logic (Garg vs Garg Sagotra paternal collision yields 0 pts and sets `isSagotra: true`; maternal gotra overlap yields 15/30 pts and sets `hasMaternalConflict: true`).
   - Pure helper functions (`checkAgeCompatibility`, `checkEducationCompatibility`, `checkLocationCompatibility`, `checkIncomeCompatibility`, `checkManglikCompatibility`) guarantee deterministic, fast score computation.

2. **Bidirectional Protection & Cascading Moderation**:
   - When User A blocks User B via `POST /api/blocks`, the system records the block and cascades:
     - Automatically updates all pending interests between A and B to `Cancelled`.
     - Automatically deletes all shortlist entries between A and B.
   - `matchController.js` and `profileController.js` consult `getBlockedIds` to exclude blocked profiles from all discovery feeds, searches, and public profile views.

3. **Privacy & Contact Unlocking State Machine**:
   - Before connection: `getProfileById` checks `privacySettings`. Under default `'Connected Members Only'`, contact numbers and addresses are masked.
   - Upon `PUT /api/interests/:id/accept`, the interest status transitions to `'Accepted'`.
   - Subsequent calls to `getProfileById` detect the accepted connection and return unmasked contact numbers and addresses to the connected partner.

---

## 3. Caveats

1. **Missing Data Fallback**: When candidate profiles have partial or unspecified data (e.g. missing DOB, income, or education), the algorithm awards standardized neutral baseline points (10 pts for age, 5 pts for education/location/income) to prevent artificial zeroing of scores.
2. **Visit Date Normalization**: Profile views are normalized to UTC midnight (`Date.UTC(y, m, d)`) to ensure timezone-independent daily deduplication.
3. **No Hardcoding**: All calculations and responses compute dynamically from database records and algorithm formulas.

---

## 4. Conclusion

Milestone 3 is complete and fully implemented:
- Pure 6-Factor Weighted Matchmaking Engine (`services/matchEngine.js`)
- 5 Interaction & Moderation Models (`Match.js`, `Interest.js`, `Shortlist.js`, `Visitor.js`, `Block.js`)
- 5 Controllers & Routes (`matchController.js`, `interestController.js`, `shortlistController.js`, `visitorController.js`, `blockController.js`)
- Contact & Address Unlocking in `controllers/profileController.js`
- Route Mounting in `routes/index.js`
- Full Integration Test Suite in `tests/matches.test.js`

---

## 5. Verification Method

### Test Execution Commands
Run the complete backend test suite:
```bash
npm test
```

Run specifically the Milestone 3 test suite:
```bash
npx jest tests/matches.test.js --runInBand --detectOpenHandles
```

### Key Files Created / Modified
- `backend/services/matchEngine.js`
- `backend/models/Match.js`
- `backend/models/Interest.js`
- `backend/models/Shortlist.js`
- `backend/models/Visitor.js`
- `backend/models/Block.js`
- `backend/utils/profileHelper.js`
- `backend/config/constants.js`
- `backend/controllers/matchController.js`
- `backend/controllers/interestController.js`
- `backend/controllers/shortlistController.js`
- `backend/controllers/visitorController.js`
- `backend/controllers/blockController.js`
- `backend/controllers/profileController.js`
- `backend/routes/matchRoutes.js`
- `backend/routes/interestRoutes.js`
- `backend/routes/shortlistRoutes.js`
- `backend/routes/visitorRoutes.js`
- `backend/routes/blockRoutes.js`
- `backend/routes/index.js`
- `backend/tests/matches.test.js`
