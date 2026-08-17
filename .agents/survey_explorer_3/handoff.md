# Architecture & Tech Stack Analysis — Handoff Report

**Agent**: Survey Explorer 3 (Architecture & Tech Stack Analyst)  
**Working Directory**: `.agents/survey_explorer_3/`  
**Date**: 2026-08-14  
**Target Backend Path**: `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`  

---

## 1. Observation

### 1.1 Codebase & Environment Context
- **Workspace Location**: `c:\Users\admin\Desktop\appzeto-2\agarwal`
- **Node.js Environment**: Node.js `v24.18.0`, npm `11.16.0` verified via shell execution.
- **Backend Directory**: `backend/` currently exists as an empty root directory awaiting full modular implementation.
- **Frontend Codebase**: `frontend/` contains a React + Vite application with extensive UI modules:
  - `frontend/src/modules/admin/services/adminDataService.js` (789 lines) defines storage keys (`admin_users_db`, `admin_verifications_db`, `admin_matches_db`, `admin_subscriptions_db`, `admin_payments_db`, `admin_banners_db`, `admin_static_content_db`, `admin_complaints_db`, `admin_block_history_db`, `admin_audit_logs_db`), complete mock models, and seed data.
  - `frontend/src/modules/user/components/ProfileCompletionDashboardScreen.jsx` contains the 4-step biodata flow with the authentic 18 Agarwal gotras list, 3-generation relative collections, address, mobile, and profile image.
  - `frontend/src/modules/user/pages/UserFlowPage.jsx` defines the user-facing routing and authentication flows.

### 1.2 User Request Specifications (`ORIGINAL_REQUEST.md`)
- **R1: Core Infrastructure & Authentication**:
  - Modular Node.js/Express architecture.
  - Passwordless OTP authentication for users (6-digit OTP, 30s cooldown, 5 min validity, rate limit 5 req / 10 min per phone number, JWT access token 15m, refresh token 7d, SMS service stub/interface).
  - Admin authentication: bcrypt password hashing, JWT, default Super Admin seed (`admin@matrimonyhub.com` / `admin123`).
- **R2: Multi-Profile & Biodata Management**:
  - User 1 -> N Profiles relationship.
  - Authentic 18 Agarwal Gotras enum validation.
  - 3-generation family tree & relatives: Grandparents, parents, dynamic subdocuments for brothers, sisters, tauji, chacha, buaji, mamaji (with marital status, spouse names, in-laws city).
  - Multipart upload for profile picture and gallery photos.
  - Section-by-section profile completion calculation.
- **R3: Weighted Match Engine & Social**:
  - Compatibility scoring: Gotra rules (self & mother gotra exogamy), age, education, location, income, manglik alignment.
  - Discovery endpoints: `/api/matches`, `/api/matches/today`, `/api/matches/search`.
  - Interests lifecycle (send, accept, decline, lists), Shortlist/favorites, Profile visitor tracking, Block lists.
- **R4: Subscriptions, Razorpay & Verification**:
  - Plan CRUD (Gold, Platinum, Diamond / Free, Gold Monthly, Gold Quarterly, Gold Annual).
  - Razorpay order creation, HMAC SHA256 webhook verification, automated subscription activation.
  - KYC document submission (Govt ID + Professional/Academic docs), admin side-by-side queue, one-click approve/reject, automatic sync to candidate `verified` badge.
- **R5: Admin CMS, Moderation, Audit & Operations**:
  - Real-time KPIs aggregation (users, verifications, daily matches, revenue, active subscriptions).
  - User listing, filtering, suspension, CSV export.
  - CMS static pages editor (About Us, Contact Us, Privacy Policy, Terms, Guidelines) and Banners manager.
  - Abuse moderation (complaints lifecycle) and immutable audit logging.

---

## 2. Logic Chain

1. **Dependency Selection**:
   - Because the platform requires secure passwordless OTP login, admin authentication, MongoDB data modeling, image uploads, payment gateway integration, and high reliability, we must select established, production-grade packages without heavy native build tools.
   - `bcryptjs` is chosen over `bcrypt` to guarantee zero native C++ compiler dependency issues on Windows.
   - `express-rate-limit` ensures strict rate limiting on OTP and authentication routes.
   - `winston` and `morgan` provide enterprise-grade structured logging for audit and diagnostics.
   - `razorpay` official SDK and Node's native `crypto` module handle cryptographic payment validation.

