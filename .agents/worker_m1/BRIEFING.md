# BRIEFING — 2026-08-14T09:34:30Z

## Mission
Implement Milestone 1: API Client Layer & Vite Reverse Proxy for the Agarwal Matrimony platform.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa
- Working directory: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m1
- Original parent: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b
- Milestone: Milestone 1 - API Client Layer & Vite Reverse Proxy

## 🔒 Key Constraints
- Pure genuine implementation, no dummy mocks or hardcoded responses.
- Configure `frontend/vite.config.js` proxy for `/api` and `/uploads` to `http://localhost:5000`.
- Create centralized HTTP client `frontend/src/services/api.js` supporting token injection (user and admin), standard envelope unwrapping, JSON & FormData handling, and normalized error throwing.
- Implement domain service modules: `authService.js`, `profileService.js`, `matchService.js`, `interestService.js`, `socialService.js`, `paymentService.js`, `verificationService.js`, `cmsService.js`, `adminService.js`.
- Clean build verification with `npm run build` in `frontend/`.

## Current Parent
- Conversation ID: 7ef8af4e-48ce-4f5d-a173-ce643eca3c4b
- Updated: 2026-08-14T09:34:30Z

## Task Summary
- **What to build**: Centralized API service layer and Vite dev proxy configuration.
- **Success criteria**: All 11 domain service files and vite.config.js cleanly created/updated, accurate backend API endpoints matching backend routes, clean frontend build.
- **Interface contracts**: Backend route declarations discovered in surveys (`backend/src/routes/`).
- **Code layout**: `frontend/src/services/*.js`, `frontend/vite.config.js`.

## Change Tracker
- **Files modified**: [TBD]
- **Build status**: pending
- **Pending issues**: none

## Quality Status
- **Build/test result**: pending
- **Lint status**: pending
- **Tests added/modified**: pending

## Key Decisions Made
- Centralized `api.js` will handle query string serialization, bearer auth token discovery (`token`, `accessToken`, `adminToken`), envelope unwrapping (`data` vs full response), error extraction (`error` or `message`), and file uploads.

## Artifact Index
- `frontend/vite.config.js`
- `frontend/src/services/api.js`
- `frontend/src/services/authService.js`
- `frontend/src/services/profileService.js`
- `frontend/src/services/matchService.js`
- `frontend/src/services/interestService.js`
- `frontend/src/services/socialService.js`
- `frontend/src/services/paymentService.js`
- `frontend/src/services/verificationService.js`
- `frontend/src/services/cmsService.js`
- `frontend/src/services/adminService.js`
