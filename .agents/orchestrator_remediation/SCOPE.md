# Scope: Agrawal Biodata Backend REST API Remediation

## Architecture
- Backend: Node.js Express REST API, MongoDB with Mongoose
- Payment service: Razorpay integration, plan activation (`backend/services/paymentService.js`)
- Tests: Jest / Supertest test suites (`backend/tests/`)

## Feature Inventory & Remediation Items
| # | Feature / Bug | Description | Milestone | Source |
|---|---------------|-------------|-----------|--------|
| 1 | Plan ID Lookup Fix | `activateUserSubscription` in `backend/services/paymentService.js`: Support Mongoose `ObjectId` and slug string via `mongoose.isValidObjectId(planId)` and fallback `Plan.findOne({ planId })`. Preserves Platinum/Diamond tiers. | M1 | Victory Audit Finding 1 |
| 2 | Gotra Enum Test Fix | `backend/tests/challenger_m4.test.js`: Update Gotra from `'Agrawal'` to authentic Gotra (`'Bansal'` / `'Garg'`) in describe block 6. | M1 | Victory Audit Finding 2 |
| 3 | Full Test Suite Pass | Run `npm test` across all test suites, verifying 100% pass rate (300+ tests passing, 0 failures). | M1 | Victory Audit Finding 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Remediation & Verification | Fix `paymentService.js`, fix `challenger_m4.test.js`, run full test suite | none | DONE |

## Code Layout
- `backend/services/paymentService.js` — Subscription activation logic
- `backend/tests/challenger_m4.test.js` — KYC rejection workflow test
