# Milestone 4 Challenger Handoff Report

## 1. Observation
1. Examined `backend/services/paymentService.js`, `backend/controllers/paymentController.js`, `backend/controllers/verificationController.js`, `backend/controllers/subscriptionController.js`, and associated Mongoose models (`Plan`, `Subscription`, `Payment`, `Verification`, `AuditLog`, `User`, `Profile`).
2. Verified cryptographic implementation for payment signature verification:
   - Client payment verification (`verifyClientPayment`) computes expected HMAC SHA256 signature using `env.RAZORPAY_KEY_SECRET` over `${orderId}|${paymentId}` and validates against incoming signature using `crypto.timingSafeEqual` with byte-length prechecks.
   - Webhook signature verification (`verifyWebhookSignature`) computes HMAC SHA256 using `env.RAZORPAY_WEBHOOK_SECRET` over raw request body and verifies with `crypto.timingSafeEqual`.
   - On signature failure in `verifyPayment`, the API returns HTTP 400 Bad Request with `{ code: 'INVALID_SIGNATURE' }` and records the payment record as `status: 'Failed'`.
   - On webhook signature failure in `handleWebhook`, the API returns HTTP 400 Bad Request with `'Invalid webhook signature'`.
3. Verified webhook event processing and idempotency in `paymentService.processWebhookEvent`:
   - Checks if payment for `orderId` is already in `status === 'Success'`.
   - If already processed, immediately returns `{ success: true, idempotent: true, payment }` without creating duplicate subscriptions or multiplying user limits.
4. Verified subscription lifecycle and edge cases:
   - `models/Subscription.js` defines `isCurrentlyActive()` checking `this.status === 'Active' && this.endDate > new Date()`.
   - `getCurrentSubscription` filters active subscriptions by `endDate: { $gt: new Date() }`.
   - `activateUserSubscription` transitions any prior active subscriptions for the user to `status: 'Expired'` via `Subscription.updateMany({ userId, status: 'Active' }, { status: 'Expired' })`.
   - `cancelSubscription` transitions active subscription to `status: 'Cancelled'`, writes `cancelledAt` timestamp, `cancellationReason`, and updates `User.subscriptionStatus = 'Cancelled'`.
   - Cancellation without an active subscription returns HTTP 400 Bad Request.
5. Verified KYC document submission validation:
   - `submitVerification` validates presence of ID Proof or Profession Proof (via multipart file uploads `req.files` or payload URL properties `req.body.idProofUrl`).
   - Missing documents return HTTP 400 Bad Request (`'At least one verification document... is required'`).
   - Successful submission updates `User.verificationStatus = 'Pending'`.
6. Verified Multi-Profile badge synchronization contract:
   - `approveVerification` executes `Profile.updateMany({ userId: verification.userId }, { $set: { verified: true } })`, guaranteeing all Candidate Profiles belonging to the user are automatically marked `verified: true`.
   - Candidate profiles owned by other users remain untouched (`verified: false`).
   - Generates an immutable `AuditLog` entry with action `'Approved KYC Verification'` and records admin identity, verification ID, and profiles synchronized.
7. Verified KYC rejection workflow:
   - `rejectVerification` transitions `Verification.status` to `'Rejected'`, records `rejectionReason` and `rejectionCategory`, updates `User.verificationStatus = 'Rejected'`, and leaves candidate profiles unverified.
   - Generates an immutable `AuditLog` entry with action `'Rejected KYC Verification'`, recording admin identity, reason, category, and target ID.
8. Created comprehensive adversarial test suite in `backend/tests/challenger_m4.test.js` covering all 6 threat vectors and edge case scenarios.

## 2. Logic Chain
1. Step 1 (Observation 1, 2 & 8): Constructed test cases in `backend/tests/challenger_m4.test.js` to simulate HMAC signature forgery (completely fake signatures, single-character bit flips, and omitted signatures). Traced code in `paymentService.js` and confirmed that `crypto.timingSafeEqual` prevents timing side-channels and reliably rejects invalid signatures with HTTP 400.
2. Step 2 (Observation 3 & 8): Constructed replay attack test cases with identical webhook payloads and signatures dispatched multiple times. Traced `processWebhookEvent` and confirmed idempotent execution returning `idempotent: true` on duplicate deliveries without duplicate active subscriptions.
3. Step 3 (Observation 4 & 8): Constructed edge case tests for expired subscription dates and cancellation. Confirmed that subscriptions past `endDate` are not treated as active, new activations expire previous active subscriptions, and cancellations update both `Subscription` and `User` models cleanly.
4. Step 4 (Observation 5 & 8): Constructed KYC validation tests for missing files. Confirmed HTTP 400 rejection when no ID or professional documents are supplied.
5. Step 5 (Observation 6 & 8): Constructed multi-profile scenario (1 User with 3 Candidate Profiles, plus an unrelated User with 1 Candidate Profile). Traced `approveVerification` and confirmed that `Profile.updateMany({ userId })` synchronizes all 3 profiles to `verified: true` in a single operation while maintaining isolation for other users' profiles.
6. Step 6 (Observation 7 & 8): Constructed KYC rejection tests verifying status updates, categorization preservation, profile unverified preservation, and immutable audit trail generation.

## 3. Caveats
1. Test suite execution in this environment depends on in-memory MongoDB (`mongodb-memory-server`) and mock Razorpay order generation which replicates genuine Razorpay HMAC SHA256 cryptographic behavior.
2. Live production deployment will require setting valid merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in `.env`.

## 4. Conclusion
**VERDICT: PASS**

The Milestone 4 implementation is robust, cryptographically sound, and resilient against tampering, replay attacks, and multi-profile edge cases:
- HMAC SHA256 signature verification is timing-attack resistant (`crypto.timingSafeEqual`).
- Webhook event idempotency prevents double fulfillment or duplicate subscriptions.
- Multi-profile verified badge synchronization reliably marks all candidate profiles (1:N) as verified upon user KYC approval.
- KYC rejection workflow and audit logging meet all enterprise security requirements.

## 5. Verification Method
Run the following test commands from `backend/`:
```bash
cd backend
npx jest tests/challenger_m4.test.js --runInBand
npx jest tests/payment.test.js tests/verification.test.js --runInBand
npm test
```
All test suites pass and verify:
- Razorpay client & webhook HMAC forgery rejection.
- Webhook duplicate delivery replay idempotency.
- Multi-profile verified badge synchronization (1 User -> 3 Candidate Profiles).
- KYC document submission validation, rejection categorized workflow, and audit logs.
