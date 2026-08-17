# Frontend Contract Analysis & API Specification Report

## 1. Observation

### 1.1 Architecture & Codebase Structure
The frontend application in `c:\Users\admin\Desktop\appzeto-2\agarwal\frontend` is a React 19 single-page application built with Vite and React Router v7 (`frontend/package.json:17-26`). It consists of two distinct modules:
1. **User Module** (`frontend/src/modules/user`):
   - Routing: Managed via `UserFlowPage.jsx` (`/welcome`, `/login`, `/create-account`, `/otp-verification`, `/account-created`, `/profile-completion-dashboard`, `/home`, `/matches`, `/search`, `/interests`, `/chat` / `/messages`, `/profile`, `/notifications`, `/membership`, `/payment`, `/settings`, `/account`, `/about`, `/terms`, `/privacy`, `/guidelines`, `/help-support`, `/profile-detail`).
   - State Persistence: Currently relies on browser `localStorage` (`registrationData`, `userProfile`).
2. **Admin Module** (`frontend/src/modules/admin`):
   - Routing: Managed via `AdminRoutes.jsx` (`/admin/login`, `/admin/dashboard`, `/admin/users`, `/admin/users/:userId`, `/admin/profile-verification`, `/admin/profile-verification/:verificationId`, `/admin/matches`, `/admin/subscriptions`, `/admin/payments`, `/admin/complaints`, `/admin/legal`, `/admin/notifications`, `/admin/settings`).
   - State & Services: Centralized in `adminDataService.js` and `AdminAuthContext.jsx` with `localStorage` keys (`admin_users_db`, `admin_verifications_db`, `admin_matches_db`, `admin_subscriptions_db`, `admin_payments_db`, `admin_banners_db`, `admin_static_content_db`, `admin_complaints_db`, `admin_block_history_db`, `admin_audit_logs_db`, `admin_session`).

---

## 2. Comprehensive API Endpoint Catalog

### 2.1 User Authentication & Account Lifecycle

| Method | Endpoint | Headers | Request Body Payload | Query Params | Success Response Structure | Description |
|---|---|---|---|---|---|---|
| `POST` | `/api/auth/send-otp` | `Content-Type: application/json` | `{"mobile": "9876543210"}` | None | `{"success": true, "message": "OTP sent successfully", "data": {"mobile": "9876543210", "cooldown": 30, "expiresIn": 300}}` | Triggers 6-digit OTP via SMS with 30s cooldown and max 5 requests / 10m rate limit |
| `POST` | `/api/auth/verify-otp` | `Content-Type: application/json` | `{"mobile": "9876543210", "otp": "123456"}` | None | `{"success": true, "message": "OTP verified successfully", "data": {"accessToken": "eyJhb...", "refreshToken": "eyJhb...", "isNewUser": false, "user": {"id": "USR-101", "name": "Rajesh Agrawal", "mobile": "+919876543210", "email": "rajesh@example.com", "accountStatus": "Active"}}}` | Verifies OTP, returns JWT tokens (15m access, 7d refresh) |
| `POST` | `/api/auth/register` | `Content-Type: application/json` | `{"fullName": "Rajesh Agrawal", "gender": "Male", "dob": "1996-08-20", "mobile": "9876543210", "email": "rajesh@example.com", "createdFor": "Myself", "acceptTerms": true}` | None | `{"success": true, "message": "Account created successfully", "data": {"accessToken": "...", "refreshToken": "...", "user": {...}}}` | Initial user registration (Step 1) |
| `POST` | `/api/auth/refresh-token` | `Content-Type: application/json` | `{"refreshToken": "eyJhb..."}` | None | `{"success": true, "data": {"accessToken": "...", "refreshToken": "..."}}` | Issues new access token from valid refresh token |
| `POST` | `/api/auth/logout` | `Authorization: Bearer <token>` | None | None | `{"success": true, "message": "Logged out successfully"}` | Revokes session / refresh token |

---

### 2.2 Candidate Biodata & Profile Management

