# Full-Stack API Contract Specification & Reconciliation Analysis
**Platform**: Agrawal Matrimony Platform (`Vinita2323/AgrawalBiodata`)  
**Scope**: Complete Frontend (`frontend/src`) ↔ Backend REST API (`backend/`) Contract Mapping, Payload Schemas, Enums Reconciliation, and Service Layer Specification.

---

## 1. Executive Summary & Architecture Overview

The Agrawal Matrimony platform connects registered Vaishya/Agarwal community members through authentic 18 Gotra exogamy matchmaking, 3-generation family tree biodata, KYC document verification, and administrative governance.

### Standardized Response Envelope
All backend endpoints wrap responses in a canonical JSON envelope:
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
  code?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
```

### Authentication Token Contract
- **User JWT Access Token**: 15-minute validity, passed in `Authorization: Bearer <accessToken>` header. Contains payload `{ userId: string, mobile: string, role: 'user' }`.
- **User Refresh Token**: 7-day validity, passed in JSON body `{ refreshToken: string }` to rotate and obtain a new access/refresh token pair. Stored up to 5 concurrent sessions per user.
- **Admin JWT Token**: 24-hour validity, passed in `Authorization: Bearer <adminToken>` header. Contains payload `{ adminId: string, email: string, role: 'Super Admin' | 'Moderator' }`.

### Reverse Proxy Configuration
`frontend/vite.config.js` configures reverse proxies for development:
- `/api` → `http://localhost:5000/api`
- `/uploads` → `http://localhost:5000/uploads`

---

## 2. Screen-to-Backend REST Endpoint Mapping Matrix

### 2.1 User Module Screens

| Screen / Component | Route / Path | HTTP Verb | Backend REST Endpoint | Auth Scope | Primary Purpose |
|---|---|---|---|---|---|
| `AuthLandingScreen.jsx` | `/welcome`, `/auth-landing`, `/` | `GET` | `/api/cms/banners`<br>`GET /api/gotras` | Public | Public landing, showcase banners and authentic 18 Gotras reference. |
| `LoginScreen.jsx` | `/login`, `/auth` | `POST` | `/api/auth/send-otp` | Public | Request 6-digit OTP for login with rate limiting & cooldown. |
| `CreateAccountScreen.jsx` | `/create-account`, `/register` | `POST` | `/api/auth/send-otp` | Public | Send OTP before registering new user. |
| `OtpVerificationScreen.jsx` | `/otp-verification` | `POST`<br>`POST` | `/api/auth/verify-otp`<br>`POST /api/auth/register` | Public | Verify OTP code; execute registration if `isNewUser: true`. |
| `AccountCreatedScreen.jsx` | `/account-created` | `GET` | `/api/auth/me` | User JWT | Fetch user session and proceed to biodata onboarding. |
| `ProfileCompletionDashboardScreen.jsx` (Step 1: Personal & Gotra) | `/profile-completion-dashboard` | `POST`<br>`PUT` | `/api/profiles`<br>`PUT /api/profiles/:profileId` | User JWT | Persist personal details, authentic 18 Gotras, birth info, physical metrics. |
| `ProfileCompletionDashboardScreen.jsx` (Step 2: Family Tree) | `/profile-completion-dashboard` | `PUT` | `/api/profiles/:profileId` | User JWT | Persist grandparents, parents, and dynamic brother, sister, tauji, chacha, buaji lists. |
| `ProfileCompletionDashboardScreen.jsx` (Step 3: Maternal & Contact) | `/profile-completion-dashboard` | `PUT` | `/api/profiles/:profileId` | User JWT | Persist mamajiList, residential address, and phone number. |
| `ProfileCompletionDashboardScreen.jsx` (Step 4: Photo Upload) | `/profile-completion-dashboard` | `POST` | `/api/profiles/me/photo`<br>`POST /api/profiles/:profileId/photo` | User JWT | Upload multipart image file (`photo`) to `/uploads/profiles/`. |
| `ProfileCompletionDashboardScreen.jsx` (Completion Score) | `/profile-completion-dashboard` | `GET` | `/api/profiles/me/completion` | User JWT | Calculate real-time 5-section completion score breakdown. |
| `DashboardScreen.jsx` (Home Tab) | `/home`, `/dashboard` | `GET`<br>`GET`<br>`GET`<br>`GET` | `/api/profiles/me`<br>`GET /api/matches/today`<br>`GET /api/cms/banners`<br>`GET /api/visitors/count` | User JWT | Active profile details, top daily recommendation carousel, hero banners, visitor stats. |
| `DashboardScreen.jsx` (Matches Tab) | `/matches` | `GET` | `/api/matches` | User JWT | Paginated candidate matches with 6-factor Gotra compatibility scoring. |
| `DashboardScreen.jsx` (Search Tab) | `/search` | `GET` | `/api/matches/search` | User JWT | Multi-field search (keyword, gotra, city, age bounds, education, occupation). |
| `DashboardScreen.jsx` (Interests Tab) | `/interests` | `GET`<br>`PUT`<br>`PUT`<br>`PUT` | `/api/interests`<br>`PUT /api/interests/:id/accept`<br>`PUT /api/interests/:id/decline`<br>`PUT /api/interests/:id/cancel` | User JWT | Manage sent and received interest requests with accept/decline actions. |
| `DashboardScreen.jsx` (Messages Tab) | `/chat`, `/messages` | `GET` | `/api/interests?status=Accepted` | User JWT | Connected candidate list (unlocked upon mutual interest acceptance). |
| `DashboardScreen.jsx` (Profile / Biodata PDF Tab) | `/profile` | `GET`<br>`GET`<br>`POST`<br>`PUT` | `/api/profiles/me`<br>`GET /api/profiles/my-profiles`<br>`POST /api/profiles/switch-active`<br>`PUT /api/profiles/:profileId` | User JWT | Active profile biodata view, PDF download, multi-profile list and switcher. |
| `DashboardScreen.jsx` (Shortlist Modal) | Modal in Dashboard | `GET`<br>`POST`<br>`DELETE` | `/api/shortlist`<br>`POST /api/shortlist`<br>`DELETE /api/shortlist/:targetProfileId` | User JWT | View bookmarked profiles, add or remove candidates from shortlist. |
| `DashboardScreen.jsx` (Visitors Modal) | Modal in Dashboard | `GET`<br>`GET` | `/api/visitors`<br>`GET /api/visitors/count` | User JWT | Deduplicated daily visitor log and total/weekly metrics. |
| `DashboardScreen.jsx` (Blocked Users Modal) | Modal in Dashboard | `GET`<br>`POST`<br>`DELETE` | `/api/blocks`<br>`POST /api/blocks`<br>`DELETE /api/blocks/:targetProfileId` | User JWT | View blocked candidates, block or unblock candidate profiles. |
| `ProfileDetailScreen.jsx` | `/profile-detail` | `GET`<br>`POST`<br>`GET`<br>`POST`<br>`GET`<br>`POST`<br>`DELETE` | `/api/profiles/:profileId`<br>`POST /api/visitors`<br>`GET /api/interests/status/:targetProfileId`<br>`POST /api/interests`<br>`GET /api/matches/score/:targetProfileId`<br>`POST /api/shortlist`<br>`DELETE /api/shortlist/:targetProfileId` | User JWT (Optional Auth on profile view) | Full biodata inspection, privacy masking, compatibility breakdown, express interest, record visitor. |
| `MembershipScreen.jsx` | `/membership`, `/premium` | `GET` | `/api/plans` | Public / User JWT | Active subscription plans (Gold Monthly, Quarterly, Annual, Platinum, Diamond). |
| `PaymentScreen.jsx` | `/payment` | `POST`<br>`POST` | `/api/payments/create-order`<br>`POST /api/payments/verify` | User JWT | Create Razorpay order (`keyId`, `orderId`) and verify cryptographic payment signature. |
| `SettingsScreen.jsx` | `/settings` | `POST` | `/api/auth/logout` | User JWT | Logout user session and revoke refresh token. |
| `AccountSettingsScreen.jsx` | `/account` | `GET`<br>`PUT`<br>`DELETE` | `/api/auth/me`<br>`PUT /api/profiles/:profileId`<br>`DELETE /api/profiles/:profileId` | User JWT | Manage account phone, email, privacy visibility levels, and profile deletion. |
| `BlockedUsersScreen.jsx` | `/blocked` | `GET`<br>`DELETE` | `/api/blocks`<br>`DELETE /api/blocks/:targetUserId` | User JWT | Dedicated blocked user list with one-click unblock. |
| `AboutMatrimonyHubScreen.jsx` | `/about` | `GET` | `/api/cms/pages/about-us` | Public | About Us content and community history. |
| `TermsOfServiceScreen.jsx` | `/terms` | `GET` | `/api/cms/pages/terms-of-service` | Public | Platform terms of service and community rules. |
| `PrivacyPolicyScreen.jsx` | `/privacy` | `GET` | `/api/cms/pages/privacy-policy` | Public | Privacy policy and data protection terms. |
| `CommunityGuidelinesScreen.jsx` | `/guidelines` | `GET` | `/api/cms/pages/community-guidelines` | Public | Vaishya and Agarwal matrimonial conduct guidelines. |
| `HelpSupportScreen.jsx` | `/help-support`, `/help` | `GET`<br>`GET`<br>`POST` | `/api/cms/pages/contact-us`<br>`GET /api/cms/pages/faqs`<br>`POST /api/complaints` | Public / User JWT | Helpline, FAQs, and ticket/complaint submission. |

