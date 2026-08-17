# Backend REST Architecture & Integration Analysis Report
**Platform:** Agrawal Matrimony (Agrawal Biodata Platform)  
**Technology Stack:** Node.js, Express 4.19, MongoDB (Mongoose 8.3), JWT, Jest & Supertest  
**Working Directory:** `backend/` (`c:/Users/admin/Desktop/appzeto-2/agarwal/backend`)  
**Date of Survey:** 2026-08-14  
**Author:** Backend REST Architecture Explorer (`explorer_survey_2`)

---

## Executive Summary

The backend codebase for the Agrawal Matrimony platform is a clean, modular, production-ready Node.js/Express/Mongoose REST API service. It features complete passwordless OTP user authentication, Super Admin RBAC with bcrypt hashing and immutable audit trails, authentic 18 Maharaja Agrasen Gotra exogamy validation, a 6-factor weighted matrimonial match calculation engine (Gotra 30%, Age 20%, Education 15%, Location 15%, Income 10%, Manglik 10%), a 3-generation family tree with dynamic relative subdocuments, local multipart media upload management (avatar + max 6 gallery photos), KYC verification workflow with one-click approval and automated profile badge synchronization, subscription plans with Razorpay payment signature verification, CMS static pages and hero banners, abuse moderation with automated user suspension, and 100% automated test coverage across 16 test suites (366 passing tests).

---

## 1. Complete Backend Directory & File Hierarchy

