# E2E Test Infra: Agrawal Biodata Matrimony Platform Backend

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests exercise HTTP endpoints as a real client/frontend would.
- **Hermetic & Self-Contained**: Backed by `mongodb-memory-server` in `tests/setup.js` for isolated, fast, zero-dependency execution.
- **Methodology**: 4-Tier Structured Testing + Tier 5 Adversarial Coverage Hardening.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Tier 1 (Happy) | Tier 2 (Boundary/Error) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|-------------|:--------------:|:-----------------------:|:----------------------:|:-----------------:|
| 1 | Express & Security | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | MongoDB Setup | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | User OTP Auth | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Admin Auth & Seed | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | Multi-Profile Linking | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | 18 Gotras Enum Validation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Full Matrimonial Biodata | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | Relative Subdocuments | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 9 | Media Upload & Privacy | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 10 | Profile Completion API | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 11 | Weighted Match Engine | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 12 | Gotra Exogamy Rules | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 13 | Match Discovery Endpoints | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 14 | Interests Lifecycle | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 15 | Favorites, Visitors, Block | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 16 | Plan CRUD & Subscriptions | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 17 | Razorpay Order & Webhook | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 18 | KYC Document Submission | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 19 | Admin KYC Approval & Sync | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 20 | Admin Dashboard KPIs | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 21 | Admin User Management | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 22 | CMS Pages & Banners | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 23 | Complaints & Moderation | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 24 | Immutable Audit Trail | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: `npm test` (`cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit`)
- **Harness**: Supertest executing against Express `app` instance exported from `server.js` (or `app.js`).
- **Memory Database**: `mongodb-memory-server` dynamically spun up before tests in `tests/setup.js` and cleaned after each suite.

## Real-World Application Scenarios (Tier 4)
1. **User Full Matrimonial Journey**: Register phone -> OTP verification -> Create primary candidate profile with authentic Gotra & relatives -> Upload photo -> Calculate completion (100%) -> Discover matches -> Express interest -> Accept mutual interest.
2. **Admin Moderation & KYC Verification Journey**: Admin login -> Fetch dashboard KPIs -> Inspect pending KYC queue -> Approve Aadhaar proof -> Verify candidate profile badge auto-updates to `verified=true` -> View generated audit log entry.
3. **Monetization & Razorpay Webhook Journey**: User initiates Gold Plan subscription -> Order created -> Simulated Razorpay webhook event with valid HMAC SHA256 signature received -> Subscription auto-activated -> Profile unlocked.
4. **Gotra Exogamy & Match Engine Edge Case Journey**: Candidate with Garg Gotra searches matches -> Bansal Gotra candidate scores 90%+; Garg Gotra candidate scores 0% with Sagotra flag; Mother Gotra match candidate gets 50% gotra penalty.
5. **Multi-Profile & Privacy Control Journey**: User creates Profile A (Self) and Profile B (Sister) -> Sets address visibility to Connected Members Only -> Non-connected user cannot see address -> After interest accepted, address becomes visible.
