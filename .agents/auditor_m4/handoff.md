# Milestone 4 Forensic Audit Report: Subscriptions, Razorpay Integration & KYC Document Verification

## Forensic Audit Verdict
- **Work Product**: Milestone 4 Backend Implementation (Monetization & Trust: `Plan.js`, `Subscription.js`, `Payment.js`, `Verification.js`, `paymentService.js`, `paymentController.js`, `verificationController.js`, `planController.js`, `subscriptionController.js`, `auditService.js`)
- **Profile**: General Project (Forensic Integrity)
- **Integrity Mode**: Development (ORIGINAL_REQUEST.md §8)
- **Verdict**: **CLEAN** (0 Integrity Violations Detected)

---

## 1. Observation

### A. Source Code & Architecture Observations
1. **Plan Model (`backend/models/Plan.js`)**:
   - Implements full subscription schema with `planId`, `name`, `nameHindi`, `description`, `tagline`, `badge`, `monthlyPrice`, `quarterlyPrice`, `yearlyPrice`, `discountPercent`, `features`, `contactViewLimit`, `interestSendLimit`, `verifiedPriority`, `chatAccess`, `relationshipManager`, `profileBoost`, `isActive`, `sortOrder`.
   - Pre-save hook generates normalized slug `planId` if missing (lines 116-121).

2. **Subscription Model (`backend/models/Subscription.js`)**:
   - Implements `userId`, `planId`, `billingCycle` ('monthly' | 'quarterly' | 'yearly'), `startDate`, `endDate`, `status` ('Active' | 'Expired' | 'Cancelled' | 'Pending'), `paymentId`, `orderId`, `amountPaid`, `autoRenew`, `contactViewLimit`, `features`.
   - Helper method `isCurrentlyActive()` evaluates genuine date validity: `this.status === 'Active' && this.endDate > new Date()` (lines 92-94).

3. **Payment Model (`backend/models/Payment.js`)**:
   - Implements `userId`, `orderId` (unique, indexed), `paymentId`, `signature`, `amount`, `currency` ('INR'), `status` ('Created' | 'Success' | 'Failed' | 'Refunded'), `method`, `planId`, `billingCycle`, `subscriptionId`, `webhookEventId`, `errorDetails`.

4. **KYC Verification Model (`backend/models/Verification.js`)**:
   - Implements `userId`, `profileId`, `documentType` (Aadhaar, Passport, Voter ID, PAN, Driving License), `documentNumber`, `idProofUrl`, `professionProofUrl`, `addressProofUrl`, `status` ('Pending' | 'Approved' | 'Rejected'), `rejectionReason`, `rejectionCategory`, `reviewedBy`, `reviewedByName`, `reviewedAt`, `adminNotes`.

5. **Payment Service & Razorpay Cryptography (`backend/services/paymentService.js`)**:
   - `createOrder`: Dynamically determines price based on billing cycle (`monthly`, `quarterly`, `yearly`), verifies plan exists and `isActive`, creates Razorpay order payload with receipt and user notes, stores a `Payment` document with status `'Created'` (lines 48-130).
   - `verifyClientPayment`: Computes HMAC SHA256 using `env.RAZORPAY_KEY_SECRET` over `${orderId}|${paymentId}` and validates against incoming signature via `crypto.timingSafeEqual` with buffer length checking (lines 147-159). If signature fails, records `Payment.status = 'Failed'` and throws an error (lines 160-172). If valid, marks `Payment.status = 'Success'` and calls `activateUserSubscription` (lines 175-209).
   - `verifyWebhookSignature`: Computes HMAC SHA256 of raw webhook string using `env.RAZORPAY_WEBHOOK_SECRET` and executes `crypto.timingSafeEqual(headerBuf, expectedBuf)` (lines 218-237).
   - `processWebhookEvent`: Implements idempotent webhook processing for `payment.captured` and `order.paid` (lines 244-329). Checks if payment with `orderId` was already marked `'Success'` and returns `{ success: true, idempotent: true }` without duplicate subscription activation (lines 264-270).
   - `activateUserSubscription`: Calculates expiry date (monthly: 30d, quarterly: 90d, yearly: 365d), marks prior active subscriptions as `'Expired'`, creates new `'Active'` subscription record, and updates `User.subscriptionPlan`, `User.subscriptionStatus = 'Active'`, `User.subscriptionExpiresAt`, and `User.contactViewLimit` (lines 342-427).

6. **KYC Approval & Multi-Profile Badge Synchronization (`backend/controllers/verificationController.js`)**:
   - `approveVerification`: On admin approval, updates `Verification.status = 'Approved'`, updates `User.verificationStatus = 'Approved'`, and bulk updates all candidate profiles belonging to the user via `Profile.updateMany({ userId: verification.userId }, { $set: { verified: true } })` (lines 217-235).
   - `rejectVerification`: On admin rejection, updates `Verification.status = 'Rejected'`, records `rejectionReason` and `rejectionCategory`, updates `User.verificationStatus = 'Rejected'`, and leaves candidate profiles unverified (lines 290-306).
   - `getAdminVerificationById`: Supplies side-by-side verification review by populating user details, document URLs, and fetching all candidate profiles under the user account (`Profile.find({ userId })`) (lines 174-195).

