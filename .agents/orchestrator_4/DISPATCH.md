## 2026-08-14T09:27:29Z
You are the Project Orchestrator for the Agarwal Matrimony platform full-stack integration task.

Your working directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\orchestrator_4

Please read the user request at:
c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md

Mission:
Build complete end-to-end connectivity between the React frontend (c:/Users/admin/Desktop/appzeto-2/agarwal/frontend) and the Node.js / Express / MongoDB backend REST API (c:/Users/admin/Desktop/appzeto-2/agarwal/backend), ensuring all user registration data, authentic 18 Agarwal biodata, 3-generation family tree, dynamic relatives, photo uploads, KYC verifications, match calculations, and admin operations persist directly in MongoDB.

Core requirements:
1. R1: API Client Layer & Vite Reverse Proxy (frontend/vite.config.js proxy for /api and /uploads -> localhost:5000, centralized frontend/src/services/ API layer with auth, profile, match, interest, social, payment, verification, admin services, JWT Bearer token handling, multipart uploads, error normalization).
2. R2: User Auth & Passwordless OTP Integration (CreateAccountScreen, LoginScreen, OtpVerificationScreen calling backend OTP and register endpoints, localStorage token persistence, clean logout).
3. R3: Candidate Biodata, Relatives & Photo Persistence in MongoDB (ProfileCompletionDashboardScreen Step 1-4 wiring, 18 authentic Gotras, grandparents, parents, dynamic subdocument lists for brothers, sisters, tauji, chacha, buaji, mamaji, photo upload to POST /api/profiles/me/photo, intermediate step saving, completion percentage sync).
4. R4: Match Discovery, Interests & Social Interactions (DashboardScreen and ProfileDetailScreen connected to real backend endpoints /api/profiles/me, /api/matches, /api/matches/today, /api/interests, shortlist, visitors).
5. R5: Admin Operations & KYC Verification Queue (AdminAuthContext, adminDataService connected to /api/admin/auth/login, /api/admin/dashboard/kpis, /api/admin/verifications, etc.).

Verification:
- Ensure all backend tests pass (100% success rate).
- Ensure frontend builds cleanly with `npm run build` in `frontend/`.
- Ensure integration tests or verification scripts confirm end-to-end data flow and persistence into MongoDB.