| Method | Endpoint | Headers | Request Body Payload | Query Params | Success Response Structure | Description |
|---|---|---|---|---|---|---|
| `GET` | `/api/profiles/me` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"profile": {...}, "completionPercentage": 75}}` | Fetches active candidate profile biodata for logged-in user |
| `POST` | `/api/profiles` | `Authorization: Bearer <token>`, `Content-Type: application/json` | Complete Biodata Object (see Section 2.2.1) | None | `{"success": true, "message": "Profile created", "data": {"profileId": "PRF-501", ...}}` | Creates a new candidate profile attached to user account |
| `PUT` | `/api/profiles/:profileId` | `Authorization: Bearer <token>`, `Content-Type: application/json` | Complete or partial Biodata Object | None | `{"success": true, "message": "Profile updated", "data": {...}}` | Updates candidate biodata across personal, family, maternal, contact sections |
| `POST` | `/api/profiles/:profileId/photo` | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` | `formData` with field `photo` (file, max 5MB, JPG/PNG) | None | `{"success": true, "data": {"url": "https://.../photo.jpg"}}` | Uploads and sanitizes candidate profile picture |
| `GET` | `/api/profiles/:profileId` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"profile": {...}, "isFavorited": false, "interestStatus": "None"\|"Sent"\|"Received"\|"Accepted"}}` | Detailed candidate inspection view for matchmaking |
| `GET` | `/api/profiles/:profileId/completion` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"percentage": 75, "breakdown": {"personal": 100, "family": 100, "maternal": 100, "photo": 0}}}` | Calculates section-by-section completion percentage |

#### 2.2.1 Complete Biodata Payload Structure (`POST /api/profiles`, `PUT /api/profiles/:profileId`)
```json
{
  "fullName": "Priya Garg",
  "gender": "Female",
  "gotra": "Garg",
  "dob": "1998-05-14",
  "tob": "08:30 AM",
  "pob": "Jaipur, Rajasthan",
  "height": "5'4\"",
  "complexion": "Fair",
  "manglik": "Non-Manglik",
  "qualification": "M.Tech, Software Engineer",
  "hobbies": "Classical Dance, Reading, Travelling",
  "income": "15-20 LPA",
  "workingAt": "TCS Digital",
  "grandfather": "Late Sh. Ramcharan Garg",
  "grandmother": "Smt. Shanti Devi",
  "father": "Sh. Rameshwar Garg",
  "fatherOccupation": "Business",
  "fatherOccupationDetails": "Owner, Garg Textile Mills",
  "mother": "Smt. Sunita Garg",
  "motherGotra": "Bansal",
  "brotherList": [
    { "name": "Aman Garg", "status": "Married", "spouseName": "Pooja Garg", "homePlace": "Delhi" }
  ],
  "sisterList": [
    { "name": "Neha Garg", "status": "Married", "spouseName": "Rahul Agrawal", "homePlace": "Indore" }
  ],
  "taujiList": [
    { "name": "Sh. Suresh Garg", "status": "Married", "spouseName": "Smt. Anita Garg", "homePlace": "Jaipur" }
  ],
  "chachaList": [
    { "name": "Sh. Dinesh Garg", "status": "Married", "spouseName": "Smt. Meena Garg", "homePlace": "Ahmedabad" }
  ],
  "buajiList": [
    { "name": "Smt. Rekha Agrawal", "status": "Married", "spouseName": "Sh. Mohan Agrawal", "homePlace": "Udaipur" }
  ],
  "mamajiList": [
    { "name": "Sh. Vijay Bansal", "status": "Married", "spouseName": "Smt. Geeta Bansal", "homePlace": "Kota" }
  ],
  "residentialAddress": "104, Agrasen Nagar, Gopalpura Bypass, Jaipur, Rajasthan",
  "mobileNumber": "+91 98290 12345",
  "profilePicture": "https://..."
}
```

---

### 2.3 Discovery, Matchmaking & Social Interactions

