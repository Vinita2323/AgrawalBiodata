## 2026-08-14T07:26:19Z

You are Worker M1 Fix (Core Infra & Auth Remediation Engineer).
Your working directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m1_fix
The project source directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\backend
The user request specification is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
The architecture document is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
The full audit report is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\auditor_m1_1\handoff.md
The reviewer reports are in:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\reviewer_m1_1\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\reviewer_m1_2\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\challenger_m1_1\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\challenger_m1_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
Fix all issues identified by the Forensic Auditor, Reviewers, and Challengers:
1. `backend/utils/token.js`: Update `signRefreshToken` to include a unique `jti: crypto.randomUUID()` in the payload so that rapid sequential token rotations generate distinct JWTs and properly enforce single-use refresh token rotation and anti-replay protection.
2. `backend/controllers/authController.js`: In `getMe` and any other M1 handlers, safely check if `Profile` model exists before calling `.populate('profiles')` (e.g. `if (mongoose.models.Profile) { query.populate('profiles'); }`) or do not unconditionally populate it until M2.
3. `backend/middleware/rateLimiter.js`: Coerce `req.body.mobile` to string `String(req.body?.mobile || '')` before `.replace(/\D/g, '')` to prevent TypeError on numeric payloads.
4. `backend/services/otpService.js`: Change `crypto.randomInt(100000, 999999)` to `crypto.randomInt(100000, 1000000)` so that 999999 is included.
5. In `backend`: Run `npm test` across all test files (`tests/auth.test.js`, `tests/challenger_m1.test.js`, etc.) and ensure 100% pass (0 failures).
6. Document your changes, commands, and passing test results in `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m1_fix\handoff.md` and report back.
