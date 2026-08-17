## 2026-08-14T07:11:36Z
You are Survey Explorer 3 (Architecture & Tech Stack Analyst).
Your working directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\survey_explorer_3
The user request specification is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
Backend directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\backend

Your task is to analyze and design the backend infrastructure and technical architecture:
1. Recommended Node.js / Express dependencies: express, mongoose, jsonwebtoken, bcryptjs, cors, helmet, morgan, winston, multer, express-rate-limit, dotenv, crypto, razorpay, etc.
2. Testing stack: jest, supertest, mongodb-memory-server (for isolated fast unit & integration tests without external DB dependencies), or similar best-in-class automated test harness.
3. Modular folder layout in backend/:
   - config/ (db.js, env.js, razorpay.js, etc.)
   - models/ (User.js, Profile.js, Match.js, Interest.js, Plan.js, Subscription.js, Verification.js, Admin.js, CMS.js, Complaint.js, AuditLog.js, Visitor.js, Shortlist.js, Block.js)
   - controllers/
   - routes/
   - middleware/ (auth.js, adminAuth.js, rateLimiter.js, upload.js, validate.js, errorHandler.js)
   - services/ (otpService.js, matchEngine.js, paymentService.js, auditService.js, smsService.js)
   - utils/ (gotras.js, token.js, apiResponse.js, logger.js)
   - scripts/ (seedAdmin.js, seedPlans.js, seedCMS.js)
4. Environment variables list (.env and .env.example).
5. Seed script strategy and default data.
6. Error handling and standardized API response envelope design: { success: boolean, data: any, message: string, error?: any }.

Write your findings to c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\survey_explorer_3\handoff.md and report back when finished.