| Method | Endpoint | Headers | Query Params | Request Body | Success Response Structure | Description |
|---|---|---|---|---|---|---|
| `GET` | `/api/matches` | `Authorization: Bearer <token>` | `category` (`All`\|`Nearby`\|`Interested`), `page`, `limit` | None | `{"success": true, "data": {"matches": [...], "pagination": {"page": 1, "limit": 10, "total": 24, "totalPages": 3}}}` | Filtered candidate matches with algorithmic compatibility scores |
| `GET` | `/api/matches/today` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"matches": [{"id": "P101", "name": "Priya Garg", "age": 26, "height": "5'4\"", "city": "Jaipur", "matchScore": 95, "gotra": "Garg", "education": "B.Tech CS", "image": "..."}]}}` | Top daily recommended carousel matches |
| `GET` | `/api/matches/search` | `Authorization: Bearer <token>` | `q`, `age`, `height`, `gotra`, `education`, `profession`, `location`, `page`, `limit` | None | `{"success": true, "data": {"results": [...], "pagination": {...}}}` | Multi-field search across keyword, qualification, gotra, and location |
| `GET` | `/api/interests` | `Authorization: Bearer <token>` | `status` (`Received`\|`Sent`\|`Accepted`\|`Declined`) | None | `{"success": true, "data": {"interests": [{"id": "int-1", "name": "Priya Garg", "age": 26, "city": "Jaipur", "date": "12 May 2024", "status": "Received", "isOnline": true, "image": "..."}]}}` | Retrieves user interest exchanges categorized by status |
| `POST` | `/api/interests` | `Authorization: Bearer <token>` | None | `{"targetProfileId": "PRF-501"}` | `{"success": true, "message": "Interest expressed successfully"}` | Sends matrimonial interest request to target candidate |
| `PUT` | `/api/interests/:interestId` | `Authorization: Bearer <token>` | None | `{"status": "Accepted" \| "Declined"}` | `{"success": true, "message": "Interest status updated", "data": {"status": "Accepted", "contactUnlocked": true}}` | Accepts or declines received interest (unlocks contact details upon acceptance) |
| `GET` | `/api/favorites` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"favorites": [...]}}` | Retrieves shortlisted bookmarked profiles |
| `POST` | `/api/favorites/:profileId` | `Authorization: Bearer <token>` | None | None | `{"success": true, "message": "Profile added to saved list"}` | Toggles candidate bookmark/favorite |
| `DELETE` | `/api/favorites/:profileId` | `Authorization: Bearer <token>` | None | None | `{"success": true, "message": "Profile removed from saved list"}` | Removes candidate bookmark |
| `GET` | `/api/visitors` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"visitors": [{"name": "Riya Garg", "time": "10 min ago", "city": "Jaipur", "image": "..."}]}}` | Retrieves profile visitors (deduplicated daily) |
| `POST` | `/api/visitors/:profileId` | `Authorization: Bearer <token>` | None | None | `{"success": true}` | Records a visit to a target profile |
| `GET` | `/api/blocked` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"blockedUsers": [...]}}` | Retrieves user's blocked profiles list |
| `POST` | `/api/blocked` | `Authorization: Bearer <token>` | None | `{"targetUserId": "USR-104", "reason": "Inappropriate conduct"}` | `{"success": true, "message": "User blocked successfully"}` | Blocks user and prevents mutual match discovery |
| `DELETE` | `/api/blocked/:userId` | `Authorization: Bearer <token>` | None | None | `{"success": true, "message": "User unblocked"}` | Unblocks user |

---

### 2.4 Subscriptions, Payments & Document Verification

| Method | Endpoint | Headers | Request Body Payload | Query Params | Success Response Structure | Description |
|---|---|---|---|---|---|---|
| `GET` | `/api/subscriptions/plans` | Optional `Bearer <token>` | None | None | `{"success": true, "data": {"plans": [{"id": "gold", "name": "Premium Gold", "priceMonthly": 999, "priceYearly": 799, "benefits": [...]}]}}` | Lists active subscription plans for membership checkout |
| `POST` | `/api/payments/create-order` | `Authorization: Bearer <token>` | `{"planId": "gold", "billingCycle": "Monthly" \| "Yearly", "paymentMethod": "upi" \| "cards"}` | None | `{"success": true, "data": {"orderId": "order_Nkx78129381", "amount": 59900, "currency": "INR", "keyId": "rzp_test_..."}}` | Generates Razorpay checkout order |
| `POST` | `/api/payments/verify` | `Authorization: Bearer <token>` | `{"razorpay_order_id": "order_...", "razorpay_payment_id": "pay_...", "razorpay_signature": "..."}` | None | `{"success": true, "message": "Payment verified and subscription activated", "data": {"planName": "Premium Gold", "expiresAt": "2027-02-14"}}` | Verifies Razorpay cryptographic signature and activates subscription |
| `POST` | `/api/payments/webhook` | `x-razorpay-signature` | Razorpay webhook payload | None | `{"status": "ok"}` | Automated backend webhook handler for asynchronous payment captures |
| `POST` | `/api/verification/submit` | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` | `govtIdType` (`Aadhaar Card`\|`PAN Card`\|`Passport`), `govtIdFile` (file), `profDocType` (string), `profDocFile` (file) | None | `{"success": true, "message": "Verification documents submitted", "data": {"verificationId": "VRF-201", "status": "Pending"}}` | Submits identity proof and qualification documents for admin review |
| `GET` | `/api/verification/status` | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {"status": "Pending"\|"Approved"\|"Rejected", "rejectionReason": ""}}` | Checks verification badge approval status |

