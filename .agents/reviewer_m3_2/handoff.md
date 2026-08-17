# Reviewer Milestone 3 Handoff Report

**Reviewer:** Reviewer M3 (Instance 2)  
**Date:** 2026-08-14  
**Verdict:** **REQUEST_CHANGES**

---

## Review Summary

While the algorithmic logic in `matchEngine.js` (6-factor scoring, Gotra exogamy with 2-Gotra rule), Mongoose schemas, controllers, and privacy contact-unlocking mechanisms are well-designed and feature-complete, a **Critical module resolution defect** in 5 newly added route files prevents the backend server from starting and causes 100% of test suites to fail on execution.

---

## 1. Observation

### Observation 1.1: Verbatim Test Suite Execution Failure
When executing `npm test` from `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`, all 6 test suites failed immediately at runtime:

```text
> agrawal-matrimony-backend@1.0.0 test
> cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit

FAIL tests/matches.test.js
  ● Test suite failed to run

    Cannot find module '../middlewares/auth' from 'routes/matchRoutes.js'

    Require stack:
      routes/matchRoutes.js
      routes/index.js
      server.js
      tests/matches.test.js

       7 | const router = express.Router();
       8 | const matchController = require('../controllers/matchController');
    >  9 | const { verifyToken } = require('../middlewares/auth');
         |                         ^
      10 |
      11 | // All match routes require user authentication
      12 | router.use(verifyToken);

Test Suites: 6 failed, 6 total
Tests:       0 total
```

### Observation 1.2: Root Cause in Route Imports
The project directory is named `backend/middleware/` (singular), containing `auth.js`. However, 5 route files reference `../middlewares/auth` (plural with an 's'):
1. `backend/routes/matchRoutes.js:9`: `const { verifyToken } = require('../middlewares/auth');`
2. `backend/routes/interestRoutes.js:9`: `const { verifyToken } = require('../middlewares/auth');`
3. `backend/routes/shortlistRoutes.js:9`: `const { verifyToken } = require('../middlewares/auth');`
4. `backend/routes/visitorRoutes.js:9`: `const { verifyToken } = require('../middlewares/auth');`
5. `backend/routes/blockRoutes.js:9`: `const { verifyToken } = require('../middlewares/auth');`

In contrast, existing routes correctly use `require('../middleware/auth')`:
- `backend/routes/profileRoutes.js:11`: `const { verifyToken, optionalAuth } = require('../middleware/auth');`
- `backend/routes/authRoutes.js:10`: `const { verifyToken } = require('../middleware/auth');`

### Observation 1.3: Edge Cases in Controllers
1. In `backend/controllers/interestController.js` lines 172-174 and 180-182:
   ```javascript
   const acceptInterest = async (req, res, next) => {
     req.body.action = 'accept';
     return updateInterest(req, res, next);
   };
   ```
   If a client dispatches `PUT /api/interests/:id/accept` with an empty or undefined `req.body`, `req.body.action = ...` will throw an unhandled `TypeError: Cannot set property 'action' of undefined`.
2. In `backend/controllers/shortlistController.js:83` and `backend/controllers/blockController.js:110`:
   ```javascript
   const query = {
     $or: [
       { _id: targetProfileId, userId: req.user.userId },
       { userId: req.user.userId, shortlistedProfileId: targetId }
     ]
   };
   ```
   If `targetProfileId` is a custom profileId string (e.g. `"PRF-100001"`) rather than a valid MongoDB ObjectId, querying `{ _id: targetProfileId }` triggers a Mongoose `CastError: Cast to ObjectId failed for value "PRF-100001" at path "_id"`.

---

## 2. Logic Chain

1. **Step 1 (Module Loading)**: `server.js` requires `./routes` (`routes/index.js`), which in turn requires `./matchRoutes`, `./interestRoutes`, `./shortlistRoutes`, `./visitorRoutes`, and `./blockRoutes`.
2. **Step 2 (Crash Cascade)**: Because these 5 route files attempt to import `../middlewares/auth` which does not exist on disk (the actual folder is `middleware`), Node.js throws `MODULE_NOT_FOUND`.
3. **Step 3 (Test Invalidation)**: Any test suite requiring `server.js` or `app` immediately crashes before any test assertions can execute.
4. **Step 4 (Quality & Integrity Check)**: The implementation code logic for the 6-factor algorithm, Gotra exogamy, models, and privacy controls is well implemented without hardcoded fake responses or cheating shortcuts. However, because the code does not execute and fails `npm test`, it cannot be approved in its current state.

---

## 3. Findings

### [Critical] Finding 1: Incorrect Module Path in 5 Route Files (`MODULE_NOT_FOUND`)
- **What**: Invalid path `../middlewares/auth` instead of `../middleware/auth`.
- **Where**:
  - `backend/routes/matchRoutes.js:9`
  - `backend/routes/interestRoutes.js:9`
  - `backend/routes/shortlistRoutes.js:9`
  - `backend/routes/visitorRoutes.js:9`
  - `backend/routes/blockRoutes.js:9`
- **Why**: Crashes Express application and prevents all test suites from running.
- **Suggestion**: Replace `require('../middlewares/auth')` with `require('../middleware/auth')` across all 5 files.

