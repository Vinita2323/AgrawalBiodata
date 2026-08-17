# Challenger Milestone 2 Handoff Report

**Milestone**: Milestone 2 (Candidate Biodata & Multi-Profile Management)  
**Agent**: Challenger M2 (`challenger_m2`)  
**Verdict**: **`APPROVE`**  
**Date**: 2026-08-14T07:42:30Z  

---

## 1. Observation

Empirical testing and boundary analysis were conducted directly against the backend codebase. The following exact behaviors, status codes, and outputs were observed:

### A. Gotra Validation Boundaries
- **Invalid Gotra creation rejection (400 Bad Request)**:
  - Attempted creation with non-Agarwal gotras (`Gupta`, `Sharma`, `Verma`, `Kashyap`, `Agarwal`, `Jat`, `InvalidGotra`, `12345`, `<script>`, NoSQL objects, and empty/whitespace strings).
  - Result: All returned `HTTP 400 Bad Request` with `code: "INVALID_GOTRA"` and error message indicating invalid Gotra.
- **Gotra canonical normalization**:
  - Accepted all 18 authentic Agarwal Gotras (`Garg`, `Goyal`, `Bansal`, `Bindal`, `Mittal`, `Singhal`, `Jindal`, `Tingal`, `Tayal`, `Airan`, `Dharan`, `Madhukul`, `Goyan`, `Kuchhal`, `Kansal`, `Nangal`, `Mangal`, `Bhandal`), aliases (`Goel` -> `Goyal`, `Kushal` -> `Kuchhal`, `Dhingan` -> `Goyan`, `Nagal` -> `Nangal`), Hindi Devanagari (`गर्ग` -> `Garg`), and composite bilingual strings (`गर्ग (Garg)` -> `Garg`).
- **Mother Gotra validation**:
  - Invalid `motherGotra` returned `HTTP 400 Bad Request` on both creation and update endpoints.
- **Gotra mutation immutability**:
  - Attempting to update `gotra` with an invalid string via `PUT /api/profiles/:profileId` returned `HTTP 400` and preserved the existing valid gotra in the database.

### B. Gallery Photo Upload Limits (Max 6 Photos)
- **Consecutive Uploads (Photos 1 to 6)**:
  - POST `/api/profiles/:profileId/gallery` successfully accepted 6 consecutive image uploads, creating unique subdocument IDs, updating timestamps, and updating profile completion scores.
- **7th Photo Upload Rejection (400 Bad Request)**:
  - Attempting to upload a 7th photo returned `HTTP 400 Bad Request` with error payload: `"Maximum 6 gallery photos allowed per profile"`.
  - The database array length remained strictly clamped at 6.
- **Photo Deletion and Re-upload**:
  - Deleting a gallery photo via `DELETE /api/profiles/:profileId/gallery/:photoId` reduced the count to 5, and immediately permitted uploading a new 6th photo.
- **Direct Schema Enforcement**:
  - Mongoose validation validator on `gallery` schema property enforces `val.length <= 6`.

### C. Multi-Profile Ownership & Authorization Controls (403 Forbidden)
- **Cross-user profile activation**:
  - User 1 attempting to activate User 2's profile via `POST /api/profiles/switch-active` or `PUT /api/profiles/switch/:profileId` was rejected with `HTTP 403 Forbidden` (`"You do not have permission to activate a profile owned by another user"`).
- **Cross-user profile mutation and deletion**:
  - `PUT /api/profiles/:profileId` by a non-owner returned `HTTP 403 Forbidden`.
  - `DELETE /api/profiles/:profileId` by a non-owner returned `HTTP 403 Forbidden`.
  - `POST /api/profiles/:profileId/photo` and `POST /api/profiles/:profileId/gallery` by a non-owner returned `HTTP 403 Forbidden`.
- **Suspended accounts**:
  - Suspended users were blocked with `HTTP 403 Forbidden` from accessing profile endpoints.

### D. Privacy Masking for Non-Owners & Guests
- **Owner View**:
  - Owner accessing own profile (`GET /api/profiles/:profileId`) receives unmasked mobile number (e.g., `+91 98290 55443`), unmasked address (`House 42, Civil Lines, Jaipur`), and `isOwner: true`.