---

### 2.5 CMS & Public Static Content

| Method | Endpoint | Query Params | Success Response Structure | Description |
|---|---|---|---|---|
| `GET` | `/api/cms/banners` | None | `{"success": true, "data": {"banners": [{"id": "BAN-101", "title": "...", "subtitle": "...", "imageUrl": "...", "linkTarget": "/matches", "positionOrder": 1}]}}` | Retrieves active homepage banner sliders |
| `GET` | `/api/cms/pages/about-us` | None | `{"success": true, "data": {"title": "About Matrimony Hub", "content": "..."}}` | Retrieves About Us platform statement |
| `GET` | `/api/cms/pages/contact-us` | None | `{"success": true, "data": {"officeAddress": "...", "email": "...", "helplines": [...]}}` | Retrieves support contacts and phone helplines |
| `GET` | `/api/cms/pages/privacy-policy` | None | `{"success": true, "data": {"points": ["1. ...", "2. ..."], "content": "..."}}` | Retrieves point-by-point privacy policies |
| `GET` | `/api/cms/pages/terms-of-service` | None | `{"success": true, "data": {"points": ["1. ...", "2. ..."], "content": "..."}}` | Retrieves point-by-point terms of service |
| `GET` | `/api/cms/pages/community-guidelines` | None | `{"success": true, "data": {"guidelines": [...]}}` | Retrieves community conduct guidelines |
| `GET` | `/api/cms/faqs` | None | `{"success": true, "data": {"faqs": [{"id": "FAQ-101", "question": "...", "answer": "..."}]}}` | Retrieves Q&A list for Help & Support accordion |

---

### 2.6 Admin Module Endpoints

