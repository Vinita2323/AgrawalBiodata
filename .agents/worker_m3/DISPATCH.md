## 2026-08-14T07:46:19Z
You are Worker M3 for the Agrawal Matrimony backend.
Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m3
Read the following files before starting:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\TEST_INFRA.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\explorer_m3\analysis.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\explorer_m3\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\backend\

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
Implement Milestone 3 in `backend/`:
1. `services/matchEngine.js`:
   - 6-factor weighted algorithm (Gotra 30%, Age 20%, Edu 15%, Loc 15%, Inc 10%, Manglik 10%).
   - Authentic Gotra exogamy logic using `utils/gotras.js`: Sagotra paternal collision = 0 gotra score and sagotra flag; maternal gotra overlap = 50% gotra penalty (15/30); clean distinct gotras = 30/30.
   - Return `{ totalScore: number (0-100), isSagotra: boolean, breakdown: { gotra, age, education, location, income, manglik } }`.
2. Mongoose Models:
   - `models/Match.js`
   - `models/Interest.js`
   - `models/Shortlist.js`
   - `models/Visitor.js` (daily deduplication via compound unique index on `{ visitedProfileId, visitorProfileId, visitDate }`)
   - `models/Block.js`
3. Controllers & Routes:
   - `controllers/matchController.js` & `routes/matchRoutes.js`: `GET /api/matches` (paginated, filtered, sort by score/date), `GET /api/matches/today` (top daily carousel), `GET /api/matches/search` (multi-field query), `GET /api/matches/score/:targetProfileId` (on-demand score computation).
   - `controllers/interestController.js` & `routes/interestRoutes.js`: `POST /api/interests`, `PUT /api/interests/:interestId` (accept, decline, cancel), `GET /api/interests` (sent, received, accepted, declined).
   - `controllers/shortlistController.js` & `routes/shortlistRoutes.js`: `POST /api/shortlist`, `DELETE /api/shortlist/:targetProfileId`, `GET /api/shortlist`.
   - `controllers/visitorController.js` & `routes/visitorRoutes.js`: `POST /api/visitors`, `GET /api/visitors`.
   - `controllers/blockController.js` & `routes/blockRoutes.js`: `POST /api/blocks`, `DELETE /api/blocks/:targetProfileId`, `GET /api/blocks`.
4. Mutual Contact Unlocking & Privacy:
   - In `controllers/profileController.js` (or via helper), check if an `Accepted` interest exists between the requesting user's active profile and the target profile. If accepted, unmask the phone number and address.
   - In discovery/match queries, exclude blocked profiles (bidirectional).
5. Router integration:
   - Mount routes in `routes/index.js` under `/matches`, `/interests`, `/shortlist`, `/visitors`, `/blocks`.
6. Integration Test Suite:
   - Create comprehensive tests in `tests/matches.test.js` covering match calculation, gotra sagotra & maternal edge cases, discovery endpoints, interest lifecycle, shortlist, visitor deduplication, and bidirectional blocking.
7. Verification:
   - Run `npm test` and ensure ALL test suites pass (M1, M2, and M3).
8. Write your completion report in `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m3\handoff.md` and send a message to parent.
