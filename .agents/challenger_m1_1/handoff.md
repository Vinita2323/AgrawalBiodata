# Milestone 1 (Core Infrastructure & Auth) Challenger Handoff Report

## 1. Observation

### Test Execution Commands & Results
An adversarial test suite containing 31 empirical test cases was written and executed at `backend/tests/challenger_m1.test.js` using Jest:

```bash
npx jest tests/challenger_m1.test.js --runInBand --forceExit
```

**Output Summary**:
```
FAIL tests/challenger_m1.test.js
  Milestone 1 Adversarial & Boundary Empirical Test Suite
    1. OTP Spam Attacks & Window Rate Limiting
      √ OTP Spam 1.1: First OTP request succeeds with 200 OK (166 ms)
      √ OTP Spam 1.2: Immediate second OTP request strictly rejected with 400 and OTP_COOLDOWN_ACTIVE (55 ms)
      √ OTP Spam 1.3: Enforces 5 requests per 10-minute window and returns 429 on 6th attempt (165 ms)
      √ OTP Spam 1.4: 10-minute window reset allows requests after window expires (39 ms)
      √ OTP Spam 1.5: Phone number variations (+91, 0 prefix, spaces) normalize to same mobile (44 ms)
      √ OTP Spam 1.6: Malformed, non-numeric, or invalid length phone numbers rejected with 400 (47 ms)
    2. OTP Verification Boundary, Brute Force & Replay Attacks
      √ OTP Verify 2.1: Rejects verification when no OTP was requested (26 ms)
      √ OTP Verify 2.2: Rejects wrong OTP code and increments failure attempts (39 ms)
      √ OTP Verify 2.3: Brute force lockout after 5 consecutive failed attempts (99 ms)
      √ OTP Verify 2.4: Rejects expired OTP code (>5 minutes old) (37 ms)
      √ OTP Verify 2.5: Strictly forbids OTP reuse (Replay Attack) (66 ms)
    3. Admin Authentication, Passwords, Security & Deactivation
      √ Admin 3.1: Super Admin login returns signed token and hides password hash (191 ms)
      √ Admin 3.2: Case-insensitive email handles uppercase/mixed login (165 ms)
      √ Admin 3.3: Rejects invalid password with 401 Unauthorized (161 ms)
      √ Admin 3.4: Deactivated admin login returns 403 Forbidden (162 ms)
      √ Admin 3.5: Deactivated admin with existing token rejected with 403 Forbidden on protected routes (179 ms)
      √ Admin 3.6: Malformed, forged, or expired admin tokens return 401 Unauthorized (105 ms)
    4. Suspended User Account Access Barrier
      √ Suspended 4.1: Accessing /api/auth/me returns 403 Forbidden (41 ms)
      √ Suspended 4.2: Refreshing tokens returns 403 Forbidden (40 ms)
      √ Suspended 4.3: Login via OTP verification returns 403 Forbidden (62 ms)
      √ Suspended 4.4: Re-registering with suspended mobile returns 403 Forbidden (52 ms)
    5. 18 Authentic Gotras Validation & Exogamy Boundary Tests
      √ Gotra 5.1: Exactly 18 authentic Gotras returned by /api/gotras (16 ms)
      √ Gotra 5.2: Normalizes all 18 authentic Gotras in English (case-insensitive) (13 ms)
      √ Gotra 5.3: Normalizes Hindi Devanagari script for all 18 Gotras (7 ms)
      √ Gotra 5.4: Normalizes bilingual formats and common spelling aliases (6 ms)
      √ Gotra 5.5: Strictly rejects non-Agarwal gotras, empty values, and malicious inputs (8 ms)
      √ Gotra 5.6: Gotra Exogamy Engine correctly handles all 4 boundary conditions (6 ms)
    6. Empirical Bug Reproduction on User Token Operations
      × Bug Repro 6.1: GET /api/auth/me should return 200 without 500 crashes from unpopulated profiles (44 ms)
      × Bug Repro 6.2: POST /api/auth/refresh-token rotation must produce distinct token string and reject old token (39 ms)
    7. Admin Profile Conflicts & Token Tampering
      √ Admin 7.1: Rejects updating admin email to an already taken email (249 ms)
      √ Token 7.2: Rejects non-JWT string in refresh-token endpoint with 401 (192 ms)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 29 passed, 31 total
```

### Direct Observations of Defects

#### Defect 1: Unhandled `MissingSchemaError` in `GET /api/auth/me`
- **File & Line**: `backend/controllers/authController.js:276`
- **Code**:
  ```javascript
  const user = await User.findById(req.user.userId).populate('profiles');
  ```
- **Error**: When an authenticated user calls `GET /api/auth/me`, Mongoose throws `MissingSchemaError: Schema hasn't been registered for model "Profile"`. Express catches this in `errorHandler.js` and returns HTTP 500 Internal Server Error:
  ```
  Expected: 200
  Received: 500
  ```

#### Defect 2: Duplicate Signature & Defeated Replay Protection in `POST /api/auth/refresh-token`
- **File & Lines**:
  - `backend/utils/token.js:20-30`:
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
  - `backend/controllers/authController.js:220-232`:
    ```javascript
    // Check if refresh token exists in user's saved list
    const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
    if (tokenIndex === -1) {
      return unauthorized(res, 'Refresh token has been revoked or invalidated');
    }

    // Rotate refresh token
    user.refreshTokens.splice(tokenIndex, 1);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
    await user.save();
    ```
