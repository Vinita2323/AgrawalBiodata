# Frontend Architecture Survey & API Integration Analysis

**Project**: Agarwal Matrimony Full-Stack Platform  
**Target**: React 19 Frontend (`c:/Users/admin/Desktop/appzeto-2/agarwal/frontend`)  
**Backend API**: Node.js / Express / MongoDB (`c:/Users/admin/Desktop/appzeto-2/agarwal/backend`)  
**Date**: 2026-08-14  
**Author**: Frontend Architecture Explorer  

---

## 1. Executive Summary

The frontend application is a modern single-page application built with **React 19**, **Vite 5**, **Tailwind CSS 4**, and **React Router DOM 7**. It is architecturally divided into two primary submodules:
1. **User Module (`src/modules/user/`)**: Mobile-responsive matrimonial portal containing passwordless OTP onboarding, a 4-step multi-generational biodata creator (supporting the authentic 18 Agarwal Gotras, 3-generation family tree, and dynamic relative subdocument collections), matches discovery carousel, faceted candidate search, mutual interest management, shortlisted favorites, visitor tracking, bio-data PDF export, and Razorpay checkout.
2. **Admin Module (`src/modules/admin/`)**: Full-featured administrative control panel with Super Admin authentication, real-time KPI metrics, KYC document inspection queue, user status toggling, CSV exports, content management system (banners and static pages), complaint moderation, and immutable audit logging.

### Current Implementation State
- **UI & Layouts**: 100% complete, highly styled with traditional Agarwal cultural aesthetics (maroon `#570013`, gold `#775a19`, amber accents) and responsive design.
- **Backend Connectivity**: Currently **0% connected** to the real REST API. The User module relies entirely on local React state (`useState`) and browser `localStorage` (`userProfile`, `registrationData`), while the Admin module relies on a mock service (`adminDataService.js`) with localStorage persistence and hardcoded in-memory arrays.
- **Vite Proxy**: Currently missing the reverse proxy configuration for `/api` and `/uploads` in `vite.config.js`.
- **API Service Layer**: `src/services/` does not yet exist.

---

## 2. Complete Frontend File Structure

```
frontend/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
├── public/
│   ├── Logo (2).png
│   ├── favicon.svg
│   ├── icons.svg
│   └── _redirects
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/                     # Legacy root stubs
    │   ├── AuthScreen.jsx
    │   ├── OnboardingScreen.jsx
    │   ├── SplashScreen.jsx
    │   └── WelcomeScreen.jsx
    └── modules/
        ├── admin/
        │   ├── index.js
        │   ├── components/
        │   │   ├── AdminLayout.jsx
        │   │   └── HeaderSearchModal.jsx
        │   ├── context/
        │   │   └── AdminAuthContext.jsx
        │   ├── pages/
        │   │   ├── AdminDashboardPage.jsx
        │   │   ├── AdminLoginPage.jsx
        │   │   ├── AdminSettingsPage.jsx
        │   │   ├── AuditLogPage.jsx
        │   │   ├── ComplaintManagementPage.jsx
        │   │   ├── ContentManagementPage.jsx
        │   │   ├── LegalManagementPage.jsx
        │   │   ├── MatchManagementPage.jsx
        │   │   ├── NotificationsPage.jsx
        │   │   ├── PaymentManagementPage.jsx
        │   │   ├── ProfileVerificationPage.jsx
        │   │   ├── SubscriptionManagementPage.jsx
        │   │   ├── UserDetailPage.jsx
        │   │   ├── UserManagementPage.jsx
        │   │   └── VerificationDetailPage.jsx
        │   ├── routes/
        │   │   └── AdminRoutes.jsx
        │   └── services/
        │       └── adminDataService.js
        └── user/
            ├── index.js
            ├── pages/
            │   └── UserFlowPage.jsx
            └── components/
                ├── AboutMatrimonyHubScreen.jsx
                ├── AccountCreatedScreen.jsx
                ├── AccountSettingsScreen.jsx
                ├── AuthLandingScreen.jsx
                ├── AuthScreen.jsx
                ├── BlockedUsersScreen.jsx
                ├── CommunityGuidelinesScreen.jsx
                ├── CreateAccountScreen.jsx
                ├── DashboardScreen.jsx
                ├── HeaderBar.jsx
                ├── HelpSupportScreen.jsx
                ├── LoginScreen.jsx
                ├── MembershipScreen.jsx
                ├── NotificationSettingsScreen.jsx
                ├── OnboardingScreen.jsx
                ├── OtpVerificationScreen.jsx
                ├── PaymentScreen.jsx
                ├── PrivacyPolicyScreen.jsx
                ├── ProfileCompletionDashboardScreen.jsx
                ├── ProfileDetailScreen.jsx
                ├── ScrollToTop.jsx
                ├── SettingsScreen.jsx
                ├── SplashScreen.jsx
                ├── TermsOfServiceScreen.jsx
                └── WelcomeScreen.jsx
```

