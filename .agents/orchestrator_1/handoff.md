# Orchestrator Soft Handoff — Generation 1 to Generation 2

## 1. Observation & State of the Project
- **Project Directory**: `c:\Users\admin\Desktop\appzeto-2\agarwal`
- **Backend Directory**: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`
- **Current Test Status**: 130 / 130 tests passing across 5 test suites (`tests/auth.test.js`, `tests/profile.test.js`, `tests/challenger_m1.test.js`, `tests/challenger_m2.test.js`, `tests/adversarial.test.js`).

### Milestones Completed
1. **Survey & Blueprint (Phase 0)**:
   - Full domain specifications, 18 authentic Agarwal gotras, 6-factor matching formulation, 53 API endpoint mappings, and Razorpay HMAC signature logic mapped in `PROJECT.md` and `TEST_INFRA.md`.
2. **Milestone 1: Project Setup, Core Infra & Auth (R1)**:
   - Modular Express app, Mongoose connection, centralized error handling, rate limiting.
   - Passwordless User OTP Auth (6-digit, 30s cooldown, 5m expiry, 5 req / 10m sliding window, JWT 15m access / 7d refresh token with `jti` anti-replay protection).
   - Admin Authentication (bcrypt password hash, Super Admin seeder `admin@matrimonyhub.com` / `admin123`).
   - Audit logging service for administrative actions.
   - Gate Status: **PASS** (CLEAN audit).
3. **Milestone 2: Candidate Biodata & Multi-Profile Management (R2)**:
   - Multi-profile support (User 1 -> N Candidate Profiles, `activeProfileId`, switch active profile).
   - Matrimonial Biodata schema (`models/Profile.js`): 18 authentic Gotras validation, mother's gotra, 3-generation family tree, 7 dynamic relative subdocument arrays (`brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList`).
   - 5-section weighted completion percentage engine (`services/profileScoreService.js`).
   - Multer media upload middleware (avatar + max 6 gallery photos, UUID sanitization, 5MB limit).
   - Privacy masking on phone number, address, and photos for non-owners.
   - Gate Status: **PASS** (CLEAN audit, 130 passing tests).

---

## 2. Logic Chain & Remaining Milestones

### Milestone 3: Weighted Match Engine, Interests & Candidate Discovery (R3) [CURRENT FOCUS - IN_PROGRESS]
- **Deliverables**:
  1. `models/Match.js`, `models/Interest.js`, `models/Shortlist.js`, `models/Visitor.js`, `models/Block.js`.
  2. `services/matchEngine.js`:
     - 6-factor weighted compatibility calculation (Gotra 30%, Age 20%, Education 15%, Location 15%, Income 10%, Manglik 10%).
     - Gotra exogamy: 0 score on Sagotra paternal collision, 50% penalty on maternal gotra overlap.
     - Normalized integer score (0-100) and detailed breakdown payload.
  3. `controllers/matchController.js` & `routes/matchRoutes.js`:
     - `GET /api/matches` (paginated, filtered by category: All, Nearby, Interested, and query filters).
     - `GET /api/matches/today` (top daily carousel matches).
     - `GET /api/matches/search` (multi-field search across keyword, age, height, gotra, education, location).
  4. `controllers/interestController.js` & `routes/interestRoutes.js`:
     - `POST /api/interests` (express interest).
     - `PUT /api/interests/:interestId` (accept / decline, unlocks contact details on accept).
     - `GET /api/interests` (categorized lists: Sent, Received, Accepted, Declined).
  5. `controllers/shortlistController.js`, `visitorController.js`, `blockController.js`:
     - Favorites / shortlists CRUD.
     - Profile visitor tracking (deduplicated daily per visitor/target profile).
     - User block list (bi-directional blocking preventing search & communication).
  6. Integration tests in `tests/matches.test.js`.

### Milestone 4: Subscriptions, Payments & Document Verification (R4)
- **Deliverables**:
  1. `models/Plan.js`, `models/Subscription.js`, `models/Payment.js`, `models/Verification.js`.
  2. Plan CRUD (Free, Gold, Platinum, Diamond) with monthly/yearly pricing and feature limits.
  3. Razorpay payment integration (`services/paymentService.js`):
     - `POST /api/payments/create-order` (Razorpay order generation).
     - `POST /api/payments/verify` (Client payment signature verification).
     - `POST /api/payments/webhook` (Cryptographic HMAC SHA256 signature verification via `crypto.timingSafeEqual`, automated subscription activation, idempotency protection).
  4. KYC Document Verification workflow (`controllers/verificationController.js`):
     - User document upload (`POST /api/verification/submit` for Govt ID + Professional proof).
     - Admin queue (`GET /api/admin/verifications`, `GET /api/admin/verifications/:id`).
     - One-click approve (`PUT /api/admin/verifications/:id/approve`) -> auto-synchronizes `Profile.verified = true`, `User.verificationStatus = 'Approved'`, logs audit trail.
     - Reject (`PUT /api/admin/verifications/:id/reject`) with categorized grounds.
  5. Integration tests in `tests/payment.test.js` and `tests/verification.test.js`.

### Milestone 5: Admin Operations, CMS, Moderation & Audit Trail (R5)
- **Deliverables**:
  1. `models/CMS.js`, `models/Complaint.js`.
  2. `controllers/adminController.js`:
     - Real-time KPI aggregation (`GET /api/admin/dashboard/metrics`).
     - User management (`GET /api/admin/users`, `GET /api/admin/users/:userId`, `PUT /api/admin/users/:userId/status`, CSV export).
  3. `controllers/cmsController.js`:
     - Static pages editor (About Us, Contact Us, Privacy Policy points, Terms of Service points, Guidelines, FAQs).
     - Banner carousel CRUD (`/api/admin/banners`).
  4. `controllers/complaintController.js`:
     - Abuse reports queue, resolution workflow (suspend user, warn, dismiss), block history.
  5. `controllers/auditController.js`:
     - Immutable audit log query API with pagination and search.
  6. Integration tests in `tests/admin.test.js`.

### Milestone 6: Full E2E Verification & Adversarial Coverage Hardening (M6)
- Comprehensive end-to-end integration test suites (`tests/e2e.test.js`) verifying user lifecycle, matching, payment webhook activation, KYC approval badge sync, and admin operations.
- Clean startup verification (`npm start`, `npm run seed:admin`, `npm test`).

---

## 3. Active Subagents
- All 16 subagents spawned in Generation 1 have completed their tasks and delivered their handoffs. Zero pending subagents.

---

## 4. Key Artifacts & Paths
- Architecture Blueprint: `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md`
- Test Infrastructure Spec: `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\TEST_INFRA.md`
- User Requirements: `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md`
- Gate Records: `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\orchestrator_1\GATE_STATUS.md`
- Backend Root: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`

---

## 5. Successor Action Plan
1. Resume orchestrator workflow at `.agents/orchestrator_2/`.
2. Dispatch Worker for Milestone 3 (Weighted Match Engine & Social/Interests).
3. Run M3 verification gate (Reviewer, Challenger, Auditor).
4. Dispatch Worker for Milestone 4 (Subscriptions, Razorpay HMAC Webhook, Document Verification).
5. Run M4 verification gate.
6. Dispatch Worker for Milestone 5 (Admin Ops, CMS, Moderation, Audit Trail).
7. Run M5 verification gate.
8. Execute Milestone 6 (E2E Test Suite & Final Verification).
9. Report final completion back to parent (`ec109685-4aac-4384-974b-a3a9d0e381aa`).