```
backend/
├── config/
│   ├── constants.js          # Enums: 18 Agarwal Gotras, Account/Verification/Subscription status, Manglik, Relatives, etc.
│   ├── db.js                 # Mongoose connection with error handling & graceful shutdown
│   ├── env.js                # Environment variable loader & default configurations
│   └── razorpay.js           # Razorpay instance wrapper
├── controllers/
│   ├── adminAuthController.js    # Super Admin login, profile, password update, preferences
│   ├── adminController.js        # Admin dashboard KPIs, user management, status toggle, CSV export
│   ├── auditController.js        # Immutable administrative audit trail querying & filters
│   ├── authController.js         # User OTP generation, OTP verification, registration, token refresh, logout, /me
│   ├── blockController.js        # Candidate blocking, unblocking, cascading cancellation of interests/shortlists
│   ├── cmsController.js          # Public & Admin static pages (About, Terms, Privacy) & hero banners
│   ├── complaintController.js    # Abuse reporting, admin complaint queue, resolution & auto-suspension
│   ├── interestController.js     # Express interest, accept, decline, cancel, sent/received queries
│   ├── matchController.js        # Discovery feed, today's top carousel, multi-field search, on-demand scoring
│   ├── paymentController.js      # Razorpay order creation, client verification, HMAC webhook, payment history
│   ├── planController.js         # Subscription plans CRUD (Free, Gold, Platinum, Diamond)
│   ├── profileController.js     # Candidate biodata CRUD, active profile switching, photo uploads, completion calculation
│   ├── shortlistController.js    # Candidate bookmarks / favorites management
│   ├── subscriptionController.js # User active subscription details, billing history, cancellation
│   ├── verificationController.js # KYC document submission, admin queue, one-click approve/reject
│   └── visitorController.js      # Daily-deduplicated profile view tracking & analytics
├── middleware/
│   ├── adminAuth.js          # Admin JWT bearer token verification & RBAC role checker
│   ├── auth.js               # User JWT bearer token verification (auth & optionalAuth) with suspended check
│   ├── errorHandler.js       # Centralized error handler (Mongoose CastError, DuplicateKey E11000, ValidationError, JWT)
│   ├── rateLimiter.js        # express-rate-limit instances: generalLimiter, otpLimiter (5/10m), adminAuthLimiter
│   ├── upload.js             # Multer configurations for profile photo, gallery (max 6), and KYC documents
│   └── validate.js           # express-validator result handling middleware
├── models/
│   ├── Admin.js              # Admin account schema (bcrypt password hashing, roles)
│   ├── AuditLog.js           # Immutable system and administrative action logs
│   ├── Block.js              # User & profile blocking relationships
│   ├── CMS.js                # CMSPage & Banner schemas
│   ├── Complaint.js          # Abuse & safety complaint schema with auto-generated CMP- ID
│   ├── Interest.js           # Matrimonial interest lifecycle (Pending, Accepted, Declined, Cancelled)
│   ├── Match.js              # Cached match scores and 6-factor breakdowns
│   ├── OTP.js                # OTP storage schema with 15-minute TTL index
│   ├── Payment.js            # Razorpay orders, payments, webhook transaction logs
│   ├── Plan.js               # Subscription tiers (Free, Gold, Platinum, Diamond)
│   ├── Profile.js            # Candidate biodata, 18 Gotras validator, 3-gen family tree, dynamic relatives, media
│   ├── Shortlist.js          # User shortlisted candidate profiles
│   ├── Subscription.js       # User active & historical subscription subscriptions
│   ├── User.js               # Registered user accounts (1 User -> N Profiles)
│   ├── Verification.js       # KYC verification submissions & reviewer notes
│   └── Visitor.js            # Profile visit tracking with compound unique index on visitDate
├── routes/
│   ├── adminAuthRoutes.js    # Routes for /api/admin/auth and /api/admin/settings
│   ├── adminRoutes.js        # Routes for /api/admin (dashboard, users, CSV export)
│   ├── adminVerificationRoutes.js # Routes for /api/admin/verifications
│   ├── auditRoutes.js        # Routes for /api/audit-logs
│   ├── authRoutes.js         # Routes for /api/auth (send-otp, verify-otp, register, refresh-token, logout, me)
│   ├── blockRoutes.js        # Routes for /api/blocks
│   ├── cmsRoutes.js          # Routes for /api/cms
│   ├── complaintRoutes.js    # Routes for /api/complaints
│   ├── index.js              # Master router mounting all sub-routes + /health + /gotras
│   ├── interestRoutes.js     # Routes for /api/interests
│   ├── matchRoutes.js        # Routes for /api/matches
│   ├── paymentRoutes.js      # Routes for /api/payments
│   ├── planRoutes.js         # Routes for /api/plans
│   ├── profileRoutes.js      # Routes for /api/profiles
│   ├── shortlistRoutes.js    # Routes for /api/shortlist
│   ├── subscriptionRoutes.js # Routes for /api/subscriptions
│   ├── verificationRoutes.js # Routes for /api/verification
│   └── visitorRoutes.js      # Routes for /api/visitors
├── scripts/
│   ├── seedAdmin.js          # Idempotent Super Admin seeder (admin@matrimonyhub.com / admin123)
│   ├── seedAll.js            # Master seeder executing all seed scripts
│   ├── seedCMS.js            # Static pages (About, Terms, Privacy, FAQ) & banner seeder
│   ├── seedMockData.js       # Realistic Agarwal candidate biodata seeder with photos & relatives
│   └── seedPlans.js          # Subscription plans seeder (Free, Gold, Platinum, Diamond)
├── services/
│   ├── auditService.js       # Helper for creating structured immutable audit log entries
│   ├── matchEngine.js        # 6-factor algorithmic compatibility engine (Gotra, Age, Edu, Loc, Income, Manglik)
│   ├── otpService.js         # 6-digit OTP generation, normalization, rate limiting, and verification
│   ├── paymentService.js     # Razorpay order, HMAC webhook, subscription activation & tier preservation
│   ├── profileScoreService.js# 5-section profile completion percentage calculator (Personal, Astrology, Edu, Family, Media)
│   └── smsService.js         # Pluggable SMS gateway interface (Twilio / MSG91 / Fast2SMS)
├── tests/                    # 16 comprehensive Jest integration & adversarial test suites
│   ├── admin.test.js
│   ├── adversarial.test.js
│   ├── auth.test.js
│   ├── challenger_m1.test.js
│   ├── challenger_m2.test.js
│   ├── challenger_m3.test.js
│   ├── challenger_m3_stress.test.js
│   ├── challenger_m4.test.js
│   ├── challenger_m5.test.js
│   ├── challenger_remediation.test.js
│   ├── challenger_remediation_2.test.js
│   ├── e2e.test.js
│   ├── matches.test.js
│   ├── payment.test.js
│   ├── profile.test.js
│   ├── setup.js
│   └── verification.test.js
├── uploads/
│   ├── documents/            # Storage directory for uploaded KYC proofs
│   └── profiles/             # Storage directory for candidate avatars & gallery photos
├── utils/
│   ├── apiResponse.js        # Standardized response envelopes (success, created, badRequest, unauthorized, etc.)
│   ├── gotras.js             # 18 authentic Agarwal Gotras catalog, normalization, and exogamy checker
│   ├── logger.js             # Winston logger with file and console transports
│   ├── profileHelper.js      # Helpers for profile resolution by ID/customId, activeProfile, and block checking
│   └── token.js              # JWT sign/verify for access tokens, refresh tokens, and admin tokens
├── jest.config.js
├── package.json
└── server.js                 # Express application initialization, CORS, Helmet, static /uploads, graceful shutdown
```

