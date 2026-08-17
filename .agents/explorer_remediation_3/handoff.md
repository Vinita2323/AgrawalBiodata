# Handoff Report: Agrawal Biodata REST API Remediation Investigation

**Author**: Explorer 3  
**Target Workspaces**: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`  
**Working Directory**: `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\explorer_remediation_3`  
**Date**: 2026-08-14  
**Handoff Type**: Hard (Investigation Complete)

---

## 1. Observation

### 1.1 `backend/services/paymentService.js`
- **Lines 7–15**:
  ```javascript
  const crypto = require('crypto');
  const env = require('../config/env');
  const { razorpayInstance } = require('../config/razorpay');
  const Plan = require('../models/Plan');
  const Subscription = require('../models/Subscription');
  const Payment = require('../models/Payment');
  const User = require('../models/User');
  const auditService = require('./auditService');
  const logger = require('../utils/logger');
  ```
  `mongoose` is not currently imported in `paymentService.js`.
- **Lines 44–67 (`resolvePlan`)**:
  ```javascript
  async resolvePlan(planIdentifier) {
    if (!planIdentifier) return null;

    if (planIdentifier._id && planIdentifier.name) {
      return planIdentifier;
    }

    const idStr = planIdentifier.toString ? planIdentifier.toString() : String(planIdentifier);

    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const plan = await Plan.findById(idStr);
        if (plan) return plan;
      } catch (err) {
        // Continue fallback
      }
    }

    let plan = await Plan.findOne({ planId: idStr });
    if (plan) return plan;

    plan = await Plan.findOne({ name: new RegExp(`^${idStr}$`, 'i') });
    return plan;
  }
  ```
- **Lines 369–376 (`activateUserSubscription`)**:
  ```javascript
  // 1. Resolve Plan
  let plan = await this.resolvePlan(planId);

  // Default to Gold if plan not specified
  if (!plan) {
    plan = await Plan.findOne({ name: 'Gold' }) || await Plan.findOne();
  }
  ```
- **Lines 212–219 (`verifyClientPayment`) & Lines 317–324 (`processWebhookEvent`)**:
  `payment.planId` is passed into `activateUserSubscription({ userId, planId: payment.planId, ... })`.
  In `Payment.js` (line 52), `planId` is defined as `type: mongoose.Schema.Types.ObjectId, ref: 'Plan'`. When queried from Mongoose via `Payment.findOne(...)`, `payment.planId` is an instance of `mongoose.Types.ObjectId`.

### 1.2 `backend/models/Profile.js` & `backend/tests/challenger_m4.test.js`
- In `backend/models/Profile.js` (lines 152–162):
  ```javascript
  gotra: {
    type: String,
    required: [true, 'Gotra is required'],
    trim: true,
    validate: {
      validator: function (value) {
        return isValidGotra(value);
      },
      message: props => `"${props.value}" is not one of the authentic 18 Agarwal Gotras`
    }
  },
  ```
- In `backend/config/constants.js` (lines 6–25) and `backend/utils/gotras.js` (lines 1–46), the 18 authentic Maharaja Agrasen Gotras are:
  `Garg`, `Goyal` (`Goel`), `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan` (`Dhingan`), `Kuchhal` (`Kushal`), `Kansal`, `Nangal` (`Nagal`), `Mangal`, `Bhandal`.
- `'Agrawal'` is the community / caste name, NOT one of the 18 gotras. Thus `isValidGotra('Agrawal')` returns `false`.
- In `backend/tests/challenger_m4.test.js` describe block 6 (lines 710–725):
  `gotra: 'Bansal'`, `motherGotra: 'Garg'`. Both are authentic Gotras in the 18 Gotra enum.

### 1.3 Test Suite Files in `backend/tests/`
- 13 total test-related files:
  1. `setup.js`
  2. `auth.test.js`
  3. `adversarial.test.js`
  4. `challenger_m1.test.js`
  5. `profile.test.js`
  6. `challenger_m2.test.js`
  7. `matches.test.js`
  8. `challenger_m3.test.js`
  9. `challenger_m3_stress.test.js`
  10. `payment.test.js`
  11. `verification.test.js`
  12. `challenger_m4.test.js`
  13. `admin.test.js`

---

## 2. Logic Chain

1. **Step 1 — Trace Plan Resolution**:
   - `Payment` records store `planId` as a Mongoose `ObjectId` reference.
   - When payment is verified or webhook processed, `payment.planId` (a Mongoose `ObjectId` object) is passed to `activateUserSubscription({ planId: payment.planId })`.
   - `activateUserSubscription` calls `this.resolvePlan(planId)`.
   - In `resolvePlan`, if `planIdentifier` is not resolved or lookup fails, `activateUserSubscription` defaults to `Plan.findOne({ name: 'Gold' })`.
   - If a user purchased Platinum or Diamond, this fallback would downgrade them to Gold.
   - By importing `mongoose` and using `mongoose.isValidObjectId(planIdentifier)` to execute `Plan.findById(planIdentifier)` before falling back to `Plan.findOne({ planId: idStr })` and `Plan.findOne({ name: new RegExp(...) })`, all input forms (Mongoose `ObjectId` instance, 24-hex string, slug, name) resolve cleanly and preserve tier fidelity.

2. **Step 2 — Verify Gotra Validation**:
   - `Profile` schema enforces that `gotra` must be one of the 18 authentic Gotras using `isValidGotra(value)`.
   - Passing `'Agrawal'` fails with `ValidationError: Profile validation failed: gotra: "Agrawal" is not one of the authentic 18 Agarwal Gotras`.
   - Passing authentic Gotras like `'Bansal'` or `'Garg'` passes validation.
   - In `challenger_m4.test.js` describe block 6, `gotra: 'Bansal'` is valid and conforms to the schema.

3. **Step 3 — Test Suite Verification**:
   - The test suite is configured with Jest 29 and `mongodb-memory-server` in `backend/jest.config.js`.
   - The suite command `npm test` runs all 12 test suites sequentially with `--runInBand --detectOpenHandles --forceExit`.

---

## 3. Caveats

- **Read-Only Scope**: Explorer 3 performed read-only static analysis without directly modifying application source files.
- **Environment Stubs**: Tests utilize `mongodb-memory-server` and in-memory mock crypto keys for Razorpay HMAC signatures (`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`). Real Razorpay webhooks in production require identical SHA256 hashing against the configured webhook secret.

---

## 4. Conclusion

1. **`backend/services/paymentService.js`**:
   - Must import `const mongoose = require('mongoose');`.
   - Must update `resolvePlan` to use `mongoose.isValidObjectId(planIdentifier)` -> `Plan.findById(planIdentifier)` -> `Plan.findOne({ planId: idStr })` -> `Plan.findOne({ name: new RegExp(...) })`.
2. **`backend/tests/challenger_m4.test.js`**:
   - Confirmed that describe block 6 uses authentic Gotra (`'Bansal'`), preventing Gotra validation errors.
3. **Test Infrastructure**:
   - All 12 test suites in `backend/tests/` are indexed and verified ready for test runner execution.

---

## 5. Verification Method

### Test Suite Execution
To independently verify the backend REST API:
```bash
# In c:\Users\admin\Desktop\appzeto-2\agarwal\backend
npm test
```

### Targeted Test Suite Verification
```bash
# Verify Payment Service & Subscription Activation
npx jest tests/payment.test.js --runInBand

# Verify Challenger M4 (HMAC Verification, Idempotency, KYC Rejection)
npx jest tests/challenger_m4.test.js --runInBand

# Verify Gotra Validation & Profiles
npx jest tests/profile.test.js --runInBand
```
