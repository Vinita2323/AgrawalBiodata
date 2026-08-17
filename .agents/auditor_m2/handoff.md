# Forensic Audit Report — Milestone 2: Candidate Biodata & Multi-Profile Management

**Work Product**: `backend/` (Candidate Biodata, Multi-Profile Engine, 18 Gotras Validation, Family Tree Subdocuments, Media Upload & Profile Completion Calculation)  
**Profile**: General Project (Development Mode per `ORIGINAL_REQUEST.md`)  
**Verdict**: **`CLEAN`**

---

## 1. Observation

### 1.1 Source Code & Static Analysis Observations
1. **18 Authentic Agarwal Gotras Enum & Validation** (`backend/utils/gotras.js:6-126`, `backend/config/constants.js:6-25`):
   - Exactly 18 canonical Agarwal gotras mapped to Maharaja Agrasen's 18 sons: `Garg`, `Goyal`, `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan`, `Kuchhal`, `Kansal`, `Nangal`, `Mangal`, `Bhandal`.
   - Normalization function `normalizeGotra` handles bilingual formats (e.g. `गर्ग (Garg)`), Hindi Devanagari script, case-insensitive English, and common aliases (`Goel` -> `Goyal`, `Kushal` -> `Kuchhal`, `Nagal` -> `Nangal`, `Dhingan` -> `Goyan`).
   - Rejects non-authentic strings, empty strings, and script/injection payloads with boolean `false` / `null`.

2. **Mongoose Profile Schema & Relative Subdocuments** (`backend/models/Profile.js:12-446`):
   - Mongoose schema `profileSchema` contains 8 structured sections: Personal & Physical, Astrology & Gotra, Education & Career, 3-Generation Family Tree (`grandfather`, `grandmother`, `maternalGrandfather`, `maternalGrandmother`, `father`, `mother`), 7 dynamic relative collections (`brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList` with embedded subdocument schema), Contact/Address with Privacy Controls, and Media Gallery (`galleryPhotoSchema`).
   - Custom validators enforce Gotra validation via `isValidGotra(value)` on both `gotra` and `motherGotra`.
   - Max 6 gallery photos enforced by Mongoose validator (`val.length <= 6`).
   - Pre-save hook normalizes Gotra and automatically assigns unique `PRF-XXXXXX` profile identifiers.

3. **5-Section Weighted Profile Completion Engine** (`backend/services/profileScoreService.js:34-138`):
   - Computes dynamic completion breakdown:
     - **Personal Details**: 25% (`fullName` 5%, `gender` 5%, `dob` 5%, `gotra` 5%, `height` 2.5%, `complexion` 2.5%)
     - **Astrological Details**: 15% (`tob` 4%, `pob` 4%, `motherGotra` 4%, `manglik` 3%)
     - **Education & Profession**: 20% (`qualification` 8%, `occupation` 4%, `workingAt` 3%, `income` 5%)
     - **Family Tree & Relatives**: 25% (`father` 4%, `fatherOccupation` 4%, `mother` 5%, `grandfather`/`maternalGrandfather` 4%, dynamic relative list check 8%)
     - **Media & Contact Info**: 15% (`profilePicture`/gallery 10%, address/city/state 2.5%, `mobileNumber` 2.5%)
   - Pure arithmetic calculation with no hardcoded returns or mocked scores.

4. **Multi-Profile Ownership & Privacy Masking** (`backend/controllers/profileController.js:14-845`):
   - 1 User -> N Profiles relationship tracked via `User.profiles` array and `User.activeProfileId`.
   - Ownership check enforces `profile.userId.toString() === req.user.userId` before update, delete, switch active, or photo upload; returns `403 Forbidden` on unauthorized access.
   - Non-owner and guest viewers receive masked phone numbers (`+91 98290 XXXXX` or `Protected`) and masked address (`Protected (Available on Connection)`) according to privacy settings (`phoneVisibility`, `addressVisibility`).