---

### 2.2 Admin Module Screens

| Screen / Component | Route / Path | HTTP Verb | Backend REST Endpoint | Auth Scope | Primary Purpose |
|---|---|---|---|---|---|
| `AdminLoginPage.jsx` | `/admin/login` | `POST` | `/api/admin/auth/login` | Public | Super Admin & Moderator credential login (`email`, `password`). |
| `AdminDashboardPage.jsx` | `/admin/dashboard` | `GET`<br>`GET`<br>`GET`<br>`GET` | `/api/admin/dashboard/kpis`<br>`GET /api/admin/users?limit=5`<br>`GET /api/admin/verifications?status=Pending&limit=5`<br>`GET /api/admin/audit-logs?limit=4` | Admin JWT | Aggregated real-time KPIs, recent registrations, pending KYC queue, audit log widget. |
| `UserManagementPage.jsx` | `/admin/users` | `GET`<br>`GET`<br>`PUT` | `/api/admin/users`<br>`GET /api/admin/users/export/csv`<br>`PUT /api/admin/users/:userId/status` | Admin JWT | Search, filter, inspect users, toggle `Active` / `Suspended`, export CSV. |
| `UserDetailPage.jsx` | `/admin/users/:userId` | `GET`<br>`PUT` | `/api/admin/users/:userId`<br>`PUT /api/admin/users/:userId/status` | Admin JWT | Deep inspection of user, candidate profiles, subscriptions, verification docs, payments, complaints. |
| `ProfileVerificationPage.jsx` | `/admin/profile-verification` | `GET` | `/api/admin/verifications` | Admin JWT | Paginated KYC verification queue with status tabs (`Pending`, `Approved`, `Rejected`). |
| `VerificationDetailPage.jsx` | `/admin/profile-verification/:verificationId` | `GET`<br>`PUT`<br>`PUT` | `/api/admin/verifications/:id`<br>`PUT /api/admin/verifications/:id/approve`<br>`PUT /api/admin/verifications/:id/reject` | Admin JWT | Side-by-side inspection of Govt ID & Professional docs; one-click approval (auto-syncing candidate profile badge) or categorized rejection. |
| `MatchManagementPage.jsx` | `/admin/matches` | `GET`<br>`PUT` | `/api/admin/users`<br>`PUT /api/profiles/:profileId` | Admin JWT | Candidate featured profile status toggle and match parameters. |
| `SubscriptionManagementPage.jsx` | `/admin/subscriptions` | `GET`<br>`POST`<br>`PUT`<br>`DELETE` | `/api/plans`<br>`POST /api/plans`<br>`PUT /api/plans/:id`<br>`DELETE /api/plans/:id` | Admin JWT | Subscription plan tier CRUD (Gold, Platinum, Diamond, pricing, benefit limits). |
| `PaymentManagementPage.jsx` | `/admin/payments` | `GET` | `/api/payments/admin/all` | Admin JWT | Platform payment ledger with Razorpay transaction IDs, status, and filters. |
| `ComplaintManagementPage.jsx` | `/admin/complaints` | `GET`<br>`GET`<br>`PUT`<br>`GET` | `/api/admin/complaints`<br>`GET /api/admin/complaints/:id`<br>`PUT /api/admin/complaints/:id/resolve`<br>`GET /api/blocks/admin/all` | Admin JWT | Abuse queue, report investigation, resolution (suspend, warn, dismiss), block history. |
| `ContentManagementPage.jsx` | `/admin/cms`, `/admin/content` | `GET`<br>`POST`<br>`PUT`<br>`DELETE`<br>`GET`<br>`PUT` | `/api/admin/banners`<br>`POST /api/admin/banners`<br>`PUT /api/admin/banners/:id`<br>`DELETE /api/admin/banners/:id`<br>`GET /api/admin/cms/pages`<br>`PUT /api/admin/cms/pages/:key` | Admin JWT | Hero banner carousel manager and static page content CMS editor. |
| `LegalManagementPage.jsx` | `/admin/legal` | `GET`<br>`PUT` | `/api/cms/pages`<br>`PUT /api/admin/cms/pages/:key` | Admin JWT | Edit Terms of Service, Privacy Policy, Community Guidelines, and FAQs. |
| `NotificationsPage.jsx` | `/admin/notifications` | `GET` | `/api/admin/dashboard/metrics` | Admin JWT | System operational alerts, pending queue badges. |
| `AdminSettingsPage.jsx` | `/admin/settings` | `GET`<br>`PUT`<br>`PUT`<br>`PUT` | `/api/admin/auth/profile`<br>`PUT /api/admin/auth/password`<br>`PUT /api/admin/auth/profile`<br>`PUT /api/admin/auth/preferences` | Admin JWT | Admin profile details, password change, notification preferences, dark/light theme. |
| `AuditLogPage.jsx` | `/admin/audit-logs` | `GET`<br>`GET` | `/api/admin/audit-logs`<br>`GET /api/admin/audit-logs/:id` | Admin JWT | Immutable administrative audit trail search and details inspection. |