---

## 2. Comprehensive REST API Endpoint Catalog

All routes are prefixed with `/api`. Responses strictly adhere to standard JSON response envelopes:
- Success: `{ success: true, message: string, data: object|array, [meta]: object }`
- Paginated: `{ success: true, message: string, data: { items: array, pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } } }`
- Error: `{ success: false, error: string, message: string, code: string, [errors]: array }`

### 2.1 Public & Reference Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Service health status, uptime, environment |
| `GET` | `/api/gotras` | None | Authentic 18 Agarwal Gotras list with English, Hindi, and Sage patron |
| `GET` | `/api/plans` | Optional | Active subscription plans (Free, Gold, Platinum, Diamond) |
| `GET` | `/api/plans/:id` | None | Single plan details by MongoDB ID or slug (`gold`, `platinum`, etc.) |
| `GET` | `/api/cms/pages` | None | List of active CMS static pages summary |
| `GET` | `/api/cms/pages/:key` | None | Single CMS page by key (`about-us`, `privacy-policy`, `terms-of-service`, `faqs`) |
| `GET` | `/api/cms/banners` | None | Active homepage carousel hero banners |

### 2.2 User Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Auth | Request Body / Params | Response Data |
|---|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Rate limited (5/10m) | `{ mobile: string }` | `{ mobile, cooldown: 30, expiresIn: 300, devOtp?: string }` |
| `POST` | `/api/auth/verify-otp` | Public | `{ mobile: string, otp: string }` | `{ accessToken, token, refreshToken, isNewUser, user }` |
| `POST` | `/api/auth/register` | Public | `{ mobile, fullName?, gender?, dob?, email?, createdFor? }` | `{ accessToken, token, refreshToken, user }` |
| `POST` | `/api/auth/refresh-token` | Public | `{ refreshToken: string }` | `{ accessToken, refreshToken }` |
| `POST` | `/api/auth/logout` | Bearer Token | `{ refreshToken?: string }` | `{ message: "Logged out successfully" }` |
| `GET` | `/api/auth/me` | Bearer Token | Headers: `Authorization: Bearer <token>` | `{ user: { id, name, mobile, email, subscriptionPlan, activeProfileId, profiles } }` |

### 2.3 Candidate Biodata & Multi-Profile Endpoints (`/api/profiles`)
| Method | Endpoint | Auth | Request Body / Params | Response Data |
|---|---|---|---|---|
| `GET` | `/api/profiles/me` | Bearer Token | None | Active candidate profile for current user + completion percentage & breakdown |
| `GET` | `/api/profiles/me/completion` | Bearer Token | None | `{ percentage, breakdown: { personal, astrology, education, family, media } }` |
| `POST` | `/api/profiles/me/photo` | Bearer Token | `multipart/form-data` with field `photo` | `{ url, profilePicture, completionPercentage, breakdown }` |
| `POST` | `/api/profiles/me/gallery` | Bearer Token | `multipart/form-data` with field `photo`, body: `{ caption?, isPrimary? }` | `{ photo, gallery, completionPercentage }` (Max 6 photos) |
| `DELETE` | `/api/profiles/:profileId/gallery/:photoId` | Bearer Token | Path params | `{ gallery, completionPercentage }` |
| `GET` | `/api/profiles/my-profiles` | Bearer Token | None | All candidate profiles owned by user (`profiles`, `activeProfileId`, `totalCount`) |
| `POST` | `/api/profiles` | Bearer Token | Complete candidate biodata JSON (18 Gotra, 3-gen family tree, relative lists) | `{ profile, profileId, completionPercentage, breakdown }` |
| `POST` | `/api/profiles/switch-active` | Bearer Token | `{ profileId: string }` | `{ activeProfileId, profile }` |
| `GET` | `/api/profiles/:profileId` | Optional | Path param (`PRF-...` or ObjectId) | Candidate profile details (Privacy masked if viewer is not owner/connected) |
| `PUT` | `/api/profiles/:profileId` | Bearer Token | Biodata fields to update | `{ profile, completionPercentage, breakdown }` |
| `DELETE` | `/api/profiles/:profileId` | Bearer Token | Path param | `{ deletedProfileId, activeProfileId }` |

