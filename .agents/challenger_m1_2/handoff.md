# Adversarial Security & Edge Case Validation Report (Milestone 1)

## Verdict: REQUEST_CHANGES

---

## 1. Observation

Empirical testing was executed across the backend test suite (`tests/auth.test.js` and `tests/adversarial.test.js`). The findings across the required test vectors and runtime behavior are documented below:

### A. SQL / NoSQL Injection Attacks
- **Command & Output**: `npx jest tests/adversarial.test.js`
- **Endpoints tested**:
  - `POST /api/auth/send-otp` with payload `{ mobile: { "$gt": "" } }` -> HTTP 400 Validation Error.
  - `POST /api/auth/verify-otp` with `{ mobile: { "$ne": null }, otp: { "$ne": null } }` -> HTTP 400 Validation Error.
  - `POST /api/auth/register` with `{ mobile: { "$ne": null } }` -> HTTP 400 Validation Error.
  - `POST /api/auth/refresh-token` with `{ refreshToken: { "$ne": null } }` -> HTTP 400 Validation Error.
  - `POST /api/admin/auth/login` with `{ email: { "$ne": null }, password: { "$gt": "" } }` -> HTTP 400 Validation Error.
  - `POST /api/admin/auth/login` with `{ email: { "$regex": ".*" }, password: "admin" }` -> HTTP 400 Validation Error.
- **Observation**: Express-validator and explicit string coercion (`String(email).trim()`, `normalizeMobile()`) successfully neutralize NoSQL query object injection.

### B. Malformed & Tampered Authorization Headers
- **Observations**:
  - Missing `Authorization` header -> HTTP 401 Unauthorized (`Authentication required. No Bearer token provided.`).
  - Header: `Bearer` (empty token) -> HTTP 401 Unauthorized.
  - Header: `Bearer   ` (spaces) -> HTTP 401 Unauthorized.
  - Header: `Bearer invalid.jwt.here` -> HTTP 401 Unauthorized (`Invalid or expired access token`).
  - Header: `Basic dXNlcjpwYXNz` -> HTTP 401 Unauthorized.
  - Header: `Bearer [alg: none]` forged token -> HTTP 401 Unauthorized (JWT library rejects unsigned algorithms).
  - Header: `Bearer [wrong JWT secret]` -> HTTP 401 Unauthorized.
  - Cross-role authorization: User access token sent to `GET /api/admin/auth/profile` -> HTTP 401 Unauthorized.

### C. Duplicate User Registration & Phone Sanitization
- **Observations**:
  - `normalizeMobile()` in `services/otpService.js:25-35` correctly strips country code `+91`, leading `0`, spaces, hyphens, and validates 10 digits.
  - Repeated registrations with different representations of the same phone number (`+91 98765 43210`, `09876543210`, `9876543210`) find and update the existing user document instead of throwing duplicate key errors (`E11000 duplicate key error collection: test.users index: mobile_1`).
  - Invalid formats (e.g. `12345`, `abcdefghij`) are rejected with HTTP 400 Bad Request.

### D. Seed Script Idempotency
- **Observations**:
  - `seedAdmin()` in `scripts/seedAdmin.js:11-46` checks for an existing admin by email using `Admin.findOne({ email: defaultAdmin.email })`.
  - Sequential invocations (tested with 3 repeated calls) update the existing record cleanly without duplicate key exceptions and preserve valid bcrypt password authentication for `admin@matrimonyhub.com` / `admin123`.

### E. Defects & Security Edge Case Failures

#### Defect 1: HTTP 500 Crash on `GET /api/auth/me`
- **Location**: `backend/controllers/authController.js:276`
  ```javascript
  const user = await User.findById(req.user.userId).populate('profiles');
  ```
- **Error Output**:
  ```
  FAIL tests/auth.test.js
  ● Milestone 1 › 3. User Registration, Token Refresh, and Protected Access › GET /api/auth/me should fetch profile with valid access token
    Expected: 200
    Received: 500
  ```
- **Root Cause**: The `User` schema references model `'Profile'` (`models/User.js:83`), but the `Profile` model schema is not registered with Mongoose in Milestone 1. When `populate('profiles')` executes, Mongoose throws `MissingSchemaError: Schema hasn't been registered for model "Profile"`, crashing `GET /api/auth/me` with an unhandled 500 Internal Server Error.

