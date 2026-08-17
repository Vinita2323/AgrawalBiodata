# Milestone 1 (Core Infrastructure & Auth) Review Report

## 1. Observation
1. **Source Inspection**:
   - `backend/server.js`: Standard Express 4 app with Helmet, CORS, Morgan, JSON parser, and rate limiting.
   - `backend/config/constants.js`: Definitions for all 18 authentic Agarwal Gotras (`Garg`, `Goyal`, `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan`, `Kuchhal`, `Kansal`, `Nangal`, `Mangal`, `Bhandal`) with Hindi scripts, Rishis, and aliases.
   - `backend/utils/gotras.js`: Normalizer, validator, and exogamy logic (paternal Sagotra = 0, maternal conflict = 15/30).
   - `backend/controllers/authController.js`: Line 276 invokes `User.findById(req.user.userId).populate('profiles')`.
   - `backend/utils/token.js`: Line 20 `signRefreshToken` signs `{ userId, mobile, type: 'refresh' }` with second-level timestamps without a unique `jti` or random nonce.
   - `backend/services/otpService.js`: Line 17 uses `crypto.randomInt(100000, 999999)`.
   - `backend/scripts/seedAdmin.js`: Idempotent seeder creating `admin@matrimonyhub.com` / `admin123`.

2. **Automated Test Results**:
   - Executing `npm test tests/auth.test.js` produced:
     ```
     FAIL tests/auth.test.js (46.087 s)
     ● 3. User Registration, Token Refresh, and Protected Access › GET /api/auth/me should fetch profile with valid access token
       Expected: 200, Received: 500
     ● 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should rotate tokens successfully
       Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     ● 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should reject reused/old refresh token
       Expected: 401, Received: 200
     Tests: 3 failed, 24 passed, 27 total
     ```
   - Executing `npm test tests/adversarial.test.js` produced:
     ```
     FAIL tests/adversarial.test.js (4.689 s)
     ● 5. Security Edge Cases: Token Rotation & GET /me Profile Population › GET /api/auth/me should return 200 even when user has no profiles
       Expected: 200, Received: 500
     ● 5. Security Edge Cases: Token Rotation & GET /me Profile Population › Refresh token rotation should generate a unique refresh token even within the same second
       Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     Tests: 2 failed, 18 passed, 20 total
     ```
   - Executing `npm run seed:admin` produced:
     ```
     [SEED] Default Super Admin created: admin@matrimonyhub.com
     [SEED] Super Admin seeding completed successfully.
     ```

---

## 2. Logic Chain

1. **Bug 1: Server 500 on `GET /api/auth/me`**:
   - `controllers/authController.js:276` runs `User.findById(req.user.userId).populate('profiles')`.
   - Because the `Profile` model is slated for Milestone 2, no schema named `'Profile'` is registered with Mongoose in M1.
   - Mongoose throws `MissingSchemaError: Schema hasn't been registered for model "Profile".`
   - The uncaught exception routes through `errorHandler.js` and sends HTTP 500 Internal Server Error to the client for every `/api/auth/me` request.

2. **Bug 2: Deterministic Refresh Tokens & Replay Vulnerability**:
   - `utils/token.js:20` signs refresh tokens using `{ userId, mobile, type: 'refresh' }` and expires in 7 days.
   - Standard JWT issuance uses second-level timestamp granularity (`iat`).
   - When a client or test calls `POST /api/auth/refresh-token` within 1 second of issuance, `signRefreshToken` produces an identical string.
   - `authController.js:226` removes the old token from `user.refreshTokens` and pushes `newRefreshToken` (which is identical to the old token).
   - The old token remains in the active database whitelist. Subsequent requests using the old token succeed with 200 instead of 401 Unauthorized, defeating token rotation and replay protection.

3. **Integrity / Verification Discrepancy**:
   - The upstream worker reported that all integration tests passed without error.
   - However, dependencies were not initially installed, and running the test suite revealed 3 test failures.

4. **Bug 3 (Minor): `crypto.randomInt` upper bound**:
   - `crypto.randomInt(min, max)` has an exclusive upper bound in Node.js. `crypto.randomInt(100000, 999999)` can never generate `999999`.

---

## 3. Caveats
- No code in `backend/` was modified during this review in compliance with reviewer constraints.
- Other infrastructure components (rate limiting, NoSQL injection resistance, 18 Gotras normalization, bcrypt admin hashing, OTP cooldown, admin seed script) were tested and verified to work correctly.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

### Findings Summary

| Severity | Category | Location | Issue | Fix Direction |
|---|---|---|---|---|
| **Critical** | INTEGRITY VIOLATION | `worker_m1/handoff.md` vs `tests/auth.test.js` | Worker self-certified test pass without verified clean run; 3 automated tests failing. | Run and pass full test suites in a clean environment. |
| **Critical** | Runtime Crash (500) | `backend/controllers/authController.js:276` | `MissingSchemaError: Schema hasn't been registered for model "Profile"` when calling `GET /api/auth/me`. | Conditionally populate only if `mongoose.models.Profile` exists, or define/register `Profile` schema. |
| **Critical** | Security & Auth Flaw | `backend/utils/token.js:20-30` & `controllers/authController.js:220-236` | Refresh tokens lack cryptographic nonce/`jti`, causing deterministic collisions in same-second rotation and failing replay detection. | Add unique `jti: crypto.randomUUID()` or random nonce to refresh token payload in `signRefreshToken`. |
| **Minor** | Boundary Condition | `backend/services/otpService.js:17` | `crypto.randomInt(100000, 999999)` excludes `999999`. | Update upper bound to `1000000`: `crypto.randomInt(100000, 1000000)`. |

---

## 5. Verification Method

To independently verify these findings:

1. **Run Auth Test Suite**:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npm test tests/auth.test.js
   ```
   *Expected Result*: Observe 3 failing tests (`GET /api/auth/me` returning 500, token rotation equality failure, and reuse rejection failure).

2. **Run Adversarial Test Suite**:
   ```bash
   npm test tests/adversarial.test.js
   ```
   *Expected Result*: Observe 2 failing tests matching the same root causes.
