# Milestone 1 (Core Infrastructure & Auth) Reviewer 2 & Adversarial Critic Report

## Review Summary

**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Test Suite Execution Results
- **Command Run**: `npm test tests/auth.test.js` in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`
- **Result**: `Test Suites: 1 failed, 1 total. Tests: 3 failed, 24 passed, 27 total.`
- **Verbatim Failure 1**:
  ```text
  ● Milestone 1: Core Infrastructure & Authentication Test Suite › 3. User Registration, Token Refresh, and Protected Access › GET /api/auth/me should fetch profile with valid access token
    expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 500
    at tests/auth.test.js:252:26
  ```
- **Verbatim Failure 2**:
  ```text
  ● Milestone 1: Core Infrastructure & Authentication Test Suite › 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should rotate tokens successfully
    expect(received).not.toBe(expected) // Object.is equality
    Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTdlYzI2MjRiYTc5N2EyNmM5NWY1YTMiLCJtb2JpbGUiOiI5ODEyMzQ1Njc4IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODY2OTIxOTQsImV4cCI6MTc4NzI5Njk5NH0.iQnbhBMaFqDFd2aLZp0LMtLvP3qqq5owGQJYG4BomPc"
    at tests/auth.test.js:283:46
  ```
- **Verbatim Failure 3**:
  ```text
  ● Milestone 1: Core Infrastructure & Authentication Test Suite › 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should reject reused/old refresh token
    expect(received).toBe(expected) // Object.is equality
    Expected: 401
    Received: 200
    at tests/auth.test.js:305:26
  ```

### 1.2 Code Inspection Observations
1. **`backend/controllers/authController.js` (lines 275-277)**:
   ```javascript
   const getMe = async (req, res, next) => {
     try {
       const user = await User.findById(req.user.userId).populate('profiles');
   ```
   In Milestone 1, the `Profile` Mongoose model has not been defined or registered with `mongoose.model('Profile')`. Calling `.populate('profiles')` causes Mongoose to throw `MissingSchemaError: Schema hasn't been registered for model "Profile"`, resulting in a 500 Internal Server Error.

2. **`backend/utils/token.js` (lines 20-30)**:
   ```javascript
   const signRefreshToken = (payload) => {
     return jwt.sign(
       {
         userId: payload.userId || payload._id,
         mobile: payload.mobile,
         type: 'refresh'
       },
       env.JWT_REFRESH_SECRET,
       { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
     );
   };
   ```
   The payload consists only of static claims (`userId`, `mobile`, `type`) and standard JWT timestamp `iat` (which has 1-second resolution). When `signRefreshToken` is called multiple times within the same second for the same user, `jwt.sign` deterministically generates an identical token string.

3. **`backend/controllers/authController.js` (lines 220-232)**:
   ```javascript
   const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
   if (tokenIndex === -1) {
     return unauthorized(res, 'Refresh token has been revoked or invalidated');
   }
   user.refreshTokens.splice(tokenIndex, 1);
   const newAccessToken = signAccessToken(user);
   const newRefreshToken = signRefreshToken(user);
   user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
   await user.save();
   ```
   Because `newRefreshToken === token` when generated in the same second, `splice` removes `token` and `push` immediately adds the identical token back into `user.refreshTokens`. Consequently, token rotation fails, and the old token remains valid and reusable.

4. **`backend/middleware/rateLimiter.js` (lines 27-31)**:
   ```javascript
   keyGenerator: (req) => {
     const mobile = req.body && req.body.mobile ? req.body.mobile.replace(/\D/g, '') : null;
     return mobile || req.ip;
   }
   ```
   If a client submits a JSON payload where `mobile` is passed as a number (e.g. `{"mobile": 9876543210}`), calling `.replace()` on a number throws `TypeError: req.body.mobile.replace is not a function`, causing an unhandled 500 crash in the rate limiter before route validation occurs.

---

## 2. Logic Chain

1. **Failure of `GET /api/auth/me`**:
   - `models/User.js` defines field `profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }]`.
   - In M1 scope, only `User`, `Admin`, `OTP`, and `AuditLog` models are created; `Profile.js` is scheduled for Milestone 2.
   - When `authController.getMe` calls `.populate('profiles')`, Mongoose searches `mongoose.models` for `'Profile'`.
   - Because `'Profile'` is not registered, Mongoose throws a `MissingSchemaError`.
   - The uncaught exception in the try-block reaches `errorHandler` as a 500 Internal Server Error.

2. **Failure of Token Rotation and Anti-Replay Protection**:
   - JWT tokens generated with identical payloads and identical `iat` seconds are cryptographically identical strings.
   - In automated test flows (and high-throughput API clients), token refresh occurs within milliseconds of login or prior refresh.
   - Because `signRefreshToken` contains no unique identifier (e.g., `crypto.randomUUID()` or `jti` claim), `newRefreshToken === oldRefreshToken`.
   - Splicing and re-pushing the identical token results in zero rotation and allows the old token to be reused perpetually.

3. **Rate Limiter Type Safety**:
   - Express body parser parses JSON numbers as JavaScript numbers.
   - Directly invoking `req.body.mobile.replace(...)` without verifying `typeof req.body.mobile === 'string'` exposes an unhandled crash vector.

---

## 3. Findings & Required Fixes

### Finding 1 [Critical] — `GET /api/auth/me` throws 500 due to unregistered `Profile` model
- **Where**: `backend/controllers/authController.js:276`
- **Why**: Milestone 1 does not yet have `Profile` model registered in Mongoose. `.populate('profiles')` causes `MissingSchemaError` 500 error.
- **Suggested Fix**:
  Check if `mongoose.models.Profile` exists before populating, or conditionally populate, or avoid `.populate('profiles')` until Milestone 2:
  ```javascript
  const user = await User.findById(req.user.userId);
  ```
  Or check `if (mongoose.models.Profile) { query = query.populate('profiles'); }`.

### Finding 2 [Critical] — Token rotation failure in `POST /api/auth/refresh-token` due to deterministic JWT generation
- **Where**: `backend/utils/token.js:20-30` and `backend/controllers/authController.js:220-235`
- **Why**: `signRefreshToken` lacks a unique `jti` or random nonce. Sub-second token refreshes create identical tokens, breaking rotation and anti-reuse enforcement.
- **Suggested Fix**:
  Include a cryptographic nonce or `jti` (JWT ID) in `signRefreshToken`:
  ```javascript
  const crypto = require('crypto');
  const signRefreshToken = (payload) => {
    return jwt.sign(
      {
        userId: payload.userId || payload._id,
        mobile: payload.mobile,
        type: 'refresh',
        jti: crypto.randomUUID()
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );
  };
  ```

### Finding 3 [Major / Adversarial] — `otpLimiter` keyGenerator vulnerable to `TypeError` on numeric `mobile` payload
- **Where**: `backend/middleware/rateLimiter.js:29`
- **Why**: Calling `req.body.mobile.replace(/\D/g, '')` directly crashes with `TypeError` if `req.body.mobile` is passed as a number.
- **Suggested Fix**:
  Defensively coerce to string before regex replacement:
  ```javascript
  const mobile = req.body && req.body.mobile
    ? String(req.body.mobile).replace(/\D/g, '')
    : null;
  ```

---

## 4. Verified Claims & Positive Observations

| Area | Observation | Status |
|---|---|---|
| **JWT Expiration Settings** | Access token is set to `15m`, Refresh token is set to `7d`, Admin token is set to `24h`. Verified in `config/env.js` and `utils/token.js`. | **PASS** |
| **Token Secret Separation** | Separate secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ADMIN_SECRET`) prevent cross-role privilege escalation. | **PASS** |
| **Bcrypt Password Hashing** | 10 salt rounds used in `models/Admin.js` pre-save hook; passwords stripped in `toJSON` transform and never returned in responses. | **PASS** |
| **Admin Seed Script** | `scripts/seedAdmin.js` is idempotent, correctly initializes Super Admin (`admin@matrimonyhub.com`), and updates cleanly. | **PASS** |
| **18 Gotras Reference & Validation** | All 18 canonical Agarwal gotras mapped in `config/constants.js` and validated in `utils/gotras.js`. Handles Hindi script, bilingual formats, and aliases. | **PASS** |
| **Gotra Exogamy Engine** | Sagotra paternal collisions return 0 compatibility score; maternal crossover returns 50% penalty (15/30); distinct gotras return 30/30. | **PASS** |
| **Passwordless OTP Logic** | 6-digit random crypto generation, 30s cooldown with remaining seconds returned, 5m expiry, 5 requests / 10m rate limit, and max 5 verification attempts. | **PASS** |
| **Audit Logging** | Administrative actions (`Admin Login`, `Updated Password`, `Updated Profile`) recorded in `AuditLog` collection with IP and timestamps. | **PASS** |
| **Integrity Check** | No hardcoded test responses or fake bypasses found in production controller or service code. Logic is genuine. | **PASS** |

---

## 5. Caveats

- Milestone 1 implements the SMS notification provider as a clean console logging stub (`smsService.js`), which is appropriate for development/test integrity. Live SMS gateway credentials should be wired in production deployment.
- Tests were executed hermetically using Jest with `MongoMemoryServer`.

---

## 6. Conclusion & Verdict

**Final Verdict**: **`REQUEST_CHANGES`**

While the core architecture, security boundaries, rate limiting, and 18 Gotras logic are well-structured, 3 integration test failures must be resolved before Milestone 1 can be approved:
1. Fix `GET /api/auth/me` 500 error by removing/guarding `.populate('profiles')` until Milestone 2 `Profile` schema is registered.
2. Fix `signRefreshToken` in `backend/utils/token.js` by adding a unique `jti: crypto.randomUUID()` so refresh tokens are unique upon every rotation.
3. Fix `otpLimiter` in `backend/middleware/rateLimiter.js` by coercing `mobile` to string defensively.

---

## 7. Verification Method

To verify the fixes independently:

1. **Run Auth Integration Tests**:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npm test tests/auth.test.js
   ```
   **Pass Condition**: All 27 tests in `tests/auth.test.js` pass with 0 failures (100% pass rate).

2. **Verify Admin Seeder**:
   ```bash
   node scripts/seedAdmin.js
   ```
   **Pass Condition**: Exits with code 0 and logs `[SEED] Default Super Admin created/verified`.