2. **Automated Testing Harness**:
   - Running tests against an external running MongoDB instance can cause flaky CI/local test failures if MongoDB is not locally running as a service.
   - `mongodb-memory-server` combined with `jest` and `supertest` creates an isolated, zero-dependency in-memory MongoDB environment that boots instantly, runs all unit/integration tests deterministically, and tears down cleanly.

3. **Modular Architecture & Separation of Concerns**:
   - Strict separation between routes, controllers, middleware, services, models, and utils prevents tight coupling and enables independent unit testing.
   - Heavy business calculations (compatibility match scoring, profile completion percentage, OTP hashing/validation, payment signature verification) are isolated into dedicated `services/` (`matchEngine.js`, `profileScoreService.js`, `otpService.js`, `paymentService.js`, `auditService.js`).

4. **Multi-Profile Relational Architecture**:
   - A single registered user (`User` model) identified by mobile number can manage multiple matrimonial candidates (e.g. self, son, daughter, sibling) via `Profile` models referencing `userId`.
   - All profile queries, verifications, and match calculations link cleanly via `profileId` and `userId`.

5. **Security & Standardized API Contract**:
   - A unified response envelope (`ApiResponse`) ensures frontend clients and admin consoles receive predictable payloads `{ success: boolean, data: any, message: string, meta?: any, error?: any }`.
   - Centralized error middleware captures all synchronous and asynchronous errors, Mongoose validation errors, CastErrors, duplicate key codes (11000), and JWT expiration errors, preventing leaked stack traces in production.

---

## 3. Caveats

- **SMS Gateway**: In local development, an SMS stub/logger service prints the OTP to the console and returns it in development mode responses for seamless testing, while maintaining a clean pluggable interface for third-party providers (Twilio / Fast2SMS).
- **File Upload Storage**: Multipart uploads are stored locally in `backend/uploads/` with sanitized random filenames and MIME type validation; can easily be backed by cloud S3 storage if needed in future production stages.
- **MongoDB Connection**: In production/dev, `MONGODB_URI` connects to a MongoDB replica set or local MongoDB instance; in test mode (`NODE_ENV=test`), `mongodb-memory-server` dynamically intercepts the connection.

---

## 4. Conclusion & Technical Blueprint

### 4.1 Dependency Manifest (`package.json`)

