# Review & Adversarial Audit Handoff Report: Milestone 2

**Agent**: Reviewer & Critic (Milestone 2)  
**Target Milestone**: Milestone 2 (Candidate Biodata & Multi-Profile Management)  
**Date & UTC Timestamp**: 2026-08-14T07:39:40Z  
**Verdict**: **APPROVE**  

---

## 1. Observation

Direct inspection of the Milestone 2 codebase in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend` and empirical execution of test suites yielded the following verified findings:

1. **Profile Model (`models/Profile.js`)**:
   - `gotra` & `motherGotra`: Schema validator calls `isValidGotra()` ensuring strict adherence to the authentic 18 Agarwal gotras (`Garg`, `Goyal`, `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan`, `Kuchhal`, `Kansal`, `Nangal`, `Mangal`, `Bhandal`). Pre-save hooks normalize aliases (e.g., `Goel` -> `Goyal`, bilingual strings `"गर्ग (Garg)"` -> `Garg`).
   - 3-Generation Family Tree: Fields defined for `grandfather`, `grandmother`, `maternalGrandfather`, `maternalGrandmother`, `father`, `fatherOccupation`, `fatherOccupationDetails`, `mother`, `motherOccupation`, `familyType`, `familyValues`, `familyOrigin`.
   - 7 Relative Subdocument Arrays: Embedded `relativeSchema` (`_id: true`, `name`, `relationType`, `status`, `spouseName`, `homePlace`, `occupation`) across `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, and `masijiList`.
   - Privacy Settings: Nested subdocument `privacySettings: { phoneVisibility, addressVisibility, photoVisibility }` with enum protection.
   - Media: `profilePicture`, `gallery` (with max 6 items validation in schema and virtual `galleryPhotos`).
   - Unique `profileId`: Auto-generated string index (`PRF-XXXXXX`).

2. **Scoring Engine (`services/profileScoreService.js`)**:
   - Implements genuine 5-section weighted calculation totaling 100%:
     - Personal Details (25%): `fullName` (5%), `gender` (5%), `dob` (5%), `gotra` (5%), `height`/`complexion` (5%).
     - Astrological Details (15%): `tob` (4%), `pob` (4%), `motherGotra` (4%), `manglik` (3%).
     - Education & Profession (20%): `qualification` (8%), `occupation`/`workingAt` (7%), `income` (5%).
     - Family Tree & Relatives (25%): `father` & `fatherOccupation` (8%), `mother` (5%), grandparents (4%), dynamic relatives list entry (8%).
     - Media & Contact Info (15%): `profilePicture`/`gallery` (10%), `residentialAddress`/`city` & `mobileNumber` (5%).
   - Dynamic calculation handles missing, partial, and full profiles with zero NaN/TypeError risks.

3. **Upload Middleware (`middleware/upload.js`)**:
   - Multer disk storage configured for `uploads/profiles/` and `uploads/documents/`.
   - Filename sanitization using timestamp + random hex bytes (`profile-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`).
   - Size limit strictly set to 5MB (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
   - MIME type filtering for JPEG, PNG, and WebP images.
   - Higher-order error wrapper `handleUpload` catching Multer errors and responding with 400 Bad Request.

4. **Controllers & Routes (`controllers/profileController.js`, `routes/profileRoutes.js`)**:
   - CRUD operations: `createProfile`, `getMeProfile`, `getUserProfiles`, `switchActiveProfile`, `getProfileById`, `updateProfile`, `deleteProfile`.
   - Media operations: `uploadProfilePhoto`, `uploadGalleryPhoto` (enforcing 6 photo max limit), `deleteGalleryPhoto`.
   - Completion endpoint: `getCompletionScore` returning percentage and section-by-section breakdown.
   - Multi-profile switching: Validates ownership before switching `user.activeProfileId`, returns 403 Forbidden for cross-user attempts.
   - Privacy masking in `getProfileById`: Masks phone number (`+91 98290 XXXXX` or `"Protected"`) and address for non-owners based on `privacySettings`.
   - Cascade on deletion: Cleans up `user.profiles` array and reassigns `user.activeProfileId` to remaining profile or `null`.

5. **Test Execution**:
   - `npm test`: Executed 4 test suites (`tests/profile.test.js`, `tests/auth.test.js`, `tests/challenger_m1.test.js`, `tests/adversarial.test.js`).
   - **106 total tests passed, 0 failures, 0 errors**.
   - `npx jest tests/profile.test.js --verbose`: 27 tests passed covering all Milestone 2 requirements.

---

## 2. Logic Chain

1. **Integrity Check**:
   - Code was audited for facade patterns, dummy implementations, or hardcoded return values. All profile CRUD, scoring arithmetic, and Gotra checks execute dynamic logic against database state and inputs.
   - Zero integrity violations detected.
2. **Requirement Conformance**:
   - Requirement R2 specifies 18 Gotras validation, 3-generation family tree, 7 relative arrays, multi-profile switcher, 5-section scoring engine, Multer photo/gallery upload, and privacy masking.
   - All specified capabilities are implemented and verified via automated integration tests.
3. **Adversarial Robustness**:
   - Cross-user activation attempts return 403 Forbidden.
   - Cross-user edit/delete attempts return 403 Forbidden.
   - Gallery uploads beyond 6 items return 400 Bad Request.
   - Invalid Gotras return 400 Bad Request with `INVALID_GOTRA`.
   - Deletion of the active profile cascades cleanly to remaining profiles or `null`.

---

## 3. Caveats

- **Local File Storage**: Media files are written to local disk under `backend/uploads/`. Production deployments in clustered or serverless environments will require swapping the disk storage engine for an S3/Cloudflare R2 storage adapter.
- **Privacy Granularity**: Phone number masking uses a standard suffix mask (`XXXXX`). When connected status is added in Milestone 3, the connection check can dynamically toggle full unmasking for accepted matches.

---

## 4. Conclusion

Milestone 2 deliverables are complete, architecturally sound, thoroughly tested, and adhere to all domain requirements. The implementation passes all quality, security, and adversarial checks.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce the verification results:

```bash
# 1. Navigate to backend directory
cd c:\Users\admin\Desktop\appzeto-2\agarwal\backend

# 2. Run full test suite across all milestones
npm test

# 3. Run Milestone 2 test suite specifically
npx jest tests/profile.test.js --verbose
```