#### Defect 2: Refresh Token Rotation Collision & Replay Vulnerability within Same Timestamp
- **Location**: `backend/utils/token.js:20-30`
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
- **Error Output**:
  ```
  FAIL tests/auth.test.js
  ● Milestone 1 › 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should rotate tokens successfully
    Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  
  ● Milestone 1 › 3. User Registration, Token Refresh, and Protected Access › POST /api/auth/refresh-token should reject reused/old refresh token
    Expected: 401
    Received: 200
  ```
- **Root Cause**: JWT timestamps (`iat`) are resolution-limited to whole seconds. When `signRefreshToken` signs a token with identical payload within the same second, it produces an identical token string. During rotation in `authController.refreshToken` (`user.refreshTokens.splice(tokenIndex, 1); user.refreshTokens.push({ token: newRefreshToken })`), replacing the old token with an identical token string results in the "old" token remaining valid in `user.refreshTokens`, breaking token rotation and allowing token replay.

---

## 2. Logic Chain

1. **Premise 1**: Protected user endpoints must function reliably and return HTTP 200 with user profile details when supplied with a valid JWT access token.
2. **Observation 1**: `GET /api/auth/me` unconditionally calls `.populate('profiles')`. In Milestone 1, `models/Profile.js` is not yet created/registered in Mongoose. Mongoose throws `MissingSchemaError`, resulting in HTTP 500.
3. **Inference 1**: `GET /api/auth/me` must either conditionally populate only if the `Profile` model is registered (`mongoose.models.Profile`), or register a placeholder Profile model / omit populate if unpopulated.
4. **Premise 2**: Refresh token rotation must guarantee one-time use and immediate invalidation of previous refresh tokens to prevent replay attacks.
5. **Observation 2**: `signRefreshToken()` lacks a unique entropy field (such as a UUID `jti` or random crypto salt). Calls to `signRefreshToken` within the same second produce identical JWT strings.
6. **Inference 2**: When a token is refreshed within 1 second of issuance or previous refresh, the new token is identical to the old token, causing `user.refreshTokens` to still recognize the previous token, violating the single-use rotation contract and failing automated test assertions.
7. **Conclusion**: While injection defense, authorization header checks, phone sanitization, and seed idempotency pass, the core user authentication workflow contains two blocking defects causing test failures. Changes are required before approving Milestone 1.

---

## 3. Caveats

- Milestone 2 models (`Profile`, `Candidate`, `Family`, etc.) were not present in the codebase during testing, which is expected for Milestone 1 scope, but exposed the unhandled schema dependency in `authController.getMe`.
- Rate limiting window tests were verified in memory with mock time / short test configurations (`OTP_COOLDOWN_SECONDS=2`).
- Production SMS delivery was tested against the stub/mock SMS service as designed for development/test integrity mode.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

### Required Modifications:
1. **Fix `GET /api/auth/me` Profile Population**:
   - In `backend/controllers/authController.js:276`, avoid unhandled `MissingSchemaError` when `Profile` model is not registered:
     ```javascript
     let query = User.findById(req.user.userId);
     if (mongoose.models.Profile) {
       query = query.populate('profiles');
     }
     const user = await query;
     ```
2. **Add Unique Nonce/JTI to `signRefreshToken`**:
   - In `backend/utils/token.js:20`, include a unique identifier (`crypto.randomUUID()` or timestamp with high-entropy salt) in the JWT payload:
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
   - This ensures every issued refresh token is cryptographically unique regardless of timestamp, guaranteeing proper rotation and replay rejection.

---

## 5. Verification Method

To independently verify these findings:

1. **Run Full Test Suite**:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npm test
   ```
   *Expected Current Result*: Fails 3 tests in `tests/auth.test.js` (`GET /api/auth/me` 500 error, `POST /api/auth/refresh-token` token rotation collision and reuse).

2. **Run Adversarial Security Suite**:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npx jest tests/adversarial.test.js
   ```
   *Expected Current Result*: Passes 18 security & injection checks, fails 2 edge case tests for `GET /api/auth/me` and same-second token rotation.