5. **Multer Media Upload** (`backend/middleware/upload.js:23-113`):
   - Multer `diskStorage` saves uploaded photos to `uploads/profiles/` and KYC documents to `uploads/documents/`.
   - MIME types strictly filtered (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`).
   - File size limited to 5MB (`MAX_FILE_SIZE`).
   - `handleUpload` wrapper catches Multer errors and responds with standard `400 Bad Request` JSON envelope.

6. **Static Analysis for Cheating & Mocks**:
   - Zero hardcoded mock returns.
   - Zero facade functions or uncomputed constant returns.
   - Zero pre-populated test report artifacts.

### 1.2 Runtime Test Verification Output
Running `npm test` executes the complete Jest integration and adversarial test suite:

```
PASS tests/challenger_m2.test.js
PASS tests/challenger_m1.test.js
PASS tests/auth.test.js
PASS tests/adversarial.test.js
PASS tests/profile.test.js

Test Suites: 5 passed, 5 total
Tests:       130 passed, 130 total
Snapshots:   0 total
Time:        17.225 s
Ran all test suites.
```
- Total test suites: **5 passed / 5 total**
- Total test cases: **130 passed / 130 total (100% pass rate)**
- Exit Code: **0**

---

## 2. Logic Chain

1. **Static Analysis & Schema Validation**:
   - Verification of `models/Profile.js` and `utils/gotras.js` proves that the authentic 18 Agarwal gotras are strictly checked using Mongoose custom validators and normalization hooks.
   - Verification of `models/Profile.js` proves that the 3-generation family tree and 7 dynamic relative collections are modelled as genuine Mongoose subdocument arrays.
   - Verification of `services/profileScoreService.js` confirms that section scores are calculated dynamically using field-presence heuristics rather than static mock percentages.

2. **Access Control & Ownership Logic**:
   - Verification of `controllers/profileController.js` lines 316-318, 426-428, 605-607, 657-659, 708-710 confirms that all mutating endpoints verify profile ownership (`profile.userId.toString() === req.user.userId`) and return `403 Forbidden` on cross-user operations.
   - Verification of `getProfileById` confirms that sensitive fields (`mobileNumber`, `residentialAddress`) are dynamically masked for non-owner users according to privacy configurations.

3. **Media Upload Robustness**:
   - Verification of `middleware/upload.js` and `controllers/profileController.js:712-714` confirms that Multer multipart file upload is genuine, validates MIME types, limits file size to 5MB, and strictly enforces a ceiling of 6 gallery photos per profile.

4. **Runtime & Adversarial Test Execution**:
   - Running `npm test` executes 130 integration and adversarial test cases across all M1 and M2 modules against an in-memory MongoDB instance.
   - All 130 tests pass with exit code 0, confirming runtime correctness, API contract conformance, and zero runtime crashes.

---

## 3. Caveats
- No external S3 / Cloudinary cloud storage was configured in M2 as local disk storage (`uploads/profiles/`) was specifically mandated for M2. Cloud storage drivers can be added seamlessly via Multer storage plugins in future milestones if required.

---

## 4. Conclusion
The implementation of Milestone 2 (Candidate Biodata & Multi-Profile Management) in `backend/` is complete, authentic, robust, and free of any hardcoding, mocks, or integrity violations.

**Explicit Verdict**: **`CLEAN`**

---

## 5. Verification Method

To independently reproduce and verify this audit:

1. Open PowerShell in `c:\Users\admin\Desktop\appzeto-2\agarwal\backend`.
2. Run the automated test suite:
   ```bash
   npm test
   ```
   **Expected Result**: All 5 test suites pass, 130/130 tests pass with exit code 0.

3. Verify Gotra Exogamy & 18 Gotras normalization interactively or via test:
   ```bash
   npx jest tests/profile.test.js --verbose
   ```
4. Verify Multer and Profile Creation endpoints via curl / Postman:
   - `POST /api/profiles` with valid Gotra returns 201 Created with generated `PRF-XXXXXX`.
   - `POST /api/profiles` with invalid Gotra (e.g. `Sharma`) returns 400 Bad Request (`INVALID_GOTRA`).
   - `GET /api/profiles/:profileId/completion` returns calculated section breakdown sum matching `percentage`.