7. **Administrative Action Audit Logging (`backend/services/auditService.js` & `backend/models/AuditLog.js`)**:
   - Implements `auditService.logAction` generating human-readable log IDs (`LOG-...`), recording `adminId`, `adminName`, `adminRole`, `action`, `target`, `details`, `ipAddress`, and `metadata` (lines 22-52).
   - Audits recorded for: `Created Subscription Plan`, `Updated Subscription Plan`, `Deleted Subscription Plan`, `Approved KYC Verification`, `Rejected KYC Verification`, and `Razorpay Payment Captured (Webhook)`.

8. **Test Suites & Coverage (`tests/payment.test.js`, `tests/verification.test.js`, `tests/challenger_m4.test.js`)**:
   - `tests/payment.test.js`: 17 integration tests across 5 describe blocks validating plan CRUD, Razorpay order generation, HMAC SHA256 client verification, forged signature rejection, webhook verification with `crypto.timingSafeEqual`, duplicate replay idempotency, and subscription lifecycle.
   - `tests/verification.test.js`: 11 integration tests across 4 describe blocks validating multipart uploads for ID/profession proofs, user status queries, admin queue pagination & side-by-side inspection, one-click multi-profile badge sync, and categorized rejection.
   - `tests/challenger_m4.test.js`: 14 adversarial stress tests verifying cryptographic tamper resistance (1-bit flipped signatures, missing headers), multi-profile bulk sync across 3 candidate profiles per user, subscription expiration dates, and role-based access enforcement.

---

## 2. Logic Chain

1. **Step 1 — Integrity Check on Cryptography**:
   - Checked `paymentService.verifyClientPayment` and `paymentService.verifyWebhookSignature`.
   - Verified that neither method uses hardcoded true responses or string equality (`===`) vulnerable to timing attacks. Both construct `Buffer.from(signature, 'utf8')` and `Buffer.from(expectedSignature, 'utf8')`, verify identical byte lengths, and perform `crypto.timingSafeEqual`.
   - Conclusion: Genuine cryptographic signature verification is enforced for all payment and webhook entry points.

2. **Step 2 — Integrity Check on Multi-Profile KYC Badge Synchronization**:
   - Checked `verificationController.approveVerification` (lines 231-235).
   - The code executes `Profile.updateMany({ userId: verification.userId }, { $set: { verified: true } })`.
   - In matrimonial workflows where 1 user account manages multiple candidate profiles (e.g., self, brother, sister), approving user identity documents automatically verifies all linked candidate profiles.
   - Verified via adversarial test case in `challenger_m4.test.js` (lines 639-705), where User 3 has 3 candidate profiles (`profileA`, `profileB`, `profileC`) and all 3 are verified simultaneously while other users' profiles remain untouched.
   - Conclusion: KYC approval genuinely updates the database and satisfies the multi-profile verified badge contract.

3. **Step 3 — Integrity Check on Audit Logging**:
   - Inspected `auditService.js` and all administrative controller actions in `planController.js` and `verificationController.js`.
   - Every administrative mutation (`createPlan`, `updatePlan`, `deletePlan`, `approveVerification`, `rejectVerification`, webhook fulfillment) awaits `auditService.logAction(...)` creating an immutable `AuditLog` entry in MongoDB.
   - Conclusion: Administrative actions are comprehensively logged to the audit trail.

4. **Step 4 — Prohibited Pattern Scan**:
   - Scanned for hardcoded test results: None found.
   - Scanned for facade implementations: None found. All controllers execute full Mongoose database queries and return dynamic JSON payloads.
   - Scanned for pre-populated logs or fabricated verification outputs: None found. All tests operate on clean in-memory MongoDB databases created dynamically in `tests/setup.js`.

---

## 3. Caveats
- No live Razorpay gateway credentials were provided in the local environment; the system correctly implements deterministic mock order generation and genuine HMAC SHA256 signature verification matching standard Razorpay SDK contracts.
- File uploads for KYC documents are stored locally in `uploads/documents/` with 5MB limits and MIME type enforcement (PDF, JPEG, PNG, WebP).

---

## 4. Conclusion
Milestone 4 (Subscriptions, Razorpay Integration, and KYC Document Verification) satisfies all requirements defined in `ORIGINAL_REQUEST.md` §R4 and `PROJECT.md` §16-19. The codebase contains genuine business logic, robust cryptographic validation using `crypto.timingSafeEqual`, automated multi-profile badge synchronization, and immutable audit logging.

**Binary Verdict**: **CLEAN**

---

## 5. Verification Method

To independently verify all findings:
1. Inspect the source files:
   - `backend/models/Plan.js`
   - `backend/models/Subscription.js`
   - `backend/models/Payment.js`
   - `backend/models/Verification.js`
   - `backend/services/paymentService.js`
   - `backend/controllers/paymentController.js`
   - `backend/controllers/verificationController.js`
   - `backend/controllers/planController.js`
   - `backend/services/auditService.js`
2. Run test suites via Jest:
   ```bash
   cd backend
   npm test tests/payment.test.js
   npm test tests/verification.test.js
   npm test tests/challenger_m4.test.js
   npm test
   ```
3. Invalidation conditions: Any test failure in payment verification, signature bypass, or failure of candidate profile badge synchronization upon KYC approval would invalidate this audit.
