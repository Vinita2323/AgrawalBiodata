# Handoff Report: Frontend Architecture & Integration Survey

**Author**: Frontend Architecture Explorer  
**Recipient**: Parent Orchestrator (`7ef8af4e-48ce-4f5d-a173-ce643eca3c4b`)  
**Working Directory**: `c:/Users/admin/Desktop/appzeto-2/agarwal/.agents/explorer_survey_1`  
**Date**: 2026-08-14  

---

## 1. Observation

Direct observations from examining the codebase at `c:/Users/admin/Desktop/appzeto-2/agarwal/frontend` and `c:/Users/admin/Desktop/appzeto-2/agarwal/backend`:

1. **Configuration & Server Proxy**:
   - `frontend/vite.config.js` lines 1–15: Currently configures only `plugins: [react(), tailwindcss()]` with `build: { outDir: 'dist' }`. There is **no `server.proxy`** configured for forwarding `/api` or `/uploads` requests to the backend server at `http://localhost:5000`.
   - `frontend/package.json` lines 1–28: Uses React 19 (`^19.2.7`), React Router DOM 7 (`^7.18.2`), Tailwind CSS 4 (`^4.3.3`), Vite 5 (`^5.4.14`), and PDF export tools (`html2canvas`, `jspdf`, `html2pdf.js`). Axios is not installed; native browser `fetch` is available for API clients.

2. **User Authentication Flow**:
   - `CreateAccountScreen.jsx` lines 6–29: Collects `fullName`, `gender`, `dob`, `mobile`, `email`, `createdFor`, and `acceptTerms`. Currently calls `localStorage.setItem('registrationData', JSON.stringify(formData))` without calling the backend.
   - `LoginScreen.jsx` lines 4–17: Takes 10-digit `mobile` and transitions to `/otp-verification` without calling `POST /api/auth/send-otp`.
   - `OtpVerificationScreen.jsx` lines 11, 63–85: Pre-fills `['1','2','3','4','5','6']` and runs a mock `setTimeout(..., 1200)` delay before navigating.
   - Backend Contract: `POST /api/auth/send-otp` (`{ mobile }`), `POST /api/auth/verify-otp` (`{ mobile, otp }` returning `{ accessToken, refreshToken, isNewUser, user }`), and `POST /api/auth/register` (`{ fullName, gender, dob, mobile, email, createdFor }`).

