# E2E Test Infra: Agarwal Matrimony Full-Stack Integration

## Test Philosophy
- Opaque-box, requirement-driven, end-to-end integration and verification.
- Validates data persistence in MongoDB, correct Gotra exogamy logic, 3-gen family tree and dynamic relative subdocument preservation, multipart photo uploads, JWT authentication, and Admin KYC auto-sync.

## Feature Inventory & Test Coverage
| # | Feature | Source (Requirement) | Tier 1 (Unit/API) | Tier 2 (Boundary) | Tier 3 (Integration) | Tier 4 (E2E Scenario) |
|---|---------|---------------------|:-----------------:|:-----------------:|:--------------------:|:---------------------:|
| 1 | API Client Layer & Vite Reverse Proxy | ORIGINAL_REQUEST R1 | ✓ | ✓ | ✓ | ✓ |
| 2 | User Auth & Passwordless OTP | ORIGINAL_REQUEST R2 | ✓ | ✓ | ✓ | ✓ |
| 3 | Candidate Biodata & Relatives | ORIGINAL_REQUEST R3 | ✓ | ✓ | ✓ | ✓ |
| 4 | Photo Upload Multipart | ORIGINAL_REQUEST R3 | ✓ | ✓ | ✓ | ✓ |
| 5 | Profile Completion Score | ORIGINAL_REQUEST R3 | ✓ | ✓ | ✓ | ✓ |
| 6 | Match Discovery & Recommendations | ORIGINAL_REQUEST R4 | ✓ | ✓ | ✓ | ✓ |
| 7 | Interests & Social Features | ORIGINAL_REQUEST R4 | ✓ | ✓ | ✓ | ✓ |
| 8 | Admin Auth & Dashboard KPIs | ORIGINAL_REQUEST R5 | ✓ | ✓ | ✓ | ✓ |
| 9 | KYC Verification & Badge Sync | ORIGINAL_REQUEST R5 | ✓ | ✓ | ✓ | ✓ |
| 10 | Clean Frontend Production Build | ORIGINAL_REQUEST Acceptance | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- Backend test runner: `npm test` in `backend/` (Jest with MongoDB in-memory / mock server)
- Frontend build runner: `npm run build` in `frontend/` (Vite)
- E2E Integration Suite: Multi-step integration script validating live REST API flow against MongoDB