```json
{
  "name": "agrawal-matrimony-backend",
  "version": "1.0.0",
  "description": "Production REST API Backend for Agrawal Biodata Matrimony Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seedAll.js",
    "seed:admin": "node scripts/seedAdmin.js",
    "seed:plans": "node scripts/seedPlans.js",
    "seed:cms": "node scripts/seedCMS.js",
    "seed:mock": "node scripts/seedMockData.js",
    "test": "cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "express-validator": "^7.2.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.9.5",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "razorpay": "^2.9.5",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.1.3",
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### 4.2 Complete Backend Folder Layout

```
backend/
├── config/
│   ├── db.js                 # Mongoose connection with reconnection events & debug hooks
│   ├── env.js                # Centralized validated environment config
│   ├── razorpay.js           # Razorpay SDK client initialization
│   └── constants.js          # App-wide constants (18 Gotras enum, Enums, Roles, Plan IDs)
├── models/
│   ├── User.js               # User account (mobile, email, role, accountStatus, verificationStatus)
│   ├── Profile.js            # Matrimonial Candidate Biodata (Personal, Family Tree, Relatives, Media)
│   ├── Match.js              # Cached compatibility scores & recommendations
│   ├── Interest.js           # Expressed interest lifecycle (senderProfileId, receiverProfileId, status)
│   ├── Plan.js               # Subscription plans (Free, Gold Monthly, Gold Quarterly, Gold Annual)
│   ├── Subscription.js       # Active user subscriptions with expiry dates & status
│   ├── Payment.js            # Transaction history, Razorpay order/payment IDs, amounts, gatewayRef
│   ├── Verification.js       # KYC documents submission & admin review status
│   ├── Admin.js              # Admin account (username, email, passwordHash, role: Super Admin, Moderator)
│   ├── CMS.js                # Static CMS pages (About, Contact, Privacy, Terms, Guidelines) & Banners
│   ├── Complaint.js          # User moderation complaints & resolution workflow
│   ├── AuditLog.js           # Immutable administrative action logs
│   ├── Visitor.js            # Deduplicated daily profile visitor tracking
│   ├── Shortlist.js          # User shortlisted/bookmarked candidate profiles
│   └── Block.js              # Blocked profile & user relationships
├── controllers/
│   ├── authController.js     # User OTP request, verify, refresh token, logout
│   ├── adminAuthController.js# Admin login, profile, password update
│   ├── userController.js     # User profile retrieval, account settings, switch active profile
│   ├── profileController.js  # CRUD candidate biodata, completion percentage, photo upload
│   ├── matchController.js    # Match discovery, today's top matches, weighted multi-field search
│   ├── interestController.js # Express interest, accept, decline, list sent/received
│   ├── planController.js     # Plan listing, plan creation/editing for admin
│   ├── subscriptionController.js # User subscription status, subscription history
│   ├── paymentController.js  # Razorpay create order, verify signature, webhook handler
│   ├── verificationController.js # Submit KYC docs, admin review queue, one-click approve/reject
│   ├── adminController.js    # Dashboard KPIs, user list/filter/suspend, CSV user export
│   ├── cmsController.js      # Public CMS data, admin CMS edit, banner CRUD
│   ├── complaintController.js# Submit complaint, admin queue, resolve & take moderation action
│   ├── auditController.js    # Query audit logs with pagination & filtering
│   ├── visitorController.js  # Track profile view, list recent visitors
│   ├── shortlistController.js# Shortlist / unshortlist profile, get favorites list
│   └── blockController.js    # Block / unblock profile, get blocked list
├── routes/
│   ├── index.js              # Master API router aggregating all endpoints under /api
│   ├── authRoutes.js         # /api/auth
│   ├── adminAuthRoutes.js    # /api/admin/auth
│   ├── userRoutes.js         # /api/users
│   ├── profileRoutes.js      # /api/profiles
│   ├── matchRoutes.js        # /api/matches
│   ├── interestRoutes.js     # /api/interests
│   ├── planRoutes.js         # /api/plans
│   ├── subscriptionRoutes.js # /api/subscriptions
│   ├── paymentRoutes.js      # /api/payments
│   ├── verificationRoutes.js # /api/verifications
│   ├── adminRoutes.js        # /api/admin
│   ├── cmsRoutes.js          # /api/cms
│   ├── complaintRoutes.js    # /api/complaints
│   ├── auditRoutes.js        # /api/audit-logs
│   ├── visitorRoutes.js      # /api/visitors
│   ├── shortlistRoutes.js    # /api/shortlists
│   └── blockRoutes.js        # /api/blocks
├── middleware/
│   ├── auth.js               # User JWT verification middleware (attaches req.user)
│   ├── adminAuth.js          # Admin JWT verification middleware (attaches req.admin)
│   ├── rateLimiter.js        # OTP rate limiter & general API rate limiter
│   ├── upload.js             # Multer configuration for profile images and KYC documents
│   ├── validate.js           # express-validator schema execution helper
│   └── errorHandler.js       # Centralized JSON error envelope & 404 handler
├── services/
│   ├── otpService.js         # In-memory/Redis OTP generator, cooldown check, TTL verification
│   ├── matchEngine.js        # Compatibility scoring engine (Gotra, Age, Education, Manglik, Income, City)
│   ├── paymentService.js     # Razorpay order generation & crypto HMAC SHA256 webhook validator
│   ├── auditService.js       # Asynchronous admin action logger
│   ├── smsService.js         # Pluggable SMS provider interface (console logger / Twilio / Fast2SMS)
│   └── profileScoreService.js# 4-section percentage profile completion calculator
├── utils/
│   ├── gotras.js             # 18 authentic Agarwal Gotras array, Hindi/English labels, validation helper
│   ├── token.js              # Access token (15m) & refresh token (7d) signer/verifier
│   ├── apiResponse.js        # Standardized API response formatters (success, error, paginate)
│   └── logger.js             # Winston logger setup (console + file transports)
├── scripts/
│   ├── seedAdmin.js          # Super Admin seeder
│   ├── seedPlans.js          # Membership plans seeder
│   ├── seedCMS.js            # Static pages & hero banners seeder
│   ├── seedMockData.js       # Demo users, profiles, verifications, payments seeder
│   └── seedAll.js            # Master seed execution runner
├── uploads/
│   ├── profiles/             # User avatar & gallery uploads
│   └── documents/            # KYC document uploads
├── tests/
│   ├── setup.js              # mongodb-memory-server test harness lifecycle
│   ├── auth.test.js          # OTP & authentication integration tests
│   ├── profile.test.js       # Biodata CRUD & completion score tests
│   ├── matches.test.js       # Match engine & Gotra exogamy tests
│   ├── admin.test.js         # Admin KPIs, verification approval & badge sync tests
│   └── payment.test.js       # Razorpay webhook & subscription activation tests
├── .env
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── server.js                 # Express application initialization and HTTP server listener
```

---

### 4.3 Detailed Schema & Model Specifications

#### 1. `User` Model (`models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  name: { type: String, trim: true, default: '' },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Pending'], default: 'Active', index: true },
  verificationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Unverified'], default: 'Unverified', index: true },
  subscriptionPlan: { type: String, default: 'Free Tier' },
  subscriptionStatus: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
  activeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });
