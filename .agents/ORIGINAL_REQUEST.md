# Original User Request

## Initial Request — 2026-08-14T07:10:36Z

Build a complete, production-ready REST API backend in Node.js, Express, and MongoDB (Mongoose) for the Agrawal Biodata Matrimony platform, fully supporting both the User Module and Admin Module frontends.

Working directory: c:/Users/admin/Desktop/appzeto-2/agarwal/backend
Integrity mode: development

## Requirements

### R1. Project Setup, Core Infrastructure & Authentication
- Initialize Node.js Express application with modular architecture (config, middleware, models, controllers, routes, services, utils).
- MongoDB connection using Mongoose with proper error handling and schemas.
- Implement Passwordless OTP Authentication for Users:
  - Generate & store 6-digit OTP (30s cooldown, 5 min validity) with rate limiting (max 5 requests / 10 min per phone number).
  - OTP verification issuing JWT access token (15m) and refresh token (7d).
  - SMS sending logic structured with clean stub/interface for future SMTP/SMS provider integration.
- Implement Admin Authentication:
  - Single Admin account model with bcrypt password hashing and JWT authentication.
  - Seed script to initialize default Super Admin (admin@matrimonyhub.com / admin123).

### R2. Matrimonial Candidate Biodata & Multi-Profile Management
- Support multiple candidate profiles per registered user account.
- Complete Matrimonial Biodata Schema:
  - Personal Details: Gotra (strictly from authentic 18 Agarwal gotras enum), Mother's Gotra, DOB, TOB, POB, height, complexion, manglik status, qualification, workingAt, income, hobbies.
  - 3-Generation Family Tree & Relative Collections: Grandparents, parents, dynamic subdocument lists for brothers, sisters, tauji, chacha, buaji, mamaji (including marital status, spouse names, and in-laws city).
  - Residential and contact information with privacy protection levels.
  - Media: Local multipart image upload handling (profile picture + up to 6 gallery photos) with sanitization and validation.
- Profile completion calculation endpoint (percentage breakdown per section).

