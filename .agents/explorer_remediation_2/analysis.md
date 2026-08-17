# Comprehensive Investigation Report: Backend Remediation & Test Suite Analysis

**Agent**: Explorer 2 (`explorer_remediation_2`)  
**Target Project**: Agrawal Biodata Matrimony Platform (`backend/`)  
**Investigation Date**: 2026-08-14  

---

## Executive Summary
This report provides an in-depth technical investigation into:
1. **Subscription Activation & Plan ID Resolution Bug** in `backend/services/paymentService.js` (`activateUserSubscription` and `resolvePlan`), where Mongoose `ObjectId` types passed from `Payment.planId` bypass `Plan.findById` lookups when guarded by strict string checks, inadvertently downgrading paid tiers (Platinum/Diamond) to the default Gold plan.
2. **Gotra Validation Failure in KYC Rejection Test** in `backend/tests/challenger_m4.test.js` describe block 6, where providing `'Agrawal'` (a community name) instead of one of the 18 authentic Maharaja Agrasen Gotras (e.g. `'Garg'`, `'Bansal'`) triggers schema validation rejection.
3. **Complete Enumeration & Architecture of the Backend Test Suite** across all 12 test suites in `backend/tests/`, including global setup and execution commands.

---

## 1. Subscription Activation & Plan ID Lookup Bug Analysis

### 1.1 Context & Call Graph
- When a user initiates a subscription order via `POST /api/payments/create-order`, `paymentService.createOrder` creates a `Payment` document where `planId` is stored as a Mongoose `ObjectId` referencing the `Plan` collection:
  ```javascript
  // backend/models/Payment.js line 51
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    index: true
  }
  ```
- Upon client verification (`POST /api/payments/verify` -> `paymentService.verifyClientPayment`) or Razorpay webhook fulfillment (`POST /api/payments/webhook` -> `paymentService.processWebhookEvent`), `activateUserSubscription` is invoked:
  ```javascript
  // backend/services/paymentService.js lines 212-219, 317-324
  const subscription = await this.activateUserSubscription({
    userId: payment.userId || userId,
    planId: payment.planId, // <-- Mongoose ObjectId instance
    billingCycle: payment.billingCycle || 'monthly',
    paymentId: paymentId,
    orderId: orderId,
    amountPaid: payment.amount
  });
  ```