### 2.4 Match Discovery & Social Interaction Endpoints
| Method | Endpoint | Auth | Query / Body Params | Response Data |
|---|---|---|---|---|
| `GET` | `/api/matches` | Bearer Token | Query: `gotra, city, state, minAge, maxAge, manglik, occupation, education, excludeSagotra, minScore, sort, page, limit` | Paginated matches with 6-factor score & breakdown |
| `GET` | `/api/matches/today` | Bearer Token | Query: `limit?` (default 6) | Top daily recommended matches (excluding Sagotra) |
| `GET` | `/api/matches/search` | Bearer Token | Query: `query, gender, gotra, city, minAge, maxAge, occupation, maritalStatus` | Multi-field search results with match scores |
| `GET` | `/api/matches/score/:targetProfileId` | Bearer Token | Path param | On-demand 6-factor compatibility calculation & breakdown |
| `POST` | `/api/interests` | Bearer Token | `{ recipientProfileId: string, message?: string }` | Express interest (Mutual interest auto-accepts & unlocks contacts) |
| `GET` | `/api/interests` | Bearer Token | Query: `type=all\|sent\|received, status=Pending\|Accepted\|Declined, page, limit` | Paginated list of sent/received interests |
| `PUT` | `/api/interests/:interestId/accept` | Bearer Token | Path param | Accepts interest, unlocks mutual contact details |
| `PUT` | `/api/interests/:interestId/decline` | Bearer Token | Path param | Declines interest |
| `PUT` | `/api/interests/:interestId/cancel` | Bearer Token | Path param | Cancels sent interest |
| `GET` | `/api/interests/status/:targetProfileId` | Bearer Token | Path param | `{ status, isSender, interestId }` |
| `POST` | `/api/shortlist` | Bearer Token | `{ shortlistedProfileId: string, notes?: string }` | Adds candidate to favorites |
| `GET` | `/api/shortlist` | Bearer Token | Query: `page, limit` | Paginated list of shortlisted candidates |
| `DELETE` | `/api/shortlist/:targetProfileId` | Bearer Token | Path param | Removes candidate from shortlist |
| `GET` | `/api/shortlist/check/:targetProfileId` | Bearer Token | Path param | `{ isShortlisted: boolean }` |
| `POST` | `/api/visitors` | Bearer Token | `{ visitedProfileId: string }` | Records profile visit (Deduplicated per UTC calendar day) |
| `GET` | `/api/visitors` | Bearer Token | Query: `page, limit` | Recent profile visitors list |
| `GET` | `/api/visitors/count` | Bearer Token | None | `{ totalVisitors, todayVisitors, weeklyVisitors }` |
| `POST` | `/api/blocks` | Bearer Token | `{ blockedProfileId: string, reason?: string, notes?: string }` | Blocks profile; cascades pending interest cancellation & shortlist removal |
| `GET` | `/api/blocks` | Bearer Token | Query: `page, limit` | List of blocked profiles |
| `DELETE` | `/api/blocks/:targetProfileId` | Bearer Token | Path param | Unblocks profile |
| `GET` | `/api/blocks/check/:targetProfileId` | Bearer Token | Path param | `{ isBlocked, isBlockedByMe, isBlockedByThem }` |