### R3. Weighted Match Engine, Interests & Candidate Discovery
- Algorithmic compatibility scoring engine taking into account:
  - Gotra rules (candidate gotra and mother's gotra check).
  - Age, education, location, income bracket, and manglik alignment.
- Match discovery endpoints: GET /api/matches (paginated, filtered by nearby/category), GET /api/matches/today (top carousel), GET /api/matches/search (multi-field search).
- Interest lifecycle: Express interest, accept, decline, and retrieve sent/received lists.
- Social features: Shortlist/favorites, profile visitor tracking (deduplicated daily), and user block list management.

### R4. Subscriptions, Payments & Document Verification
- Subscription & Plan Management: CRUD for plans (Gold, Platinum, Diamond) with monthly/yearly pricing and custom benefit lists.
- Razorpay Integration: Order creation, webhook signature verification, and automated subscription activation upon successful payment.
- Verification Workflow:
  - User document submission (Government ID + Professional/Academic documents).
  - Admin verification queue with side-by-side inspection, one-click approval, and categorized rejection reasons.
  - Automated synchronization between verification approval and candidate profile verified badge.

### R5. Admin CMS, Moderation, Audit Trails & Operations KPIs
- Admin Operations Dashboard: Real-time aggregated KPIs (total users, active users, pending verifications, daily matches, revenue, active subscriptions).
- User Management: Listing, filtering, search, status toggles (Active/Suspended), CSV export, and profile inspection.
- Content Management (CMS): Static pages editor (About Us, Contact Us, Privacy Policy points, Terms of Service points, FAQs) and homepage banner carousel manager.
- Abuse Moderation: Complaint reporting, resolution workflow, automatic suspension actions, and block history.
- Audit Trail: Immutable administrative action logging (actor, action, target entity, timestamp, details).

## Acceptance Criteria

### API Functionality & Schema Validation
- [ ] All endpoints specified in R1-R5 are fully implemented and return valid JSON responses with appropriate HTTP status codes.
- [ ] Mongoose models correctly enforce schemas, enums (18 Gotras), required fields, and index constraints.
- [ ] Multi-profile relationship (User 1 -> N Profile) is correctly supported in creation, fetching, updating, and admin views.
- [ ] Passwords and sensitive data are never returned in plaintext in API responses.

### Security & Rate Limiting
- [ ] Unauthenticated requests to protected endpoints return 401 Unauthorized.
- [ ] Rate limiter blocks excessive OTP generation attempts.
- [ ] Razorpay webhook handler validates cryptographic signatures before processing fulfillment.

### Automated Testing & Verification
- [ ] End-to-end integration test scripts verify complete workflows:
  - Auth flow (OTP request -> verify -> token issuance -> profile creation).
  - Biodata update & completion calculation.
  - Matching calculation and interest exchange.
  - Admin login, user status management, verification approval, and audit log generation.
- [ ] Server boots cleanly without errors with npm start / npm run dev.

## Follow-up — 2026-08-14T09:26:57Z

Build complete end-to-end connectivity between the React frontend (c:/Users/admin/Desktop/appzeto-2/agarwal/frontend) and the Node.js / Express / MongoDB backend REST API (c:/Users/admin/Desktop/appzeto-2/agarwal/backend), ensuring all user registration data, authentic 18 Agarwal biodata, 3-generation family tree, dynamic relatives, photo uploads, KYC verifications, match calculations, and admin operations persist directly in MongoDB.

Working directory: c:/Users/admin/Desktop/appzeto-2/agarwal
Integrity mode: development

## Requirements

### R1. API Client Layer & Vite Reverse Proxy
- Configure `frontend/vite.config.js` with reverse proxy for `/api` and `/uploads` pointing to backend `http://localhost:5000`.
- Create centralized API service layer in `frontend/src/services/` (`api.js`, `authService.js`, `profileService.js`, `matchService.js`, `interestService.js`, `socialService.js`, `paymentService.js`, `verificationService.js`, `adminService.js`).
- Implement automatic JWT `Authorization: Bearer <token>` header injection, JSON serialization, multipart file upload support, and error normalization.

### R2. User Authentication & Passwordless OTP Integration
- Connect `CreateAccountScreen.jsx` and `LoginScreen.jsx` to call `POST /api/auth/send-otp`.
- Connect `OtpVerificationScreen.jsx` to call `POST /api/auth/verify-otp`, followed by `POST /api/auth/register` for new registrations.
- Store JWT `accessToken`, `refreshToken`, and user metadata in `localStorage` and auth state with clean logout support.

### R3. Candidate Biodata, Relatives & Photo Persistence in MongoDB
- Wire `ProfileCompletionDashboardScreen.jsx` to:
  - Step 1 (Personal & Astrology): Name, authentic 18 Gotras dropdown, DOB, TOB, POB, height, complexion, manglik status, education, occupation, income.
  - Step 2 (Family Background): Grandparents, parents, dynamic subdocument lists for brothers, sisters, tauji, chacha, buaji.
  - Step 3 (Maternal & Contact): Mamaji, mamajiList, residential address, mobile number, privacy settings.
  - Step 4 (Photo Upload): Local file upload sending multipart form data to `POST /api/profiles/me/photo`.
- Wire intermediate save buttons and step progression to `POST /api/profiles` (or `PUT /api/profiles/:profileId`).
- Automatically sync profile completion percentage from backend `/api/profiles/me/completion`.

### R4. Match Discovery, Interests & Social Interactions
- Connect `DashboardScreen.jsx` and `ProfileDetailScreen.jsx` to:
  - `GET /api/profiles/me` for active candidate profile.
  - `GET /api/matches` and `GET /api/matches/today` for curated recommendations with 6-factor Gotra compatibility score.
  - `POST /api/interests` and `PUT /api/interests/:id/accept` for expressing and accepting mutual interest.
  - Shortlist bookmarks (`/api/shortlist`) and visitor tracking (`/api/visitors`).

### R5. Admin Operations & KYC Verification Queue
- Connect `AdminAuthContext.jsx` and `adminDataService.js` to real backend REST endpoints:
  - `POST /api/admin/auth/login` for Super Admin authentication.
  - `GET /api/admin/dashboard/kpis` for real-time aggregated metrics.
  - `GET /api/admin/verifications` and `PUT /api/admin/verifications/:id/approve` for KYC moderation.
  - CMS pages and hero banner management.

## Acceptance Criteria

### API Connectivity & Data Persistence
- [ ] Submitting the profile form in `ProfileCompletionDashboardScreen` persists candidate biodata, 18 Gotra, 3-gen family tree, and relative lists into MongoDB.
- [ ] Uploaded profile photo is saved to backend `/uploads/profiles/` and rendered correctly in the UI.
- [ ] Profile completion score is fetched from the backend calculation engine.
- [ ] OTP auth flow works end-to-end with the backend API.
- [ ] Matches feed loads real candidate documents from MongoDB with Gotra compatibility breakdown.
- [ ] Frontend builds cleanly with `npm run build` in `frontend/` without syntax or bundling errors.
- [ ] Backend tests continue to pass with 100% success rate.

