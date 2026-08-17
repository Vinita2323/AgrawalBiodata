# Milestone 1 (Core Infrastructure & Auth) Forensic Audit Report

**Work Product**: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`  
**Profile**: General Project (Development Mode)  
**Verdict**: **`INTEGRITY VIOLATION`**

---

## 1. Observation

1. **Test Suite Execution Failure**:
   Command executed: `npm test` in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`.
   Result: Process exited with return code `1`.
   Output Summary: `Test Suites: 1 failed, 1 total`, `Tests: 3 failed, 24 passed, 27 total`.
   
   **Failure 1: `GET /api/auth/me` returns HTTP 500 Internal Server Error**
   - File: `backend/controllers/authController.js:276`
   - Code: `const user = await User.findById(req.user.userId).populate('profiles');`
   - Test Error:
     ```
     expect(received).toBe(expected) // Object.is equality
     Expected: 200
     Received: 500
       at Object.toBe (tests/auth.test.js:252:26)
     ```
   - Root Cause: In Mongoose, calling `.populate('profiles')` requires the `Profile` model schema to be registered in `mongoose.models`. In Milestone 1, `Profile.js` has not yet been implemented or registered, causing Mongoose to throw `MissingSchemaError: Schema hasn't been registered for model "Profile"`, which is caught by the global error handler and returned as a 500 Internal Server Error.

   **Failure 2: `POST /api/auth/refresh-token` fails token rotation**
   - File: `backend/utils/token.js:20-29`
   - Code:
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
   - Test Error:
     ```
     expect(received).not.toBe(expected) // Object.is equality
     Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTdlYzI2MmQyNjcwYTEwMzJkZmIzOWYiLCJtb2JpbGUiOiI5ODEyMzQ1Njc4IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODY2OTIxOTQsImV4cCI6MTc4NzI5Njk5NH0.V7Y_omD9bFHFQ_Z9Ptt104gP03F2SLJXhAmI1Ot0LS0"
       at Object.toBe (tests/auth.test.js:283:46)
     ```
   - Root Cause: `signRefreshToken` signs a static payload without a unique token identifier (`jti` or random nonce). When executed in rapid succession (within the same Unix second timestamp `iat`), `jwt.sign` yields an identical token string, causing the rotated refresh token to equal the old refresh token.

   **Failure 3: `POST /api/auth/refresh-token` fails to reject revoked/reused token**
   - File: `backend/controllers/authController.js:220-231`
   - Test Error:
     ```
     expect(received).toBe(expected) // Object.is equality
     Expected: 401
     Received: 200
       at Object.toBe (tests/auth.test.js:305:26)
     ```
   - Root Cause: Because the newly issued refresh token is identical to the old token due to lack of entropy, the old token remains present in `user.refreshTokens` (splice removed one instance, but push added the same identical token string back), allowing immediate token replay without rejection.

2. **Static Analysis of Milestone 1 Implementation**:
   - **Bcrypt Password Hashing**: `models/Admin.js:63-77` properly invokes `bcrypt.genSalt(10)` and `bcrypt.hash` inside a pre-save hook, and implements `adminSchema.methods.comparePassword` using `bcrypt.compare`.
   - **JSON Web Token Generation**: `utils/token.js` genuinely invokes `jwt.sign` and `jwt.verify` with distinct secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ADMIN_SECRET`).
   - **18 Gotras Validation & Exogamy**: `config/constants.js` and `utils/gotras.js` faithfully define and validate all 18 authentic Agarwal Gotras and implement Gotra exogamy scoring (0 for Sagotra paternal conflict, 50% penalty for maternal overlap).
   - **OTP Lifecycle**: `services/otpService.js` uses `crypto.randomInt(100000, 999999)` for OTP generation, enforces 30s cooldown, 5 requests / 10m rate limits, and 5 failed attempt lockouts.
   - **No Hardcoded Test Bypasses / Facades Found**: All controller routes connect to actual Mongoose models and database methods; no mock return strings or bypass backdoors exist.

---

## 2. Logic Chain

1. **Forensic Rule**: Under the Integrity Forensics standard for General Projects, "Build the project from source and run its test suite. The build must succeed and tests must execute — a project that doesn't build or whose tests don't run is automatically flagged. A single failure = INTEGRITY VIOLATION."
2. **Observation Step**: Execution of `npm test` failed with 3 test failures out of 27 test cases (exit code 1).
3. **Trace Step 1**: `GET /api/auth/me` crashes with 500 because it attempts to `.populate('profiles')` on the `User` model, but `Profile` schema does not exist in M1. To be self-contained in M1 or safe against uncompiled models, it should check `mongoose.models.Profile` or defer population when the model is registered.
4. **Trace Step 2**: `POST /api/auth/refresh-token` fails token rotation and replay prevention because `signRefreshToken` lacks a unique `jti` claim or timestamp nonce (e.g. `crypto.randomUUID()` or `Date.now()`), allowing token collisions within the same second.
5. **Conclusion Deduction**: Because 3 automated integration tests fail during runtime execution verification and violate runtime reliability criteria, the work product cannot be certified as clean in its current state.

---

## 3. Caveats

- The core architecture, database connection, models, admin bcrypt authentication, 18 Gotras logic, OTP crypto generation, rate limiters, and error handling middleware are genuine, robust, and free of mock bypasses or facade cheats.
- The failures are concentrated in:
  1. An eager `.populate('profiles')` in `controllers/authController.js` before `Profile` model exists.
  2. Missing `jti` (unique token ID) in `utils/token.js` for refresh token signing.

---

## 4. Conclusion

**Verdict: `INTEGRITY VIOLATION` (REJECTED)**

Milestone 1 work product contains failing integration tests (`3 failed, 24 passed`) and runtime runtime contract flaws (`GET /api/auth/me` returns HTTP 500, `POST /api/auth/refresh-token` generates duplicate tokens under rapid execution).

### Required Corrective Actions for Worker:
1. **Fix `backend/utils/token.js`**:
   Add a unique identifier (`jti: crypto.randomUUID()` or timestamp nonce) to `signRefreshToken` payload so every issued refresh token is cryptographically unique, even when generated within the same second.
2. **Fix `backend/controllers/authController.js` (`getMe`)**:
   Safely handle population of `profiles` (e.g. check if `mongoose.models.Profile` is registered before calling `.populate('profiles')`, or query user without crashing when `Profile` model is not yet compiled).
3. **Re-run Test Suite**: Ensure `npm test` executes with `27 passed, 0 failed, 100% test pass rate`.

---

## 5. Verification Method

To independently reproduce this forensic audit result:

```bash
cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
npm test
```

Expected reproduction output:
- `FAIL tests/auth.test.js`
- `3 failed, 24 passed, 27 total`
- Exit code: `1`