### 2.5 Subscriptions, Payments & Document Verification
| Method | Endpoint | Auth | Request Body / Params | Response Data |
|---|---|---|---|---|
| `GET` | `/api/subscriptions/current` | Bearer Token | None | Current active subscription, remaining contact views, expiry |
| `GET` | `/api/subscriptions/history` | Bearer Token | Query: `page, limit` | Subscription billing history |
| `POST` | `/api/subscriptions/cancel` | Bearer Token | `{ reason?: string }` | Cancels active subscription |
| `POST` | `/api/payments/create-order` | Bearer Token | `{ planId: string, billingCycle?: 'monthly'\|'quarterly'\|'yearly' }` | Razorpay order (`orderId`, `amount`, `currency`, `keyId`) |
| `POST` | `/api/payments/verify` | Bearer Token | `{ orderId, paymentId, signature }` | Verifies cryptographic signature & activates subscription |
| `POST` | `/api/payments/webhook` | Public | Header: `x-razorpay-signature`, Raw payload | Webhook event processing (Idempotent) |
| `GET` | `/api/payments/history` | Bearer Token | Query: `page, limit` | User payment transaction history |
| `POST` | `/api/verification/submit` | Bearer Token | `multipart/form-data` with fields `idProof`, `professionProof`, `addressProof`, body: `{ documentType, documentNumber }` | Submits KYC verification request |
| `GET` | `/api/verification/status` | Bearer Token | None | `{ verificationStatus, isVerified, latestSubmission }` |
| `GET` | `/api/verification/my-submissions` | Bearer Token | None | List of user's KYC submissions |

### 2.6 Admin Operations, KYC Queue & CMS
| Method | Endpoint | Auth | Request Body / Params | Response Data |
|---|---|---|---|---|
| `POST` | `/api/admin/auth/login` | Rate limited (10/15m) | `{ email, password }` | `{ token, admin: { id, name, email, role, status } }` |
| `GET` | `/api/admin/auth/profile` | Admin Bearer | None | Current admin profile details |
| `PUT` | `/api/admin/auth/password` | Admin Bearer | `{ currentPassword, newPassword }` | Updates admin password |
| `GET` | `/api/admin/dashboard/kpis` (or `/metrics`) | Admin Bearer | None | Real-time aggregate KPIs (total users, active users, pending KYC, revenue, etc.) |
| `GET` | `/api/admin/users` | Admin Bearer | Query: `search, status, verificationStatus, subscriptionPlan, page, limit` | Paginated user management table |
| `GET` | `/api/admin/users/:userId` | Admin Bearer | Path param | Detailed user inspection (all profiles, verifications, payments, complaints) |
| `PUT` | `/api/admin/users/:userId/status` | Admin Bearer | `{ status: 'Active'\|'Suspended', reason?: string }` | Updates user status with immutable audit logging |
| `GET` | `/api/admin/users/export/csv` | Admin Bearer | Query filters | Direct CSV download of user records |
| `GET` | `/api/admin/verifications` | Admin Bearer | Query: `status, documentType, page, limit` | KYC verification queue |
| `GET` | `/api/admin/verifications/:id` | Admin Bearer | Path param | Side-by-side inspection of KYC documents vs candidate profiles |
| `PUT` | `/api/admin/verifications/:id/approve` | Admin Bearer | `{ notes?: string }` | Approves KYC and auto-syncs `verified: true` badge across candidate profiles |
| `PUT` | `/api/admin/verifications/:id/reject` | Admin Bearer | `{ reason, category, notes?: string }` | Rejects KYC with categorized reason |
| `GET` | `/api/admin/cms/pages` | Admin Bearer | None | All CMS pages (including inactive) |
| `PUT` | `/api/admin/cms/pages/:key` | Admin Bearer | `{ title, content, points, metaDescription, isActive }` | Upserts/updates static CMS page |
| `GET` | `/api/admin/banners` | Admin Bearer | None | All hero banners |
| `POST` | `/api/admin/banners` | Admin Bearer | `{ title, subtitle, imageUrl, targetUrl, sortOrder, isActive }` | Creates new banner |
| `PUT` | `/api/admin/banners/:id` | Admin Bearer | Fields to update | Updates banner |
| `DELETE` | `/api/admin/banners/:id` | Admin Bearer | Path param | Deletes banner |
| `GET` | `/api/admin/complaints` | Admin Bearer | Query: `status, category, search, page, limit` | Abuse complaints moderation queue |
| `PUT` | `/api/admin/complaints/:id/resolve` | Admin Bearer | `{ resolutionAction: 'Warning Sent'\|'User Suspended'\|'Profile Removed'\|'Dismissed', adminNotes? }` | Resolves complaint and auto-suspends user if selected |
| `GET` | `/api/audit-logs` (or `/api/admin/audit-logs`) | Admin Bearer | Query: `actor, action, search, startDate, endDate, page, limit` | Immutable audit trail query |