```

#### 2. `Profile` Model (`models/Profile.js`)
```javascript
const relativeSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Married', 'Unmarried'], default: 'Unmarried' },
  spouseName: { type: String, trim: true, default: '' },
  homePlace: { type: String, trim: true, default: '' },
}, { _id: true });

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  profileId: { type: String, unique: true, index: true }, // e.g., PRF-501
  fullName: { type: String, required: true, trim: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  gotra: {
    type: String,
    required: true,
    enum: [
      'Garg', 'Goyal', 'Bansal', 'Bindal', 'Singhal', 'Jindal', 'Mittal',
      'Tayal', 'Kansal', 'Kuchhal', 'Airan', 'Dharan', 'Mangal', 'Madhukul',
      'Tingal', 'Nagal', 'Goyan', 'Bhandal',
      'गर्ग (Garg)', 'गोयल (Goyal)', 'बंसल (Bansal)', 'बिंदल (Bindal)',
      'सिंघल (Singhal)', 'जिंदल (Jindal)', 'मित्तल (Mittal)', 'तायल (Tayal)',
      'कंसल (Kansal)', 'कुच्छल (Kuchhal)', 'ऐरन (Airan)', 'धारण (Dharan)',
      'मंगल (Mangal)', 'मधुकल (Madhukul)', 'तिंगल (Tingal)', 'नागल (Nagal)',
      'गोयन (Goyan)', 'भंदल (Bhandal)'
    ],
    index: true
  },
  motherGotra: { type: String, default: '', index: true },
  dob: { type: Date, required: true },
  tob: { type: String, default: '' },
  pob: { type: String, default: '' },
  height: { type: String, default: '' },
  complexion: { type: String, default: '' },
  manglik: { type: String, enum: ['Manglik', 'Non-Manglik', 'Anshik Manglik', 'Don\'t Know'], default: 'Non-Manglik' },
  qualification: { type: String, default: '' },
  workingAt: { type: String, default: '' },
  income: { type: String, default: '' },
  hobbies: { type: String, default: '' },
  // 3-Generation Family Tree
  grandfather: { type: String, default: '' },
  grandmother: { type: String, default: '' },
  father: { type: String, default: '' },
  fatherOccupation: { type: String, default: '' },
  fatherOccupationDetails: { type: String, default: '' },
  mother: { type: String, default: '' },
  brotherList: [relativeSchema],
  sisterList: [relativeSchema],
  taujiList: [relativeSchema],
  chachaList: [relativeSchema],
  buajiList: [relativeSchema],
  mamaji: { type: String, default: '' },
  mamajiList: [relativeSchema],
  // Contact & Address
  residentialAddress: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  // Media & Badges
  profilePicture: { type: String, default: '' },
  gallery: [{ type: String }],
  verified: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  completionPercentage: { type: Number, default: 0 },
  matchScore: { type: Number, default: 0 },
}, { timestamps: true });
```

#### 3. `Admin` Model (`models/Admin.js`)
```javascript
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Super Admin', 'Moderator', 'Support Admin'], default: 'Super Admin' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });
```

#### 4. `Verification` Model (`models/Verification.js`)
```javascript
const verificationSchema = new mongoose.Schema({
  verificationId: { type: String, unique: true, index: true }, // e.g. VRF-201
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, default: '' },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  profileName: { type: String, default: '' },
  mobile: { type: String, default: '' },
  email: { type: String, default: '' },
  mobileVerified: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  govtIdType: { type: String, enum: ['Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID', 'Driving License'], default: 'Aadhaar Card' },
  govtIdDocUrl: { type: String, default: '' },
  govtIdStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  profDocType: { type: String, default: '' },
  profDocUrl: { type: String, default: '' },
  profDocStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });
```

#### 5. `Plan` & `Subscription` Models (`models/Plan.js`, `models/Subscription.js`)
```javascript
const planSchema = new mongoose.Schema({
  planId: { type: String, unique: true, required: true }, // e.g. SUB-PLAN-1
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  durationDays: { type: Number, required: true },
  durationType: { type: String, default: '1 Month' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  badge: { type: String, default: 'Basic' },
  benefits: [{ type: String }],
  activeSubscribers: { type: Number, default: 0 }
}, { timestamps: true });

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active', index: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true, index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
}, { timestamps: true });
```

#### 6. `Payment` Model (`models/Payment.js`)
```javascript
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, index: true }, // PAY-8801
  transactionId: { type: String, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Razorpay / UPI' },
  paymentStatus: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Pending', index: true },
  gatewayRef: { type: String, default: '' },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  razorpaySignature: { type: String }
}, { timestamps: true });
```

#### 7. `Interest`, `Shortlist`, `Visitor`, `Block` Models
```javascript
// Interest Model
const interestSchema = new mongoose.Schema({
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending', index: true }
}, { timestamps: true });
interestSchema.index({ senderProfileId: 1, receiverProfileId: 1 }, { unique: true });

// Shortlist Model
const shortlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true }
}, { timestamps: true });
shortlistSchema.index({ userId: 1, profileId: 1 }, { unique: true });

// Visitor Model (Deduplicated Daily)
const visitorSchema = new mongoose.Schema({
  visitorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  targetProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  visitDate: { type: String, required: true } // YYYY-MM-DD
}, { timestamps: true });
visitorSchema.index({ visitorProfileId: 1, targetProfileId: 1, visitDate: 1 }, { unique: true });

// Block Model
const blockSchema = new mongoose.Schema({
  blockedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  blockedByName: { type: String, default: '' },
  blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  blockedUserName: { type: String, default: '' },
  blockedProfileName: { type: String, default: '' },
  reason: { type: String, default: 'Inappropriate conduct' }
}, { timestamps: true });
blockSchema.index({ blockedByUserId: 1, blockedUserId: 1 }, { unique: true });
```

#### 8. `CMS`, `Complaint`, `AuditLog` Models
```javascript
// CMS Model (Static Pages & Banners)
const bannerSchema = new mongoose.Schema({
  bannerId: { type: String, unique: true }, // BAN-101
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  linkTarget: { type: String, default: '/matches' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  positionOrder: { type: Number, default: 1 }
});

const cmsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true }, // 'static_pages', 'banners'
  aboutUs: { type: String, default: '' },
  contactUs: { type: String, default: '' },
  privacyPolicy: { type: String, default: '' },
  termsOfService: { type: String, default: '' },
  communityGuidelines: { type: String, default: '' },
  banners: [bannerSchema]
}, { timestamps: true });

