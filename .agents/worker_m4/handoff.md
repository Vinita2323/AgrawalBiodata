# Milestone 4 Handoff Report: Subscriptions, Razorpay & KYC Document Verification

## 1. Observation
1. Prior to Milestone 4, `backend/models/` lacked models for plans, subscriptions, payment transactions, and KYC document verifications.
2. `backend/routes/index.js` mounted endpoints only for `/auth`, `/admin/auth`, `/admin/settings`, `/profiles`, `/matches`, `/interests`, `/shortlist`, `/visitors`, and `/blocks`.
3. Requirement R4 in `ORIGINAL_REQUEST.md` (lines 40-47) and `PROJECT.md` (lines 29-32) specifies:
   - Subscription & Plan Management (CRUD for Free, Gold, Platinum, Diamond).
   - Razorpay Integration (order creation, client HMAC SHA256 signature verification, webhook signature verification with `crypto.timingSafeEqual`, and automated subscription activation).
   - KYC Verification Workflow (submission of Government ID + Professional documents, admin review queue, one-click approval with automatic `Profile.verified = true` badge synchronization, categorized rejection, and audit logging via `auditService`).
4. Created and modified the following components:
   - `models/Plan.js`: Plan schema with `planId`, `name`, `monthlyPrice`, `yearlyPrice`, `discountPercent`, `features`, `contactViewLimit`, `interestSendLimit`, `verifiedPriority`, `chatAccess`, `relationshipManager`, `profileBoost`, `isActive`, `sortOrder`.
   - `models/Subscription.js`: User subscription records with `userId`, `planId`, `billingCycle`, `startDate`, `endDate`, `status`, `paymentId`, `orderId`, `amountPaid`, `autoRenew`, `contactViewLimit`.
   - `models/Payment.js`: Payment transaction lifecycle with `userId`, `orderId`, `paymentId`, `signature`, `amount`, `currency`, `status`, `method`, `planId`, `billingCycle`, `webhookEventId`.
   - `models/Verification.js`: KYC submission tracking with `userId`, `profileId`, `documentType`, `documentNumber`, `idProofUrl`, `professionProofUrl`, `addressProofUrl`, `status`, `rejectionReason`, `rejectionCategory`, `reviewedBy`, `reviewedByName`, `reviewedAt`.
   - `config/razorpay.js`: Razorpay SDK instance and key exports.
   - `services/paymentService.js`: `createOrder`, `verifyClientPayment` (HMAC SHA256), `verifyWebhookSignature` (`crypto.timingSafeEqual`), `processWebhookEvent` (idempotent handling), `activateUserSubscription`.
   - `middleware/upload.js`: Added `uploadVerificationDocs` supporting multipart fields `idProof`, `professionProof`, `addressProof`, and `document` into `uploads/documents/`.
   - `controllers/planController.js` & `routes/planRoutes.js`: `GET /api/plans`, `GET /api/plans/:id`, `POST /api/plans`, `PUT /api/plans/:id`, `DELETE /api/plans/:id`.
   - `controllers/subscriptionController.js` & `routes/subscriptionRoutes.js`: `GET /api/subscriptions/current`, `GET /api/subscriptions/history`, `POST /api/subscriptions/cancel`.
   - `controllers/paymentController.js` & `routes/paymentRoutes.js`: `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/webhook`, `GET /api/payments/history`, `GET /api/payments/admin/all`.
   - `controllers/verificationController.js`, `routes/verificationRoutes.js` & `routes/adminVerificationRoutes.js`: User KYC submission (`POST /api/verification/submit`, `GET /api/verification/status`, `GET /api/verification/my-submissions`) and Admin KYC queue (`GET /api/admin/verifications`, `GET /api/admin/verifications/:id`, `PUT /api/admin/verifications/:id/approve`, `PUT /api/admin/verifications/:id/reject`).
   - `scripts/seedPlans.js` & `scripts/seedAll.js`: Idempotent seeding for 4 default subscription plans.
   - `routes/index.js`: Mounted routers for `/plans`, `/subscriptions`, `/payments`, `/verification`, and `/admin/verifications`.
   - `tests/payment.test.js`: Integration tests covering plan CRUD, Razorpay order creation, client HMAC SHA256 verification, webhook processing with `crypto.timingSafeEqual`, idempotency replay, subscription lifecycle & cancellation.
   - `tests/verification.test.js`: Integration tests covering multipart document submission, user status tracking, admin queue filtering, one-click approval with multi-profile badge synchronization, rejection with reason categorization, and immutable audit logs.

## 2. Logic Chain
1. Step 1 (Observation 1 & 4): Defined Mongoose schemas for `Plan`, `Subscription`, `Payment`, and `Verification` adhering to strict TypeScript/JSON contracts and enums.
2. Step 2 (Observation 3 & 4): Implemented `paymentService.js` with secure HMAC SHA256 signature verification for client callbacks and `crypto.timingSafeEqual` for Razorpay webhook callbacks to prevent timing attacks.
3. Step 3 (Observation 3 & 4): Implemented idempotent subscription activation in `paymentService.activateUserSubscription` which sets `User.subscriptionStatus = 'Active'`, updates plan name, increases `contactViewLimit`, and sets expiration dates.
4. Step 4 (Observation 3 & 4): Implemented one-click verification approval in `verificationController.approveVerification` which updates `Verification.status = 'Approved'`, `User.verificationStatus = 'Approved'`, and bulk updates `Profile.updateMany({ userId: verification.userId }, { $set: { verified: true } })`, guaranteeing that all candidate profiles created by the user inherit the verified badge.
5. Step 5 (Observation 4): Implemented categorized rejection in `verificationController.rejectVerification` and recorded audit log entries via `auditService.logAction`.
6. Step 6 (Observation 4): Authored integration test suites `tests/payment.test.js` (17 test cases across 5 test suites) and `tests/verification.test.js` (11 test cases across 4 test suites) using real in-memory MongoDB documents.

## 3. Caveats
1. Razorpay live gateway calls require real merchant credentials in production (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`); in test/development environments without live keys, `paymentService` uses secure deterministic mock order generation and genuine HMAC SHA256 cryptographic verification.
2. Document file uploads require write permissions to `uploads/documents/`, which is auto-created by `middleware/upload.js`.

## 4. Conclusion
Milestone 4 (Subscriptions, Razorpay & KYC Document Verification) is fully implemented, adhering to the Clean Layered Architecture, with genuine business logic, cryptographic signature validation, multi-profile verified badge synchronization, and comprehensive integration tests.

## 5. Verification Method
1. Inspect the following created/updated files:
   - `backend/models/Plan.js`
   - `backend/models/Subscription.js`
   - `backend/models/Payment.js`
   - `backend/models/Verification.js`
   - `backend/services/paymentService.js`
   - `backend/controllers/planController.js`
   - `backend/controllers/subscriptionController.js`
   - `backend/controllers/paymentController.js`
   - `backend/controllers/verificationController.js`
   - `backend/routes/planRoutes.js`
   - `backend/routes/subscriptionRoutes.js`
   - `backend/routes/paymentRoutes.js`
   - `backend/routes/verificationRoutes.js`
   - `backend/routes/adminVerificationRoutes.js`
   - `backend/routes/index.js`
   - `backend/scripts/seedPlans.js`
   - `backend/tests/payment.test.js`
   - `backend/tests/verification.test.js`
2. Run test suites via Jest:
   ```bash
   cd backend
   npm test tests/payment.test.js
   npm test tests/verification.test.js
   npm test
   ```
3. Invalidation Conditions: Any test failure, signature verification failure, or unfulfilled profile badge synchronization on verification approval would invalidate this handoff.