---

## 3. Payload Structures & Data Contract Schemas

### 3.1 Authentication

#### 1. Send OTP (`POST /api/auth/send-otp`)
- **Request Body**:
  ```json
  {
    "mobile": "9876543210"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "data": {
      "mobile": "9876543210",
      "expiresInSeconds": 300,
      "cooldownSeconds": 30,
      "otp": "123456" // In development mode
    }
  }
  ```

#### 2. Verify OTP (`POST /api/auth/verify-otp`)
- **Request Body**:
  ```json
  {
    "mobile": "9876543210",
    "otp": "123456"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "isNewUser": false,
      "user": {
        "id": "66bc8...",
        "name": "Rajesh Agrawal",
        "mobile": "9876543210",
        "email": "rajesh@example.com",
        "accountStatus": "Active",
        "verificationStatus": "Approved",
        "subscriptionPlan": "Free Tier",
        "subscriptionStatus": "Active",
        "activeProfileId": "66bc8..."
      }
    }
  }
  ```

#### 3. Register (`POST /api/auth/register`)
- **Request Body**:
  ```json
  {
    "fullName": "Amit Agrawal",
    "gender": "Male",
    "dob": "1996-05-15",
    "mobile": "9876543210",
    "email": "amit@example.com",
    "createdFor": "Myself"
  }
  ```
- **Response (201 Created)**: Returns `{ accessToken, refreshToken, user: { ... } }`.

#### 4. Refresh Token (`POST /api/auth/refresh-token`)
- **Request Body**: `{ "refreshToken": "eyJhbGciOi..." }`
- **Response (200 OK)**: `{ "accessToken": "...", "refreshToken": "..." }`

#### 5. Logout (`POST /api/auth/logout`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**: `{ "refreshToken": "..." }` (optional, clears all user tokens if omitted)
- **Response (200 OK)**: `{ "success": true, "message": "Logged out successfully" }`

---

### 3.2 Candidate Profile Biodata & Relatives

