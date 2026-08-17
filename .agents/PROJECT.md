# Project: Agrawal Biodata Matrimony Platform Backend REST API

## Architecture
- **Tech Stack**: Node.js (>=18), Express 4, Mongoose 8 (MongoDB), JWT, bcryptjs, Multer, Helmet, Cors, Express-Rate-Limit, Winston/Morgan, Razorpay SDK, Crypto.
- **Testing Framework**: Jest, Supertest, MongoDB-Memory-Server for zero-dependency hermetic in-memory integration testing.
- **Architectural Paradigm**: Clean Layered Architecture:
  `Routes -> Middleware (Auth/Validation/RateLimit/Upload) -> Controllers -> Services (Business Logic) -> Models (Mongoose Schemas) -> Database`.
- **Response Format**: Standardized JSON Envelope `{ success: boolean, message: string, data?: any, error?: any, meta?: any }`.
- **Multi-Profile Design**: 1 Registered User (by Phone/OTP) -> N Candidate Profiles (`Profile` models referencing `userId`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Express & Security Setup | Modular Express app, helmet, cors, winston logger, rate limiters, centralized error handling | M1 | ORIGINAL_REQUEST §R1 |
| 2 | MongoDB & Mongoose Setup | DB connection, error handlers, index management | M1 | ORIGINAL_REQUEST §R1 |
| 3 | User OTP Authentication | 6-digit OTP, 30s cooldown, 5m expiry, 5/10m rate limit, JWT access (15m) & refresh (7d), SMS stub | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Admin Authentication | Bcrypt password hashing, JWT admin token, Super Admin seeder (`admin@matrimonyhub.com` / `admin123`) | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Multi-Profile Relationship | User 1 -> N Candidate Profiles linking, active profile switcher | M2 | ORIGINAL_REQUEST §R2 |
| 6 | 18 Authentic Gotras Enum | Strict validation against 18 canonical Agarwal gotras (Garg, Goyal, Bansal, etc.) with bilingual support | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Full Matrimonial Biodata | Personal, horoscope/manglik, 3-gen family tree, education, occupation, income, residential info | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Relative Dynamic Collections | Subdocument lists for brothers, sisters, tauji, chacha, buaji, mamaji (marital status, spouse, sasural city) | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Media & Privacy Controls | Local multipart upload for avatar + up to 6 gallery photos, privacy levels for contact/address/photos | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Profile Completion Engine | Section-by-section percentage breakdown API (Personal 25%, Astrology 15%, Education 20%, Family 25%, Media 15%) | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Weighted Match Engine | 6-factor compatibility scoring (Gotra 30%, Age 20%, Edu 15%, Loc 15%, Inc 10%, Manglik 10%) | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Gotra Exogamy Rules | 0 score for Sagotra paternal conflict, 50% penalty for maternal gotra conflict | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Match Discovery Endpoints | `GET /api/matches` (paginated, filtered), `GET /api/matches/today` (carousel), `GET /api/matches/search` (multi-field) | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Interest Lifecycle | Express interest (Pending), Accept (unlocks contact info), Decline, Sent/Received queries | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Social & Privacy Interactivity| Shortlist/favorites, deduplicated daily profile visitor tracking, user block list | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Plans & Subscriptions | CRUD for plans (Free, Gold, Platinum, Diamond) with monthly/yearly pricing & benefit limits | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Razorpay Order & Webhook | Order creation, HMAC SHA256 webhook signature verification (`crypto.timingSafeEqual`), auto-subscription activation | M4 | ORIGINAL_REQUEST §R4 |
| 18 | KYC Document Verification | User document submission (Govt ID + Professional), admin side-by-side review queue, one-click approve/reject | M4 | ORIGINAL_REQUEST §R4 |
| 19 | Verified Badge Auto-Sync | Automatic synchronization of verified status to candidate profile upon admin approval | M4 | ORIGINAL_REQUEST §R4 |
| 20 | Admin Dashboard KPIs | Real-time aggregated metrics (total users, active users, pending verifications, daily matches, revenue, active subs) | M5 | ORIGINAL_REQUEST §R5 |
| 21 | Admin User Management | List, filter, search, active/suspended toggle, CSV export, profile inspection | M5 | ORIGINAL_REQUEST §R5 |
| 22 | CMS & Banner Management | Static pages editor (About, Contact, Privacy, Terms, Guidelines, FAQs) and hero banner carousel CRUD | M5 | ORIGINAL_REQUEST §R5 |
| 23 | Abuse Moderation Queue | Complaint reporting, investigation queue, resolution actions (suspend, warn, dismiss), block history | M5 | ORIGINAL_REQUEST §R5 |
| 24 | Immutable Audit Trail | Administrative action logging (actor, action, target entity, timestamp, details) | M5 | ORIGINAL_REQUEST §R5 |
| 25 | Automated Testing Suite | Unit and E2E integration test suites covering R1-R5 with memory DB and adversarial coverage hardening | M6 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Infra & Auth | Project init, modular layout, error handler, rate limiters, DB config, User OTP Auth, Admin Auth, Super Admin seed | none | DONE |
| M2 | Candidate Biodata & Profiles | Multi-profile management, 18 Gotras enum, family tree & relatives, media upload, completion calculation API | M1 | DONE |
| M3 | Match Engine & Social | 6-factor weighted match engine, Gotra exogamy, discovery APIs, interests lifecycle, favorites, visitors, blocks | M2 | DONE |
| M4 | Subscriptions, Payments & KYC | Plan management, Razorpay order & HMAC webhook, KYC doc verification, auto-sync verified badge | M2 | DONE |
| M5 | Admin Ops, CMS, Moderation & Audit | Dashboard KPIs, User CRUD & CSV export, CMS & banners, complaints queue, immutable audit logging | M1, M4 | DONE |
| M6 | Final Verification & Hardening | 100% E2E test pass (Tiers 1-4) & adversarial test hardening (Tier 5) | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts

### 1. Auth & Token Contract (`middleware/auth.js` & `middleware/adminAuth.js`)
- **User Token**: `req.user = { userId: string, mobile: string, role: 'user' }`
- **Admin Token**: `req.admin = { adminId: string, email: string, role: 'Super Admin' | 'Moderator' }`

### 2. User ↔ Profile Contract
- `User.activeProfileId -> Profile._id`
- `Profile.userId -> User._id`

### 3. Match Engine Contract (`services/matchEngine.js`)
- Input: `(profile1: ProfileDocument, profile2: ProfileDocument)`
- Output: `{ totalScore: number (0-100), breakdown: { gotra, age, education, location, income, manglik } }`

### 4. Verification ↔ Profile Badge Contract (`controllers/verificationController.js`)
- On `PUT /api/admin/verifications/:id/approve`:
  - `Verification.status = 'Approved'`
  - `User.verificationStatus = 'Approved'`
  - `Profile.verified = true`

### 5. Razorpay Webhook Contract (`controllers/paymentController.js`)
- Input: Raw body buffer + `x-razorpay-signature`
- Verification: `crypto.createHmac('sha256', secret).update(rawBody).digest('hex') === signature`
- On Success: `Payment.paymentStatus = 'Success'`, `User.subscriptionStatus = 'Active'`, `User.subscriptionPlan = plan.name`

## Code Layout
```
c:/Users/admin/Desktop/appzeto-2/agarwal/backend/
├── config/
│   ├── db.js
│   ├── env.js
│   ├── razorpay.js
│   └── constants.js
├── models/
│   ├── User.js
│   ├── Profile.js
│   ├── Match.js
│   ├── Interest.js
│   ├── Plan.js
│   ├── Subscription.js
│   ├── Payment.js
│   ├── Verification.js
│   ├── Admin.js
│   ├── CMS.js
│   ├── Complaint.js
│   ├── AuditLog.js
│   ├── Visitor.js
│   ├── Shortlist.js
│   └── Block.js
├── controllers/
│   ├── authController.js
│   ├── adminAuthController.js
│   ├── userController.js
│   ├── profileController.js
│   ├── matchController.js
│   ├── interestController.js
│   ├── planController.js
│   ├── subscriptionController.js
│   ├── paymentController.js
│   ├── verificationController.js
│   ├── adminController.js
│   ├── cmsController.js
│   ├── complaintController.js
│   ├── auditController.js
│   ├── visitorController.js
│   ├── shortlistController.js
│   └── blockController.js
├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   ├── adminAuthRoutes.js
│   ├── userRoutes.js
│   ├── profileRoutes.js
│   ├── matchRoutes.js
│   ├── interestRoutes.js
│   ├── planRoutes.js
│   ├── subscriptionRoutes.js
│   ├── paymentRoutes.js
│   ├── verificationRoutes.js
│   ├── adminRoutes.js
│   ├── cmsRoutes.js
│   ├── complaintRoutes.js
│   ├── auditRoutes.js
│   ├── visitorRoutes.js
│   ├── shortlistRoutes.js
│   └── blockRoutes.js
├── middleware/
│   ├── auth.js
│   ├── adminAuth.js
│   ├── rateLimiter.js
│   ├── upload.js
│   ├── validate.js
│   └── errorHandler.js
├── services/
│   ├── otpService.js
│   ├── matchEngine.js
│   ├── paymentService.js
│   ├── auditService.js
│   ├── smsService.js
│   └── profileScoreService.js
├── utils/
│   ├── gotras.js
│   ├── token.js
│   ├── apiResponse.js
│   └── logger.js
├── scripts/
│   ├── seedAdmin.js
│   ├── seedPlans.js
│   ├── seedCMS.js
│   ├── seedMockData.js
│   └── seedAll.js
├── uploads/
│   ├── profiles/
│   └── documents/
├── tests/
│   ├── setup.js
│   ├── auth.test.js
│   ├── profile.test.js
│   ├── matches.test.js
│   ├── admin.test.js
│   ├── payment.test.js
│   └── e2e.test.js
├── .env
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── server.js
```