- **Non-Owner & Public Guest View**:
  - When `phoneVisibility: "Connected Members Only"`: Mobile number is masked as `+91 98290 XXXXX` (`phoneMasked: true`).
  - When `addressVisibility: "Connected Members Only"`: Address is masked as `Protected (Available on Connection)` (`addressMasked: true`).
  - When `phoneVisibility: "Hidden"`: Mobile number is set to `Protected`.
  - City and State fields (`Jaipur`, `Rajasthan`) remain unmasked for matrimonial search context.

### E. Profile Completion Score Weighted Engine
- The 5-section weighted scoring engine (`profileScoreService.js`) was tested across granular combinations:
  1. **Personal Details (Max 25%)**: Full name (5) + Gender (5) + DOB (5) + Gotra (5) + Height/Complexion (5) = 25%.
  2. **Astrology & Gotra (Max 15%)**: TOB (4) + POB (4) + Mother's Gotra (4) + Manglik (3) = 15%.
  3. **Education & Career (Max 20%)**: Qualification (8) + Occupation/Company (7) + Income (5) = 20%.
  4. **Family Tree & Relatives (Max 25%)**: Father (4) + Father Occupation (4) + Mother (5) + Grandfather (4) + Relatives List (8) = 25%.
  5. **Media & Contact (Max 15%)**: Avatar/Gallery (10) + Address/City/State (2.5) + Mobile (2.5) = 15%.
  - Total combines deterministically to **100%**.
  - `GET /api/profiles/me/completion` and `GET /api/profiles/:profileId/completion` return exact percentage and breakdown objects.

### F. Automated Test Suite Execution
```
Test Suites: 5 passed, 5 total
Tests:       130 passed, 130 total
Snapshots:   0 total
Time:        18.15 s
```
All 5 test suites (`tests/challenger_m2.test.js`, `tests/profile.test.js`, `tests/challenger_m1.test.js`, `tests/adversarial.test.js`, `tests/auth.test.js`) executed with 100% passing tests.

---

## 2. Logic Chain

1. **Gotra Integrity**: In matrimonial platforms catering to specific communities, Gotra validation is essential for traditional exogamy. The implementation uses a dual layer of validation: controller pre-check (`isValidGotra`) and Mongoose model validator (`validate: { validator: isValidGotra }`), ensuring no invalid or corrupted Gotra can enter the database.
2. **Media Quota Enforcement**: The 6-photo gallery ceiling is enforced both at the upload handler (`uploadGalleryPhoto`: checking `profile.gallery.length >= 6`) and at the Mongoose schema validator level (`val.length <= 6`), protecting against race conditions and payload spoofing.
3. **Multi-Profile Isolation**: The profile switching logic verifies `profile.userId.toString() === req.user.userId` before modifying `user.activeProfileId`. This prevents unauthorized account hijacking or cross-profile linkage.
4. **Privacy Shield**: The privacy masking layer in `getProfileById` executes before serialization, checking `isOwner`. Non-owners receive masked sensitive fields (`phoneMasked: true`, `addressMasked: true`) without exposing raw PII in JSON responses.
5. **Deterministic Scoring**: The 5-section breakdown is mathematical, deterministic, and auto-calculated during create, update, and photo upload operations.

---

## 3. Caveats

- **No Caveats**: All 5 mandatory challenger test categories were empirically executed and passed. Test suite is robust, covers edge cases, boundary conditions, malicious payloads, and authorization barriers.

---

## 4. Conclusion

**Verdict: `APPROVE`**

Milestone 2 (Candidate Biodata & Multi-Profile Management) meets and exceeds all specification requirements. The system cleanly enforces:
1. Strict 18 authentic Gotra validation with normalization across Hindi, English, and aliases.
2. Hard boundary limit of 6 gallery photos with 400 rejection for excess uploads.
3. Strict 403 Forbidden enforcement against cross-user profile activation and tampering.
4. Comprehensive privacy masking for non-owners and unauthenticated guests.
5. 5-section weighted profile completion scoring engine (25% + 15% + 20% + 25% + 15% = 100%).

---

## 5. Verification Method

To independently verify all empirical tests:

```bash
cd backend
npm test
```

Specific test targets:
```bash
# Run Milestone 2 Challenger adversarial boundary suite
npx jest tests/challenger_m2.test.js --runInBand

# Run core Milestone 2 profile suite
npx jest tests/profile.test.js --runInBand
```