- **Observation**: Because `signRefreshToken` signs static fields without a unique salt/jti, when token refresh occurs within the same second, `newRefreshToken === oldRefreshToken`. The splice removes the token, but the push re-inserts the exact same string. The old token is therefore never invalidated, and subsequent replay calls with the old token succeed (returning 200) instead of being rejected with 401 Unauthorized.

---

## 2. Logic Chain

1. **OTP Rate Limiting & Cooldown**:
   - `POST /api/auth/send-otp` tracks `cooldownUntil` and `requestCount` with a 10-minute window in MongoDB.
   - When a second request is issued within 30 seconds, `OtpService.requestOtp` identifies `now < otpDoc.cooldownUntil` and returns 400 Bad Request with `OTP_COOLDOWN_ACTIVE`.
   - When 5 requests are made within the 10-minute window, the 6th request identifies `otpDoc.requestCount >= 5` and returns 429 Too Many Requests with `OTP_RATE_LIMIT_EXCEEDED`.
   - Normalization via regex `mobile.replace(/\D/g, '')` stripping leading `+91` or `0` ensures phone number variations do not bypass the rate limits.

2. **OTP Verification & Single-Use**:
   - Failed OTP guesses increment `attempts`. After 5 failed attempts, any subsequent attempt triggers `MAX_ATTEMPTS_EXCEEDED` and returns 400.
   - Upon successful verification, `otpDoc.isUsed` is flagged `true`. Replay attempts fail to find an active record (`isUsed: false`) and return 400 `OTP_NOT_FOUND`.
   - Expired OTP timestamps (>5 minutes) return 400 `OTP_EXPIRED`.

3. **Admin Security & Audit Trail**:
   - `POST /api/admin/auth/login` verifies bcrypt passwords via `Admin.comparePassword`, omitting password fields from the response envelope (`toJSON` transform).
   - Inactive admin accounts are blocked at login and on protected routes via `adminAuth` middleware with 403 Forbidden.
   - All admin logins and password changes generate immutable audit log documents via `auditService.logAction`.

4. **Suspended User Enforcement**:
   - `auth.js` middleware checks `user.accountStatus === 'Suspended'` and returns 403 Forbidden for all protected endpoints.
   - `verifyOtp`, `register`, and `refreshToken` handlers explicitly check account status and return 403 Forbidden.

5. **18 Gotras Validation**:
   - `gotras.js` normalizes canonical English, Devanagari Hindi (`गर्ग`), composite strings (`गर्ग (Garg)`), and historical aliases (`Goel`, `Kushal`, `Nagal`, `Dhingan`).
   - Gotra exogamy logic computes scores conforming to community standards: Sagotra collisions yield 0 points (`isSagotra: true`), maternal collisions yield 15 points (`hasMaternalConflict: true`), and distinct lineages yield 30 points.

6. **Identified Flaws (Root Cause to Impact)**:
   - For `GET /api/auth/me`: Calling Mongoose `.populate('profiles')` without registering the `Profile` model throws an unhandled error, bringing down the user profile endpoint with a 500 error.
   - For `POST /api/auth/refresh-token`: Standard JWT timestamp resolution is 1 second. Without a cryptographically unique `jti` or millisecond nonce in `signRefreshToken`, tokens signed within the same second produce identical hashes, breaking the rotation invariant and defeating token revocation.

---

## 3. Caveats
- Only Milestone 1 endpoints and services were evaluated; Milestone 2 models (Candidate Biodata, 3-Generation Family Tree, Gallery Media, Match Discovery) were not evaluated as they are scheduled for Milestone 2.
- The SMS sending module operates in logging stub mode in development/test environment; real carrier SMS delivery requires cloud SMS API credentials in `.env`.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

While 29 of 31 adversarial attack vectors and boundary validations successfully passed (including OTP spam limits, 30s cooldown, brute-force lockout, admin security, suspended user barriers, and 18 Gotras exogamy rules), 2 critical backend bugs must be resolved by the worker before Milestone 1 can be approved:

1. **Fix `authController.js` line 276**: Safely retrieve user data in `getMe` without throwing a `MissingSchemaError` on `.populate('profiles')` (e.g. check `mongoose.models.Profile` or omit population until M2).
2. **Fix `utils/token.js` `signRefreshToken`**: Add a unique identifier (`jti: crypto.randomUUID()` or timestamp nonce) to the refresh token payload so that rotated refresh tokens always produce unique signatures, allowing proper token revocation and replay rejection.

---

## 5. Verification Method

To independently reproduce all findings and verify the fixes:

1. **Run the Challenger Empirical Test Suite**:
   ```bash
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npx jest tests/challenger_m1.test.js --runInBand --forceExit
   ```

2. **Run the Baseline Auth Test Suite**:
   ```bash
   npm test tests/auth.test.js
   ```

3. **Invalidation Conditions**:
   - `GET /api/auth/me` returns 200 OK with user profile details instead of 500.
   - `POST /api/auth/refresh-token` issues a refresh token that differs from the old token, and replaying the old token returns 401 Unauthorized.
   - All 31 tests in `tests/challenger_m1.test.js` and all 27 tests in `tests/auth.test.js` pass with 0 failures.