// Complaint Model
const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, index: true }, // CMP-701
  category: { type: String, enum: ['Fake Profile', 'Abuse', 'Harassment', 'Financial Scam', 'Other'], default: 'Fake Profile' },
  reportedProfileId: { type: String, required: true },
  reportedProfileName: { type: String, default: '' },
  reportedUserId: { type: String, required: true, index: true },
  reporterUserId: { type: String, required: true },
  reporterUserName: { type: String, default: '' },
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Under Review', 'Resolved', 'Dismissed'], default: 'Under Review', index: true },
  assignedTo: { type: String, default: 'Admin Team' },
  actionTaken: { type: String, default: '' }
}, { timestamps: true });

// AuditLog Model (Immutable)
const auditLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true, index: true }, // LOG-301
  adminName: { type: String, default: 'Super Admin' },
  adminRole: { type: String, default: 'Super Admin' },
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' }
}, { timestamps: true });
```

---

### 4.4 Standardized API Response & Error Handling Framework

#### `utils/apiResponse.js`
```javascript
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    const payload = {
      success: false,
      message,
      error: {
        code,
        ...(details && { details })
      }
    };
    if (process.env.NODE_ENV === 'development' && details?.stack) {
      payload.stack = details.stack;
    }
    return res.status(statusCode).json(payload);
  }

  static badRequest(res, message = 'Bad Request', details = null) {
    return ApiResponse.error(res, message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return ApiResponse.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403, 'FORBIDDEN');
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404, 'NOT_FOUND');
  }

  static paginate(res, data, total, page, limit, message = 'Data fetched successfully') {
    const totalPages = Math.ceil(total / limit);
    return ApiResponse.success(res, data, message, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  }
}

module.exports = ApiResponse;
```

#### Centralized Error Middleware (`middleware/errorHandler.js`)
```javascript
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`, { stack: err.stack });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return ApiResponse.badRequest(res, 'Validation Error', details);
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid format for field: ${err.path}`);
  }

  // Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.badRequest(res, `Duplicate entry for ${field}: ${err.keyValue[field]}`);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token has expired');
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    return ApiResponse.badRequest(res, `File upload error: ${err.message}`);
  }

  const statusCode = err.statusCode || 500;
  return ApiResponse.error(res, err.message || 'Internal Server Error', statusCode, err.code || 'SERVER_ERROR');
}

function notFoundHandler(req, res) {
  return ApiResponse.notFound(res, `Cannot ${req.method} ${req.originalUrl}`);
}

module.exports = { errorHandler, notFoundHandler };
```

---

### 4.5 Weighted Match Engine & Gotra Rules Algorithm

#### 18 Gotras Array & Exogamy Rules (`utils/gotras.js`)
```javascript
const AGARWAL_GOTRAS = [
  { english: 'Garg', hindi: 'गर्ग', sage: 'Gargya' },
  { english: 'Goyal', hindi: 'गोयल', sage: 'Gobhila' },
  { english: 'Bansal', hindi: 'बंसल', sage: 'Vatsa' },
  { english: 'Bindal', hindi: 'बिंदल', sage: 'Vashishtha' },
  { english: 'Singhal', hindi: 'सिंघल', sage: 'Shringi' },
  { english: 'Jindal', hindi: 'जिंदल', sage: 'Jaimini' },
  { english: 'Mittal', hindi: 'मित्तल', sage: 'Maitreya' },
  { english: 'Tayal', hindi: 'तायल', sage: 'Taitireya' },
  { english: 'Kansal', hindi: 'कंसल', sage: 'Kaushik' },
  { english: 'Kuchhal', hindi: 'कुच्छल', sage: 'Kashyap' },
  { english: 'Airan', hindi: 'ऐरन', sage: 'Aurva' },
  { english: 'Dharan', hindi: 'धारण', sage: 'Dhaumya' },
  { english: 'Mangal', hindi: 'मंगल', sage: 'Mudgala' },
  { english: 'Madhukul', hindi: 'मधुकल', sage: 'Madhukulya' },
  { english: 'Tingal', hindi: 'तिंगल', sage: 'Tandya' },
  { english: 'Nagal', hindi: 'नागल', sage: 'Naga' },
  { english: 'Goyan', hindi: 'गोयन', sage: 'Garga-Gautama' },
  { english: 'Bhandal', hindi: 'भंदल', sage: 'Bhardwaj' }
];

