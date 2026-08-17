# Handoff Report: Milestone 2 — Candidate Biodata & Multi-Profile Management

**Agent**: Worker 2 (Candidate Biodata & Multi-Profile Management Engineer)  
**Target Milestone**: Milestone 2 (M2)  
**Date & UTC Timestamp**: 2026-08-14T07:38:00Z  

---

## 1. Observation

Direct inspection and execution of the codebase in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend` produced the following verified observations:

1. **Model Implementation (`models/Profile.js`)**:
   - Schema defines `userId` (ObjectId referencing `User`, indexed, required), `profileId` (unique string index, auto-generated `PRF-XXXXXX`), `profileFor` (`Self`, `Son`, `Daughter`, `Brother`, `Sister`, `Relative`, `Friend`).
   - Personal & Physical details: `fullName`, `gender` (Male/Female), `dob`, `tob`, `pob`, `height`, `complexion`, `maritalStatus`, `bloodGroup`, `diet`, `hobbies`, `bio`.
   - Astrology & Gotra: `gotra` (validated against authentic 18 Gotras), `motherGotra` (validated against 18 Gotras if provided), `manglik` (`Non-Manglik`, `Manglik`, `Anshik Manglik`, `Don't Know`), `rashi`, `nakshatra`.
   - Education & Career: `qualification`, `educationLevel`, `workingAt`, `occupation`, `occupationType`, `income`.
   - 3-Generation Family Tree: `grandfather`, `grandmother`, `maternalGrandfather`, `maternalGrandmother`, `father`, `fatherOccupation`, `fatherOccupationDetails`, `mother`, `motherOccupation`, `familyType`, `familyValues`, `familyOrigin`.
   - Dynamic Relatives Subdocuments: `relativeSchema` (`_id: true`, `name`, `relationType`, `status`, `spouseName`, `homePlace`, `occupation`) across 7 arrays: `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList`.
   - Contact & Privacy: `residentialAddress`, `city`, `state`, `mobileNumber`, `privacySettings: { phoneVisibility, addressVisibility, photoVisibility }`.
   - Media & Metrics: `profilePicture`, `gallery` (max 6 items with `{ id, url, caption, isPrimary }`), `verified`, `isFeatured`, `completionPercentage`, `matchScore`.

2. **Scoring Engine (`services/profileScoreService.js`)**:
   - Evaluates profile completion (0–100%) section-by-section:
     - Personal Details: 25%
     - Astrological & Gotra: 15%
     - Education & Profession: 20%
     - Family Tree & Relatives: 25%
     - Media & Contact Info: 15%
   - Returns `{ percentage, breakdown: { personal, astrology, education, family, media } }`.

3. **Upload Middleware (`middleware/upload.js`)**:
   - Multer disk storage targeting `uploads/profiles/` and `uploads/documents/`.
   - UUID and timestamp filename sanitization: `profile-${Date.now()}-${randomBytes}${ext}`.
   - MIME type validation (`image/jpeg`, `image/png`, `image/webp`) with 5MB max size limit.
   - Graceful 400 Bad Request error handling for oversized files and invalid MIME types.

4. **Profile Controller (`controllers/profileController.js`) & Router (`routes/profileRoutes.js`)**:
   - `createProfile` (`POST /api/profiles`): Validates 18 Gotras, creates candidate profile, associates with user, updates `activeProfileId` if first profile, computes completion score.
   - `getMeProfile` (`GET /api/profiles/me`): Retrieves active candidate profile with completion breakdown.
   - `getUserProfiles` (`GET /api/profiles/my-profiles` & `GET /api/profiles/user/all`): Lists all candidate profiles for user with `isActive` flags.
   - `switchActiveProfile` (`POST /api/profiles/switch-active` & `PUT /api/profiles/switch/:profileId`): Switches active profile for user; blocks activating profiles owned by other users (403 Forbidden).
   - `getProfileById` (`GET /api/profiles/:profileId`): Fetches profile; applies privacy masking on phone number, address, and photos for non-owners.
   - `updateProfile` (`PUT /api/profiles/:profileId`): Updates profile biodata and recalculates completion score; validates gotras if updated.
   - `deleteProfile` (`DELETE /api/profiles/:profileId`): Removes profile, cleans user profile list, cascades `activeProfileId`.
   - `uploadProfilePhoto` (`POST /api/profiles/:profileId/photo` & `POST /api/profiles/me/photo`): Uploads avatar and updates completion score.
   - `uploadGalleryPhoto` (`POST /api/profiles/:profileId/gallery` & `POST /api/profiles/me/gallery`): Adds gallery image (enforces max 6 photo limit).
   - `deleteGalleryPhoto` (`DELETE /api/profiles/:profileId/gallery/:photoId`): Deletes gallery image.
   - `getCompletionScore` (`GET /api/profiles/:profileId/completion` & `GET /api/profiles/me/completion`): Returns completion percentage and section breakdown.
   - Master router `routes/index.js` mounts `profileRoutes` under `/profiles` (`/api/profiles`).

