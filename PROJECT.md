# Project: Agarwal Matrimony Full-Stack Integration

## Architecture
- **Frontend**: React 19, React Router DOM 7, Tailwind CSS 4, Vite 5 (`c:/Users/admin/Desktop/appzeto-2/agarwal/frontend`)
- **Backend**: Node.js, Express, MongoDB with Mongoose ODM, JWT Auth, Multer multipart storage (`c:/Users/admin/Desktop/appzeto-2/agarwal/backend`)
- **Integration Layer**: Vite reverse proxy forwarding `/api` and `/uploads` to `http://localhost:5000`, centralized API client layer in `frontend/src/services/` with automatic JWT Bearer token injection, refresh token rotation, error normalization, and multipart file upload handling.
- **Database & Persistence**: MongoDB collections for Users, Profiles (with authentic 18 Gotras enum, 3-generation family tree, and dynamic relative subdocument arrays), Matches, Interests, Shortlists, Visitors, Blocks, KYC Verifications, Subscriptions, Payments, CMS, and Audit Logs.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Vite Reverse Proxy & API Client Layer | Configure `vite.config.js` proxy for `/api` and `/uploads`; create centralized API client `api.js` and modular services in `frontend/src/services/` | M1 | ORIGINAL_REQUEST R1 |
| 2 | User Auth & Passwordless OTP | Wire `CreateAccountScreen.jsx`, `LoginScreen.jsx`, and `OtpVerificationScreen.jsx` to `authService` (`POST /api/auth/send-otp`, `/verify-otp`, `/register`), token storage, and logout | M2 | ORIGINAL_REQUEST R2 |
| 3 | Candidate Biodata & Relatives Persistence | Wire `ProfileCompletionDashboardScreen.jsx` (Steps 1-4) with 18 authentic Gotras, grandparents, parents, brothers, sisters, tauji, chacha, buaji, mamaji to `profileService` (`POST /api/profiles`, `PUT /api/profiles/:id`) | M3 | ORIGINAL_REQUEST R3 |
| 4 | Profile Photo Multipart Upload | Wire Step 4 image selector to send multipart/form-data to `POST /api/profiles/me/photo`, saving to backend `/uploads/profiles/` and rendering photo URL in UI | M3 | ORIGINAL_REQUEST R3 |
| 5 | Profile Completion Score Sync | Fetch and display live profile completion breakdown and percentage from backend `GET /api/profiles/me/completion` | M3 | ORIGINAL_REQUEST R3 |
| 6 | Match Discovery & Recommendations | Wire `DashboardScreen.jsx` and `ProfileDetailScreen.jsx` to `GET /api/matches` and `GET /api/matches/today` with 6-factor Gotra compatibility score | M4 | ORIGINAL_REQUEST R4 |
| 7 | Interests & Social Interactivity | Wire Express Interest, Accept Interest, Shortlist bookmarking, and visitor tracking (`/api/interests`, `/api/shortlist`, `/api/visitors`) | M4 | ORIGINAL_REQUEST R4 |
| 8 | Admin Auth & Dashboard Operations | Wire `AdminAuthContext.jsx` and admin pages to `POST /api/admin/auth/login`, `GET /api/admin/dashboard/kpis`, user management, and audit logs | M5 | ORIGINAL_REQUEST R5 |
| 9 | Admin KYC Verification Queue & Badge Sync | Wire side-by-side KYC document inspection and one-click approval (`PUT /api/admin/verifications/:id/approve`), auto-synchronizing verified badge on candidate profile | M5 | ORIGINAL_REQUEST R5 |
| 10 | End-to-End Build & Test Integrity | Ensure 100% backend test pass rate and clean frontend build with `npm run build` in `frontend/` | M6 | ORIGINAL_REQUEST Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: API Client Layer & Vite Reverse Proxy | `frontend/vite.config.js`, `frontend/src/services/` (all service modules with token interceptors and multipart support) | none | DONE |
| 2 | M2: User Auth & Passwordless OTP Integration | `CreateAccountScreen.jsx`, `LoginScreen.jsx`, `OtpVerificationScreen.jsx`, user session management | M1 | DONE |
| 3 | M3: Biodata, Dynamic Relatives & Photo Persistence | `ProfileCompletionDashboardScreen.jsx` (Steps 1-4), 18 Gotras dropdown, 3-gen family tree, relative subdocuments, photo upload, completion score sync | M1, M2 | DONE |
| 4 | M4: Match Discovery, Interests & Social Features | `DashboardScreen.jsx`, `ProfileDetailScreen.jsx`, match cards, 6-factor Gotra compatibility display, interest lifecycle, shortlists, visitors | M1, M2, M3 | DONE |
| 5 | M5: Admin Auth, Dashboard KPIs & KYC Verification Queue | `AdminAuthContext.jsx`, `adminDataService.js` (now a REST adapter, no longer localStorage), all admin pages, KYC queue with profile badge sync, CMS | M1 | DONE |
| 6 | M6: E2E Integration Testing & Production Build | Full backend suite green, clean `npm run build` | M1-M5 | DONE |