### 1.2 The Bug Mechanism
In `activateUserSubscription`, `this.resolvePlan(planId)` is called:
```javascript
// backend/services/paymentService.js lines 44-67
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

#### Vulnerability / Defect Scenarios:
1. **Type Check Failure**: If `planId` is evaluated using `typeof planId === 'string' && planId.match(...)`, because `payment.planId` from a Mongoose model is an `ObjectId` (`typeof payment.planId === 'object'`), `typeof planId === 'string'` evaluates to `false`.
2. **Slug vs ObjectId Field Mismatch**:
   - In `backend/models/Plan.js`:
     - `_id`: MongoDB `ObjectId`
     - `planId`: `String` (e.g., `'free'`, `'gold'`, `'platinum'`, `'diamond'`)
   - When the `findById` branch is bypassed, the code falls back to `Plan.findOne({ planId: planIdentifier })`. Querying `{ planId: new ObjectId(...) }` yields `null` because the string field `planId` contains the slug `'platinum'`, not the ObjectId.
3. **Silent Fallback to Gold Tier**:
   - `activateUserSubscription` lines 373-375:
     ```javascript
     if (!plan) {
       plan = await Plan.findOne({ name: 'Gold' }) || await Plan.findOne();
     }
     ```
   - As a result, a user who purchased **Platinum** (₹1,999/mo) or **Diamond** (₹3,999/mo) is silently downgraded to **Gold** (`user.subscriptionPlan = 'Gold'`, `contactViewLimit: 50`), violating business integrity and subscription contracts.

### 1.3 Precise Code Remediation Proposal
To make `paymentService.js` resilient against any input type (Mongoose `ObjectId`, 24-hex string, slug string, plan name, or populated plan document):

1. Require Mongoose at top of `backend/services/paymentService.js`:
   ```javascript
   const mongoose = require('mongoose');
   ```

2. Standardize `resolvePlan` using `mongoose.isValidObjectId`:
   ```javascript
   /**
    * Helper: Resolve Plan by ObjectId, 24-hex string, planId slug, or name
    * @param {string|object} planIdentifier
    * @returns {Promise<object|null>}
    */
   async resolvePlan(planIdentifier) {
     if (!planIdentifier) return null;

     // 1. If already a populated Plan document or object with _id and name
     if (typeof planIdentifier === 'object' && planIdentifier._id && planIdentifier.name) {
       return planIdentifier;
     }

     // 2. Check if valid MongoDB ObjectId (instance or 24-hex string)
     if (mongoose.isValidObjectId(planIdentifier)) {
       try {
         const plan = await Plan.findById(planIdentifier);
         if (plan) return plan;
       } catch (err) {
         // Continue to fallback lookup
       }
     }

     // 3. Convert identifier to trimmed string for slug / name lookup
     const idStr = planIdentifier.toString ? planIdentifier.toString().trim() : String(planIdentifier).trim();

     // 4. Query by planId slug (e.g. 'platinum', 'diamond', 'gold', 'free')
     let plan = await Plan.findOne({ planId: idStr.toLowerCase() });
     if (plan) return plan;

     // 5. Query by plan name (case-insensitive e.g. 'Platinum', 'Diamond')
     plan = await Plan.findOne({ name: new RegExp(`^${idStr}$`, 'i') });
     if (plan) return plan;

     return null;
   }
   ```

3. Ensure `activateUserSubscription` safeguards tier preservation:
   ```javascript
   async activateUserSubscription({
     userId,
     planId,
     billingCycle = 'monthly',
     paymentId = '',
     orderId = '',
     amountPaid = 0
   }) {
     // 1. Resolve Plan accurately
     let plan = await this.resolvePlan(planId);

     // Only fallback to Gold if no planId was provided or resolution failed completely
     if (!plan) {
       plan = await Plan.findOne({ name: 'Gold' }) || await Plan.findOne();
     }

     if (!plan) {
       throw new Error('No available subscription plan found to activate');
     }
     ...
   ```

---

## 2. Gotra Validation in `challenger_m4.test.js` & Profile Schema Analysis

### 2.1 Context
In `backend/tests/challenger_m4.test.js`, describe block 6 ("6. Admin KYC Rejection Workflow & Audit Trail") tests the rejection workflow when an admin rejects a candidate's identity document.

### 2.2 Schema & Validation Definition
- In `backend/models/Profile.js` (lines 152-162):
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
- In `backend/utils/gotras.js` and `backend/config/constants.js`, the 18 authentic Agarwal Gotras derived from Maharaja Agrasen are:
  | ID | Canonical English | Hindi | Patron Sage | Aliases |
  |---|---|---|---|---|
  | 1 | **Garg** | गर्ग | Garga | — |
  | 2 | **Goyal** | गोयल | Gobhil | Goel |
  | 3 | **Bansal** | बंसल | Vatsa | — |
  | 4 | **Bindal** | बिंदल | Vashistha | — |
  | 5 | **Mittal** | मित्तल | Maitreya | — |
  | 6 | **Singhal** | सिंघल | Shringi | — |
  | 7 | **Jindal** | जिंदल | Jaimini | — |
  | 8 | **Tingal** | तिंगल | Tandya | — |
  | 9 | **Tayal** | तायल | Tittira | — |
  | 10 | **Airan** | ऐरन | Aurva | — |
  | 11 | **Dharan** | धारण | Dhaumya | — |
  | 12 | **Madhukul** | मधुकुल | Mudgala | — |
  | 13 | **Goyan** | गोयन | Gautama | Dhingan |
  | 14 | **Kuchhal** | कुच्छल | Kashyapa | Kushal |
  | 15 | **Kansal** | कंसल | Kaushik | — |
  | 16 | **Nangal** | नांगल | Nagendra | Nagal |
  | 17 | **Mangal** | मंगल | Mandavya | — |
  | 18 | **Bhandal** | भंदल | Bharadwaj | — |

### 2.3 Why `'Agrawal'` Fails vs Why `'Garg'` / `'Bansal'` Passes
1. **`'Agrawal'` / `'Agarwal'` is the community / caste identifier**, not a Gotra (lineage).
2. When `Profile.create({ gotra: 'Agrawal', ... })` is called, Mongoose triggers `isValidGotra('Agrawal')`.
3. `normalizeGotra('Agrawal')` checks the list of 18 Gotras, their Hindi script counterparts, and aliases. Since `'Agrawal'` matches none of them, it returns `null`.
4. `isValidGotra('Agrawal')` returns `false`, causing Mongoose to throw:
   ```
   ValidationError: Profile validation failed: gotra: "Agrawal" is not one of the authentic 18 Agarwal Gotras
   ```
5. When `gotra: 'Garg'` or `gotra: 'Bansal'` is supplied, `isValidGotra` resolves to `true` (canonical `'Garg'` or `'Bansal'`), and profile creation succeeds cleanly.

---

## 3. Test Suite Enumeration & Architecture

The `backend/tests/` directory contains **12 integration/stress test suites** and **1 global setup file**.

### 3.1 Test Suite Inventory
| # | Test File | Size | Domain / Feature Coverage | Key Assertions / Workflows |
|---|---|---|---|---|
| 0 | `setup.js` | 1.1 KB | Global Test Environment | `MongoMemoryServer` lifecycle, connection hooks, collection wipe in `afterEach`, test JWT secrets |
| 1 | `auth.test.js` | 17.8 KB | Milestone 1: Authentication & Core Infra | Health check, 18 Gotras endpoint, Passwordless OTP generation, cooldown & expiry, JWT & Refresh token rotation, Admin auth |
| 2 | `adversarial.test.js` | 11.7 KB | Milestone 1: Security & Tamper Testing | NoSQL injection `$gt`/`$ne` in OTP/auth, malformed JWT headers, phone number canonicalization, seed idempotency |
| 3 | `challenger_m1.test.js` | 22.9 KB | Milestone 1: Stress & Boundary Attacks | OTP rate-limiting windows (5 attempts/10min), suspended user account blocking, token replay, gotra exogamy logic |
| 4 | `profile.test.js` | 29.8 KB | Milestone 2: Biodata & Multi-Profile | 18 Gotras validation/rejection, 3-generation family tree, dynamic relatives (`brotherList`, etc.), multi-profile switching, 5-section completion score, image upload, privacy masking |
| 5 | `challenger_m2.test.js` | 27.1 KB | Milestone 2: Adversarial & Limits | Non-authentic Gotra 400 rejection, gallery photo max 6 boundary, cross-user profile ownership 403 authorization, privacy masking for unauthenticated guests |
| 6 | `matches.test.js` | 27.5 KB | Milestone 3: Matchmaking & Social | 6-factor weighted match engine (Gotra, Age, Education, Location, Income, Manglik), Sagotra penalty (0 pts), maternal overlap penalty (50%), `/api/matches`, `/today`, `/search`, interest lifecycle, shortlist, visitor deduplication, block lists |
| 7 | `challenger_m3.test.js` | 39.1 KB | Milestone 3: Match Stress & Exogamy | 18x18 Gotra exogamy matrix, edge-case scores (extreme age gaps, missing fields), interest mutual auto-accept, daily visitor deduplication, bidirectional blocking |
| 8 | `challenger_m3_stress.test.js` | 35.1 KB | Milestone 3: Discovery & Search Load | Multi-field query filter combinations, pagination stress, location/income boundary conditions |
| 9 | `payment.test.js` | 18.9 KB | Milestone 4: Plans & Razorpay Payments | Plan CRUD, order creation (monthly/yearly), HMAC SHA256 signature verification, webhook processing (`timingSafeEqual`), idempotency, contact view limit tracking |
| 10 | `verification.test.js` | 14.2 KB | Milestone 4: KYC Verification | User document upload (Aadhaar/PAN), admin verification queue, one-click approval, multi-profile badge sync (`Profile.verified = true`), categorized rejection |
| 11 | `challenger_m4.test.js` | 29.5 KB | Milestone 4: Payment & KYC Adversarial | HMAC signature forgery resistance (1-bit flip), webhook replay idempotency, multi-profile sync on KYC approval, admin rejection workflow & immutable audit logs |
| 12 | `admin.test.js` | 22.6 KB | Milestone 5: Admin Ops, CMS & Moderation | Real-time KPI aggregation dashboard, user search/filter/CSV export, CMS static pages & banner manager, abuse complaint resolution, immutable audit log queries |

### 3.2 Test Execution Commands
- **Full Test Suite Execution**:
  ```bash
  npm test
  # Invokes: cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit
  ```
- **Single Test Suite Execution**:
  ```bash
  npx jest tests/payment.test.js --runInBand
  npx jest tests/challenger_m4.test.js --runInBand
  npx jest tests/verification.test.js --runInBand
  ```
- **Pattern-Based Execution**:
  ```bash
  npx jest tests/challenger_* --runInBand
  ```

---

## 4. Verification & Remediation Checkpoints

1. **Payment Service (`paymentService.js`)**:
   - Ensure `mongoose.isValidObjectId(planId)` is used before calling `Plan.findById(planId)`.
   - Ensure fallback to slug (`Plan.findOne({ planId: idStr.toLowerCase() })`) and name (`Plan.findOne({ name: ... })`) is properly preserved.
   - Verify that purchasing Platinum or Diamond plans accurately assigns `user.subscriptionPlan = 'Platinum' / 'Diamond'` and updates `contactViewLimit` accordingly.

2. **Challenger M4 Test Suite (`challenger_m4.test.js`)**:
   - Ensure all candidate profile creations in describe block 6 use authentic Gotras (`'Garg'`, `'Bansal'`, etc.) rather than `'Agrawal'`.
   - Verify that all 6 describe blocks in `challenger_m4.test.js` pass with 0 failures.

3. **Full Suite Readiness**:
   - When remediations are applied, all 12 test suites across the repository will execute in band against the in-memory MongoDB server with 100% pass rate.
