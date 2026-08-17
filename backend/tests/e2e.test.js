/**
 * Master E2E Integration Test Suite (Tier-4 Real-World Journeys)
 * Agrawal Biodata Matrimony Platform Backend REST API
 *
 * Scenarios Covered:
 * Scenario 1: User Full Matrimonial Journey (Register phone -> OTP verification -> Create primary candidate profile with authentic Gotra & relatives -> Upload photo -> Calculate completion (100%) -> Discover matches -> Express interest -> Accept mutual interest -> Contact unmasked).
 * Scenario 2: Admin Moderation & KYC Verification Journey (Admin login -> Fetch dashboard KPIs -> Inspect pending KYC queue -> Approve Aadhaar proof -> Verify candidate profile badge auto-updates to `verified=true` across all user profiles -> View generated audit log entry).
 * Scenario 3: Monetization & Razorpay Webhook Journey (User initiates Gold Plan subscription -> Order created -> Simulated Razorpay webhook event with valid HMAC SHA256 signature (`crypto.createHmac('sha256', secret)`) received -> Subscription auto-activated -> Profile unlocked).
 * Scenario 4: Gotra Exogamy & Match Engine Edge Case Journey (Candidate with Garg Gotra searches matches -> Bansal Gotra candidate scores 90%+; Garg Gotra candidate scores 0% with Sagotra paternal conflict flag; Mother Gotra match candidate gets 50% maternal gotra penalty).
 * Scenario 5: Multi-Profile & Privacy Control Journey (1 User creates Profile A (Self) and Profile B (Sister) -> Sets address visibility to Connected Members Only -> Non-connected user cannot see address -> After interest accepted, address becomes visible).
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Admin = require('../models/Admin');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Verification = require('../models/Verification');
const Interest = require('../models/Interest');
const AuditLog = require('../models/AuditLog');
const OTP = require('../models/OTP');
const seedAdmin = require('../scripts/seedAdmin');
const seedPlans = require('../scripts/seedPlans');
const seedCMS = require('../scripts/seedCMS');
const seedMockData = require('../scripts/seedMockData');
const env = require('../config/env');
const { calculateMatchScore } = require('../services/matchEngine');
const { normalizeGotra, checkGotraExogamy } = require('../utils/gotras');
const { signAccessToken, signAdminToken } = require('../utils/token');

describe('Master E2E Integration Test Suite — Agrawal Matrimony Platform', () => {
  let sampleAvatarBuffer;
  let sampleDocBuffer;

  beforeAll(() => {
    // 1x1 transparent PNG buffer for image/document upload testing
    sampleAvatarBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    sampleDocBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  /* ==========================================================================
     SCENARIO 1: USER FULL MATRIMONIAL JOURNEY
     ========================================================================== */
  it('Scenario 1: User Full Matrimonial Journey (Register phone -> OTP verification -> Create primary candidate profile with authentic Gotra & relatives -> Upload photo -> Calculate completion (100%) -> Discover matches -> Express interest -> Accept mutual interest -> Contact unmasked)', async () => {
    const groomMobile = '9876510001';
    const brideMobile = '9876510002';

    // 1. Groom requests OTP via phone
    const sendOtpRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ mobile: groomMobile });

    expect(sendOtpRes.status).toBe(200);
    expect(sendOtpRes.body.success).toBe(true);
    expect(sendOtpRes.body.data.mobile).toBe(groomMobile);

    // 2. Groom verifies OTP and receives JWT tokens
    const otpRecord = await OTP.findOne({ mobile: groomMobile, isUsed: false }).sort({ createdAt: -1 });
    expect(otpRecord).toBeTruthy();
    expect(otpRecord.otp).toBeDefined();

    const verifyOtpRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        mobile: groomMobile,
        otp: otpRecord.otp
      });

    expect(verifyOtpRes.status).toBe(200);
    expect(verifyOtpRes.body.success).toBe(true);
    expect(verifyOtpRes.body.data.token).toBeDefined();
    const groomToken = verifyOtpRes.body.data.token;

    // 3. Groom creates primary candidate profile with authentic Gotra & complete relatives
    const groomProfileData = {
      fullName: 'Aditya Garg',
      gender: 'Male',
      dob: '1995-05-15',
      tob: '07:30 AM',
      pob: 'Delhi',
      height: "5'11\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'B+',
      diet: 'Vegetarian',
      hobbies: ['Reading', 'Chess', 'Cricket'],
      bio: 'Senior Software Architect at a leading tech firm in Delhi NCR. Value cultural roots and family ties.',
      gotra: 'Garg',
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      rashi: 'Gemini',
      nakshatra: 'Ardra',
      qualification: 'B.Tech + M.Tech Computer Science',
      educationLevel: 'Postgraduate',
      workingAt: 'Google India',
      occupation: 'Software Architect',
      occupationType: 'Private Job',
      income: '45 LPA',
      grandfather: 'Late Shri Rameshwar Dayal Garg',
      grandmother: 'Smt. Shanti Devi Garg',
      maternalGrandfather: 'Shri Om Prakash Goyal',
      maternalGrandmother: 'Smt. Kanta Goyal',
      father: 'Shri Rajesh Garg',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Owner - Garg Trading Co, Delhi',
      mother: 'Smt. Saroj Garg',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Traditional yet Modern',
      familyOrigin: 'Hisar, Haryana',
      brotherList: [
        { name: 'Varun Garg', relationType: 'Brother', status: 'Unmarried', homePlace: 'Delhi', occupation: 'Chartered Accountant' }
      ],
      sisterList: [
        { name: 'Kavita Garg', relationType: 'Sister', status: 'Married', spouseName: 'Manish Bansal', homePlace: 'Jaipur', occupation: 'Assistant Professor' }
      ],
      taujiList: [
        { name: 'Shri Dinesh Garg', relationType: 'Tauji', status: 'Married', spouseName: 'Sunita Garg', homePlace: 'Hisar', occupation: 'Advocate' }
      ],
      chachaList: [
        { name: 'Shri Vinod Garg', relationType: 'Chacha', status: 'Married', spouseName: 'Meena Garg', homePlace: 'Gurugram', occupation: 'Real Estate Developer' }
      ],
      buajiList: [
        { name: 'Smt. Radha Mittal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri O.P. Mittal', homePlace: 'Meerut', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Suresh Goyal', relationType: 'Mamaji', status: 'Married', spouseName: 'Alka Goyal', homePlace: 'Agra', occupation: 'Industrialist' }
      ],
      residentialAddress: 'A-42, Ashok Vihar Phase 1',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: groomMobile,
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      }
    };

    const createProfileRes = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${groomToken}`)
      .send(groomProfileData);

    expect(createProfileRes.status).toBe(201);
    expect(createProfileRes.body.success).toBe(true);
    expect(createProfileRes.body.data.profile.fullName).toBe('Aditya Garg');
    expect(createProfileRes.body.data.profile.gotra).toBe('Garg');
    const groomProfileId = createProfileRes.body.data.profile.profileId;

    // 4. Groom uploads avatar photo
    const uploadRes = await request(app)
      .post('/api/profiles/me/photo')
      .set('Authorization', `Bearer ${groomToken}`)
      .attach('photo', sampleAvatarBuffer, 'aditya_avatar.png');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.profilePicture).toMatch(/^\/uploads\/profiles\//);

    // 5. Groom profile reaches 100% completion score
    const compRes = await request(app)
      .get('/api/profiles/me/completion')
      .set('Authorization', `Bearer ${groomToken}`);

    expect(compRes.status).toBe(200);
    expect(compRes.body.success).toBe(true);
    expect(compRes.body.data.percentage).toBe(100);
    expect(compRes.body.data.breakdown.personal).toBe(25);
    expect(compRes.body.data.breakdown.astrology).toBe(15);
    expect(compRes.body.data.breakdown.education).toBe(20);
    expect(compRes.body.data.breakdown.family).toBe(25);
    expect(compRes.body.data.breakdown.media).toBe(15);

    // 6. Register Bride (Priya Bansal) & create compatible profile
    await request(app).post('/api/auth/send-otp').send({ mobile: brideMobile });
    const brideOtpDoc = await OTP.findOne({ mobile: brideMobile, isUsed: false }).sort({ createdAt: -1 });
    const brideVerifyRes = await request(app).post('/api/auth/verify-otp').send({
      mobile: brideMobile,
      otp: brideOtpDoc.otp
    });
    const brideToken = brideVerifyRes.body.data.token;

    const brideProfileData = {
      fullName: 'Priya Bansal',
      gender: 'Female',
      dob: '1996-08-22',
      tob: '10:15 AM',
      pob: 'Delhi',
      height: "5'6\"",
      complexion: 'Very Fair',
      maritalStatus: 'Never Married',
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      manglik: 'Non-Manglik',
      qualification: 'MBA Finance, B.Com SRCC',
      educationLevel: 'Postgraduate',
      workingAt: 'Deloitte India',
      occupation: 'Senior Financial Consultant',
      income: '30 LPA',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: brideMobile,
      residentialAddress: 'B-14, Model Town, Delhi',
      father: 'Shri Kailash Bansal',
      fatherOccupation: 'Govt Job',
      mother: 'Smt. Pushpa Bansal',
      brotherList: [{ name: 'Aman Bansal', relationType: 'Brother', status: 'Unmarried' }],
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      }
    };

    const brideProfileRes = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${brideToken}`)
      .send(brideProfileData);

    expect(brideProfileRes.status).toBe(201);
    const brideProfileId = brideProfileRes.body.data.profile.profileId;

    // 7. Groom discovers matches and finds Bride as top recommendation (>= 90% score)
    const matchRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${groomToken}`);

    expect(matchRes.status).toBe(200);
    expect(matchRes.body.success).toBe(true);
    expect(matchRes.body.data.matches.length).toBeGreaterThanOrEqual(1);

    const brideMatch = matchRes.body.data.matches.find(m => m.profile.profileId === brideProfileId);
    expect(brideMatch).toBeDefined();
    expect(brideMatch.matchScore).toBeGreaterThanOrEqual(90);
    expect(brideMatch.isSagotra).toBe(false);
    expect(brideMatch.hasMaternalConflict).toBe(false);
    expect(brideMatch.breakdown.gotra.score).toBe(30);

    // 8. Groom expresses interest in Bride (Pending status)
    const interestRes = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${groomToken}`)
      .send({
        recipientProfileId: brideProfileId,
        message: 'Namaste, we found your biodata very suitable.'
      });

    expect(interestRes.status).toBe(201);
    expect(interestRes.body.success).toBe(true);
    expect(interestRes.body.data.interest.status).toBe('Pending');
    const interestId = interestRes.body.data.interest.id || interestRes.body.data.interest._id;

    // 9. Before acceptance, Bride contact & address are strictly masked for Groom
    const beforeAcceptViewRes = await request(app)
      .get(`/api/profiles/${brideProfileId}`)
      .set('Authorization', `Bearer ${groomToken}`);

    expect(beforeAcceptViewRes.status).toBe(200);
    expect(beforeAcceptViewRes.body.data.profile.phoneMasked).toBe(true);
    expect(beforeAcceptViewRes.body.data.profile.addressMasked).toBe(true);
    expect(beforeAcceptViewRes.body.data.profile.mobileNumber).toContain('XXXXX');
    expect(beforeAcceptViewRes.body.data.profile.residentialAddress).toContain('Protected');
    expect(beforeAcceptViewRes.body.data.isConnected).toBe(false);

    // 10. Bride accepts mutual interest (Accepted status)
    const acceptRes = await request(app)
      .put(`/api/interests/${interestId}/accept`)
      .set('Authorization', `Bearer ${brideToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.interest.status).toBe('Accepted');

    // 11. After acceptance, Bride contact & address are completely unmasked for Groom
    const afterAcceptViewRes = await request(app)
      .get(`/api/profiles/${brideProfileId}`)
      .set('Authorization', `Bearer ${groomToken}`);

    expect(afterAcceptViewRes.status).toBe(200);
    expect(afterAcceptViewRes.body.data.profile.phoneMasked).toBe(false);
    expect(afterAcceptViewRes.body.data.profile.addressMasked).toBe(false);
    expect(afterAcceptViewRes.body.data.profile.mobileNumber).toBe(brideMobile);
    expect(afterAcceptViewRes.body.data.profile.residentialAddress).toBe('B-14, Model Town, Delhi');
    expect(afterAcceptViewRes.body.data.isConnected).toBe(true);

    // Also verify Bride viewing Groom gets unmasked contact & address
    const groomViewRes = await request(app)
      .get(`/api/profiles/${groomProfileId}`)
      .set('Authorization', `Bearer ${brideToken}`);

    expect(groomViewRes.status).toBe(200);
    expect(groomViewRes.body.data.profile.phoneMasked).toBe(false);
    expect(groomViewRes.body.data.profile.addressMasked).toBe(false);
    expect(groomViewRes.body.data.profile.mobileNumber).toBe(groomMobile);
    expect(groomViewRes.body.data.profile.residentialAddress).toBe('A-42, Ashok Vihar Phase 1');
    expect(groomViewRes.body.data.isConnected).toBe(true);
  });

  /* ==========================================================================
     SCENARIO 2: ADMIN MODERATION & KYC VERIFICATION JOURNEY
     ========================================================================== */
  it('Scenario 2: Admin Moderation & KYC Verification Journey (Admin login -> Fetch dashboard KPIs -> Inspect pending KYC queue -> Approve Aadhaar proof -> Verify candidate profile badge auto-updates to verified=true across all user profiles -> View generated audit log entry)', async () => {
    // 1. Seed Super Admin & login
    await seedAdmin();
    const loginRes = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@matrimonyhub.com',
        password: 'admin123'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.admin.role).toBe('Super Admin');
    const adminToken = loginRes.body.data.token;

    // 2. Fetch dashboard KPIs
    const kpiRes = await request(app)
      .get('/api/admin/dashboard/kpis')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(kpiRes.status).toBe(200);
    expect(kpiRes.body.success).toBe(true);
    expect(kpiRes.body.data).toBeDefined();
    expect(typeof kpiRes.body.data.totalUsers).toBe('number');
    expect(typeof kpiRes.body.data.activeUsers).toBe('number');
    expect(typeof kpiRes.body.data.pendingVerifications).toBe('number');

    // 3. Create Candidate User with 2 profiles (Self and Sister)
    const candidateUser = await User.create({
      mobile: '9876520001',
      name: 'Vikas Goyal',
      email: 'vikas.goyal@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Unverified'
    });
    const candidateToken = signAccessToken(candidateUser);

    const profileA = await Profile.create({
      userId: candidateUser._id,
      profileId: 'PRF-KYC-001',
      fullName: 'Vikas Goyal',
      gender: 'Male',
      dob: new Date('1994-07-10'),
      gotra: 'Goyal',
      motherGotra: 'Bansal',
      profileFor: 'Self',
      verified: false
    });

    const profileB = await Profile.create({
      userId: candidateUser._id,
      profileId: 'PRF-KYC-002',
      fullName: 'Divya Goyal',
      gender: 'Female',
      dob: new Date('1998-03-14'),
      gotra: 'Goyal',
      motherGotra: 'Bansal',
      profileFor: 'Sister',
      verified: false
    });

    candidateUser.activeProfileId = profileA._id;
    candidateUser.profiles = [profileA._id, profileB._id];
    await candidateUser.save();

    // 4. Candidate submits KYC documents
    const submitRes = await request(app)
      .post('/api/verification/submit')
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('documentType', 'Aadhaar Card')
      .field('documentNumber', '1234-5678-9012')
      .attach('idProof', sampleDocBuffer, 'aadhaar_card.png')
      .attach('professionProof', sampleDocBuffer, 'degree.png');

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.verification.status).toBe('Pending');
    expect(submitRes.body.data.verification.idProofUrl).toMatch(/^\/uploads\/documents\//);
    const verificationId = submitRes.body.data.verification._id;

    // 5. Admin inspects pending KYC queue & side-by-side candidate details
    const queueRes = await request(app)
      .get('/api/admin/verifications?status=Pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.success).toBe(true);
    expect(queueRes.body.data.items.length).toBeGreaterThanOrEqual(1);

    const detailRes = await request(app)
      .get(`/api/admin/verifications/${verificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.verification.documentType).toBe('Aadhaar Card');
    expect(detailRes.body.data.candidateProfiles.length).toBe(2);

    // 6. Admin approves verification with notes
    const approveRes = await request(app)
      .put(`/api/admin/verifications/${verificationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Aadhaar details and name verified against government portal.'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.verification.status).toBe('Approved');
    expect(approveRes.body.data.userVerificationStatus).toBe('Approved');

    // 7. Verified badge auto-updates to verified=true across ALL candidate profiles of the user
    const updatedUser = await User.findById(candidateUser._id);
    expect(updatedUser.verificationStatus).toBe('Approved');

    const freshProfileA = await Profile.findById(profileA._id);
    expect(freshProfileA.verified).toBe(true);

    const freshProfileB = await Profile.findById(profileB._id);
    expect(freshProfileB.verified).toBe(true);

    // 8. Admin views generated immutable audit log entry
    const auditRes = await request(app)
      .get('/api/audit-logs?action=Approved')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    const logs = auditRes.body.data.items || auditRes.body.data.logs || [];
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const approvalLog = logs.find(
      log => log.target === verificationId.toString()
    );
    expect(approvalLog).toBeDefined();
    expect(approvalLog.action).toBe('Approved KYC Verification');
    expect(approvalLog.adminName).toBeDefined();
  });

  /* ==========================================================================
     SCENARIO 3: MONETIZATION & RAZORPAY WEBHOOK JOURNEY
     ========================================================================== */
  it('Scenario 3: Monetization & Razorpay Webhook Journey (User initiates Gold Plan subscription -> Order created -> Simulated Razorpay webhook event with valid HMAC SHA256 signature received -> Subscription auto-activated -> Profile unlocked)', async () => {
    // 1. Seed plans
    await seedPlans();
    const goldPlan = await Plan.findOne({ name: 'Gold' });
    expect(goldPlan).toBeTruthy();

    // 2. Create user with Free subscription
    const subscriberUser = await User.create({
      mobile: '9876530001',
      name: 'Manish Mittal',
      email: 'manish.mittal@example.com',
      accountStatus: 'Active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free',
      contactViewLimit: 0,
      contactViewsUsed: 0
    });
    const subscriberToken = signAccessToken(subscriberUser);

    // 3. User initiates Gold Plan subscription order
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${subscriberToken}`)
      .send({
        planId: goldPlan._id.toString(),
        billingCycle: 'monthly'
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderId).toBeDefined();
    expect(orderRes.body.data.amount).toBe(goldPlan.monthlyPrice * 100);
    expect(orderRes.body.data.currency).toBe('INR');

    const orderId = orderRes.body.data.orderId;
    const paymentId = `pay_rzp_${Date.now()}`;

    // Verify payment record in Created status
    const paymentDoc = await Payment.findOne({ orderId });
    expect(paymentDoc).toBeTruthy();
    expect(paymentDoc.status).toBe('Created');

    // 4. Server receives Razorpay webhook payment.captured event with valid HMAC SHA256 signature
    const webhookPayload = {
      entity: 'event',
      account_id: 'acc_rzp_matrimony',
      event: 'payment.captured',
      id: `evt_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: goldPlan.monthlyPrice * 100,
            currency: 'INR',
            status: 'captured',
            method: 'upi'
          }
        }
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const validHmacSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', validHmacSignature)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.data.success).toBe(true);

    // 5. User subscription is automatically activated with Gold benefits and 50 contact unlocks
    const userInDb = await User.findById(subscriberUser._id);
    expect(userInDb.subscriptionStatus).toBe('Active');
    expect(userInDb.subscriptionPlan).toBe('Gold');
    expect(userInDb.contactViewLimit).toBe(50);
    expect(userInDb.subscriptionExpiresAt).toBeDefined();

    const subInDb = await Subscription.findOne({ userId: subscriberUser._id, status: 'Active' });
    expect(subInDb).toBeTruthy();
    expect(subInDb.planId.toString()).toBe(goldPlan._id.toString());
    expect(subInDb.amountPaid).toBe(goldPlan.monthlyPrice);

    // User checks current subscription endpoint
    const currSubRes = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${subscriberToken}`);

    expect(currSubRes.status).toBe(200);
    expect(currSubRes.body.success).toBe(true);
    expect(currSubRes.body.data.subscription.status).toBe('Active');
    expect(currSubRes.body.data.subscription.planName).toBe('Gold');
    expect(currSubRes.body.data.subscription.remainingContactViews).toBe(50);

    // 6. Webhook replay is handled idempotently without creating duplicate subscriptions
    const replayPayload = {
      entity: 'event',
      event: 'payment.captured',
      id: `evt_replay_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: goldPlan.monthlyPrice * 100,
            currency: 'INR',
            status: 'captured'
          }
        }
      }
    };

    const replayString = JSON.stringify(replayPayload);
    const replaySignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(replayString)
      .digest('hex');

    const replayRes = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', replaySignature)
      .send(replayPayload);

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.idempotent).toBe(true);

    const activeSubs = await Subscription.find({ userId: subscriberUser._id, status: 'Active' });
    expect(activeSubs.length).toBe(1);
  });

  /* ==========================================================================
     SCENARIO 4: GOTRA EXOGAMY & MATCH ENGINE EDGE CASE JOURNEY
     ========================================================================== */
  it('Scenario 4: Gotra Exogamy & Match Engine Edge Case Journey (Candidate with Garg Gotra searches matches -> Bansal Gotra candidate scores 90%+; Garg Gotra candidate scores 0% with Sagotra paternal conflict flag; Mother Gotra match candidate gets 50% maternal gotra penalty)', async () => {
    // 1. Groom: Garg Gotra, mother Goyal (28 yrs, B.Tech, Delhi, 30 LPA, Non-Manglik)
    const groomUser = await User.create({
      mobile: '9876540001',
      name: 'Kunal Garg',
      accountStatus: 'Active'
    });
    const groomToken = signAccessToken(groomUser);

    const groomProfile = await Profile.create({
      userId: groomUser._id,
      profileId: 'PRF-GOTRA-001',
      fullName: 'Kunal Garg',
      gender: 'Male',
      dob: new Date('1996-02-15'),
      gotra: 'Garg',
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech CS',
      educationLevel: 'Graduate',
      workingAt: 'Tech Solutions',
      occupation: 'Software Engineer',
      income: '30 LPA',
      city: 'Delhi',
      state: 'Delhi',
      verified: true
    });
    groomUser.activeProfileId = groomProfile._id;
    groomUser.profiles = [groomProfile._id];
    await groomUser.save();

    // 2. Candidate 1: Bansal Gotra, mother Mittal (Clean match, highly compatible)
    const user1 = await User.create({ mobile: '9876540002', name: 'Ritu Bansal', accountStatus: 'Active' });
    const bansalProfile = await Profile.create({
      userId: user1._id,
      profileId: 'PRF-GOTRA-002',
      fullName: 'Ritu Bansal',
      gender: 'Female',
      dob: new Date('1997-04-10'),
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      manglik: 'Non-Manglik',
      qualification: 'MBA Finance',
      educationLevel: 'Postgraduate',
      workingAt: 'KPMG',
      occupation: 'Financial Analyst',
      income: '25 LPA',
      city: 'Delhi',
      state: 'Delhi',
      verified: true
    });

    // 3. Candidate 2: Garg Gotra, mother Mittal (Sagotra conflict - Paternal match)
    const user2 = await User.create({ mobile: '9876540003', name: 'Shalini Garg', accountStatus: 'Active' });
    const sagotraProfile = await Profile.create({
      userId: user2._id,
      profileId: 'PRF-GOTRA-003',
      fullName: 'Shalini Garg',
      gender: 'Female',
      dob: new Date('1996-08-20'),
      gotra: 'Garg',
      motherGotra: 'Mittal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech',
      educationLevel: 'Graduate',
      occupation: 'Developer',
      income: '20 LPA',
      city: 'Delhi',
      state: 'Delhi',
      verified: true
    });

    // 4. Candidate 3: Singhal Gotra, mother Goyal (Maternal gotra overlap - Groom mother Goyal == Bride mother Goyal)
    const user3 = await User.create({ mobile: '9876540004', name: 'Ananya Singhal', accountStatus: 'Active' });
    const maternalConflictProfile = await Profile.create({
      userId: user3._id,
      profileId: 'PRF-GOTRA-004',
      fullName: 'Ananya Singhal',
      gender: 'Female',
      dob: new Date('1996-12-05'),
      gotra: 'Singhal',
      motherGotra: 'Goyal',
      manglik: 'Non-Manglik',
      qualification: 'B.Tech',
      educationLevel: 'Graduate',
      occupation: 'Developer',
      income: '25 LPA',
      city: 'Delhi',
      state: 'Delhi',
      verified: true
    });

    // Verification 1: Bansal Gotra candidate scores 90%+ with clean Gotra exogamy (30/30 pts)
    const scoreRes1 = await request(app)
      .get(`/api/matches/score/${bansalProfile.profileId}`)
      .set('Authorization', `Bearer ${groomToken}`);

    expect(scoreRes1.status).toBe(200);
    expect(scoreRes1.body.success).toBe(true);
    expect(scoreRes1.body.data.totalScore).toBeGreaterThanOrEqual(90);
    expect(scoreRes1.body.data.isSagotra).toBe(false);
    expect(scoreRes1.body.data.hasMaternalConflict).toBe(false);
    expect(scoreRes1.body.data.breakdown.gotra.score).toBe(30);

    // Verification 2: Garg Gotra candidate scores 0 pts on Gotra factor with Sagotra paternal conflict flag
    const scoreRes2 = await request(app)
      .get(`/api/matches/score/${sagotraProfile.profileId}`)
      .set('Authorization', `Bearer ${groomToken}`);

    expect(scoreRes2.status).toBe(200);
    expect(scoreRes2.body.success).toBe(true);
    expect(scoreRes2.body.data.isSagotra).toBe(true);
    expect(scoreRes2.body.data.hasMaternalConflict).toBe(false);
    expect(scoreRes2.body.data.breakdown.gotra.score).toBe(0);
    expect(scoreRes2.body.data.breakdown.gotra.details).toContain('Sagotra Conflict');

    // GET /api/matches with excludeSagotra=true strictly excludes candidate
    const filterRes = await request(app)
      .get('/api/matches?excludeSagotra=true')
      .set('Authorization', `Bearer ${groomToken}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.matches.some(m => m.profile.profileId === sagotraProfile.profileId)).toBe(false);

    // Verification 3: Mother Gotra match candidate gets 50% maternal gotra penalty (15 pts instead of 30)
    const scoreRes3 = await request(app)
      .get(`/api/matches/score/${maternalConflictProfile.profileId}`)
      .set('Authorization', `Bearer ${groomToken}`);

    expect(scoreRes3.status).toBe(200);
    expect(scoreRes3.body.success).toBe(true);
    expect(scoreRes3.body.data.isSagotra).toBe(false);
    expect(scoreRes3.body.data.hasMaternalConflict).toBe(true);
    expect(scoreRes3.body.data.breakdown.gotra.score).toBe(15);
    expect(scoreRes3.body.data.breakdown.gotra.details).toContain('Maternal Gotra overlap detected');

    // Verification 4: Normalizes aliases and bilingual script in Gotra calculations
    const goelRes = checkGotraExogamy('Goel', 'Goyal', 'Bansal', 'Mittal');
    expect(goelRes.score).toBe(0);
    expect(goelRes.isSagotra).toBe(true);

    const kushalRes = checkGotraExogamy('Kushal', 'Kuchhal', 'Bansal', 'Mittal');
    expect(kushalRes.score).toBe(0);
    expect(kushalRes.isSagotra).toBe(true);

    const hindiRes = checkGotraExogamy('गर्ग', 'Garg', 'बंसल', 'Mittal');
    expect(hindiRes.score).toBe(0);
    expect(hindiRes.isSagotra).toBe(true);
  });

  /* ==========================================================================
     SCENARIO 5: MULTI-PROFILE & PRIVACY CONTROL JOURNEY
     ========================================================================== */
  it('Scenario 5: Multi-Profile & Privacy Control Journey (1 User creates Profile A (Self) and Profile B (Sister) -> Sets address visibility to Connected Members Only -> Non-connected user cannot see address -> After interest accepted, address becomes visible)', async () => {
    // 1. Parent/User creates account
    const parentUser = await User.create({
      mobile: '9876550001',
      name: 'Ramesh Agrawal',
      email: 'ramesh.agrawal@example.com',
      accountStatus: 'Active'
    });
    const parentToken = signAccessToken(parentUser);

    // 2. Seeker User
    const seekerUser = await User.create({
      mobile: '9876550002',
      name: 'Amit Mittal',
      email: 'amit.mittal@example.com',
      accountStatus: 'Active'
    });
    const seekerToken = signAccessToken(seekerUser);

    const seekerProfile = await Profile.create({
      userId: seekerUser._id,
      profileId: 'PRF-SEEKER-001',
      fullName: 'Amit Mittal',
      gender: 'Male',
      dob: new Date('1995-03-20'),
      gotra: 'Mittal',
      motherGotra: 'Singhal',
      city: 'Noida',
      state: 'Uttar Pradesh'
    });
    seekerUser.activeProfileId = seekerProfile._id;
    seekerUser.profiles = [seekerProfile._id];
    await seekerUser.save();

    // 3. User creates Profile A (Self) and Profile B (Sister)
    const resA = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        fullName: 'Ramesh Agrawal',
        profileFor: 'Self',
        gender: 'Male',
        dob: '1992-04-10',
        gotra: 'Bindal',
        motherGotra: 'Garg',
        city: 'Noida',
        state: 'Uttar Pradesh',
        residentialAddress: 'Flat 101, Supertech, Sector 74, Noida',
        privacySettings: {
          phoneVisibility: 'Connected Members Only',
          addressVisibility: 'Connected Members Only'
        }
      });

    expect(resA.status).toBe(201);
    const profileSelf = resA.body.data.profile;

    const resB = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        fullName: 'Neha Agrawal',
        profileFor: 'Sister',
        gender: 'Female',
        dob: '1997-09-18',
        gotra: 'Bindal',
        motherGotra: 'Garg',
        city: 'Noida',
        state: 'Uttar Pradesh',
        mobileNumber: '9876550001',
        residentialAddress: 'Tower 3, Flat 502, Lotus Boulevard, Sector 100, Noida',
        privacySettings: {
          phoneVisibility: 'Connected Members Only',
          addressVisibility: 'Connected Members Only',
          photoVisibility: 'Visible to All'
        }
      });

    expect(resB.status).toBe(201);
    const profileSister = resB.body.data.profile;

    // Verify User has 2 profiles
    const userInDb = await User.findById(parentUser._id);
    expect(userInDb.profiles.length).toBe(2);

    // 4. Non-connected seeker views Sister profile -> Address & Phone are masked
    const beforeViewRes = await request(app)
      .get(`/api/profiles/${profileSister.profileId}`)
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(beforeViewRes.status).toBe(200);
    expect(beforeViewRes.body.success).toBe(true);
    expect(beforeViewRes.body.data.profile.addressMasked).toBe(true);
    expect(beforeViewRes.body.data.profile.phoneMasked).toBe(true);
    expect(beforeViewRes.body.data.profile.residentialAddress).toContain('Protected');
    expect(beforeViewRes.body.data.profile.mobileNumber).toContain('XXXXX');
    expect(beforeViewRes.body.data.isConnected).toBe(false);

    // 5. Seeker sends interest to Sister profile
    const interestRes = await request(app)
      .post('/api/interests')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        recipientProfileId: profileSister.profileId,
        message: 'Interested in connecting with Neha Ji.'
      });

    expect(interestRes.status).toBe(201);
    expect(interestRes.body.success).toBe(true);
    expect(interestRes.body.data.interest.status).toBe('Pending');
    const interestId = interestRes.body.data.interest.id || interestRes.body.data.interest._id;

    // 6. Parent accepts interest for Sister profile
    const acceptRes = await request(app)
      .put(`/api/interests/${interestId}/accept`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.interest.status).toBe('Accepted');

    // 7. After acceptance, Seeker views Sister profile -> Address & Phone are unmasked and fully visible
    const afterViewRes = await request(app)
      .get(`/api/profiles/${profileSister.profileId}`)
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(afterViewRes.status).toBe(200);
    expect(afterViewRes.body.data.profile.addressMasked).toBe(false);
    expect(afterViewRes.body.data.profile.phoneMasked).toBe(false);
    expect(afterViewRes.body.data.profile.residentialAddress).toBe('Tower 3, Flat 502, Lotus Boulevard, Sector 100, Noida');
    expect(afterViewRes.body.data.profile.mobileNumber).toBe('9876550001');
    expect(afterViewRes.body.data.isConnected).toBe(true);

    // 8. Multi-profile active switcher switches active profile seamlessly
    const switchRes = await request(app)
      .put(`/api/profiles/active/${profileSister.profileId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(switchRes.status).toBe(200);
    expect(switchRes.body.success).toBe(true);
    expect(switchRes.body.data.activeProfileId).toBe(profileSister._id ? profileSister._id.toString() : profileSister.id);

    const meRes = await request(app)
      .get('/api/profiles/me')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.profile.profileId).toBe(profileSister.profileId);

    const myProfilesRes = await request(app)
      .get('/api/profiles/my-profiles')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(myProfilesRes.status).toBe(200);
    expect(myProfilesRes.body.data.profiles.length).toBe(2);
  });

  /* ==========================================================================
     SEED SCRIPTS & REPRODUCIBILITY VALIDATION
     ========================================================================== */
  describe('Seed Scripts Verification', () => {
    it('seedAdmin should idempotently seed Super Admin', async () => {
      await seedAdmin();
      const admin = await Admin.findOne({ email: 'admin@matrimonyhub.com' });
      expect(admin).toBeTruthy();
      expect(admin.role).toBe('Super Admin');
    });

    it('seedPlans should idempotently seed 4 default subscription plans', async () => {
      await seedPlans();
      const plans = await Plan.find({ isActive: true });
      expect(plans.length).toBeGreaterThanOrEqual(4);
      const names = plans.map(p => p.name);
      expect(names).toContain('Free');
      expect(names).toContain('Gold');
      expect(names).toContain('Platinum');
      expect(names).toContain('Diamond');
    });

    it('seedCMS should idempotently seed 6 static pages and hero banners', async () => {
      await seedCMS();
      const { CMSPage, Banner } = require('../models/CMS');
      const pages = await CMSPage.find();
      expect(pages.length).toBeGreaterThanOrEqual(6);
      const banners = await Banner.find();
      expect(banners.length).toBeGreaterThanOrEqual(3);
    });

    it('seedMockData should idempotently seed realistic Agarwal candidate profiles spanning multiple gotras and both genders', async () => {
      await seedMockData();
      const mockProfiles = await Profile.find({ profileId: /^PRF-MOCK-/ });
      expect(mockProfiles.length).toBeGreaterThanOrEqual(6);

      const gotras = mockProfiles.map(p => p.gotra);
      expect(gotras).toContain('Garg');
      expect(gotras).toContain('Bansal');
      expect(gotras).toContain('Goyal');
      expect(gotras).toContain('Mittal');

      const genders = mockProfiles.map(p => p.gender);
      expect(genders).toContain('Male');
      expect(genders).toContain('Female');
    });
  });
});