5. **Test Results**:
   - Executed `npm test`: 4 test suites passed, 106 tests passed, 0 failures (100% pass rate).
   - `tests/profile.test.js`: 27 passing tests covering Gotra validation, 3-generation family tree, multi-profile switcher, 5-section completion engine, photo upload & gallery limits, privacy masking, and adversarial edge cases.

---

## 2. Logic Chain

1. **Gotra Integrity**: In accordance with the 18 authentic Gotras canonical enum, all inputs to `gotra` and `motherGotra` pass through `isValidGotra()` and `normalizeGotra()`. This normalizes Devanagari script, bilingual strings like `"गर्ग (Garg)"`, and aliases (e.g., `"Goel" -> "Goyal"`), while strictly rejecting non-Agarwal gotras with HTTP 400 `INVALID_GOTRA`.
2. **Multi-Profile Architecture**: A registered `User` account owns an array of `Profile` references. The first profile created automatically sets `User.activeProfileId`. `switchActiveProfile` updates `activeProfileId` with strict user ownership validation (`profile.userId === req.user.userId`). Deleting a profile removes it from `User.profiles` and dynamically reassigns `activeProfileId` to the next remaining profile or `null`.
3. **5-Section Completion Scoring**: The weighted completion algorithm evaluates:
   - Personal (25%): `fullName` (5%), `gender` (5%), `dob` (5%), valid `gotra` (5%), `height`/`complexion` (5%).
   - Astrological (15%): `tob` (4%), `pob` (4%), `motherGotra` (4%), `manglik` (3%).
   - Education & Career (20%): `qualification` (8%), `workingAt`/`occupation` (7%), `income` (5%).
   - Family & Relatives (25%): `father` & `fatherOccupation` (8%), `mother` (5%), grandparents (4%), dynamic relatives list entry (8%).
   - Media & Contact (15%): `profilePicture`/gallery (10%), `residentialAddress`/city & mobile (5%).
   Total = 100%. The score is updated atomically on creation, update, and photo upload.
4. **Privacy Protection**: `getProfileById` checks whether the requester is the owner of the profile. Non-owners receive masked phone numbers (`+91 98290 XXXXX` or `"Protected"`) and masked residential addresses according to `privacySettings.phoneVisibility` and `privacySettings.addressVisibility`.
5. **Media Management**: Multer handles multipart file uploads with MIME filtering (JPEG/PNG/WebP), UUID filename sanitization, and 5MB size limits. The gallery endpoint strictly enforces the 6-photo limit by rejecting the 7th upload with HTTP 400.

---

## 3. Caveats

- **Local Storage for Media**: Uploaded images are currently stored on local disk under `backend/uploads/profiles/` and `backend/uploads/documents/` and statically served via Express `/uploads`. In a cloud-native production deployment, a pluggable S3/Cloudinary storage adapter can be substituted.
- **Dynamic Relatives**: Relative subdocuments support 7 key relational categories (`brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList`). Additional custom relations can be added via the generic relationType field.

---

## 4. Conclusion

Milestone 2 (Candidate Biodata & Multi-Profile Management) is fully implemented, verified, and integrated into the Agrawal Matrimony backend API. All requirements (Profile schema, 18 Gotras validation, 3-generation family tree, dynamic relative collections, multi-profile switcher, 5-section completion score engine, Multer photo/gallery upload, and privacy masking) are operational with 100% test pass rate (106 tests across 4 test suites).

---

## 5. Verification Method

To independently verify the implementation:

1. **Run Full Test Suite**:
   ```bash
   cd c:/Users/admin/Desktop/appzeto-2/agarwal/backend
   npm test
   ```
   **Expected Output**:
   - 4 Test Suites passed (`tests/profile.test.js`, `tests/auth.test.js`, `tests/challenger_m1.test.js`, `tests/adversarial.test.js`).
   - 106 Tests passed, 0 failed.

2. **Inspect Milestone 2 Test Suite Specifically**:
   ```bash
   npx jest tests/profile.test.js
   ```
   **Expected Output**:
   - 27 Tests passed covering Gotra validation, multi-profile switching, completion breakdown, 6-photo gallery boundary, and privacy masking.