---

## 3. Build & Configuration Audit

### `package.json` Dependencies
- `react`: `^19.2.7`
- `react-dom`: `^19.2.7`
- `react-router-dom`: `^7.18.2`
- `tailwindcss`: `^4.3.3`
- `@tailwindcss/vite`: `^4.3.3`
- `html2canvas`: `^1.4.1`
- `jspdf`: `^4.2.1`
- `html2pdf.js`: `^0.14.0`

### Required `vite.config.js` Proxy Configuration
Currently, `vite.config.js` does not proxy requests to the backend. To enable seamless local development and production-like relative URL routing (`/api/*` and `/uploads/*`), update `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
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
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

---

## 4. Routing & Application Lifecycle

### App Root (`src/App.jsx`)
- `/admin/*` -> Mounts `AdminRoutes`
- `/*` -> Mounts `UserFlowPage`

### User Flow Routing (`src/modules/user/pages/UserFlowPage.jsx`)
| Route | Screen Component | Purpose | Current Data Source |
|---|---|---|---|
| `/` & `/splash` & `/welcome` | `AuthLandingScreen` | Welcome portal, login/signup triggers | Static |
| `/login` | `LoginScreen` | Mobile number entry for OTP | Local state |
| `/create-account` | `CreateAccountScreen` | Initial profile info + mobile | Local state + `localStorage` |
| `/otp-verification` | `OtpVerificationScreen` | 6-digit OTP verification | Mock `setTimeout` |
| `/account-created` | `AccountCreatedScreen` | Verification success message | Static |
| `/profile-completion-dashboard` | `ProfileCompletionDashboardScreen` | 4-step comprehensive biodata builder | `localStorage.getItem('userProfile')` |
| `/home` & `/dashboard` | `DashboardScreen (initialTab="Home")` | Dashboard with biodata summary, today's matches, quick actions | In-memory mock arrays |
| `/matches` | `DashboardScreen (initialTab="Matches")` | Curated recommendations (All, Nearby, Interested) | In-memory mock arrays |
| `/search` | `DashboardScreen (initialTab="Search")` | Search bar + quick filters | Client-side filter |
| `/interests` | `DashboardScreen (initialTab="Interests")` | Mutual interest tracker (Received, Sent, Accepted, Declined) | In-memory mock arrays |
| `/chat` & `/messages` | `DashboardScreen (initialTab="Messages")` | Chat conversation threads | Local state |
| `/profile` | `DashboardScreen (initialTab="Profile")` | Profile dashboard, completion score, settings tiles | `localStorage` |
| `/profile-detail` | `ProfileDetailScreen` | Full candidate matrimonial profile | Local prop or mock fallback |
| `/membership` | `MembershipScreen` | Gold, Platinum, Diamond plans | Hardcoded array |
| `/payment` | `PaymentScreen` | Order checkout & payment simulation | Mock timer |
| `/settings`, `/account`, `/blocked`, `/about` | Various Settings Screens | Sub-settings and legal terms | Mock / Static |

### Admin Routing (`src/modules/admin/routes/AdminRoutes.jsx`)
Protected by `AdminProtectedRoute` using `AdminAuthContext`:
| Route | Component | Purpose | Current Data Source |
|---|---|---|---|
| `/admin/login` | `AdminLoginPage` | Admin credential login | Hardcoded check (`admin@matrimonyhub.com` / `admin123`) |
| `/admin/dashboard` | `AdminDashboardPage` | Platform metrics & KPIs | `adminDataService.getDashboardMetrics()` |
| `/admin/users` | `UserManagementPage` | User listing, search, status toggles, CSV | `adminDataService.getUsers()` |
| `/admin/users/:userId` | `UserDetailPage` | User & biodata profile inspection | `adminDataService.getUserById()` |
| `/admin/profile-verification` | `ProfileVerificationPage` | KYC verification queue | `adminDataService.getVerifications()` |
| `/admin/profile-verification/:id`| `VerificationDetailPage` | Side-by-side KYC document review & approval | `adminDataService.getVerificationById()` |
| `/admin/matches` | `MatchManagementPage` | Featured profile toggles | `adminDataService.getUsers()` |
| `/admin/subscriptions` | `SubscriptionManagementPage` | Plan CRUD | `adminDataService.getSubscriptions()` |
| `/admin/payments` | `PaymentManagementPage` | Transaction history | `adminDataService.getPayments()` |
| `/admin/complaints` | `ComplaintManagementPage` | Abuse complaints & resolution | `adminDataService.getComplaints()` |
| `/admin/legal` | `LegalManagementPage` | Static CMS pages | `adminDataService.getStaticContent()` |
| `/admin/notifications` | `NotificationsPage` | Admin alerts | Static |
| `/admin/settings` | `AdminSettingsPage` | Admin password & credentials | `AdminAuthContext` |

---

## 5. Detailed Screen-by-Screen UI & Data Contracts

### 5.1 Authentication Screens
1. **`CreateAccountScreen.jsx`**:
   - Form Fields:
     - `createdFor`: `Myself | Son | Daughter | Brother | Sister | Relative | Friend`
     - `fullName`: `string`
     - `mobile`: `string` (10 digits)
     - `gender`: `Male | Female`
     - `dob`: `YYYY-MM-DD`
     - `email`: `string` (optional)
     - `acceptTerms`: `boolean`
   - Target API: `POST /api/auth/send-otp` with `{ mobile }`.
   - Navigation: Navigates to `/otp-verification` passing `state: { mobile, isNewUser: true, formData }`.

2. **`LoginScreen.jsx`**:
   - Form Fields:
     - `mobile`: `string` (10 digits)
   - Target API: `POST /api/auth/send-otp` with `{ mobile }`.
   - Navigation: Navigates to `/otp-verification` passing `state: { mobile, isNewUser: false }`.

3. **`OtpVerificationScreen.jsx`**:
   - State: `otp` (array of 6 strings), `timer` (30s cooldown), `isSubmitting`, `errorMsg`.
   - Target API Workflow:
     1. Call `POST /api/auth/verify-otp` with `{ mobile, otp }`.
     2. If `isNewUser` and `formData` exists, call `POST /api/auth/register` with `{ fullName, gender, dob, mobile, email, createdFor }`.
     3. Save `accessToken`, `refreshToken`, and `user` object in `localStorage` under `token`, `refreshToken`, and `user`.
     4. On Resend: Call `POST /api/auth/send-otp` with `{ mobile }`.
     5. Navigate to `/account-created` (for new users) or `/home` (for existing users).

---

### 5.2 Biodata Profile Completion Engine (`ProfileCompletionDashboardScreen.jsx`)

The screen is a 4-step wizard with state `formData`:
```javascript
{
  // Step 1: Personal & Astrology
  fullName: '',
  gender: '',
  gotra: '',                 // Strictly one of 18 authentic Gotras
  dob: '',
  tob: '',
  pob: '',
  height: '',
  complexion: '',
  manglik: '',               // Yes / No / Don't Know
  qualification: '',
  hobbies: '',
  income: '',
  workingAt: '',

  // Step 2: Family Background
  grandfather: '',
  grandmother: '',
  father: '',
  fatherOccupation: '',      // Business | Private Job | Govt Job | Retired | Not Employed
  fatherOccupationDetails: '',
  mother: '',
  motherGotra: '',
  brotherList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
  sisterList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
  taujiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
  chachaList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
  buajiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],

  // Step 3: Maternal & Contact
  mamaji: '',
  mamajiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
  residentialAddress: '',
  mobileNumber: '',

  // Step 4: Photo Upload
  profilePicture: null       // File or DataURL
}
```

#### Gotra Alignment
The Gotra dropdown must strictly match the 18 authentic Agarwal Gotras:
1. `Garg` (गर्ग)
2. `Goyal` (गोयल)
3. `Bansal` (बंसल)
4. `Bindal` (बिंदल)
5. `Mittal` (मित्तल)
6. `Singhal` (सिंघल)
7. `Jindal` (जिंदल)
8. `Tingal` (तिंगल)
9. `Tayal` (तायल)
10. `Airan` (ऐरन)
11. `Dharan` (धारण)
12. `Madhukul` (मधुकुल)
13. `Goyan` (गोयन)
14. `Kuchhal` (कुच्छल)
15. `Kansal` (कंसल)
16. `Nangal` (नांगल / Nagal)
17. `Mangal` (मंगल)
18. `Bhandal` (भंदल)

#### Target API Endpoints:
- **Load Existing Biodata**: `GET /api/profiles/me` on component mount to prefill fields.
- **Save / Update Biodata**:
  - If user has no profile: `POST /api/profiles` with `formData`.
  - If user has an active profile: `PUT /api/profiles/:profileId` (or `PUT /api/profiles/me`).
- **Upload Photo (Step 4)**: `POST /api/profiles/me/photo` (multipart `FormData` with field `photo`).
- **Completion Score**: `GET /api/profiles/me/completion` returning `{ totalPercentage, sections: { personal, family, contact, photo } }`.

---

### 5.3 Match Discovery, Search & Social Interactions (`DashboardScreen.jsx` & `ProfileDetailScreen.jsx`)

1. **Dashboard Home Tab**:
   - `GET /api/profiles/me` -> Render active candidate header and Bio Data card.
   - `GET /api/matches/today` -> Render top horizontal carousel with Gotra match scores.
   - `GET /api/profiles/me/completion` -> Render progress ring (e.g. 75% complete).

2. **Matches Tab**:
   - `GET /api/matches?category=all` -> Render all recommended candidates.
   - `GET /api/matches?category=nearby` -> Render nearby / regional matches.
   - `GET /api/matches?category=interested` -> Render candidates marked as interested.
   - Actions:
     - Heart toggle -> `POST /api/shortlist` `{ targetProfileId }` or `DELETE /api/shortlist/:targetProfileId`.
     - "Interested" button -> `POST /api/interests` `{ targetProfileId }`.

3. **Search Tab**:
   - Live query input -> `GET /api/matches/search?q={query}`.
   - Filter tiles (Age, Height, Gotra, Education, Profession, City) -> `GET /api/matches/search?gotra=...&city=...`.

4. **Interests Tab**:
   - Sub-tabs: `Received`, `Sent`, `Accepted`, `Declined`.
   - Data Source: `GET /api/interests?type=received` (or sent/accepted/declined).
   - Actions:
     - Accept: `PUT /api/interests/:id/accept`
     - Decline: `PUT /api/interests/:id/decline`

5. **Profile Tab & Modals**:
   - Visitors Modal: `GET /api/visitors` (tracks deduplicated daily profile visitors).
   - Saved Modal: `GET /api/shortlist` (bookmarked profiles).
   - Blocked Modal: `GET /api/blocks` (blocked candidates).
   - View Bio Data / Download PDF: Uses `html2canvas` and `jsPDF` over the rendered profile element.
   - Logout: Clears `token`, `refreshToken`, `user`, `userProfile` from `localStorage` and navigates to `/welcome`.

6. **Candidate Profile Detail Screen (`ProfileDetailScreen.jsx`)**:
   - On Mount: Call `POST /api/visitors` with `{ targetProfileId }` to record the visit.
   - Shortlist button: `POST /api/shortlist` `{ targetProfileId }`.
   - Express Interest button: `POST /api/interests` `{ targetProfileId }`.

---

### 5.4 Admin Module & KYC Verification (`src/modules/admin/`)

1. **`AdminAuthContext.jsx`**:
   - Login: `POST /api/admin/auth/login` with `{ email, password }`.
   - Store `admin_token` and `admin_user` in `localStorage`.
   - Profile verification: `GET /api/admin/auth/profile`.
   - Logout: Clears `admin_token`, `admin_user` and redirects to `/admin/login`.

2. **`AdminDashboardPage.jsx`**:
   - `GET /api/admin/dashboard/kpis` (returns `totalUsers`, `activeUsers`, `pendingVerifications`, `dailyMatches`, `revenue`, `activeSubscriptions`).
   - `GET /api/admin/users?limit=5` -> Recent user registrations.
   - `GET /api/admin/verifications?status=Pending` -> Pending verifications preview.
   - `GET /api/admin/audit-logs?limit=4` -> Live audit stream.

3. **`ProfileVerificationPage.jsx` & `VerificationDetailPage.jsx`**:
   - Queue List: `GET /api/admin/verifications?status=...&docType=...&search=...`.
   - Verification Detail: `GET /api/admin/verifications/:id`.
   - Approve: `PUT /api/admin/verifications/:id/approve` `{ notes }`.
   - Reject: `PUT /api/admin/verifications/:id/reject` `{ reason, notes }`.

4. **`UserManagementPage.jsx` & `UserDetailPage.jsx`**:
   - Listing: `GET /api/admin/users?search=...&status=...&verification=...`.
   - Status update (Activate/Suspend): `PUT /api/admin/users/:userId/status` `{ status, reason }`.
   - Export CSV: `GET /api/admin/users/export/csv`.

5. **`ContentManagementPage.jsx`**:
   - Banners: `GET /api/admin/banners`, `POST /api/admin/banners`, `PUT /api/admin/banners/:id`, `DELETE /api/admin/banners/:id`.
   - Static Pages: `GET /api/admin/cms/pages`, `PUT /api/admin/cms/pages/:key`.

6. **`ComplaintManagementPage.jsx`**:
   - Listing: `GET /api/admin/complaints`.
   - Resolve: `PUT /api/admin/complaints/:id/resolve` `{ status, actionTaken, adminNotes }`.

7. **`AuditLogPage.jsx`**:
   - Listing: `GET /api/admin/audit-logs`.

---

## 6. Proposed Centralized Service Layer Specifications

Create `frontend/src/services/` with the following 9 modular API client files:

```
frontend/src/services/
├── api.js                   # Central fetch wrapper, JWT injection & error normalizer
├── authService.js           # Passwordless OTP auth, registration, tokens
├── profileService.js        # Candidate biodata CRUD, 18 Gotras, completion, photos
├── matchService.js          # Matches feed, today's matches, search, score
├── interestService.js       # Express, accept, decline, sent/received lists
├── socialService.js         # Shortlists, visitor tracking, blocking
├── paymentService.js        # Plans, Razorpay order creation & payment verification
├── verificationService.js   # User KYC document uploads & status
└── adminService.js          # Super Admin auth, KPIs, user moderation, KYC queue, CMS, audit
```

### 6.1 `src/services/api.js` (Core API Client)
```javascript
const BASE_URL = '/api'

export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    requiresAdmin = false,
    isFormData = false,
    ...customConfig
  } = options

  const token = requiresAdmin
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('token')

  const requestHeaders = {
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  if (!isFormData && body && typeof body === 'object') {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const config = {
    method,
    headers: requestHeaders,
    ...customConfig,
  }

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  let responseData = null

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json()
  } else {
    responseData = await response.text()
  }

  if (!response.ok) {
    const errorMsg = (responseData && (responseData.message || responseData.error))
      || `HTTP Error ${response.status}: ${response.statusText}`
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = responseData
    throw error
  }

  return responseData
}

export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
  upload: (url, formData, options = {}) => request(url, { ...options, method: 'POST', body: formData, isFormData: true }),
}
```

---

## 7. Implementation Roadmap & Integration Checklist

1. **Step 1 — Infrastructure & Client Setup**:
   - Update `frontend/vite.config.js` to add `/api` and `/uploads` reverse proxy to `http://localhost:5000`.
   - Create `src/services/` with `api.js`, `authService.js`, `profileService.js`, `matchService.js`, `interestService.js`, `socialService.js`, `paymentService.js`, `verificationService.js`, and `adminService.js`.
2. **Step 2 — User Authentication Integration**:
   - Wire `CreateAccountScreen.jsx` & `LoginScreen.jsx` to `authService.sendOtp(mobile)`.
   - Wire `OtpVerificationScreen.jsx` to `authService.verifyOtp(mobile, otp)` and `authService.register(...)`.
   - Store JWT tokens and user details in `localStorage`.
3. **Step 3 — Biodata & Relatives Persistence**:
   - Wire `ProfileCompletionDashboardScreen.jsx` to fetch `profileService.getMeProfile()`.
   - Wire Save/Next buttons to `profileService.createProfile()` or `profileService.updateProfile()`.
   - Wire Step 4 photo upload to `profileService.uploadProfilePhoto(file)` using multipart `FormData`.
   - Integrate `profileService.getCompletionScore()`.
4. **Step 4 — Discovery, Matching & Social Actions**:
   - Wire `DashboardScreen.jsx` to `profileService.getMeProfile()`, `matchService.getTodayMatches()`, `matchService.getMatches()`, `matchService.searchMatches()`.
   - Wire Shortlist heart icons to `socialService.addToShortlist()` / `removeFromShortlist()`.
   - Wire Interests tab to `interestService.getInterests()`, `interestService.acceptInterest()`, `interestService.declineInterest()`.
   - Wire `ProfileDetailScreen.jsx` to `socialService.recordVisit()`.
5. **Step 5 — Admin Subsystem Integration**:
   - Wire `AdminAuthContext.jsx` to `adminService.adminLogin()`.
   - Wire `AdminDashboardPage.jsx` to `adminService.getDashboardKPIs()`.
   - Wire `ProfileVerificationPage.jsx` & `VerificationDetailPage.jsx` to `adminService.getVerifications()`, `adminService.approveVerification()`, `adminService.rejectVerification()`.
   - Wire `UserManagementPage.jsx` to `adminService.getUsers()`, `adminService.updateUserStatus()`.
   - Wire `ContentManagementPage.jsx` and `AuditLogPage.jsx` to real backend endpoints.
6. **Step 6 — End-to-End Build & Validation**:
   - Run `npm run build` in `frontend/` to ensure zero compilation or bundling errors.