#### 1. Create Profile (`POST /api/profiles`) / Update Profile (`PUT /api/profiles/:profileId`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "profileFor": "Self",
    "fullName": "Priya Garg",
    "gender": "Female",
    "dob": "1998-05-14",
    "tob": "08:30 AM",
    "pob": "Jaipur, Rajasthan",
    "height": "5'4\"",
    "complexion": "Fair",
    "maritalStatus": "Never Married",
    "bloodGroup": "B+",
    "diet": "Vegetarian",
    "hobbies": ["Classical Dance", "Reading", "Travelling"],
    "bio": "Dedicated software engineer grounded in traditional family values.",
    
    "gotra": "Garg",
    "motherGotra": "Bansal",
    "manglik": "Non-Manglik",
    "rashi": "Taurus",
    "nakshatra": "Rohini",
    
    "qualification": "M.Tech, Software Engineer",
    "educationLevel": "Postgraduate",
    "workingAt": "TCS Digital",
    "occupation": "Software Engineer",
    "occupationType": "Private Job",
    "income": "15-20 LPA",
    
    "grandfather": "Late Sh. Ramcharan Garg",
    "grandmother": "Smt. Shanti Devi",
    "maternalGrandfather": "Late Sh. Hariprasad Bansal",
    "maternalGrandgrandmother": "Smt. Bhagwati Devi",
    "father": "Sh. Rameshwar Garg",
    "fatherOccupation": "Business",
    "fatherOccupationDetails": "Owner, Garg Textile Mills",
    "mother": "Smt. Sunita Garg",
    "motherOccupation": "Homemaker",
    "familyType": "Joint",
    "familyValues": "Traditional",
    "familyOrigin": "Jaipur, Rajasthan",
    
    "brotherList": [
      {
        "name": "Aman Garg",
        "relationType": "Brother",
        "status": "Married",
        "spouseName": "Pooja Garg",
        "homePlace": "Delhi",
        "occupation": "CA"
      }
    ],
    "sisterList": [
      {
        "name": "Neha Garg",
        "relationType": "Sister",
        "status": "Married",
        "spouseName": "Rahul Agrawal",
        "homePlace": "Indore",
        "occupation": "Teacher"
      }
    ],
    "taujiList": [
      {
        "name": "Sh. Suresh Garg",
        "relationType": "Tauji",
        "status": "Married",
        "spouseName": "Smt. Anita Garg",
        "homePlace": "Jaipur",
        "occupation": "Business"
      }
    ],
    "chachaList": [
      {
        "name": "Sh. Dinesh Garg",
        "relationType": "Chacha",
        "status": "Married",
        "spouseName": "Smt. Meena Garg",
        "homePlace": "Ahmedabad",
        "occupation": "Govt Job"
      }
    ],
    "buajiList": [
      {
        "name": "Smt. Rekha Agrawal",
        "relationType": "Buaji",
        "status": "Married",
        "spouseName": "Sh. Mohan Agrawal",
        "homePlace": "Udaipur",
        "occupation": "Homemaker"
      }
    ],
    "mamajiList": [
      {
        "name": "Sh. Vijay Bansal",
        "relationType": "Mamaji",
        "status": "Married",
        "spouseName": "Smt. Geeta Bansal",
        "homePlace": "Kota",
        "occupation": "Doctor"
      }
    ],
    
    "residentialAddress": "104, Agrasen Nagar, Gopalpura Bypass, Jaipur, Rajasthan",
    "city": "Jaipur",
    "state": "Rajasthan",
    "mobileNumber": "+91 98290 12345",
    "privacySettings": {
      "phoneVisibility": "Connected Members Only",
      "addressVisibility": "Connected Members Only",
      "photoVisibility": "Visible to All"
    }
  }
  ```
- **Response (200 OK / 201 Created)**:
  ```json
  {
    "success": true,
    "message": "Candidate profile saved successfully",
    "data": {
      "profile": {
        "id": "66bcf8a2...",
        "profileId": "PRF-501234",
        "fullName": "Priya Garg",
        "gotra": "Garg",
        "completionPercentage": 100,
        "verified": false
      },
      "completionPercentage": 100,
      "breakdown": {
        "personal": 25,
        "astrology": 15,
        "education": 20,
        "family": 25,
        "media": 15
      }
    }
  }
  ```

#### 2. Photo Upload (`POST /api/profiles/me/photo` or `POST /api/profiles/:profileId/photo`)
- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Body**: Form-data with field key `photo` containing image binary (`.jpg`, `.png`, `.webp`, max 5MB).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile photo uploaded successfully",
    "data": {
      "url": "/uploads/profiles/profile-1723632900000-abc1234.jpg",
      "profilePicture": "/uploads/profiles/profile-1723632900000-abc1234.jpg",
      "completionPercentage": 100,
      "breakdown": { ... }
    }
  }
  ```

