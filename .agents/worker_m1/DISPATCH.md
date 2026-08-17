## 2026-08-14T09:34:15Z

You are the Implementation Worker for Milestone 1 (API Client Layer & Vite Reverse Proxy) of the Agarwal Matrimony platform integration.

Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m1
Parent conversation ID: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b

Please read the user requirements at:
c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
And reference the survey specifications at:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\explorer_survey_1\analysis.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\explorer_survey_2\analysis.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\spec_miner_survey_3\spec_analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Owned Files:
1. `frontend/vite.config.js`: Configure `server.proxy` for `/api` and `/uploads` forwarding to backend `http://localhost:5000` with changeOrigin: true.
2. `frontend/src/services/api.js`: Centralized fetch HTTP client.
   - Automatically injects JWT Bearer token from `localStorage.getItem('token')` or `localStorage.getItem('accessToken')` (also handles admin token `localStorage.getItem('adminToken')`).
   - Handles JSON payloads (`Content-Type: application/json`) vs `FormData` (omits Content-Type header so browser adds boundary).
   - Unwraps standard backend JSON envelope `{ success, message, data, error, meta }` and throws normalized Error objects on HTTP/API errors.
   - Helper methods: `get(endpoint, params)`, `post(endpoint, body)`, `put(endpoint, body)`, `patch(endpoint, body)`, `delete(endpoint)`, `upload(endpoint, formData)`.
3. `frontend/src/services/authService.js`:
   - `sendOtp(mobile)` -> `POST /api/auth/send-otp`
   - `verifyOtp(mobile, otp)` -> `POST /api/auth/verify-otp`
   - `register(userData)` -> `POST /api/auth/register`
   - `getCurrentUser()` -> `GET /api/auth/me`
   - `refreshToken(token)` -> `POST /api/auth/refresh-token`
   - `logout()` -> `POST /api/auth/logout` and localStorage token cleanup.
4. `frontend/src/services/profileService.js`:
   - `getMyProfile()` -> `GET /api/profiles/me`
   - `createProfile(data)` -> `POST /api/profiles`
   - `updateProfile(id, data)` -> `PUT /api/profiles/:id`
   - `uploadPhoto(fileOrFormData)` -> `POST /api/profiles/me/photo` (sends FormData with field `photo`)
   - `getCompletionScore()` -> `GET /api/profiles/me/completion`
   - `getProfileById(id)` -> `GET /api/profiles/:id`
   - `getGotras()` -> `GET /api/gotras`
5. `frontend/src/services/matchService.js`:
   - `getMatches(params)` -> `GET /api/matches`
   - `getTodayMatches()` -> `GET /api/matches/today`
   - `searchMatches(query)` -> `GET /api/matches/search`
6. `frontend/src/services/interestService.js`:
   - `sendInterest(recipientProfileId, message)` -> `POST /api/interests`
   - `acceptInterest(id)` -> `PUT /api/interests/:id/accept`
   - `declineInterest(id)` -> `PUT /api/interests/:id/decline`
   - `getSentInterests(params)` -> `GET /api/interests/sent`
   - `getReceivedInterests(params)` -> `GET /api/interests/received`
7. `frontend/src/services/socialService.js`:
   - `toggleShortlist(targetProfileId)` -> `POST /api/shortlist`
   - `getShortlists()` -> `GET /api/shortlist`
   - `recordVisitor(visitedProfileId)` -> `POST /api/visitors`
   - `getVisitors()` -> `GET /api/visitors`
   - `blockUser(targetUserId, reason)` -> `POST /api/blocks`
   - `getBlockedUsers()` -> `GET /api/blocks`
8. `frontend/src/services/paymentService.js`:
   - `getPlans()` -> `GET /api/plans`
   - `createOrder(planId, billingCycle)` -> `POST /api/payments/order`
   - `verifyPayment(paymentData)` -> `POST /api/payments/verify`
   - `getMySubscription()` -> `GET /api/subscriptions/me`
9. `frontend/src/services/verificationService.js`:
   - `submitDocuments(formData)` -> `POST /api/verification/upload`
   - `getVerificationStatus()` -> `GET /api/verification/status`
10. `frontend/src/services/cmsService.js`:
    - `getPages()` -> `GET /api/cms/pages`
    - `getPageBySlug(slug)` -> `GET /api/cms/pages/:slug`
    - `getBanners()` -> `GET /api/cms/banners`
11. `frontend/src/services/adminService.js`:
    - `adminLogin(email, password)` -> `POST /api/admin/auth/login`
    - `getDashboardKpis()` -> `GET /api/admin/dashboard/kpis`
    - `getVerifications(params)` -> `GET /api/admin/verifications`
    - `approveVerification(id, notes)` -> `PUT /api/admin/verifications/:id/approve`
    - `rejectVerification(id, reason, notes)` -> `PUT /api/admin/verifications/:id/reject`
    - `getUsers(params)` -> `GET /api/admin/users`
    - `toggleUserStatus(id, status, reason)` -> `PUT /api/admin/users/:id/status`
    - `getAuditLogs(params)` -> `GET /api/admin/audit-logs`
    - `getComplaints(params)` -> `GET /api/admin/complaints`
    - `resolveComplaint(id, resolution, action)` -> `PUT /api/admin/complaints/:id/resolve`
    - `updateCmsPage(slug, data)` -> `PUT /api/admin/cms/pages/:slug`
    - `createBanner(data)` -> `POST /api/admin/cms/banners`
    - `deleteBanner(id)` -> `DELETE /api/admin/cms/banners/:id`

Verification Requirement:
- Run `npm run build` in `frontend/` using `run_command` and confirm the bundle builds cleanly.
- Deliver `handoff.md` and `progress.md` in `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m1\`.
- Message parent (ID: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b) when completed.