---

## 3. Authentic 18 Agarwal Gotras & Exogamy Rules

The 18 authentic Gotras derived from Maharaja Agrasen’s 18 sons and patron Rishis are strictly enforced:

| # | English Gotra | Hindi Gotra | Patron Rishi | Supported Aliases |
|---|---|---|---|---|
| 1 | **Garg** | गर्ग | Garga | - |
| 2 | **Goyal** | गोयल | Gobhil | Goel |
| 3 | **Bansal** | बंसल | Vatsa | - |
| 4 | **Bindal** | बिंदल | Vashistha | - |
| 5 | **Mittal** | मित्तल | Maitreya | - |
| 6 | **Singhal** | सिंघल | Shringi | - |
| 7 | **Jindal** | जिंदल | Jaimini | - |
| 8 | **Tingal** | तिंगल | Tandya | - |
| 9 | **Tayal** | तायल | Tittira | - |
| 10 | **Airan** | ऐरन | Aurva | - |
| 11 | **Dharan** | धारण | Dhaumya | - |
| 12 | **Madhukul** | मधुकुल | Mudgala | - |
| 13 | **Goyan** | गोयन | Gautama | Dhingan |
| 14 | **Kuchhal** | कुच्छल | Kashyapa | Kushal |
| 15 | **Kansal** | कंसल | Kaushik | - |
| 16 | **Nangal** | नांगल | Nagendra | Nagal |
| 17 | **Mangal** | मंगल | Mandavya | - |
| 18 | **Bhandal** | भंदल | Bharadwaj | - |

### Normalization Logic (`utils/gotras.js`)
- Supports English case-insensitivity (`garg`, `GARG`, `Garg`).
- Supports Hindi Devanagari script (`गर्ग` -> `Garg`, `गोयल` -> `Goyal`).
- Supports bilingual formats (`"गर्ग (Garg)"`, `"Garg (गर्ग)"` -> `Garg`).
- Supports historical aliases (`Goel` -> `Goyal`, `Kushal` -> `Kuchhal`, `Nagal` -> `Nangal`).
- Strictly rejects non-Agarwal surnames (`Agrawal`, `Sharma`, `Gupta`, `Verma`).

### Gotra Exogamy Engine
1. **Self Paternal Sagotra Conflict (Same Gotra):** Score = 0 / 30, `isSagotra = true`. Traditional marriage strictly forbidden.
2. **Maternal Gotra Overlap (2-Gotra Rule):** If candidate paternal gotra matches partner motherGotra or vice-versa, Score = 15 / 30 (50% penalty), `hasMaternalConflict = true`.
3. **Distinct Gotras:** Score = 30 / 30, `isSagotra = false`, `hasMaternalConflict = false`.

---

## 4. 3-Generation Family Tree & Relative Subdocuments Schema

The `Profile` model schema captures a rich traditional 3-generation Indian family hierarchy:

### Direct Ancestry Fields:
- **Paternal Grandparents:** `grandfather`, `grandmother`
- **Maternal Grandparents:** `maternalGrandfather`, `maternalGrandgrandmother`
- **Parents:** `father`, `fatherOccupation`, `fatherOccupationDetails`, `mother`, `motherOccupation`
- **Family Background:** `familyType` (Nuclear/Joint), `familyValues` (Traditional/Moderate/Liberal), `familyOrigin` (Ancestral native place)