3. **Biodata Profile Creation & Relatives Subdocuments**:
   - `ProfileCompletionDashboardScreen.jsx` lines 9–43: State includes 18 authentic Agarwal Gotras dropdown, personal details, grandfather, grandmother, father, fatherOccupation, mother, `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, residentialAddress, mobileNumber, and profilePicture.
   - Lines 75–78, 95–98, 673–678: Form save handlers call `localStorage.setItem('userProfile', JSON.stringify(profileToSave))` and `alert('Details saved successfully!')` without persisting to MongoDB.
   - Backend Contract: `GET /api/profiles/me`, `POST /api/profiles`, `PUT /api/profiles/:profileId`, `POST /api/profiles/me/photo` (multipart `FormData` with field `photo`), and `GET /api/profiles/me/completion`.

4. **Discovery, Matching, Social & Dashboard Screens**:
   - `DashboardScreen.jsx` lines 369–462, 500–535: Renders hardcoded mock data for `matchesList`, `todayMatches`, `recentSearches`, `interestsData`, and `notificationsList`.
   - Lines 1428–1439, 1371–1383: Interest and favorite toggle handlers only mutate local React component state.
   - `ProfileDetailScreen.jsx` lines 6–44, 427–440: Uses static fallback candidate object and `alert()` for shortlisting and expressing interest.
   - Backend Contract: `GET /api/matches`, `GET /api/matches/today`, `GET /api/matches/search`, `POST /api/interests`, `PUT /api/interests/:id/accept`, `POST /api/shortlist`, `POST /api/visitors`.

5. **Admin Module & KYC Verification**:
   - `AdminAuthContext.jsx` lines 16–44: Hardcoded credential validation against `admin@matrimonyhub.com` / `admin123`.
   - `adminDataService.js` lines 1–789: Mock in-memory data store with localStorage persistence for `USERS`, `VERIFICATIONS`, `SUBSCRIPTIONS`, `PAYMENTS`, `BANNERS`, `STATIC_CONTENT`, `COMPLAINTS`, `BLOCK_HISTORY`, and `AUDIT_LOGS`.
   - Backend Contract: `POST /api/admin/auth/login`, `GET /api/admin/dashboard/kpis`, `GET /api/admin/verifications`, `PUT /api/admin/verifications/:id/approve`, `GET /api/admin/users`, `GET /api/admin/audit-logs`.

6. **Service Layer**:
   - `frontend/src/services/` directory is currently non-existent.

---

## 2. Logic Chain

1. **Proxy & Routing**: Since the frontend dev server runs on Vite (`http://localhost:5173`) and the Express REST API runs on `http://localhost:5000`, relative API calls (`/api/...` and `/uploads/...`) will result in 404s unless a reverse proxy is configured in `vite.config.js`.
2. **Client Architecture**: All user and admin components currently interact with localStorage or component state. Creating a modular service layer (`src/services/`) with a centralized `api.js` client that handles JWT token injection (`Authorization: Bearer <token>`), JSON headers, multipart upload detection, and normalized error throwing provides a clean separation of concerns and allows all screens to be wired without duplicating fetch logic.
3. **Data Schema Alignment**: The backend Mongoose `Profile` model schema exactly matches the fields in `ProfileCompletionDashboardScreen.jsx` (including the 18 authentic Agarwal Gotras, 3-generation family tree, and dynamic subdocument relative lists `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`). Converting the frontend form submissions to call `profileService` will persist candidate biodata directly into MongoDB.
4. **End-to-End Auth & State**: Connecting `CreateAccountScreen`, `LoginScreen`, and `OtpVerificationScreen` to the backend auth endpoints ensures users receive valid JWT tokens that enable authenticated requests across the discovery, interest, and profile modules.

---

## 3. Caveats

- **No Code Modification Executed**: As this investigation was read-only, no frontend or backend project code files were altered during this survey.
- **SMS Gateway Stubbing**: The backend uses an in-memory/console OTP stub (default OTP in test mode), so OTP delivery in development can be verified via backend logs/API responses.
- **Razorpay Sandbox**: Razorpay payments require valid test API keys in backend `.env` (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`) or sandbox mock mode.

---

## 4. Conclusion

The React frontend UI is fully styled and structured to match the Agarwal Matrimony platform specifications. The backend REST API is operational with complete schemas and routes. The path to 100% full-stack integration requires:
1. Configuring the Vite reverse proxy in `vite.config.js`.
2. Building the `src/services/` client layer (9 service files).
3. Wiring `CreateAccountScreen`, `LoginScreen`, and `OtpVerificationScreen` to `authService`.
4. Wiring `ProfileCompletionDashboardScreen` and photo upload to `profileService`.
5. Wiring `DashboardScreen` and `ProfileDetailScreen` to `profileService`, `matchService`, `interestService`, and `socialService`.
6. Wiring `AdminAuthContext` and Admin pages to `adminService`.

---

## 5. Verification Method

To verify the findings and test subsequent integration:

1. **Verify Frontend Build**:
   ```powershell
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\frontend
   npm run build
   ```
   *Expected*: Bundles cleanly into `dist/` with 0 errors.

2. **Verify Backend Health & Gotra Reference**:
   ```powershell
   # Start backend or run tests
   cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend
   npm test
   ```
   *Expected*: 100% test pass rate across all suites.

3. **Verify Reverse Proxy & API Connectivity**:
   - Inspect `frontend/vite.config.js` for `server.proxy` configuration.
   - Start backend (`npm run dev` on port 5000) and frontend (`npm run dev` on port 5173).
   - Test OTP sending from `http://localhost:5173/login` -> should hit `/api/auth/send-otp`.
   - Test profile save in `http://localhost:5173/profile-completion-dashboard` -> should persist candidate document to MongoDB.
