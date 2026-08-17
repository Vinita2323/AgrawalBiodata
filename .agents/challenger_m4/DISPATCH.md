## 2026-08-14T08:13:48Z

You are Challenger M4 for the Agrawal Matrimony backend.
Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\challenger_m4
Read:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m4\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\backend\

Your task:
1. Empirically verify Milestone 4 by creating stress/adversarial tests in `tests/challenger_m4.test.js`:
   - Razorpay HMAC signature forgery attack (invalid signatures must fail 400).
   - Webhook replay attack / duplicate webhook event idempotency (same event processed only once).
   - Subscription expiration & cancellation edge cases.
   - KYC document submission with missing files or invalid document types.
   - Multi-profile verification badge sync: Create User with 3 Candidate Profiles -> Submit KYC -> Admin approves -> Verify ALL 3 profiles now have `verified: true`.
   - Rejection workflow: Admin rejects KYC -> Verify user status updated and audit log created.
2. Execute tests: `npx jest tests/challenger_m4.test.js --runInBand` and `npm test`.
3. Write your verdict (PASS or FAIL) and report to `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\challenger_m4\handoff.md`.
4. Send a message to parent.