### Post-audit remediation (Phases 1-6)
An audit found that M5 was never actually integrated (the admin panel ran entirely
on `localStorage`) and that several UI surfaces had no backend at all. These
phases closed those gaps.

| # | Phase | Scope | Status |
|---|-------|-------|--------|
| P1 | Production blockers | Removed the hardcoded admin credential fallback; real SMS provider adapters (MSG91/Twilio/Fast2SMS) with fail-fast production validation; genuine Razorpay Checkout with server-verified HMAC signature; `VITE_API_URL` support for split deployment | DONE |
| P2 | Admin panel real integration | `adminDataService.js` rewritten as an async REST adapter; all 15 admin pages wired to MongoDB with loading/error states; CMS shape mapping; admin settings wired to the real password/preferences endpoints | DONE |
| P3 | Notifications subsystem | `Notification` model, `notificationService` with emit hooks in interest/visitor/verification/payment flows, feed + read-state + preferences endpoints, `notificationPreferences` on `User`, wired user and admin UIs | DONE |
| P4 | Messaging (Socket.io) | `Conversation` + `Message` models, `chatService` gated on accepted interest and block state, REST + Socket.io transports sharing one write path, typing indicators and read receipts, wired Messages tab | DONE |
| P5 | Account lifecycle, contact unlock, preferences | OTP-verified mobile change, email change, deactivate/reactivate (excluded from discovery via `Profile.isHidden`), permanent delete with cascade; `ContactUnlock` closing the dead `contactViewsUsed` fields; `partnerPreferences` + `SavedSearch`; wired Account/Blocked/Membership screens and the new KYC submission screen | DONE |
| P6 | Admin remainder + verification | `DELETE /admin/users/:id`, `GET /admin/subscriptions`, `GET /admin/blocks`, featured toggle, `GET /admin/matches` pair aggregation; plan CRUD role-gated in the UI; 82 new tests added | DONE |

| P7 | Partner preferences applied to discovery | `preferenceMatcher.js` translates stored `partnerPreferences` into query clauses + post-query filters; applied by default on `/api/matches` and `/api/matches/today`, opt-in on `/api/matches/search`; explicit request filters override the saved preference for the same dimension; `preferenceFit` annotation and `totalBeforePreferences` counter; new `PartnerPreferencesScreen` makes them settable | DONE |

## Test & Build Status
- Backend: **21 suites, 478 tests, all passing** (`npm test` in `backend/`)
- Frontend: clean production build (`npm run build` in `frontend/`)

## Known remaining gaps
- **Email delivery is not built.** `EMAIL_PROVIDER`/`SMTP_*` config exists in `env.js`, but there is no `emailService.js`. The `weeklyDigestEmail` and `promotionalEmails` preferences are stored and have no consumer.
- **Search quick-filter chips are decorative.** The backend supports diet/complexion/education/height/income filters; the `quickFilterGrid` chips in `DashboardScreen.jsx` do not yet call them.
- **Unverified against live services**: SMS adapters (written from provider docs), the Razorpay Checkout round-trip, and the Socket.io transport layer (`realtime.js` has no automated coverage; the shared `chatService` write path it uses is covered).

## Interface Contracts

