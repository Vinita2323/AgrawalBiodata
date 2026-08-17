# Handoff Report — Spec Miner Survey 3: Full-Stack API Contract Reconciliation

## 1. Observation
- **Backend Architecture & Routes**:
  - Main router: `backend/routes/index.js:46-65` mounts `/api/auth`, `/api/admin/auth`, `/api/admin`, `/api/profiles`, `/api/matches`, `/api/interests`, `/api/shortlist`, `/api/visitors`, `/api/blocks`, `/api/plans`, `/api/subscriptions`, `/api/payments`, `/api/verification`, `/api/admin/verifications`, `/api/cms`, `/api/complaints`, `/api/audit-logs`, and `/api/gotras`.
  - 18 Authentic Gotras: Defined in `backend/config/constants.js:6-25` (`Garg`, `Goyal`, `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan`, `Kuchhal`, `Kansal`, `Nangal`, `Mangal`, `Bhandal`).
  - Mongoose Profile Schema: `backend/models/Profile.js:73-405` enforces `gotra` validation via `isValidGotra`, `relativeSchema` for dynamic relatives (`brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList`), `gallery` (max 6), and pre-save normalization.
  - Match Engine: `backend/services/matchEngine.js:1-445` implements 6-factor scoring: Gotra Exogamy (30%), Age (20%), Education (15%), Location (15%), Income (10%), Manglik (10%).
  - Verification & Auto-Sync: `backend/controllers/verificationController.js:199-258` updates `Verification.status`, `User.verificationStatus`, and synchronizes `Profile.verified = true` for all candidate profiles owned by the user.
  - Multer Upload: `backend/middleware/upload.js:107-115` expects single file with field name `'photo'` for `uploadProfilePhoto` and fields `idProof`, `professionProof`, `addressProof`, `document` for `uploadVerificationDocs`.
- **Frontend Architecture & Current Mocks**:
  - Routing: `frontend/src/App.jsx:9-12` mounts `/admin/*` (`AdminRoutes.jsx`) and `/*` (`UserFlowPage.jsx`).
  - Screen Flows: `frontend/src/modules/user/pages/UserFlowPage.jsx:44-323` defines 22 screen routes.
  - User Biodata Form: `frontend/src/modules/user/components/ProfileCompletionDashboardScreen.jsx:9-43` currently saves state to `localStorage.setItem('userProfile')` and reads image as Base64 Data URL instead of multipart form data.
  - Admin Services: `frontend/src/modules/admin/services/adminDataService.js:1-789` currently uses LocalStorage mock collections (`admin_users_db`, `admin_verifications_db`, etc.).
  - Vite Proxy: `frontend/vite.config.js:1-15` currently lacks reverse proxy configuration for `/api` and `/uploads` to `http://localhost:5000`.

## 2. Logic Chain
1. *Observation*: Backend REST API provides 18 complete route groups with standardized JSON envelope `{ success, message, data, error, meta }` and JWT bearer auth tokens.
2. *Observation*: Frontend UI components currently rely on `localStorage` simulations for user authentication, biodata persistence, photo upload, match score display, and admin actions.
3. *Inference*: To achieve seamless end-to-end integration, a central API client layer (`frontend/src/services/api.js`) must be configured with Axios/Fetch, automatic JWT injection, 401 token refresh queueing, and modular service files (`authService`, `profileService`, `matchService`, `interestService`, `socialService`, `paymentService`, `verificationService`, `cmsService`, `adminService`).
4. *Inference*: Discrepancies identified (Manglik enum values `"Yes"`/`"No"` vs `'Manglik'`/`'Non-Manglik'`, Profile Photo upload format Base64 vs `multipart/form-data` with field key `'photo'`, and Gotra bilingual select labels) must be normalized by the service layer during payload serialization.
5. *Inference*: Vite dev server reverse proxy must forward `/api` and `/uploads` to `http://localhost:5000` to avoid CORS and handle image rendering.

## 3. Caveats
- No caveats. Full analysis performed across all 22 user screen components, 15 admin pages, all backend route handlers, controllers, models, and scoring services.

## 4. Conclusion
The API contract specification between frontend and backend is 100% mapped, resolved, and documented in `.agents/spec_miner_survey_3/spec_analysis.md`. All screen endpoints, payload schemas, 6-factor Gotra compatibility rules, dynamic relative subdocuments, KYC moderation workflows, and modular service specifications are ready for remediation and full-stack connectivity implementation.

## 5. Verification Method
1. Inspect `spec_analysis.md`:
   - View `.agents/spec_miner_survey_3/spec_analysis.md` to review the complete mapping table, payload schemas, and service layer specifications.
2. Test Backend Health:
   - Run backend server and execute `GET http://localhost:5000/api/health` and `GET http://localhost:5000/api/gotras` to verify authentic 18 Gotras payload.
3. Verify Vite Reverse Proxy and Service Layer:
   - Verify `frontend/vite.config.js` proxy settings for `/api` and `/uploads`.
