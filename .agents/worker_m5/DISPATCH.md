# DISPATCH

## 2026-08-14T08:17:34Z

You are Worker M5 for the Agrawal Matrimony backend.
Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m5
Read the following files before starting:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\TEST_INFRA.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\backend\

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
Implement Milestone 5 (Admin Ops, CMS, Moderation & Audit Trails) in `backend/`:
1. Models:
   - `models/CMS.js`: Schema for static pages (`key`, `title`, `content`, `points`, `updatedBy`) and Banners (`title`, `subtitle`, `imageUrl`, `targetUrl`, `isActive`, `sortOrder`).
   - `models/Complaint.js`: Schema for abuse complaints (`reporterUserId`, `reporterProfileId`, `reportedUserId`, `reportedProfileId`, `reason`, `category`, `description`, `evidenceUrls`, `status`, `resolutionAction`, `adminNotes`, `resolvedBy`, `resolvedAt`).
2. Controllers & Routes:
   - `controllers/adminController.js` & `routes/adminRoutes.js`:
     - `GET /api/admin/dashboard/metrics` (Real-time aggregated KPIs: total users, active users, suspended users, pending verifications, total candidate profiles, verified profiles, total revenue from successful payments, active subscriptions, pending complaints).
     - `GET /api/admin/users` (List users with search by phone/name, filter by status/verificationStatus, pagination).
     - `GET /api/admin/users/:userId` (Detailed inspection returning user info + all linked candidate profiles + subscriptions + verification documents).
     - `PUT /api/admin/users/:userId/status` (Toggle user status to 'Active' or 'Suspended', reason, logs immutable audit log via `auditService.logAction`).
     - `GET /api/admin/users/export/csv` (Export user list to CSV).
   - `controllers/cmsController.js` & `routes/cmsRoutes.js`:
     - Public: `GET /api/cms/pages/:key`, `GET /api/cms/pages`, `GET /api/cms/banners`.
     - Admin: `PUT /api/admin/cms/pages/:key`, `POST /api/admin/banners`, `PUT /api/admin/banners/:id`, `DELETE /api/admin/banners/:id`.
     - Seed script in `scripts/seedCMS.js` and include in `scripts/seedAll.js`.
   - `controllers/complaintController.js` & `routes/complaintRoutes.js`:
     - User: `POST /api/complaints` (report abuse against user/profile).
     - Admin: `GET /api/admin/complaints` (list with filters), `GET /api/admin/complaints/:id`, `PUT /api/admin/complaints/:id/resolve` (resolve complaint with action: 'Warning Sent' | 'User Suspended' | 'Profile Removed' | 'Dismissed'; if action === 'User Suspended', automatically sets `User.status = 'Suspended'`, logs audit log).
   - `controllers/auditController.js` & `routes/auditRoutes.js`:
     - `GET /api/admin/audit-logs` (Paginated query of immutable audit log records with actor, action, target, date filters, search).
3. Routes Mounting:
   - Mount in `routes/index.js` under `/admin`, `/cms`, `/complaints`, `/audit-logs`.
4. Integration Test Suite:
   - Create `tests/admin.test.js` covering dashboard metrics aggregation, user status toggle & CSV export, CMS static pages and banner CRUD, complaint submission & resolution with suspension action, and audit trail query API.
5. Verification:
   - Run `npm test` and ensure all test suites pass 100%.
6. Write your handoff report to `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m5\handoff.md` and send a message to parent.