### Auth API (`frontend/src/services/authService.js`)
- `sendOtp(mobile)`: `POST /api/auth/send-otp` -> `{ success, message, data: { mobile, cooldown, devOtp } }`
- `verifyOtp(mobile, otp)`: `POST /api/auth/verify-otp` -> `{ success, data: { accessToken, refreshToken, isNewUser, user } }`
- `register(userData)`: `POST /api/auth/register` -> `{ success, data: { user, profile } }`
- `getCurrentUser()`: `GET /api/auth/me` -> `{ success, data: { user } }`
- `logout()`: `POST /api/auth/logout` -> clears tokens from storage

### Profile API (`frontend/src/services/profileService.js`)
- `getMyProfile()`: `GET /api/profiles/me` -> `{ success, data: { profile, completion } }`
- `createProfile(data)`: `POST /api/profiles` -> `{ success, data: { profile, completion } }`
- `updateProfile(id, data)`: `PUT /api/profiles/:id` -> `{ success, data: { profile, completion } }`
- `uploadPhoto(formData)`: `POST /api/profiles/me/photo` (field `photo`) -> `{ success, data: { photoUrl, profile } }`
- `getCompletionScore()`: `GET /api/profiles/me/completion` -> `{ success, data: { score, breakdown, missingFields } }`

### Match & Social API (`frontend/src/services/matchService.js`, `interestService.js`, `socialService.js`)
- `getMatches(params)`: `GET /api/matches` -> `{ success, data: { matches, total, page } }`
- `getTodayMatches()`: `GET /api/matches/today` -> `{ success, data: { matches } }`
- `getProfileDetail(id)`: `GET /api/profiles/:id` -> `{ success, data: { profile, compatibility } }`
- `sendInterest(recipientProfileId, message)`: `POST /api/interests` -> `{ success, data: { interest } }`
- `acceptInterest(interestId)`: `PUT /api/interests/:id/accept` -> `{ success, data: { interest } }`
- `toggleShortlist(targetProfileId)`: `POST /api/shortlist` -> `{ success, data: { shortlisted } }`
- `recordVisitor(visitedProfileId)`: `POST /api/visitors` -> `{ success, data: { visitor } }`

### Admin API (`frontend/src/services/adminService.js`)
- `adminLogin(email, password)`: `POST /api/admin/auth/login` -> `{ success, data: { token, admin } }`
- `getDashboardKpis()`: `GET /api/admin/dashboard/kpis` -> `{ success, data: { kpis } }`
- `getVerifications(query)`: `GET /api/admin/verifications` -> `{ success, data: { verifications } }`
- `approveVerification(id)`: `PUT /api/admin/verifications/:id/approve` -> `{ success, data: { verification, profilesUpdated } }`
- `rejectVerification(id, reason)`: `PUT /api/admin/verifications/:id/reject` -> `{ success, data: { verification } }`
- `getUsers(query)`: `GET /api/admin/users` -> `{ success, data: { users, pagination } }`
- `toggleUserStatus(userId, status)`: `PUT /api/admin/users/:id/status` -> `{ success, data: { user } }`

## Code Layout
```
c:/Users/admin/Desktop/appzeto-2/agarwal/
├── backend/
│   ├── config/ (constants.js, env.js, db.js)
│   ├── controllers/ (auth, profile, match, interest, admin, verification, etc.)
│   ├── middleware/ (auth, upload, rateLimiter, errorHandler)
│   ├── models/ (User, Profile, Match, Interest, Shortlist, Visitor, Verification, Admin, CMS, AuditLog)
│   ├── routes/ (18 REST route modules)
│   ├── services/ (otpService, matchEngine, profileScoreService, etc.)
│   ├── uploads/ (profiles, documents)
│   └── tests/ (16 suites, 366 passing tests)
├── frontend/
│   ├── src/
│   │   ├── services/ (api.js, authService, profileService, matchService, interestService, socialService, paymentService, verificationService, adminService)
│   │   ├── modules/
│   │   │   ├── user/ (components/ screens: CreateAccount, Login, OtpVerification, ProfileCompletionDashboard, Dashboard, ProfileDetail, etc.)
│   │   │   └── admin/ (context/AdminAuthContext, pages/ AdminDashboard, VerificationQueue, Users, CMS, etc.)
│   │   ├── App.jsx, main.jsx
│   │   └── routes/
│   └── vite.config.js (reverse proxy config for /api and /uploads)
└── .agents/ (Orchestrator, Explorer, Worker, Reviewer, Challenger, Auditor metadata)
```
