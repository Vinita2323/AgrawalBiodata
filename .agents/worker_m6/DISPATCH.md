## 2026-08-14T08:35:37Z
You are Worker M6 for Milestone 6 (E2E Integration Test Suite, Seeders & Final Verification) of the Agrawal Biodata Matrimony platform backend REST API.

Your working directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m6
The backend directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\backend
Mandatory Reference: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md (READ THIS FIRST)
Blueprint Reference: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
Test Spec: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\TEST_INFRA.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Implement the Master E2E Integration Test Suite in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend\tests\e2e.test.js` covering all 5 Tier-4 real-world user journeys from TEST_INFRA.md:
   - Scenario 1: User Full Matrimonial Journey (Register phone -> OTP verification -> Create primary candidate profile with authentic Gotra & relatives -> Upload photo -> Calculate completion (100%) -> Discover matches -> Express interest -> Accept mutual interest -> Contact unmasked).
   - Scenario 2: Admin Moderation & KYC Verification Journey (Admin login -> Fetch dashboard KPIs -> Inspect pending KYC queue -> Approve Aadhaar proof -> Verify candidate profile badge auto-updates to `verified=true` across all user profiles -> View generated audit log entry).
   - Scenario 3: Monetization & Razorpay Webhook Journey (User initiates Gold Plan subscription -> Order created -> Simulated Razorpay webhook event with valid HMAC SHA256 signature (`crypto.createHmac('sha256', secret)`) received -> Subscription auto-activated -> Profile unlocked).
   - Scenario 4: Gotra Exogamy & Match Engine Edge Case Journey (Candidate with Garg Gotra searches matches -> Bansal Gotra candidate scores 90%+; Garg Gotra candidate scores 0% with Sagotra paternal conflict flag; Mother Gotra match candidate gets 50% maternal gotra penalty).
   - Scenario 5: Multi-Profile & Privacy Control Journey (1 User creates Profile A (Self) and Profile B (Sister) -> Sets address visibility to Connected Members Only -> Non-connected user cannot see address -> After interest accepted, address becomes visible).

2. Implement and verify all database seed scripts:
   - `scripts/seedAdmin.js`: Seeds Super Admin (`admin@matrimonyhub.com` / `admin123`).
   - `scripts/seedPlans.js`: Seeds 4 plans (Free, Gold, Platinum, Diamond) with monthly & yearly pricing and benefits.
   - `scripts/seedCMS.js`: Seeds 6 static pages and hero banners.
   - `scripts/seedMockData.js`: Seeds realistic Agarwal matrimonial candidates spanning multiple Gotras (Garg, Goyal, Bansal, Mittal, Singhal, etc.), both genders, horoscope, relatives, and photos.
   - `scripts/seedAll.js`: Master seed script running all seeders sequentially and idempotently.
   - Ensure `package.json` contains: `seed:admin`, `seed:plans`, `seed:cms`, `seed:mock`, `seed:all`, `test`, `start`.

3. Execute verification in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`:
   - `npx jest tests/e2e.test.js --runInBand`
   - `npm test` (full project test suite)
   - Ensure all tests pass with 0 failures and 0 warnings.

4. Write comprehensive 5-component handoff report in `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m6\handoff.md`.
5. Send completion update and test summary to the parent orchestrator via send_message.
