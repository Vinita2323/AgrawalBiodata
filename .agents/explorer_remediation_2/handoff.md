# Handoff Report — Explorer 2: Backend Remediation Investigation

## 1. Observation
- **Observation 1 (Payment Model & Type)**: In `backend/models/Payment.js` (lines 51-55), `planId` is defined as:
  ```javascript
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    index: true
  }
  ```
  When a `Payment` document is saved and retrieved, `payment.planId` is a Mongoose `ObjectId` object (`typeof payment.planId === 'object'`).

- **Observation 2 (Plan Model Schema)**: In `backend/models/Plan.js` (lines 8-15), the `planId` field is a slug string (e.g. `'free'`, `'gold'`, `'platinum'`, `'diamond'`), while the MongoDB primary key is `_id` (`ObjectId`):
  ```javascript
  planId: {
    type: String,
    unique: true,
    index: true,
    trim: true
  }
  ```

- **Observation 3 (Plan Resolution & Silent Downgrade)**: In `backend/services/paymentService.js` (lines 44-67 & 361-380):
  - In `activateUserSubscription`, `this.resolvePlan(planId)` is called with `payment.planId`.
  - If guarded with `typeof planId === 'string' && planId.match(...)`, the condition fails for Mongoose `ObjectId` objects (`typeof planId === 'object'`), skipping `Plan.findById(idStr)`.
  - Fallback `Plan.findOne({ planId: idStr })` fails when querying against slug field `planId`.
  - Line 374 then defaults: `plan = await Plan.findOne({ name: 'Gold' }) || await Plan.findOne();`, erroneously downgrading Platinum and Diamond purchases to Gold.

- **Observation 4 (Gotra Schema Validation)**: In `backend/models/Profile.js` (lines 152-162):
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
  }
  ```
  In `backend/utils/gotras.js` and `backend/config/constants.js` (lines 6-25), the 18 authentic Gotras are Garg, Goyal, Bansal, Bindal, Mittal, Singhal, Jindal, Tingal, Tayal, Airan, Dharan, Madhukul, Goyan, Kuchhal, Kansal, Nangal, Mangal, and Bhandal. `'Agrawal'` is the community name, not a Gotra, so `isValidGotra('Agrawal')` returns `false` and throws a `ValidationError`.

- **Observation 5 (Test Suite Inventory)**: `backend/tests/` contains 12 integration/stress test suites (`auth.test.js`, `adversarial.test.js`, `challenger_m1.test.js`, `profile.test.js`, `challenger_m2.test.js`, `matches.test.js`, `challenger_m3.test.js`, `challenger_m3_stress.test.js`, `payment.test.js`, `verification.test.js`, `challenger_m4.test.js`, `admin.test.js`) and 1 setup file (`setup.js`).

## 2. Logic Chain
1. *From Obs 1 & 2*: A payment document stores the `Plan._id` as an `ObjectId` under `payment.planId`. However, the `Plan` schema stores the human-readable slug string (e.g. `'platinum'`) under its `planId` field and the ObjectId under `_id`.
2. *From Obs 3*: If `resolvePlan` or `activateUserSubscription` tests `typeof planId === 'string'`, it evaluates to `false` for `ObjectId` instances. This bypasses `Plan.findById(planId)` and causes `Plan.findOne({ planId: planId })` to search for an ObjectId value in a slug field, returning `null`. This triggers the fallback on line 374, resetting the user's tier to `'Gold'`, regardless of whether they purchased Platinum or Diamond.
3. *From Obs 3 Remediation*: Utilizing `mongoose.isValidObjectId(planIdentifier)` to check whether the identifier is a valid ObjectId (instance or 24-hex string) and querying `Plan.findById(planIdentifier)` first, followed by fallback to `Plan.findOne({ planId: idStr.toLowerCase() })` and `Plan.findOne({ name: ... })`, completely eliminates the bug and preserves the user's purchased tier.
4. *From Obs 4*: In `backend/tests/challenger_m4.test.js` describe block 6, attempting to create a profile with `gotra: 'Agrawal'` fails because `isValidGotra('Agrawal')` is `false`. Using an authentic Gotra like `'Garg'` or `'Bansal'` satisfies schema validation and allows the test to proceed.
5. *From Obs 5*: The full test suite can be run via `npm test`, executing Jest across all 12 test suites in band.

## 3. Caveats
- `mongoose` must be explicitly required at the top of `backend/services/paymentService.js` before calling `mongoose.isValidObjectId(...)`.
- `challenger_m4.test.js` at line 720 currently has `gotra: 'Bansal'`, which is valid; if any test fixtures or payloads reference `'Agrawal'`, they must be replaced with one of the 18 authentic Gotras (`'Garg'`, `'Bansal'`, etc.).

## 4. Conclusion
1. **Payment Service Fix**:
   - In `backend/services/paymentService.js`, import `mongoose`.
   - Update `resolvePlan(planIdentifier)` to use `mongoose.isValidObjectId(planIdentifier)` and query `Plan.findById(planIdentifier)`. Fall back to `Plan.findOne({ planId: idStr.toLowerCase() })` and `Plan.findOne({ name: new RegExp('^' + idStr + '$', 'i') })`.
   - This ensures `activateUserSubscription` properly resolves Mongoose `ObjectId` objects and preserves the user's purchased subscription tier (Platinum/Diamond/Gold).
2. **Gotra Enum Compliance**:
   - All profile creations in `challenger_m4.test.js` (and across all test suites) must use one of the 18 authentic Agarwal Gotras (`'Garg'`, `'Bansal'`, etc.) rather than `'Agrawal'`.
3. **Test Suite Execution**:
   - The test suite comprises 12 test files + 1 setup file, executed via `npm test` (`cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit`).

## 5. Verification Method
1. **Inspect Code Files**:
   - `backend/services/paymentService.js` (lines 40-68 & 361-380)
   - `backend/tests/challenger_m4.test.js` (lines 710-735)
   - `backend/models/Profile.js` (lines 152-162)
   - `backend/utils/gotras.js` (lines 13-55)
2. **Run Test Commands**:
   - Single test: `npx jest tests/payment.test.js --runInBand`
   - Challenger M4: `npx jest tests/challenger_m4.test.js --runInBand`
   - Full suite: `npm test`
3. **Invalidation Conditions**:
   - If `activateUserSubscription` still assigns `'Gold'` when passed a Platinum or Diamond `planId`.
   - If `Profile.create({ gotra: 'Agrawal' })` is expected to pass without updating the Gotra schema/constants.
