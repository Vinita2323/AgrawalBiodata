## 2026-08-14T09:28:04Z

<USER_REQUEST>
You are the Full-Stack API Contract Spec Miner for the Agarwal Matrimony platform integration.

Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\spec_miner_survey_3
Parent conversation ID: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b

Please read the user requirements at:
c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md

Your mission:
Perform precise specification mining and contract reconciliation between Frontend (c:/Users/admin/Desktop/appzeto-2/agarwal/frontend) and Backend (c:/Users/admin/Desktop/appzeto-2/agarwal/backend):
1. Map every screen in the frontend to its exact corresponding backend REST endpoint(s).
2. Detail payload structures:
   - Auth: Send OTP, Verify OTP, Register, Refresh Token, Logout.
   - Profile: Step 1 (Personal/Astrology + 18 Gotras), Step 2 (Grandparents, Parents, tauji, chacha, buaji, brothers, sisters), Step 3 (Mamaji, maternal details, address, privacy), Step 4 (Photo upload multipart/form-data), Completion percentage sync.
   - Matches: Discovery, today's recommendations, search filters, 6-factor Gotra compatibility score visualization.
   - Social: Send interest, accept/decline interest, shortlist toggle, visitor log.
   - Admin: Super Admin login, dashboard KPIs aggregation, KYC verification queue (document inspection, approve/reject), user management, CMS.
3. Identify all field name mismatches, type differences, enum differences (e.g. Gotra names list: Garg, Goyal, Bindal, Mittal, Singhal, Bansal, Kansal, Kuchhal, Tingal, Tayal, Airan, Madhukul/Dharan, Jindal, Bindal/Mangal, Mittal, etc. - ensure exact casing and values match backend enums).
4. Define the API client layer specifications (`frontend/src/services/api.js` base client with Axios/Fetch, error handling, token interceptors, and modular service files).

Write your comprehensive specification report to:
`c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\spec_miner_survey_3\spec_analysis.md`
and write your self-contained handoff to:
`c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\spec_miner_survey_3\handoff.md`.
Maintain `progress.md` with timestamps during your work.
When finished, send a message back to parent (ID: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b).
</USER_REQUEST>