function normalizeGotra(gotraStr) {
  if (!gotraStr) return '';
  const match = gotraStr.match(/\((.*?)\)/);
  if (match && match[1]) return match[1].trim().toLowerCase();
  return gotraStr.trim().toLowerCase();
}

function isValidGotra(gotraStr) {
  const norm = normalizeGotra(gotraStr);
  return AGARWAL_GOTRAS.some(g => g.english.toLowerCase() === norm || g.hindi === gotraStr);
}

module.exports = { AGARWAL_GOTRAS, normalizeGotra, isValidGotra };
```

#### Match Scoring Engine (`services/matchEngine.js`)
```javascript
const { normalizeGotra } = require('../utils/gotras');

function calculateCompatibility(p1, p2) {
  let score = 0;
  const breakdown = {};

  // 1. Gotra Exogamy Rule (25 pts)
  const g1 = normalizeGotra(p1.gotra);
  const g2 = normalizeGotra(p2.gotra);
  const mg1 = normalizeGotra(p1.motherGotra);
  const mg2 = normalizeGotra(p2.motherGotra);

  if (g1 && g2 && g1 === g2) {
    breakdown.gotra = { score: 0, reason: 'Same Paternal Gotra (Sagotra)' };
  } else if ((g1 && mg2 && g1 === mg2) || (g2 && mg1 && g2 === mg1)) {
    breakdown.gotra = { score: 10, reason: 'Maternal Gotra Match' };
    score += 10;
  } else {
    breakdown.gotra = { score: 25, reason: 'Gotra Exogamy Satisfied' };
    score += 25;
  }

  // 2. Age Preference Alignment (20 pts)
  const age1 = p1.dob ? (new Date().getFullYear() - new Date(p1.dob).getFullYear()) : 25;
  const age2 = p2.dob ? (new Date().getFullYear() - new Date(p2.dob).getFullYear()) : 25;
  const ageDiff = Math.abs(age1 - age2);
  if (ageDiff <= 3) {
    breakdown.age = { score: 20, reason: 'Optimal age alignment' };
    score += 20;
  } else if (ageDiff <= 6) {
    breakdown.age = { score: 15, reason: 'Acceptable age difference' };
    score += 15;
  } else {
    breakdown.age = { score: 5, reason: 'Significant age difference' };
    score += 5;
  }

  // 3. Education & Profession Alignment (20 pts)
  const highTier = ['B.Tech', 'M.Tech', 'MBA', 'MS', 'CA', 'MBBS', 'MD'];
  const hasHigh1 = highTier.some(t => (p1.qualification || '').includes(t));
  const hasHigh2 = highTier.some(t => (p2.qualification || '').includes(t));
  if (hasHigh1 && hasHigh2) {
    breakdown.education = { score: 20, reason: 'Both Professional / Postgraduate' };
    score += 20;
  } else if (p1.qualification && p2.qualification) {
    breakdown.education = { score: 15, reason: 'Graduate qualification' };
    score += 15;
  } else {
    breakdown.education = { score: 10, reason: 'Basic details provided' };
    score += 10;
  }

  // 4. Manglik Alignment (15 pts)
  const m1 = p1.manglik || 'Non-Manglik';
  const m2 = p2.manglik || 'Non-Manglik';
  if ((m1 === 'Non-Manglik' && m2 === 'Non-Manglik') || (m1 === 'Manglik' && m2 === 'Manglik')) {
    breakdown.manglik = { score: 15, reason: 'Exact Manglik alignment' };
    score += 15;
  } else if (m1 === 'Anshik Manglik' || m2 === 'Anshik Manglik') {
    breakdown.manglik = { score: 10, reason: 'Anshik Manglik match' };
    score += 10;
  } else {
    breakdown.manglik = { score: 5, reason: 'Manglik mismatch' };
    score += 5;
  }

  // 5. Income Bracket Alignment (10 pts)
  if (p1.income && p2.income) {
    breakdown.income = { score: 10, reason: 'Income disclosed' };
    score += 10;
  } else {
    breakdown.income = { score: 5, reason: 'Partial income disclosure' };
    score += 5;
  }

  // 6. Location Alignment (10 pts)
  const loc1 = (p1.pob || p1.residentialAddress || '').toLowerCase();
  const loc2 = (p2.pob || p2.residentialAddress || '').toLowerCase();
  if (loc1 && loc2 && (loc1.includes(loc2) || loc2.includes(loc1))) {
    breakdown.location = { score: 10, reason: 'Same region/city' };
    score += 10;
  } else {
    breakdown.location = { score: 6, reason: 'Inter-city match' };
    score += 6;
  }

  return { totalScore: Math.min(score, 100), breakdown };
}