### [Minor] Finding 2: Missing `req.body` Null Safety in `acceptInterest` / `declineInterest`
- **What**: `req.body.action = 'accept'` without ensuring `req.body` is initialized.
- **Where**: `backend/controllers/interestController.js:173, 182`
- **Why**: Throws `TypeError` if `req.body` is undefined.
- **Suggestion**: Initialize `req.body = req.body || {};` before setting `req.body.action`.

### [Minor] Finding 3: Unconditional `_id` Querying with Non-ObjectId Strings
- **What**: Querying `{ _id: targetProfileId }` when `targetProfileId` may be a custom string like `"PRF-100002"`.
- **Where**:
  - `backend/controllers/shortlistController.js:83`
  - `backend/controllers/blockController.js:110`
- **Why**: Triggers Mongoose `CastError`.
- **Suggestion**: Guard `_id` checks with `mongoose.Types.ObjectId.isValid(targetProfileId)`.

---

## 4. Verified Claims & Feature Review

| Feature / Factor | Requirement | Verified Logic | Assessment |
|---|---|---|---|
| **6-Factor Match Engine** | 30% Gotra, 20% Age, 15% Edu, 15% Loc, 10% Inc, 10% Manglik | Weights sum to 100%, clamped between 0 and 100. | **PASS** (Logic verified) |
| **Gotra Exogamy** | Sagotra = 0 gotra pts (`isSagotra: true`); Maternal overlap = 15/30 pts (`hasMaternalConflict: true`); Distinct = 30/30 pts | Evaluated in `utils/gotras.js:checkGotraExogamy` with alias/Hindi normalization. | **PASS** (Logic verified) |
| **Match Discovery** | Paginated feed, `/today` carousel, multi-field `/search`, `/score/:id` | Filter by gender, gotra, city, state, age, verifiedOnly, excludeSagotra; excludes blocked IDs. | **PASS** (Logic verified) |
| **Interest Lifecycle** | Pending -> Accepted / Declined / Cancelled; Auto-match on mutual pending | Role-restricted transitions; duplicate prevention; auto-match on mutual interest. | **PASS** (Logic verified) |
| **Privacy & Contact Unlocking** | Default masked; unlocked on `Accepted` interest | In `profileController.js`, `Interest.exists({ status: 'Accepted' })` dynamically sets `phoneMasked: false`, `addressMasked: false`. | **PASS** (Logic verified) |
| **Shortlist / Favorites** | Bookmarks with notes & dynamic match scores | Upsert behavior, unique compound index, dynamic matchScore calculation. | **PASS** (Logic verified) |
| **Visitor Tracking** | Daily-deduplicated profile views | Normalized to UTC midnight; atomic `$inc` upsert; ignores self views. | **PASS** (Logic verified) |
| **Block System & Cascading** | Bidirectional block, auto-cancel pending interests, remove shortlists, exclude from discovery & profile views | `Block.save()` triggers `Interest.updateMany` and `Shortlist.deleteMany`; discovery and profile views enforce block exclusion. | **PASS** (Logic verified) |
| **Test Execution** | All tests pass under `npm test` | Fails due to `MODULE_NOT_FOUND` import typo in routes. | **FAIL** (Must fix) |

---

## 5. Adversarial Challenge & Stress Testing

- **Sagotra & Maternal Overlap Combinations**:
  - `(Garg, Garg)` -> 0 Gotra pts, `isSagotra: true`.
  - `(Goel, Goyal)` -> Normalized alias detected as Sagotra -> 0 Gotra pts.
  - `(Garg [M: Bansal], Jindal [M: Bansal])` -> Maternal overlap detected -> 15/30 Gotra pts.
- **Manglik Dosha Neutralization**:
  - `Manglik + Manglik` -> 10/10 pts (Neutralized).
  - `Non-Manglik + Non-Manglik` -> 10/10 pts (Harmonious).
  - `Anshik + Anshik` -> 10/10 pts.
  - `Manglik + Non-Manglik` -> 0/10 pts (Dosha conflict).
- **Self-Interaction Protections**:
  - Self interest: Blocked with 400 Bad Request.
  - Self shortlist: Blocked with 400 Bad Request.
  - Self visitor count: Ignored without error.
  - Self block: Blocked with 400 Bad Request.
- **Bidirectional Block Isolation**:
  - If User A blocks User B, User B cannot see User A's profile (404), cannot find User A in search or match feeds, and cannot express interest (403).

---

## 6. Caveats

- **In-Memory Candidate Scoring**: `getMatches` fetches filtered candidates and computes scores in-memory. For thousands of candidates in production, utilizing background precomputation in `Match` collections or MongoDB aggregation will be beneficial in later milestones.

---

## 7. Conclusion

**Verdict: REQUEST_CHANGES**

The business logic, scoring mathematical fidelity, and data schemas for Milestone 3 are solid. However, the Worker must fix the 5 import path statements in the route files so that the application boots and all test suites pass.

---

## 8. Verification Method

### How to independently verify the fix:
1. Update `require('../middlewares/auth')` to `require('../middleware/auth')` in:
   - `backend/routes/matchRoutes.js`
   - `backend/routes/interestRoutes.js`
   - `backend/routes/shortlistRoutes.js`
   - `backend/routes/visitorRoutes.js`
   - `backend/routes/blockRoutes.js`
2. Run test suites:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npm test
   ```
3. Ensure all test suites pass cleanly.
