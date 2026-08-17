# Milestone 1 Remediation Handoff Report

**Agent**: Worker M1 Fix (Core Infra & Auth Remediation Engineer)  
**Target Work Product**: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`  
**Status**: All Defects Fixed & 100% Tests Passing (79/79 Passed)

---

## 1. Observation

### Baseline Failures Observed
Prior to remediation, executing `npm test` across the test suites resulted in 7 failures across 3 test suites (`tests/auth.test.js`, `tests/adversarial.test.js`, `tests/challenger_m1.test.js`):
1. `GET /api/auth/me` threw `MissingSchemaError: Schema hasn't been registered for model "Profile"` resulting in HTTP 500.
2. `POST /api/auth/refresh-token` generated identical tokens during sub-second execution due to lack of unique nonce/`jti`, failing rotation and anti-replay verification (old token remained valid).
3. `rateLimiter.js` lacked string coercion on `req.body.mobile`, exposing `TypeError: req.body.mobile.replace is not a function` when numeric values were sent.
4. `otpService.js` used exclusive upper bound `crypto.randomInt(100000, 999999)` which excluded `999999`.

### Changes Applied
1. **`backend/utils/token.js`**:
   - Imported Node built-in `crypto`.
   - Updated `signRefreshToken` to include `jti: crypto.randomUUID()` in the JWT payload:
     ```javascript
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
2. **`backend/controllers/authController.js`**:
   - Imported `mongoose`.
   - Guarded `.populate('profiles')` in `getMe` by verifying `if (mongoose.models && mongoose.models.Profile)`:
     ```javascript
     const getMe = async (req, res, next) => {
       try {
         let query = User.findById(req.user.userId);
         if (mongoose.models && mongoose.models.Profile) {
           query = query.populate('profiles');
         }
         const user = await query;
         if (!user) {
           return unauthorized(res, 'User not found');
         }
     ```
3. **`backend/middleware/rateLimiter.js`**:
   - Coerced `req.body.mobile` to string defensively before invoking `.replace(/\D/g, '')`:
     ```javascript
     keyGenerator: (req) => {
       const mobile = req.body && req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : null;
       return mobile || req.ip;
     }
     ```
4. **`backend/services/otpService.js`**:
   - Corrected `generate6DigitOtp` upper bound to `1000000` to properly cover the full inclusive range `[100000, 999999]`:
     ```javascript
     generate6DigitOtp() {
       return crypto.randomInt(100000, 1000000).toString();
     }
     ```
5. **`backend/tests/adversarial.test.js`**:
   - Added test case verifying that numeric payload `mobile: 9876543210` does not crash `otpLimiter`.

### Post-Fix Verification Output
Command executed: `npm test`
```text
PASS tests/auth.test.js
PASS tests/challenger_m1.test.js
PASS tests/adversarial.test.js

Test Suites: 3 passed, 3 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        9.955 s, estimated 11 s
Ran all test suites.
```

---

## 2. Logic Chain

1. **Token Rotation & Replay Prevention**:
   - Standard JWT `iat` (issued at) timestamp has a 1-second resolution.
   - Without unique payload entropy, rapid sequential token refreshes (e.g. within the same second) yield duplicate JWT signatures.
   - Splicing the old token and pushing an identical new token leaves the old token string in the user's active `refreshTokens` array, allowing token reuse and failing replay assertions.
   - Adding `jti: crypto.randomUUID()` injects 128 bits of cryptographic entropy into every signed token, guaranteeing distinct JWT strings on every invocation. Revoking the previous token and inserting the new token strictly invalidates the old token.

2. **`getMe` Population Safety**:
   - In M1 scope, only `User`, `Admin`, `OTP`, and `AuditLog` schemas are registered; `Profile` is scheduled for M2.
   - Mongoose `.populate('profiles')` requires `Profile` model schema to be present in `mongoose.models`.
   - Checking `if (mongoose.models && mongoose.models.Profile)` allows `getMe` to work cleanly in M1 without unhandled `MissingSchemaError` 500 crashes while automatically enabling profile population when `Profile` model is registered in M2.

3. **Rate Limiter Type Safety**:
   - JSON numeric values parsed by `express.json()` produce primitive Numbers.
   - Calling `.replace()` on a number throws an unhandled `TypeError`.
   - Coercing with `String(req.body.mobile)` ensures regex stripping operates safely on numbers, strings, and avoids runtime crashes.

4. **OTP Random Upper Bound**:
   - In Node.js, `crypto.randomInt(min, max)` is inclusive of `min` and exclusive of `max` (`min <= result < max`).
   - Using `crypto.randomInt(100000, 1000000)` produces uniformly distributed integers in the range `100000 <= n <= 999999`.

---

## 3. Caveats

- In test environments, tests run with in-memory MongoDB via `mongodb-memory-server` hermetically without requiring external database instances.
- SMS dispatch continues to run via `smsService.js` in development/test stub mode (logging SMS OTP payloads cleanly to console / test response objects for testability).
- All changes were surgical and minimal, preserving all existing architecture, Gotras exogamy scoring, rate limiting, and password hashing.

---

## 4. Conclusion

All defects identified by the Forensic Auditor, Reviewers, and Challengers have been completely remediated with genuine logic:
- Unique `jti` in refresh token generation guarantees single-use token rotation and prevents token replay.
- `GET /api/auth/me` executes cleanly without 500 crashes.
- Rate limiter safely handles non-string mobile inputs.
- OTP service includes the complete 6-digit range up to `999999`.
- **Test Pass Rate**: 100% (79 passed, 0 failed across 3 test suites).

---

## 5. Verification Method

To independently verify all fixes:

```bash
cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
npm test
```

Expected result:
- `PASS tests/auth.test.js`
- `PASS tests/challenger_m1.test.js`
- `PASS tests/adversarial.test.js`
- `Test Suites: 3 passed, 3 total`
- `Tests: 79 passed, 79 total`
- Exit Code: `0`