module.exports = { calculateCompatibility };
```

---

### 4.6 Environment Configuration (`.env` and `.env.example`)

```ini
# Application Server Config
NODE_ENV=development
PORT=5000
API_PREFIX=/api
CLIENT_URL=http://localhost:5173
ADMIN_CLIENT_URL=http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://localhost:27017/agrawal_matrimony
MONGODB_TEST_URI=mongodb://localhost:27017/agrawal_matrimony_test

# JWT Security Secrets
JWT_ACCESS_SECRET=agrawal_matrimony_access_super_secret_jwt_key_2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=agrawal_matrimony_refresh_super_secret_jwt_key_2026
JWT_REFRESH_EXPIRES_IN=7d
JWT_ADMIN_SECRET=agrawal_matrimony_admin_super_secret_jwt_key_2026
JWT_ADMIN_EXPIRES_IN=24h

# OTP & SMS Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5
OTP_WINDOW_MINUTES=10
SMS_PROVIDER=stub
# FAST2SMS_API_KEY=your_fast2sms_api_key_here
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_PHONE_NUMBER=+1234567890

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_super_secret_2026

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5

# Default Super Admin Seed
ADMIN_EMAIL=admin@matrimonyhub.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Super Admin
```

---

### 4.7 Testing Stack & In-Memory MongoDB Harness

#### Jest Config (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 30000,
};
```

#### Test Harness Setup (`tests/setup.js`)
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
```

---

### 4.8 Seed Strategy & Default Datasets

1. **Idempotency**: All seed scripts perform `findOneAndUpdate` with `upsert: true` or verify presence before inserting, guaranteeing safety on repetitive execution.
2. **Master Seed Script (`scripts/seedAll.js`)**:
   - Executes `seedAdmin.js`, `seedPlans.js`, `seedCMS.js`, and `seedMockData.js` sequentially.
3. **Default Seed Data Included**:
   - Super Admin: `admin@matrimonyhub.com` / `admin123`
   - 4 Subscription Plans: Free Tier, Gold Monthly (₹999), Gold Quarterly (₹2499), Gold Annual Premium (₹6999)
   - 5 Mock Users & 6 Rich Matrimonial Profiles (Rajesh Agrawal, Priya Garg, Rohan Agrawal, Sunita Goyal, Anjali Bansal, Vikram Singhal, Aarav Singhal, Mahesh Mittal, Neha Mittal, Pankaj Goyal, Riya Goyal)
   - 4 KYC Verification requests with documents (Pending, Approved, Rejected)
   - 4 Payment transactions (Razorpay)
   - 2 CMS Hero Banners & Full Legal Static Content
   - 2 Moderation Complaints & 2 Audit Logs

---

## 5. Verification Method

To independently verify the backend infrastructure once generated:

1. **Dependency Installation & Health**:
   ```powershell
   cd backend
   npm install
   ```
2. **Seed Execution**:
   ```powershell
   npm run seed
   ```
   *Expected Result*: Output confirming Super Admin created/updated, 4 Plans seeded, CMS static pages populated, and demo users loaded.
3. **Automated Test Suite**:
   ```powershell
   npm test
   ```
   *Expected Result*: 100% passing tests across `auth.test.js`, `profile.test.js`, `matches.test.js`, `admin.test.js`, and `payment.test.js` running in-memory without external MongoDB daemon dependencies.
4. **Server Startup**:
   ```powershell
   npm start
   ```
   *Expected Result*: Server listens on `http://localhost:5000` with clean console log and accessible `/api/health` endpoint returning `{ success: true, message: "Agrawal Matrimony API is healthy", data: { ... } }`.