#### 3. Profile Completion Calculation (`GET /api/profiles/me/completion`)
- **Weights Formula**:
  - Section 1 (Personal Details): 25% (Name 5%, Gender 5%, DOB 5%, Gotra 5%, Height/Complexion 5%)
  - Section 2 (Astrology & Horoscope): 15% (TOB 4%, POB 4%, Mother's Gotra 4%, Manglik 3%)
  - Section 3 (Education & Career): 20% (Qualification 8%, Occupation/Work 7%, Income 5%)
  - Section 4 (Family Tree & Relatives): 25% (Father 4%, Father Occ 4%, Mother 5%, Grandparents 4%, Relatives 8%)
  - Section 5 (Media & Contact): 15% (Profile Photo 10%, Address/City 2.5%, Mobile 2.5%)
  - Total = 100%

---

### 3.3 Matches & 6-Factor Compatibility Scoring Engine

#### 1. Match Discovery (`GET /api/matches`, `GET /api/matches/today`, `GET /api/matches/search`)
- **Query Parameters**:
  - `page`, `limit`
  - `gotra`: Filter specific Agarwal gotra
  - `city`, `state`: Geographic proximity
  - `minAge`, `maxAge`: Computed against `dob`
  - `manglik`: `Non-Manglik`, `Manglik`, `Anshik Manglik`, `Don't Know`
  - `education`, `occupation`: Degree or job keyword
  - `excludeSagotra`: `true` | `false` (removes 0-score Sagotra paternal conflicts)
  - `minScore`: Minimum compatibility score threshold (0-100)
  - `sort`: `score` | `recent` | `age`

#### 2. 6-Factor Compatibility Scoring Breakdown:
1. **Gotra Exogamy (30%)**:
   - Paternal Sagotra Collision: `0 pts` + `isSagotra: true` flag (Traditional Hindu marriage forbidden).
   - Maternal Gotra Overlap: `15 pts` (50% penalty for 2-Gotra conflict).
   - Clean Distinct Gotras: `30 pts` (Fully compatible).
2. **Age Alignment (20%)**:
   - Gap ≤ 2 yrs: `20 pts`
   - Gap ≤ 4 yrs: `15 pts`
   - Gap ≤ 6 yrs: `10 pts`
   - Gap ≤ 8 yrs: `5 pts`
   - Gap > 8 yrs: `0 pts`
3. **Education Tier (15%)**:
   - Tier 1: Doctorate / PhD / MD
   - Tier 2: Postgraduate / Master / Professional (CA, MBA, M.Tech, MS)
   - Tier 3: Graduate / Bachelor (B.Tech, MBBS, B.Com, B.Sc)
   - Tier 4: Diploma / Higher Secondary
   - Same Tier: `15 pts`, Adjacent Tier (Diff = 1): `10 pts`, Diverse: `5 pts`.
4. **Location Proximity (15%)**:
   - Same City: `15 pts`, Same State: `10 pts`, Different State: `5 pts`.
5. **Income Bracket (10%)**:
   - Same Bracket: `10 pts`, Adjacent Bracket: `7 pts`, Diverse: `4 pts`.
6. **Manglik Astrological Alignment (10%)**:
   - Both Non-Manglik / Both Manglik / Both Anshik: `10 pts` (Harmonious / Dosha neutralized).
   - Anshik with Non-Manglik or Manglik / Don't Know: `6 pts`.
   - Manglik vs Non-Manglik conflict: `0 pts`.

- **Score API Response (`GET /api/matches/score/:targetProfileId`)**:
  ```json
  {
    "success": true,
    "message": "Match score calculated successfully",
    "data": {
      "targetProfileId": "PRF-501",
      "totalScore": 92,
      "isSagotra": false,
      "hasMaternalConflict": false,
      "breakdown": {
        "gotra": { "score": 30, "maxScore": 30, "details": "Distinct Paternal and Maternal Gotras (Garg vs Bansal)." },
        "age": { "score": 20, "maxScore": 20, "details": "Age gap: 2 years (28 vs 26)." },
        "education": { "score": 15, "maxScore": 15, "details": "Matching educational tier." },
        "location": { "score": 15, "maxScore": 15, "details": "Same city (Jaipur)." },
        "income": { "score": 7, "maxScore": 10, "details": "Adjacent/compatible income brackets." },
        "manglik": { "score": 10, "maxScore": 10, "details": "Both Non-Manglik. Astrologically compatible." }
      }
    }
  }
  ```

---

### 3.4 Social Interactivity: Interests, Shortlists, Visitors, Blocks

#### 1. Express Interest (`POST /api/interests`)
- **Body**: `{ "recipientProfileId": "66bc8..." | "PRF-502", "message": "Namaste, we liked your profile." }`
- **Auto-Accept Mutual Match**: If reverse interest is already pending, backend automatically transitions status to `Accepted` and unlocks contact details.

#### 2. Update Interest Status (`PUT /api/interests/:id/accept`, `PUT /api/interests/:id/decline`, `PUT /api/interests/:id/cancel`)
- Status values: `Pending`, `Accepted`, `Declined`, `Cancelled`.

#### 3. Shortlist (`POST /api/shortlist`, `DELETE /api/shortlist/:targetProfileId`, `GET /api/shortlist`)
- **Body on Add**: `{ "shortlistedProfileId": "66bc8..." | "PRF-502", "notes": "Great family background" }`

#### 4. Visitor Tracking (`POST /api/visitors`, `GET /api/visitors`, `GET /api/visitors/count`)
- Daily deduplication ensures viewing a profile multiple times in one day increments count on the unique daily UTC record.

#### 5. User Blocking (`POST /api/blocks`, `DELETE /api/blocks/:targetUserId`, `GET /api/blocks`)
- Blocks candidate bidirectionally. Automatically cancels pending interests and strips shortlist bookmarks.

---

### 3.5 Admin Operations, KYC Queue & CMS

#### 1. Admin Login (`POST /api/admin/auth/login`)
- **Body**: `{ "email": "admin@matrimonyhub.com", "password": "admin123" }`
- **Response (200 OK)**: `{ "accessToken": "...", "admin": { "adminId": "...", "email": "...", "role": "Super Admin" } }`

#### 2. Dashboard KPIs (`GET /api/admin/dashboard/kpis`)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "kpis": {
        "totalUsers": 1240,
        "activeUsers": 1180,
        "suspendedUsers": 60,
        "pendingVerifications": 14,
        "totalCandidateProfiles": 1520,
        "verifiedProfiles": 890,
        "totalRevenue": 485000,
        "activeSubscriptions": 430,
        "pendingComplaints": 3
      }
    }
  }
  ```

#### 3. KYC Verification Approve / Reject
- **Approve (`PUT /api/admin/verifications/:id/approve`)**:
  - Sets `Verification.status = 'Approved'`, `User.verificationStatus = 'Approved'`.
  - Auto-synchronizes candidate profile badge: `Profile.verified = true` for all candidate profiles owned by that user.
  - Generates immutable audit trail record.
- **Reject (`PUT /api/admin/verifications/:id/reject`)**:
  - Body: `{ "reason": "Blurred document", "category": "Blurred / Unreadable Document", "notes": "..." }`
  - Sets `Verification.status = 'Rejected'`, `User.verificationStatus = 'Rejected'`.

---

## 4. Full-Stack Field, Type & Enum Discrepancy Reconciliation

| Category | Frontend Current Value | Backend Canonical Schema | Reconciled Contract & Fix Required |
|---|---|---|---|
| **18 Gotras Names** | Bilingual strings: `"गर्ग (Garg)"`, `"गोयल (Goyal)"`, `"मधुकल (Madhukul)"`, `"नागल (Nagal)"`, etc. | Canonical English: `'Garg'`, `'Goyal'`, `'Bansal'`, `'Bindal'`, `'Mittal'`, `'Singhal'`, `'Jindal'`, `'Tingal'`, `'Tayal'`, `'Airan'`, `'Dharan'`, `'Madhukul'`, `'Goyan'`, `'Kuchhal'`, `'Kansal'`, `'Nangal'`, `'Mangal'`, `'Bhandal'` | Frontend selects can display bilingual labels but send canonical English values, or API normalizer automatically parses bilingual text via `backend/utils/gotras.js`. |
| **Manglik Status** | Select options: `"Yes"`, `"No"`, `"Don't Know"` | Enum: `'Non-Manglik'`, `'Manglik'`, `'Anshik Manglik'`, `"Don't Know"` | Transform `"Yes"` → `'Manglik'`, `"No"` → `'Non-Manglik'`. |
| **Profile Photo Upload** | Base64 Data URL in `formData.profilePicture` | Multer `multipart/form-data` with field key `'photo'` | Frontend `photo-upload` input appends `File` object to `FormData` under key `'photo'` and posts to `POST /api/profiles/me/photo`. |
| **Profile Image Field Name** | `p.image` in mock data vs `p.profilePicture` | `profilePicture` (plus virtual `galleryPhotos` alias) | Frontend component accessors standardized to `profile.profilePicture \|\| profile.image`. |
| **Mother Gotra Field Name** | In some UI components referred to as `subGotra` | Schema field: `motherGotra` | Standardized to `motherGotra`. |
| **Sibling Lists** | Array in `localStorage`: `brotherList`, `sisterList`, etc. | Subdocument array of `relativeSchema` | Exact match on subdocument fields `{ name, relationType, status, spouseName, homePlace, occupation }`. |
| **Admin KYC Approve** | Mutates mock state in `adminDataService.js` | `PUT /api/admin/verifications/:id/approve` | Replaced mock methods with real async HTTP calls to backend REST API. |
| **Razorpay Checkout** | Simulated 2-second timeout in `PaymentScreen.jsx` | `POST /api/payments/create-order` + `POST /api/payments/verify` | Integrated real Razorpay SDK / API verification flow. |
| **Subscription Pricing Fields** | `priceMonthly`, `priceYearly` in UI mock | `monthlyPrice`, `yearlyPrice` in `Plan.js` schema | Updated frontend plan display and payment checkout payload to match `monthlyPrice` and `yearlyPrice`. |

---

## 5. API Client Layer Architecture & Specification

### 5.1 Architecture Diagram
```
[ Frontend Components / Pages / Admin Layout ]
                     │
                     ▼
       [ Modular Service Modules ]
  (authService, profileService, matchService,
   interestService, socialService, paymentService,
   verificationService, cmsService, adminService)
                     │
                     ▼
         [ Central api.js Client ]
  - Axios / Fetch instance (baseURL: '/api')
  - Request Interceptor: Injects 'Authorization: Bearer <token>'
  - Response Interceptor: Unwraps response envelope & normalizes errors
  - 401 Interceptor: Automatically attempts refresh-token rotation
                     │
                     ▼
      [ Vite Reverse Proxy (:5173) ]
  - Forward /api/*     -> http://localhost:5000/api/*
  - Forward /uploads/* -> http://localhost:5000/uploads/*
                     │
                     ▼
       [ Backend Express REST API ]
```

### 5.2 Central API Client (`frontend/src/services/api.js`)
- Base URL configured to `/api` (works seamlessly in Vite development proxy and production reverse proxy).
- Standardized request wrapper supporting JSON payloads and multipart `FormData`.
- Automatically retrieves `accessToken` from `localStorage.getItem('token')` or `admin_token`.
- Automatically catches 401 Unauthorized responses, executes `POST /api/auth/refresh-token`, updates stored access token, and retries the original request.
- Central error normalization extracting `error.response?.data?.message || error.response?.data?.error || error.message`.

### 5.3 Modular Service Files Specification

1. **`authService.js`**:
   - `sendOtp(mobile: string)`: `POST /api/auth/send-otp`
   - `verifyOtp(mobile: string, otp: string)`: `POST /api/auth/verify-otp`
   - `register(userData: object)`: `POST /api/auth/register`
   - `refreshToken(refreshToken: string)`: `POST /api/auth/refresh-token`
   - `logout(refreshToken?: string)`: `POST /api/auth/logout`
   - `getMe()`: `GET /api/auth/me`

2. **`profileService.js`**:
   - `getMeProfile()`: `GET /api/profiles/me`
   - `createProfile(profileData: object)`: `POST /api/profiles`
   - `updateProfile(profileId: string, profileData: object)`: `PUT /api/profiles/${profileId}`
   - `deleteProfile(profileId: string)`: `DELETE /api/profiles/${profileId}`
   - `getUserProfiles()`: `GET /api/profiles/my-profiles`
   - `switchActiveProfile(profileId: string)`: `POST /api/profiles/switch-active`
   - `getProfileById(profileId: string)`: `GET /api/profiles/${profileId}`
   - `uploadProfilePhoto(file: File, profileId?: string)`: `POST /api/profiles/${profileId || 'me'}/photo` (`multipart/form-data`)
   - `uploadGalleryPhoto(file: File, caption?: string, isPrimary?: boolean, profileId?: string)`: `POST /api/profiles/${profileId || 'me'}/gallery`
   - `deleteGalleryPhoto(photoId: string, profileId?: string)`: `DELETE /api/profiles/${profileId || 'me'}/gallery/${photoId}`
   - `getCompletionScore(profileId?: string)`: `GET /api/profiles/${profileId || 'me'}/completion`
   - `getGotras()`: `GET /api/gotras`

3. **`matchService.js`**:
   - `getMatches(filters: object)`: `GET /api/matches`
   - `getTodayMatches(limit?: number)`: `GET /api/matches/today`
   - `searchMatches(queryParams: object)`: `GET /api/matches/search`
   - `getMatchScore(targetProfileId: string)`: `GET /api/matches/score/${targetProfileId}`

4. **`interestService.js`**:
   - `expressInterest(recipientProfileId: string, message?: string)`: `POST /api/interests`
   - `getInterests(type: 'all' | 'received' | 'sent', status?: string, page?: number, limit?: number)`: `GET /api/interests`
   - `acceptInterest(interestId: string)`: `PUT /api/interests/${interestId}/accept`
   - `declineInterest(interestId: string)`: `PUT /api/interests/${interestId}/decline`
   - `cancelInterest(interestId: string)`: `PUT /api/interests/${interestId}/cancel`
   - `getInterestStatus(targetProfileId: string)`: `GET /api/interests/status/${targetProfileId}`

5. **`socialService.js`**:
   - `getShortlists(page?: number, limit?: number)`: `GET /api/shortlist`
   - `addToShortlist(shortlistedProfileId: string, notes?: string)`: `POST /api/shortlist`
   - `removeFromShortlist(targetProfileId: string)`: `DELETE /api/shortlist/${targetProfileId}`
   - `checkShortlistStatus(targetProfileId: string)`: `GET /api/shortlist/check/${targetProfileId}`
   - `recordVisit(visitedProfileId: string)`: `POST /api/visitors`
   - `getVisitors(page?: number, limit?: number)`: `GET /api/visitors`
   - `getVisitorMetrics()`: `GET /api/visitors/count`
   - `getBlockedProfiles(page?: number, limit?: number)`: `GET /api/blocks`
   - `blockProfile(targetProfileId: string, reason?: string, notes?: string)`: `POST /api/blocks`
   - `unblockProfile(targetProfileId: string)`: `DELETE /api/blocks/${targetProfileId}`
   - `checkBlockStatus(targetProfileId: string)`: `GET /api/blocks/check/${targetProfileId}`

6. **`paymentService.js`**:
   - `getPlans()`: `GET /api/plans`
   - `getPlanById(id: string)`: `GET /api/plans/${id}`
   - `createOrder(planId: string, billingCycle?: string)`: `POST /api/payments/create-order`
   - `verifyPayment(payload: { orderId: string, paymentId: string, signature: string })`: `POST /api/payments/verify`
   - `getPaymentHistory(page?: number, limit?: number)`: `GET /api/payments/history`

7. **`verificationService.js`**:
   - `submitVerification(formData: FormData)`: `POST /api/verification/submit` (`multipart/form-data`)
   - `getVerificationStatus()`: `GET /api/verification/status`
   - `getMySubmissions()`: `GET /api/verification/my-submissions`

8. **`cmsService.js`**:
   - `getAllPages()`: `GET /api/cms/pages`
   - `getPageByKey(key: string)`: `GET /api/cms/pages/${key}`
   - `getActiveBanners()`: `GET /api/cms/banners`

9. **`adminService.js`**:
   - `adminLogin(credentials: { email, password })`: `POST /api/admin/auth/login`
   - `getAdminProfile()`: `GET /api/admin/auth/profile`
   - `updateAdminPassword(payload: { currentPassword, newPassword })`: `PUT /api/admin/auth/password`
   - `updateAdminProfile(payload: { name, email })`: `PUT /api/admin/auth/profile`
   - `getDashboardKPIs()`: `GET /api/admin/dashboard/kpis`
   - `getUsers(params: object)`: `GET /api/admin/users`
   - `getUserById(userId: string)`: `GET /api/admin/users/${userId}`
   - `updateUserStatus(userId: string, payload: { status: 'Active' | 'Suspended', reason?: string })`: `PUT /api/admin/users/${userId}/status`
   - `getAdminVerifications(params: object)`: `GET /api/admin/verifications`
   - `getAdminVerificationById(id: string)`: `GET /api/admin/verifications/${id}`
   - `approveVerification(id: string, notes?: string)`: `PUT /api/admin/verifications/${id}/approve`
   - `rejectVerification(id: string, payload: { reason: string, category?: string, notes?: string })`: `PUT /api/admin/verifications/${id}/reject`
   - `getAdminPayments(params: object)`: `GET /api/payments/admin/all`
   - `getAdminComplaints(params: object)`: `GET /api/admin/complaints`
   - `getAdminComplaintById(id: string)`: `GET /api/admin/complaints/${id}`
   - `resolveComplaint(id: string, payload: object)`: `PUT /api/admin/complaints/${id}/resolve`
   - `getAdminPages()`: `GET /api/admin/cms/pages`
   - `updateAdminPage(key: string, payload: object)`: `PUT /api/admin/cms/pages/${key}`
   - `getAdminBanners()`: `GET /api/admin/banners`
   - `createBanner(payload: object)`: `POST /api/admin/banners`
   - `updateBanner(id: string, payload: object)`: `PUT /api/admin/banners/${id}`
   - `deleteBanner(id: string)`: `DELETE /api/admin/banners/${id}`
   - `getAuditLogs(params: object)`: `GET /api/admin/audit-logs`
   - `getAuditLogById(id: string)`: `GET /api/admin/audit-logs/${id}`

---

## 6. Features Discovered & Edge Cases Tables

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Auth | OTP Generation & Cooldown | Generates 6-digit OTP with 30s cooldown and 5m expiry | `mobile` (10-digit string) | `{ mobile, expiresInSeconds, cooldownSeconds }` | 429 Rate limited; 400 Cooldown active | `backend/controllers/authController.js` |
| 2 | Auth | OTP Verification & Token Pair | Verifies OTP and issues JWT Access (15m) & Refresh Token (7d) | `mobile`, `otp` (6 digits) | `{ accessToken, refreshToken, isNewUser, user }` | 400 Invalid/Expired OTP; 403 Suspended | `backend/controllers/authController.js` |
| 3 | Auth | User Registration | First-time registration with personal basics & terms | `fullName`, `gender`, `dob`, `mobile`, `email`, `createdFor` | `{ accessToken, refreshToken, user }` | 400 Missing mobile; 403 Suspended | `backend/controllers/authController.js` |
| 4 | Auth | Refresh Token Rotation | Exchanges valid refresh token for rotated new token pair | `refreshToken` string | `{ accessToken, refreshToken }` | 401 Invalid/Revoked Token | `backend/controllers/authController.js` |
| 5 | Profile | 18 Authentic Gotras Validation | Validates against Maharaja Agrasen's 18 Gotras | `gotra`, `motherGotra` | Canonical English Gotra string | 400 Invalid Gotra error (`INVALID_GOTRA`) | `backend/utils/gotras.js` |
| 6 | Profile | 3-Gen Family Tree & Dynamic Relatives | Subdocument lists for brothers, sisters, tauji, chacha, buaji, mamaji | Grandparents, parents, relative arrays with spouse & sasural city | Updated `Profile` document | 400 Validation error on invalid relation types | `backend/models/Profile.js` |
| 7 | Profile | Multipart Profile Photo Upload | Multer disk storage upload for primary avatar | Multipart `FormData` with field `'photo'` | `{ url, profilePicture, completionPercentage }` | 400 File too large (>5MB) or invalid MIME | `backend/middleware/upload.js` |
| 8 | Profile | 5-Section Profile Completion Engine | Computes weighted 0-100% completion breakdown | Candidate Profile object | `{ percentage, breakdown: { personal, astrology, education, family, media } }` | 404 Profile not found | `backend/services/profileScoreService.js` |
| 9 | Match | 6-Factor Weighted Match Engine | Evaluates Gotra exogamy, Age, Edu, Loc, Income, Manglik | Source profile & Target profile | `{ totalScore, isSagotra, hasMaternalConflict, breakdown }` | 400 Missing active profile | `backend/services/matchEngine.js` |
| 10 | Match | Sagotra Exogamy Detection | Strictly assigns 0 points to paternal gotra match and 50% to maternal overlap | `gotra1`, `gotra2`, `motherGotra1`, `motherGotra2` | `{ score, isSagotra, hasMaternalConflict, details }` | N/A | `backend/utils/gotras.js` |
| 11 | Match | Today Recommendations Carousel | Top non-Sagotra matching candidates | User active profile | `{ recommendations: [...] }` | 400 No active profile | `backend/controllers/matchController.js` |
| 12 | Social | Interest Expression & Auto-Acceptance | Express interest or automatically accept mutual match | `recipientProfileId`, `message` | `{ interest }` (Status: Pending or Accepted) | 400 Self-interest; 403 Blocked | `backend/controllers/interestController.js` |
| 13 | Social | Profile Shortlisting | Add/remove candidate bookmark | `shortlistedProfileId`, `notes` | `{ shortlist }` / `{ removed: boolean }` | 400 Self-shortlist | `backend/controllers/shortlistController.js` |
| 14 | Social | Daily Deduplicated Visitor Tracking | Logs profile visits with daily UTC deduplication | `visitedProfileId` | `{ recorded: boolean, visitCount, lastVisitedAt }` | 404 Visited profile not found | `backend/controllers/visitorController.js` |
| 15 | Social | Candidate Blocking | Blocks candidate, cancels pending interests, purges shortlists | `blockedProfileId`, `reason`, `notes` | `{ block }` | 400 Self-block | `backend/controllers/blockController.js` |
| 16 | Payment | Razorpay Order Initiation | Creates Razorpay order for plan checkout | `planId`, `billingCycle` | `{ orderId, amount, currency, keyId, plan }` | 400 Plan inactive or not found | `backend/controllers/paymentController.js` |
| 17 | Payment | Payment Verification & Activation | Verifies Razorpay signature & activates subscription | `orderId`, `paymentId`, `signature` | `{ payment, subscription }` | 400 Signature mismatch | `backend/controllers/paymentController.js` |
| 18 | KYC | User Document Submission | Submits Govt ID & Professional proof files | Multipart `FormData` (`idProof`, `professionProof`) | `{ verification }` | 400 Missing documents | `backend/controllers/verificationController.js` |
| 19 | Admin | Super Admin Authentication | Admin credential login with bcrypt hashing | `email`, `password` | `{ accessToken, admin }` | 401 Invalid credentials; 429 Rate limit | `backend/controllers/adminAuthController.js` |
| 20 | Admin | Dashboard Real-time KPIs | Aggregated platform metrics | Admin JWT | `{ kpis: { totalUsers, activeUsers, revenue, ... } }` | 401 Unauthorized | `backend/controllers/adminController.js` |
| 21 | Admin | KYC One-Click Approval & Auto-Sync | Approves KYC document and sets `verified: true` across all user candidate profiles | `verificationId`, `notes` | `{ verification, profilesSynchronized }` | 404 Verification not found | `backend/controllers/verificationController.js` |
| 22 | Admin | KYC Categorized Rejection | Rejects document with category and reason | `verificationId`, `reason`, `category`, `notes` | `{ verification, userVerificationStatus }` | 404 Verification not found | `backend/controllers/verificationController.js` |
| 23 | Admin | User CSV Export | Streams user directory in standard CSV format | Admin query filters | CSV File Attachment stream | 401 Unauthorized | `backend/controllers/adminController.js` |
| 24 | Admin | Abuse & Complaint Resolution | Moderate user complaints and execute suspensions | `complaintId`, `resolutionStatus`, `actionTaken` | `{ complaint }` | 404 Complaint not found | `backend/controllers/complaintController.js` |
| 25 | Admin | CMS Banners & Static Pages CRUD | Manage homepage hero carousel and legal pages | Banner / Page key & fields | Updated CMS entity | 404 Page not found | `backend/controllers/cmsController.js` |
| 26 | Admin | Immutable Audit Trail Logging | Logs actor, action, target entity, timestamp, details | Admin action execution | `{ auditLogs: [...] }` | 401 Unauthorized | `backend/controllers/auditController.js` |

---

### Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | Gotra Exogamy | Paternal Gotra identical (`Garg` vs `Garg`) | Score is strictly 0 for Gotra factor (`maxScore: 30`), `isSagotra: true` flag set, filtered out of recommendations carousel. |
| 2 | Gotra Exogamy | Maternal Gotra matches candidate's Gotra (`Garg / Bansal` vs `Bansal / Mittal`) | Gotra score reduced to 15 (50% penalty), `hasMaternalConflict: true` recorded. |
| 3 | Gotra Normalization | Composite or alias string `"गोयल (Goyal)"` or `"Goel"` | Pre-save hook extracts canonical English `"Goyal"` and validates against official 18 Gotras list. |
| 4 | Mutual Interest Exchange | User A sends interest to User B when User B already has pending interest to User A | Automatically transitions existing interest to `Accepted`, sets `respondedAt: Date.now()`, and returns mutual match unlocked response. |
| 5 | Profile Photo Upload | File larger than 5MB or invalid MIME (`application/x-zip`) | Multer middleware intercepts error and returns `400 Bad Request` with message `'File too large. Maximum allowed size is 5MB.'`. |
| 6 | Privacy Masking | Non-connected user requests profile with `phoneVisibility: 'Connected Members Only'` | Mobile number returned masked as `+91 98290 XXXXX` and `phoneMasked: true`. |
| 7 | Account Suspension | User with `accountStatus: 'Suspended'` calls any authenticated endpoint or logs in | Interceptor returns `403 Forbidden` with `'Your account has been suspended. Please contact platform support.'`. |
| 8 | Razorpay Webhook HMAC | Webhook payload with altered signature | `crypto.timingSafeEqual` comparison fails; server returns `400 Invalid webhook signature` and rejects fulfillment. |
| 9 | KYC Verification Approval | Admin approves verification for User owning 3 candidate profiles | `User.verificationStatus` set to `'Approved'`, all 3 profiles updated with `verified = true`, and audit log generated in single atomic transaction. |
| 10 | Visitor Tracking | User views target profile 10 times in a single calendar day | Upsert matches existing UTC date record and increments `visitCount` without duplicating rows in Visitor collection. |