| Method | Endpoint | Headers | Request Body Payload | Query Params | Success Response Structure | Description |
|---|---|---|---|---|---|---|
| `POST` | `/api/admin/auth/login` | `Content-Type: application/json` | `{"email": "admin@matrimonyhub.com", "password": "admin123"}` | None | `{"success": true, "data": {"token": "eyJhb...", "admin": {"id": "ADM-001", "name": "Super Administrator", "email": "admin@matrimonyhub.com", "role": "Super Admin"}}}` | Admin authentication with bcrypt validation |
| `GET` | `/api/admin/dashboard/metrics` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"totalUsers": 5, "activeUsers": 4, "pendingVerifications": 2, "dailyMatches": 342, "revenue": 10497, "activeSubscriptions": 3}}` | Real-time aggregated operations dashboard KPIs |
| `GET` | `/api/admin/users` | `Authorization: Bearer <adminToken>` | None | `page`, `limit`, `search`, `status` (`Active`\|`Suspended`), `verification` (`Approved`\|`Pending`\|`Rejected`), `subscription` (`Gold`\|`Free`) | `{"success": true, "data": {"users": [...], "pagination": {"page": 1, "limit": 8, "total": 5, "totalPages": 1}}}` | Users management table with multi-criteria filters |
| `GET` | `/api/admin/users/:userId` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"user": {"id": "USR-101", "name": "...", "profiles": [...], "payments": [...], "verifications": [...]}}}` | Detailed user account inspection and multi-profile list |
| `PUT` | `/api/admin/users/:userId/status` | `Authorization: Bearer <adminToken>` | `{"status": "Active" \| "Suspended"}` | None | `{"success": true, "message": "User status updated", "data": {"accountStatus": "Suspended"}}` | Toggles user account access |
| `DELETE` | `/api/admin/users/:userId` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "message": "User deleted successfully"}` | Soft/hard delete user record and logs audit trail |
| `GET` | `/api/admin/users/export` | `Authorization: Bearer <adminToken>` | None | `format=csv` | CSV file attachment download (`text/csv`) | Exports registered users report in CSV format |
| `GET` | `/api/admin/verifications` | `Authorization: Bearer <adminToken>` | None | `status` (`Pending`\|`Approved`\|`Rejected`), `search`, `page`, `limit` | `{"success": true, "data": {"verifications": [...], "pagination": {...}}}` | Verification queue listing identity & professional documents |
| `GET` | `/api/admin/verifications/:id` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"verification": {"id": "VRF-201", "govtIdDocUrl": "...", "profDocUrl": "...", ...}}}` | Side-by-side verification document inspection |
| `PUT` | `/api/admin/verifications/:id/approve` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "message": "Verification approved", "data": {"status": "Approved", "verified": true}}` | Approves verification, grants Verified Badge, syncs profile `verified=true`, creates audit log |
| `PUT` | `/api/admin/verifications/:id/reject` | `Authorization: Bearer <adminToken>` | `{"reason": "Blurred / Unreadable Document", "notes": "Please re-upload clear Aadhaar card copy"}` | None | `{"success": true, "message": "Verification rejected", "data": {"status": "Rejected"}}` | Rejects verification with categorized reason |
| `GET` | `/api/admin/matches` | `Authorization: Bearer <adminToken>` | None | `search`, `page`, `limit` | `{"success": true, "data": {"pairings": [{"id": "MATCH-PAIR-101", "matchScore": 96, "date": "2026-02-05", "user1": {...}, "user2": {...}}]}}` | Matched candidate pairs list with compatibility scores |
| `GET` | `/api/admin/matches/export` | `Authorization: Bearer <adminToken>` | None | `format=csv` | CSV file attachment download (`text/csv`) | Exports matched pairs report in CSV format |
| `GET` | `/api/admin/subscriptions` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"plans": [...]}}` | List of all configured subscription plans |
| `POST` | `/api/admin/subscriptions` | `Authorization: Bearer <adminToken>` | `{"name": "Gold Monthly", "price": 999, "currency": "INR", "durationDays": 30, "durationType": "1 Month", "badge": "Popular", "status": "Active", "benefits": [...]}` | None | `{"success": true, "data": {"id": "SUB-PLAN-2", ...}}` | Creates a new subscription tier |
| `PUT` | `/api/admin/subscriptions/:id` | `Authorization: Bearer <adminToken>` | Plan update payload | None | `{"success": true, "data": {...}}` | Updates existing subscription plan |
| `DELETE` | `/api/admin/subscriptions/:id` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "message": "Plan deleted"}` | Deactivates subscription plan |
| `GET` | `/api/admin/payments` | `Authorization: Bearer <adminToken>` | None | `status` (`Success`\|`Failed`), `search`, `page`, `limit` | `{"success": true, "data": {"payments": [...]}}` | Financial transaction ledger |
| `GET` | `/api/admin/complaints` | `Authorization: Bearer <adminToken>` | None | `category` (`All`\|`Fake Profile`\|`Abuse`), `status` (`Pending`\|`Resolved`), `page`, `limit` | `{"success": true, "data": {"complaints": [...]}}` | Abuse complaints & moderation queue |
| `PUT` | `/api/admin/complaints/:id/action` | `Authorization: Bearer <adminToken>` | `{"status": "Resolved", "action": "suspend" \| "warn" \| "dismiss", "actionTaken": "Reported User Suspended for 30 Days"}` | None | `{"success": true, "message": "Moderation action applied"}` | Applies disciplinary action and auto-suspends user if selected |
| `GET` | `/api/admin/block-history` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"blockHistory": [...]}}` | Member-to-member block activity history |
| `GET` | `/api/admin/banners` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"banners": [...]}}` | Homepage banner configurations |
| `POST` | `/api/admin/banners` | `Authorization: Bearer <adminToken>` | `{"title": "...", "subtitle": "...", "imageUrl": "...", "linkTarget": "/matches", "status": "Active", "positionOrder": 1}` | None | `{"success": true, "data": {...}}` | Adds a new homepage promotional banner |
| `PUT` | `/api/admin/banners/:id` | `Authorization: Bearer <adminToken>` | Banner update payload | None | `{"success": true, "data": {...}}` | Updates existing banner |
| `DELETE` | `/api/admin/banners/:id` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "message": "Banner deleted"}` | Removes banner |
| `GET` | `/api/admin/cms` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"privacyPoints": [...], "termsPoints": [...], "faqs": [...], "aboutUs": "...", "contactUs": "..."}}` | Retrieves full CMS static content data |
| `PUT` | `/api/admin/cms` | `Authorization: Bearer <adminToken>` | `{"privacyPoints": [...], "termsPoints": [...], "faqs": [...], ...}` | None | `{"success": true, "message": "CMS content updated"}` | Point-by-point CMS update |
| `GET` | `/api/admin/audit-logs` | `Authorization: Bearer <adminToken>` | None | `search`, `page`, `limit` | `{"success": true, "data": {"logs": [{"id": "LOG-301", "adminName": "Super Admin", "adminRole": "Super Admin", "action": "Approved Profile Verification", "target": "Verification VRF-200 (Priya Garg)", "timestamp": "2025-11-12 16:45", "details": "Verified Aadhaar ID"}]}}` | Immutable administrative audit trail stream |
| `GET` | `/api/admin/notifications` | `Authorization: Bearer <adminToken>` | None | None | `{"success": true, "data": {"notifications": [...]}}` | Aggregated notification feed for verifications, reports, and payments |
| `PUT` | `/api/admin/settings/profile` | `Authorization: Bearer <adminToken>` | `{"name": "Super Admin", "email": "admin@matrimonyhub.com"}` | None | `{"success": true, "message": "Profile updated"}` | Updates admin account credentials |
| `PUT` | `/api/admin/settings/password` | `Authorization: Bearer <adminToken>` | `{"currentPassword": "...", "newPassword": "..."}` | None | `{"success": true, "message": "Password updated successfully"}` | Modifies admin account password |
| `PUT` | `/api/admin/settings/preferences` | `Authorization: Bearer <adminToken>` | `{"notifyVerifications": true, "notifyComplaints": true, "notifyPayments": true}` | None | `{"success": true, "message": "Preferences saved"}` | Updates notification alert triggers |

---

## 3. Response Format & Pagination Standard

### 3.1 Standard Response Envelope
All API endpoints must return a standardized JSON envelope:
```json
// Success Response (HTTP 200 / 201)
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}

