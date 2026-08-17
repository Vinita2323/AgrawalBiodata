# Agrawal Biodata Matrimony REST API Backend
> **महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प**

A production-grade REST API backend built in Node.js, Express, and MongoDB (Mongoose) designed specifically for the Agrawal Matrimony Platform, supporting both the **User Module** (candidate biodata, matching, interests, subscriptions) and the **Admin Module** (operations KPIs, user management, KYC queue, CMS, complaints, and audit logs).

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Framework**: Node.js (>=18) & Express.js
- **Database & ODM**: MongoDB & Mongoose (with embedded in-memory database for hermetic automated testing)
- **Authentication**:
  - **User**: Passwordless 6-digit OTP authentication with 30s cooldown and 5-min expiration.
  - **Admin**: Bcrypt-hashed password auth (`admin@matrimonyhub.com` / `admin123`).
  - **Tokens**: JWT Access Token (15 min) + Refresh Token (7 days) with rotation & revocation.
- **Security & Reliability**:
  - Helmet for security HTTP headers
  - CORS with configurable origins
  - Rate limiting (Window rate limiting for OTP + general API limiter)
  - Timing-safe cryptographic HMAC SHA256 validation for Razorpay webhooks (`crypto.timingSafeEqual`)
- **Payments**: Razorpay order creation, client signature verification, and webhook handling
- **File Uploads**: Multer handling multipart uploads with sanitization and validation for local disk storage (Render / VPS KVM 4 ready)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB instance (Local or MongoDB Atlas connection URI)

### 2. Environment Configuration
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp .env.example .env
```

Default configuration variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agrawal_biodata_db
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_placeholder_key
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_placeholder
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Installation & Seeding
```bash
# Install dependencies
npm install

# Seed default Super Admin, Subscription Plans & CMS static pages
npm run seed
```

### 4. Running the Server
```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

### 5. Running the Automated Test Suite
```bash
# Runs 293+ tests across all 12 test suites
npm test
```

---

## 🏛️ The 18 Authentic Agarwal Gotras

The backend strictly enforces the 18 Agarwal Gotras:
1. **Garg** (गर्ग)
2. **Goyal** / **Goel** (गोयल)
3. **Bansal** (बंसल)
4. **Bindal** (बिंदल)
5. **Singhal** (सिंघल)
6. **Jindal** (जिंदल)
7. **Mittal** (मित्तल)
8. **Tayal** (तायल)
9. **Kansal** (कंसल)
10. **Kuchhal** / **Kucchal** (कुच्छल)
11. **Airan** (ऐरन)
12. **Dharan** (धारण)
13. **Mangal** (मंगल)
14. **Madhukul** (मधुकल)
15. **Tingal** (तिंगल)
16. **Nagal** (नागल)
17. **Goyan** (गोयन)
18. **Bhandal** (भंदल)

---

## 📡 API Endpoint Overview

### 1. Authentication & System
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & uptime status | Public |
| `GET` | `/api/gotras` | Returns all 18 authentic Agarwal gotras | Public |
| `POST` | `/api/auth/send-otp` | Request 6-digit OTP for mobile | Rate-limited |
| `POST` | `/api/auth/verify-otp` | Verify OTP & obtain JWT tokens | Public |
| `POST` | `/api/auth/register` | Register user account | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | User Token |
| `POST` | `/api/auth/refresh-token` | Rotate refresh token | Refresh Token |
| `POST` | `/api/auth/logout` | Revoke session tokens | User Token |
| `POST` | `/api/admin/auth/login` | Super Admin login | Public |
| `GET` | `/api/admin/auth/profile` | Admin profile details | Admin Token |
| `PUT` | `/api/admin/auth/password` | Change admin password | Admin Token |

### 2. Candidate Profiles & Multi-Profile Biodata (1 User -> N Profiles)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/profiles` | Create a new candidate profile | User Token |
| `GET` | `/api/profiles/me` | List all profiles created by the user | User Token |
| `GET` | `/api/profiles/me/active` | Get currently selected active profile | User Token |
| `PUT` | `/api/profiles/me/active/:id`| Switch user's active profile | User Token |
| `GET` | `/api/profiles/me/completion`| 5-section percentage completion | User Token |
| `POST` | `/api/profiles/me/photo` | Upload profile avatar | User Token (Multipart) |
| `POST` | `/api/profiles/me/gallery` | Upload up to 6 gallery photos | User Token (Multipart) |
| `DELETE` | `/api/profiles/me/gallery/:id` | Delete gallery photo | User Token |
| `GET` | `/api/profiles/:id` | View candidate biodata (privacy masked) | Public / User |
| `PUT` | `/api/profiles/:id` | Update profile biodata | Owner Token |
| `DELETE` | `/api/profiles/:id` | Delete candidate profile | Owner Token |