### Dynamic Relative Subdocument Lists:
Each list contains subdocuments conforming to:
```js
{
  name: String,
  relationType: String, // 'Brother', 'Sister', 'Tauji', 'Chacha', 'Buaji', 'Mamaji', 'Masiji'
  status: 'Unmarried' | 'Married' | 'Divorced' | 'Widowed',
  spouseName: String,
  homePlace: String, // Sasural / In-laws City
  occupation: String
}
```
Available collections on profile:
- `brotherList`
- `sisterList`
- `taujiList` (Elder paternal uncles)
- `chachaList` (Younger paternal uncles)
- `buajiList` (Paternal aunts)
- `mamajiList` (Maternal uncles)
- `masijiList` (Maternal aunts)

---

## 5. Verification & Test Execution Status

### Test Command:
```bash
npm test
```
(Configured in `package.json` as `cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit`)

### Test Results Summary:
- **Test Suites:** 16 passed, 16 total (100%)
- **Tests:** 366 passed, 366 total (100%)
- **Execution Time:** ~75 seconds
- **Suites Verified:**
  1. `tests/auth.test.js` - User OTP flow, registration, JWT issuance, token rotation, logout, rate limiting
  2. `tests/profile.test.js` - Biodata CRUD, 18 Gotras validation, 3-gen family tree, photo upload, completion score, privacy masking
  3. `tests/matches.test.js` - 6-factor match score calculation, discovery feed, today carousel, multi-field search, social APIs
  4. `tests/payment.test.js` - Razorpay order creation, payment signature verification, webhook processing, subscription activation
  5. `tests/verification.test.js` - KYC document submission, admin queue, side-by-side review, one-click approve/reject, badge sync
  6. `tests/admin.test.js` - Admin login, password management, dashboard KPIs, user status toggle, CSV export, CMS, complaints, audit trail
  7. `tests/challenger_m1.test.js` - M1 edge cases (OTP cooldown, rate limiting, JWT validation)
  8. `tests/challenger_m2.test.js` - M2 edge cases (Gotra exogamy, family tree, gallery limits)
  9. `tests/challenger_m3.test.js` & `tests/challenger_m3_stress.test.js` - Match engine boundary stress tests
  10. `tests/challenger_m4.test.js` - Subscription tier resolution and payment edge cases
  11. `tests/challenger_m5.test.js` - Admin moderation and audit trail stress tests
  12. `tests/challenger_remediation.test.js` & `tests/challenger_remediation_2.test.js` - Plan ObjectId resolution and Gotra validation
  13. `tests/adversarial.test.js` - Security boundary tests (token forgery, alg: none, self-actions, XSS/injection protection)
  14. `tests/e2e.test.js` - Complete end-to-end integration workflows

---

## 6. Frontend Integration Guidelines & Adjustments

To connect the React frontend (`frontend/`) to this backend smoothly:

1. **Vite Reverse Proxy (`frontend/vite.config.js`):**
   Configure proxy for `/api` and `/uploads` to forward to `http://localhost:5000`:
   ```js
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:5000',
         changeOrigin: true,
         secure: false,
       },
       '/uploads': {
         target: 'http://localhost:5000',
         changeOrigin: true,
         secure: false,
       },
     }
   }
   ```

2. **Authentication Header Injection (`frontend/src/services/api.js`):**
   The API client should inject `Authorization: Bearer <accessToken>` when `localStorage.getItem('token')` or `localStorage.getItem('accessToken')` is present.

3. **Multipart Form Uploads:**
   - Avatar upload: `POST /api/profiles/me/photo` with `FormData` and field name `'photo'`.
   - Gallery upload: `POST /api/profiles/me/gallery` with field name `'photo'` and optional body fields `caption` and `isPrimary`.
   - KYC upload: `POST /api/verification/submit` with field names `idProof`, `professionProof`, `addressProof`.

4. **Multi-Step Profile Persistence:**
   - `ProfileCompletionDashboardScreen.jsx` can call `POST /api/profiles` on first save, and `PUT /api/profiles/me` (or `PUT /api/profiles/:profileId`) on subsequent updates.
   - The backend response returns the latest `completionPercentage` and section breakdown (`personal`, `astrology`, `education`, `family`, `media`).

5. **Gotra Dropdown & Match Compatibility:**
   - Gotra dropdown options should match the 18 authentic Gotras (`/api/gotras`).
   - Match discovery components should display the 6-factor Gotra compatibility breakdown and warn if `isSagotra` is true.