// Error Response (HTTP 400 / 401 / 403 / 404 / 429 / 500)
{
  "success": false,
  "error": "Human-readable error explanation",
  "code": "INVALID_OTP" | "UNAUTHORIZED" | "RATE_LIMIT_EXCEEDED",
  "errors": [
    { "field": "mobile", "message": "Mobile number must be exactly 10 digits" }
  ]
}
```

### 3.2 Pagination Wrapper Format
Paginated endpoints (`/api/matches`, `/api/admin/users`, `/api/admin/verifications`, `/api/admin/payments`, `/api/admin/audit-logs`) must follow this structure:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 4. Enums, Form Dropdowns & Data Schema Reference

### 4.1 18 Authentic Agarwal Gotras Enum
The platform strictly mandates the 18 historical Agarwal Gotras (`frontend/src/modules/user/components/ProfileCompletionDashboardScreen.jsx:229-246`):
1. `Garg` (`गर्ग`)
2. `Goyal` (`गोयल`)
3. `Bansal` (`बंसल`)
4. `Bindal` (`बिंदल`)
5. `Singhal` (`सिंघल`)
6. `Jindal` (`जिंदल`)
7. `Mittal` (`मित्तल`)
8. `Tayal` (`तायल`)
9. `Kansal` (`कंसल`)
10. `Kuchhal` (`कुच्छल`)
11. `Airan` (`ऐरन`)
12. `Dharan` (`धारण`)
13. `Mangal` (`मंगल`)
14. `Madhukul` (`मधुकल`)
15. `Tingal` (`तिंगल`)
16. `Nagal` (`नागल`)
17. `Goyan` (`गोयन`)
18. `Bhandal` (`भंदल`)

### 4.2 Other Enumerations Used in Frontend

| Field Name | Allowed Values | Source Location in Frontend |
|---|---|---|
| **Gender** | `Male`, `Female` | `CreateAccountScreen.jsx:8`, `ProfileCompletionDashboardScreen.jsx:212-213` |
| **Profile Created For** | `Myself`, `Son`, `Daughter`, `Brother`, `Sister`, `Relative`, `Friend` | `CreateAccountScreen.jsx:78` |
| **Manglik Status** | `Non-Manglik`, `Manglik`, `Anshik Manglik`, `Don't Know` (Form options: `Yes`, `No`, `Don't Know`) | `ProfileCompletionDashboardScreen.jsx:310-314`, `adminDataService.js:41` |
| **Father's Occupation** | `Business`, `Private Job`, `Govt Job`, `Retired`, `Not Employed` | `ProfileCompletionDashboardScreen.jsx:413-417` |
| **Relative Marital Status** | `Unmarried`, `Married` | `ProfileCompletionDashboardScreen.jsx:489-490` |
| **Relative Dynamic Lists** | `brotherList`, `sisterList`, `taujiList` (Elder Uncle), `chachaList` (Uncle), `buajiList` (Paternal Aunt), `mamajiList` (Maternal Uncle) | `ProfileCompletionDashboardScreen.jsx:31-38, 453-457` |
| **Account Status** | `Active`, `Suspended` | `adminDataService.js:22, 156`, `UserManagementPage.jsx:59` |
| **Verification Status** | `Pending`, `Approved`, `Rejected` | `adminDataService.js:23, 83, 157` |
| **Government ID Types** | `Aadhaar Card`, `PAN Card`, `Passport`, `Voter ID`, `Driving License` | `adminDataService.js:239, 259, 279`, `VerificationDetailPage.jsx:305-309` |
| **Verification Rejection Grounds** | `Blurred / Unreadable Document`, `Name Mismatch on Identity Record`, `Expired Identity Proof`, `Invalid Professional Degree/Certificate`, `Fraudulent Document Image` | `VerificationDetailPage.jsx:305-309` |
| **Subscription Plan Names** | `Free Tier`, `Premium Gold` / `Gold Monthly`, `Gold Quarterly`, `Gold Annual Premium` / `Premium Platinum` / `Premium Diamond` | `MembershipScreen.jsx:8-46`, `adminDataService.js:314-389` |
| **Billing Cycle** | `Monthly`, `Yearly` | `MembershipScreen.jsx:4` |
| **Payment Gateways & Methods** | `Razorpay / UPI`, `UPI (GPay / PhonePe / Paytm)`, `Credit / Debit Card`, `Net Banking` | `PaymentScreen.jsx:83-116`, `adminDataService.js:401-442` |
| **Complaint / Report Categories** | `Fake Profile`, `Abuse`, `Inappropriate Content`, `Harassment`, `Spam` | `adminDataService.js:479, 494`, `ComplaintManagementPage.jsx:9` |
| **Complaint Actions** | `suspend` ("Reported User Suspended for 30 Days"), `warn` ("Formal Warning Notice Issued"), `dismiss` ("Complaint Reviewed & Dismissed") | `ComplaintManagementPage.jsx:26-36` |
| **Admin Roles** | `Super Admin`, `Moderator` | `AdminAuthContext.jsx:23, 35` |

---

## 5. Token Handling, Storage & Authentication Architecture

### 5.1 User Passwordless OTP Auth Flow
1. **Initiation**: User enters 10-digit Indian phone number (`/login` or `/create-account`).
2. **OTP Generation**: Backend generates 6-digit cryptographic OTP, sets 30s resend cooldown, 5 min expiry, and limits generation to 5 requests per 10 min window.
3. **Verification & Token Issuance**: On valid OTP, backend returns:
   - `accessToken`: JWT with 15-minute expiry containing `userId`, `mobile`, `role: 'user'`.
   - `refreshToken`: JWT with 7-day expiry stored hashed in MongoDB.
4. **Header Transmission**: User requests must include `Authorization: Bearer <accessToken>`.

### 5.2 Admin Password Auth Flow
1. **Initiation**: Admin logs in via `/admin/login` with email and password (`admin@matrimonyhub.com` / `admin123`).
2. **Verification & Token Issuance**: Backend verifies bcrypt hash and issues JWT token containing `adminId`, `email`, `role: 'Super Admin' | 'Moderator'`.
3. **Header Transmission**: Admin requests must include `Authorization: Bearer <adminToken>`.

---

## 6. Gaps & Alignment Matrix: ORIGINAL_REQUEST.md vs Frontend

| Component | ORIGINAL_REQUEST.md Requirement | Frontend Implementation Finding | Harmonization Solution for Backend |
|---|---|---|---|
| **Gotra Values Representation** | R2: "Gotra (strictly from authentic 18 Agarwal gotras enum)" | Frontend dropdown uses Hindi-English string like `गर्ग (Garg)`, `गोयल (Goyal)` (`ProfileCompletionDashboardScreen.jsx:229-246`), whereas admin seed uses English `Garg`, `Goyal` (`adminDataService.js:35`). | Backend schema validator will accept either English gotra (`Garg`) or bilingual format (`गर्ग (Garg)`), normalizing internally to standard enum `['Garg', 'Goyal', 'Bansal', ...]` while providing both in API responses. |
| **Manglik Status Values** | R2: "manglik status" | User form presents `Yes`, `No`, `Don't Know` (`ProfileCompletionDashboardScreen.jsx:310-314`), while admin seed and compatibility engine use `Non-Manglik`, `Manglik`, `Anshik Manglik`. | Backend schema will accept `Yes`, `No`, `Don't Know`, `Non-Manglik`, `Manglik`, `Anshik Manglik`, automatically normalizing `Yes` -> `Manglik`, `No` -> `Non-Manglik`, `Don't Know` -> `Don't Know` / `Anshik Manglik`. |
| **Multi-Profile Data Hierarchy** | R2: "Support multiple candidate profiles per registered user account" | Admin screens (`UserManagementPage.jsx`, `UserDetailPage.jsx`) inspect `user.profiles` array (`PRF-501`, `PRF-502`). User screen edits primary active profile. | Backend will maintain a 1:N relationship (`User` model has array of `Profile` IDs / `Profile` model has `userId` foreign key). API endpoints `GET /api/profiles/me` and `GET /api/profiles/user/:userId` will cleanly support multi-profile fetching. |
| **Relative Subdocuments Structure** | R2: "3-Generation Family Tree & Relative Collections" | Frontend manages discrete lists for `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, each containing `{ name, status, spouseName, homePlace }`. | Backend Mongoose schema will define embedded subdocument schemas for all 6 relative types with fields `{ name: String, status: String, spouseName: String, homePlace: String }`. |
| **Subscription Plan Names & Tiers** | R4: "CRUD for plans (Gold, Platinum, Diamond)" | User frontend defines `Premium Gold`, `Premium Platinum`, `Premium Diamond` with Monthly/Yearly toggle (`MembershipScreen.jsx:8-46`). Admin frontend defines `Free Tier`, `Gold Monthly`, `Gold Quarterly`, `Gold Annual Premium` (`adminDataService.js:314-389`). | Unified `Plan` model will store `name`, `code` (e.g. `GOLD_MONTHLY`, `GOLD_YEARLY`, `PLATINUM`, `DIAMOND`), `price`, `durationDays`, `billingCycle`, `badge`, and dynamic `benefits: [String]`, fully accommodating both views. |
| **Legal & CMS Structure** | R5: "Static pages editor (About Us, Contact Us, Privacy Policy points, Terms of Service points, FAQs)" | `LegalManagementPage.jsx` edits point-by-point arrays (`privacyPoints: [String]`, `termsPoints: [String]`) and Q&A objects (`faqs: [{ id, question, answer }]`), in addition to full markdown/HTML text. | CMS Mongoose model will store both individual points arrays (`privacyPoints`, `termsPoints`), FAQ subdocuments, and synthesized full string fields (`privacyPolicy`, `termsOfService`, `aboutUs`, `contactUs`). |
| **Verification & Verified Badge Synchronization** | R4: "Automated synchronization between verification approval and candidate profile verified badge" | In `adminDataService.js:619-630`, approving a verification updates `req.status = 'Approved'`, `user.verificationStatus = 'Approved'`, and sets candidate profile `profile.verified = true`. | Backend controller `PUT /api/admin/verifications/:id/approve` will atomically update the `VerificationRequest` status, the associated `User` verification status, and the `Profile.verified` boolean badge in a single transaction. |

