## 2026-08-14T07:32:36Z

You are Worker 2 (Candidate Biodata & Multi-Profile Management Engineer).
Your working directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m2
The project source directory is: c:\Users\admin\Desktop\appzeto-2\agarwal\backend
The user request specification is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\ORIGINAL_REQUEST.md
The architecture document is in: c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\PROJECT.md
Survey reports:
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\survey_explorer_1\handoff.md
- c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\survey_explorer_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Scope for Milestone 2 (M2):
1. Create `models/Profile.js`:
   - `userId` (ref: 'User', required, index)
   - `profileId` (unique string, e.g. `PRF-XXXX`)
   - `profileFor` (enum: 'Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend')
   - Personal Details: `fullName`, `gender` ('Male', 'Female'), `dob`, `tob`, `pob`, `height`, `complexion`, `maritalStatus`, `bloodGroup`, `diet`, `hobbies`, `bio`
   - Astrology & Gotra: `gotra` (validated against authentic 18 Gotras), `motherGotra`, `manglik` ('Non-Manglik', 'Manglik', 'Anshik Manglik', "Don't Know"), `rashi`, `nakshatra`
   - Education & Career: `qualification`, `educationLevel`, `workingAt`, `occupation`, `occupationType`, `income`
   - 3-Generation Family Tree: `grandfather`, `grandmother`, `maternalGrandfather`, `maternalGrandmother`, `father`, `fatherOccupation`, `fatherOccupationDetails`, `mother`, `motherOccupation`, `familyType`, `familyValues`, `familyOrigin`
   - Dynamic Relatives Subdocuments (embedded relativeSchema `{ _id: true, name: String, status: 'Unmarried'|'Married'|'Divorced'|'Widowed', spouseName: String, homePlace: String, occupation: String }`): `brotherList`, `sisterList`, `taujiList`, `chachaList`, `buajiList`, `mamajiList`, `masijiList`
   - Contact & Address: `residentialAddress`, `city`, `state`, `mobileNumber`, `privacySettings: { phoneVisibility, addressVisibility, photoVisibility }`
   - Media: `profilePicture` (url string), `gallery: [{ id, url, caption, isPrimary }]`
   - Badges & Metrics: `verified` (boolean, default: false), `isFeatured` (boolean, default: false), `completionPercentage` (number, default: 0), `matchScore` (number, default: 0)
2. Create `services/profileScoreService.js`:
   - Calculates section-by-section completion percentage (0-100%):
     - Personal Details: 25%
     - Astrological & Gotra: 15%
     - Education & Profession: 20%
     - Family Tree & Relatives: 25%
     - Media & Contact Info: 15%
   - Returns `{ percentage: number, breakdown: { personal, astrology, education, family, media } }`
3. Create `middleware/upload.js`:
   - Configures Multer storage saving to `uploads/profiles/` and `uploads/documents/`
   - Sanitizes filenames with UUID/timestamp and validates MIME types (image/jpeg, image/png, image/webp) with max size 5MB.
4. Create `controllers/profileController.js`:
   - `createProfile`: Creates candidate profile, links to user, sets activeProfileId if first profile, recalculates completion score.
   - `getMeProfile`: Gets active profile for logged-in user with completion breakdown.
   - `getUserProfiles`: Gets all profiles owned by logged-in user.
   - `switchActiveProfile`: Switches active profile ID for logged-in user.
   - `getProfileById`: Gets public/detailed profile by ID (applies privacy masking on contact/address if not allowed).
   - `updateProfile`: Updates profile biodata fields, recalculates completion score.
   - `deleteProfile`: Deletes profile (ensures user owns it).
   - `uploadProfilePhoto`: Handles single avatar photo upload, updates `profilePicture` and recalculates score.
   - `uploadGalleryPhoto`: Adds photo to gallery (up to 6 photos max).
   - `deleteGalleryPhoto`: Removes photo from gallery.
   - `getCompletionScore`: Returns breakdown of completion percentage.
5. Create `routes/profileRoutes.js`:
   - Mounts all profile routes protected by `auth` middleware.
   - Register in `routes/index.js` under `/api/profiles`.
6. Create `tests/profile.test.js`:
   - Test profile creation with valid 18 Gotras (and rejection of invalid gotras).
   - Test 3-generation family tree and dynamic relative lists.
   - Test multi-profile management under one User (switch active profile, get user profiles).
   - Test profile completion score calculation and breakdown.
   - Test photo upload endpoints (avatar and gallery max 6).
   - Test privacy settings visibility.
7. Run `npm test` across all test suites and verify 100% pass (0 failures).
8. Document all findings and test results in `c:\Users\admin\Desktop\appzeto-2\agarwal\.agents\worker_m2\handoff.md` and report back.