### 3. Match Engine & Social Discovery
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/matches` | Paginated matches sorted by score | User Token |
| `GET` | `/api/matches/today` | Daily curated carousel | User Token |
| `GET` | `/api/matches/search` | Multi-criteria structured search | Public / User |
| `GET` | `/api/matches/score/:targetId` | On-demand 6-factor compatibility breakdown | User Token |
| `POST` | `/api/interests` | Send connection interest | User Token |
| `PUT` | `/api/interests/:id/accept` | Accept interest (unlocks contacts) | Recipient Token |
| `PUT` | `/api/interests/:id/decline` | Decline interest | Recipient Token |
| `GET` | `/api/interests/received` | List received interests | User Token |
| `GET` | `/api/interests/sent` | List sent interests | User Token |
| `POST` | `/api/shortlist/:targetId` | Bookmark candidate profile | User Token |
| `GET` | `/api/shortlist` | View bookmarked profiles | User Token |
| `POST` | `/api/visitors` | Record daily deduplicated profile view | User Token |
| `POST` | `/api/blocks/:targetId` | Block user (mutual invisibility) | User Token |
| `DELETE` | `/api/blocks/:targetId` | Unblock user | User Token |

### 4. Plans, Subscriptions & Razorpay Payments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/plans` | List active membership plans | Public |
| `POST` | `/api/plans` | Admin create new plan | Admin Token |
| `POST` | `/api/payments/create-order`| Create Razorpay order | User Token |
| `POST` | `/api/payments/verify` | Verify client HMAC SHA256 payment | User Token |
| `POST` | `/api/payments/webhook` | Process Razorpay webhook events | Webhook HMAC Header |
| `GET` | `/api/subscriptions/current`| Get active subscription status & limits| User Token |
| `POST` | `/api/subscriptions/cancel` | Cancel active subscription | User Token |
| `GET` | `/api/payments/history` | List payment transactions | User Token |

### 5. Document KYC Verification & Badge Synchronization
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/verification/submit` | Submit KYC documents (ID/Degree) | User Token (Multipart) |
| `GET` | `/api/verification/status` | Check user KYC review status | User Token |
| `GET` | `/api/admin/verifications` | Admin inspection queue | Admin Token |
| `PUT` | `/api/admin/verifications/:id/approve` | Approve & sync verified badge across all profiles | Admin Token |
| `PUT` | `/api/admin/verifications/:id/reject` | Reject with categorized reason | Admin Token |

### 6. Admin Operations, CMS, Moderation & Audit Trail
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/dashboard/metrics` | Real-time platform KPI counters | Admin Token |
| `GET` | `/api/admin/users` | Filterable user list with pagination | Admin Token |
| `GET` | `/api/admin/users/export` | Export users to CSV | Admin Token |
| `PATCH` | `/api/admin/users/:id/status`| Suspend or Activate user | Admin Token |
| `GET` | `/api/cms/pages/:slug` | Public fetch static page content | Public |
| `PUT` | `/api/cms/admin/pages/:slug`| Admin edit static CMS content | Admin Token |
| `GET` | `/api/cms/banners` | Fetch active homepage hero banners | Public |
| `POST` | `/api/complaints` | File user abuse report | User Token |
| `GET` | `/api/admin/complaints` | Admin complaint review queue | Admin Token |
| `PATCH` | `/api/admin/complaints/:id/resolve` | Resolve report & auto-suspend user | Admin Token |
| `GET` | `/api/audit-logs` | Immutable administrative audit log | Admin Token |

---

## 🔒 Security Best Practices Implemented
- Passwords are never stored in plaintext (bcrypt salted hashing).
- JWT refresh tokens are stored in the database, rotated on every refresh, and revoked on logout.
- Timing-safe cryptographic comparison (`crypto.timingSafeEqual`) prevents timing attack vulnerabilities on HMAC webhook verification.
- Sensitive candidate phone numbers and residential addresses are masked until mutual interest acceptance.