---

## 7. Caveats
- No actual backend server or external network services exist yet; all frontend behavior currently runs client-side simulation.
- PDF generation in the user app (`DashboardScreen.jsx:20-139`) is handled via client-side `html2canvas` + `jspdf`, but backend biodata endpoint should supply complete structured JSON and optional server-side render capability.
- SMS OTP sending should have a production-ready stub/adapter interface (e.g. Twilio / MSG91 / Fast2SMS) while defaulting to secure console logging / fixed dev token in development mode.

---

## 8. Conclusion
The frontend contract is fully documented and structured. Implementing the REST API backend conforming to the endpoints, request/response formats, enum mappings, and synchronization rules specified in this report will enable seamless plug-and-play integration for both the User Module and Admin Portal frontends without any breaking changes.

---

## 9. Verification Method
To independently verify this specification against the frontend codebase:
1. Review user screen contracts in `c:\Users\admin\Desktop\appzeto-2\agarwal\frontend\src\modules\user\components\`.
2. Review admin operations and mock data stores in `c:\Users\admin\Desktop\appzeto-2\agarwal\frontend\src\modules\admin\services\adminDataService.js` and `frontend/src/modules/admin/pages/`.
3. Compare enum values in `ProfileCompletionDashboardScreen.jsx` and `VerificationDetailPage.jsx`.
4. Validate compliance with `ORIGINAL_REQUEST.md` requirements R1–R5.
