/**
 * Challenger M5: Comprehensive Adversarial Test Suite for Milestone 5
 * Admin Operations, CMS, Abuse Moderation & Audit Trails
 * Agrawal Matrimony Platform Backend REST API
 *
 * Stress-tests:
 * 1. Admin KPI metrics aggregation correctness under various DB population states (Empty, Complex Heterogeneous)
 * 2. User listing filters, regex injection & special characters safety, pagination offsets, and status toggles
 * 3. CSV export validation: headers, RFC 4180 escaping, formatting, and filtered exports
 * 4. CMS Page CRUD (slug handling, case-insensitivity, validation, points list) and Banner sorting/filtering
 * 5. Abuse Complaint lifecycle (self-reporting prevention, auto-resolution with user suspension cascade)
 * 6. Audit Trail queries, immutability, date boundary edge cases, and multi-field global search
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Verification = require('../models/Verification');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Admin = require('../models/Admin');
const { CMSPage, Banner } = require('../models/CMS');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const seedCMS = require('../scripts/seedCMS');
const seedPlans = require('../scripts/seedPlans');
const { signAccessToken, signAdminToken } = require('../utils/token');

describe('Challenger M5: Adversarial Verification Test Suite', () => {
  let superAdmin, moderatorAdmin, userA, userB, userC, userD;
  let superAdminToken, moderatorToken, userAToken, userBToken, userCToken;
  let goldPlan, platinumPlan, diamondPlan;

  beforeEach(async () => {
    // 1. Seed Plans & CMS
    await seedPlans();
    await seedCMS();
    goldPlan = await Plan.findOne({ name: 'Gold' });
    platinumPlan = await Plan.findOne({ name: 'Platinum' });
    diamondPlan = await Plan.findOne({ name: 'Diamond' });

    // 2. Create Super Admin & Moderator Admin
    superAdmin = await Admin.create({
      name: 'Super Administrator',
      email: 'superadmin@matrimonyhub.com',
      password: 'hashed_admin_password_123',
      role: 'Super Admin',
      status: 'Active'
    });
    superAdminToken = signAdminToken(superAdmin);

    moderatorAdmin = await Admin.create({
      name: 'Safety Moderator',
      email: 'moderator@matrimonyhub.com',
      password: 'hashed_mod_password_123',
      role: 'Moderator',
      status: 'Active'
    });
    moderatorToken = signAdminToken(moderatorAdmin);

    // 3. Create Primary Users
    userA = await User.create({
      mobile: '9810000001',
      name: 'Aman Agrawal',
      email: 'aman.agrawal@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Approved',
      subscriptionPlan: 'Gold',
      subscriptionStatus: 'Active'
    });
    userAToken = signAccessToken(userA);

    userB = await User.create({
      mobile: '9810000002',
      name: 'Bhawna Bansal',
      email: 'bhawna.bansal@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Pending',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free'
    });
    userBToken = signAccessToken(userB);

    userC = await User.create({
      mobile: '9810000003',
      name: 'Chirag Garg',
      email: 'chirag.garg@example.com',
      accountStatus: 'Suspended',
      verificationStatus: 'Rejected',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free'
    });
    userCToken = signAccessToken(userC);

    userD = await User.create({
      mobile: '9810000004',
      name: 'Deepak, "The Elder" Goyal',
      email: 'deepak+special@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Unverified',
      subscriptionPlan: 'Platinum',
      subscriptionStatus: 'Active'
    });
  });

  // =========================================================================
  // 1. ADMIN KPI METRICS AGGREGATION UNDER DIVERSE DB CONDITIONS
  // =========================================================================
  describe('1. Admin KPI Metrics Aggregation & State Correctness', () => {
    it('1.1 Should return exact zero counts on a freshly wiped database without crashes', async () => {
      // Wipe all user/operational data
      await User.deleteMany({});
      await Profile.deleteMany({});
      await Verification.deleteMany({});
      await Subscription.deleteMany({});
      await Payment.deleteMany({});
      await Complaint.deleteMany({});

      const res = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const m = res.body.data;
      expect(m.totalUsers).toBe(0);
      expect(m.activeUsers).toBe(0);
      expect(m.suspendedUsers).toBe(0);
      expect(m.pendingVerifications).toBe(0);
      expect(m.totalCandidateProfiles).toBe(0);
      expect(m.verifiedProfiles).toBe(0);
      expect(m.totalRevenue).toBe(0);
      expect(m.activeSubscriptions).toBe(0);
      expect(m.pendingComplaints).toBe(0);
    });

    it('1.2 Should accurately aggregate heterogeneous DB state (active vs suspended, expired subs, failed payments)', async () => {
      // 1. Profiles
      const p1 = await Profile.create({
        userId: userA._id,
        profileId: 'PRF-A1',
        fullName: 'Aman Agrawal',
        gender: 'Male',
        dob: new Date('1994-01-01'),
        gotra: 'Garg',
        motherGotra: 'Bansal',
        verified: true
      });
      const p2 = await Profile.create({
        userId: userB._id,
        profileId: 'PRF-B1',
        fullName: 'Bhawna Bansal',
        gender: 'Female',
        dob: new Date('1996-05-10'),
        gotra: 'Bansal',
        motherGotra: 'Goyal',
        verified: false
      });
      const p3 = await Profile.create({
        userId: userC._id,
        profileId: 'PRF-C1',
        fullName: 'Chirag Garg',
        gender: 'Male',
        dob: new Date('1992-08-15'),
        gotra: 'Garg',
        motherGotra: 'Mittal',
        verified: false
      });

      // 2. Verifications: 2 Pending, 1 Approved, 1 Rejected
      await Verification.create([
        { userId: userA._id, profileId: p1._id, documentType: 'Aadhaar', status: 'Approved' },
        { userId: userB._id, profileId: p2._id, documentType: 'PAN', status: 'Pending' },
        { userId: userD._id, documentType: 'Passport', status: 'Pending' },
        { userId: userC._id, profileId: p3._id, documentType: 'Voter ID', status: 'Rejected' }
      ]);

      // 3. Payments: 3 Success (999 + 2499 + 6999 = 10497), 2 Failed (999, 999), 1 Created (999)
      await Payment.create([
        { userId: userA._id, orderId: 'ord_1', paymentId: 'pay_1', amount: 999, status: 'Success' },
        { userId: userD._id, orderId: 'ord_2', paymentId: 'pay_2', amount: 2499, status: 'Success' },
        { userId: userA._id, orderId: 'ord_3', paymentId: 'pay_3', amount: 6999, status: 'Success' },
        { userId: userB._id, orderId: 'ord_4', paymentId: 'pay_4', amount: 999, status: 'Failed' },
        { userId: userC._id, orderId: 'ord_5', paymentId: 'pay_5', amount: 999, status: 'Failed' },
        { userId: userB._id, orderId: 'ord_6', paymentId: 'pay_6', amount: 999, status: 'Created' }
      ]);

      // 4. Subscriptions:
      // - 2 Active with future endDate
      // - 1 Active with past endDate (expired)
      // - 1 Cancelled
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      await Subscription.create([
        { userId: userA._id, planId: goldPlan._id, status: 'Active', startDate: new Date(), endDate: futureDate, amountPaid: 999 },
        { userId: userD._id, planId: platinumPlan._id, status: 'Active', startDate: new Date(), endDate: futureDate, amountPaid: 2499 },
        { userId: userB._id, planId: goldPlan._id, status: 'Active', startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), endDate: pastDate, amountPaid: 999 },
        { userId: userC._id, planId: goldPlan._id, status: 'Cancelled', startDate: new Date(), endDate: futureDate, amountPaid: 999 }
      ]);

      // 5. Complaints: 2 Pending, 1 Resolved, 1 Dismissed
      await Complaint.create([
        { reporterUserId: userA._id, reportedUserId: userC._id, reason: 'Abusive language', status: 'Pending' },
        { reporterUserId: userB._id, reportedUserId: userC._id, reason: 'Spamming requests', status: 'Pending' },
        { reporterUserId: userD._id, reportedUserId: userC._id, reason: 'Fake profile', status: 'Resolved' },
        { reporterUserId: userA._id, reportedUserId: userB._id, reason: 'Wrong contact info', status: 'Dismissed' }
      ]);

      // Fetch dashboard metrics
      const res = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const m = res.body.data;
      expect(m.totalUsers).toBe(4); // userA, userB, userC, userD
      expect(m.activeUsers).toBe(3); // userA, userB, userD
      expect(m.suspendedUsers).toBe(1); // userC
      expect(m.pendingVerifications).toBe(2);
      expect(m.totalCandidateProfiles).toBe(3);
      expect(m.verifiedProfiles).toBe(1); // p1
      expect(m.totalRevenue).toBe(10497); // 999 + 2499 + 6999
      expect(m.activeSubscriptions).toBe(2); // Only 2 active with endDate > now
      expect(m.pendingComplaints).toBe(2);
    });

    it('1.3 Should reject unauthorized and non-admin tokens with 401', async () => {
      // Missing token
      const res1 = await request(app).get('/api/admin/dashboard/metrics');
      expect(res1.status).toBe(401);

      // User token attempting admin endpoint
      const res2 = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res2.status).toBe(401);

      // Malformed / fake Bearer token
      const res3 = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', 'Bearer invalid_token_value_xyz');
      expect(res3.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. USER MANAGEMENT, REGEX SAFETY, FILTERS & STATUS TOGGLES
  // =========================================================================
  describe('2. User Management, Regex Safety, Filters & Status Toggles', () => {
    it('2.1 Should handle adversarial regex special characters in search safely without error', async () => {
      const adversarialQueries = [
        '.*',
        '+91',
        '(981)',
        '[0-9]+',
        '{1,3}',
        '^Aman$',
        'Aman|Bhawna',
        '\\',
        '???***',
        '$$$^^^',
        'deepak+special'
      ];

      for (const q of adversarialQueries) {
        const res = await request(app)
          .get(`/api/admin/users?search=${encodeURIComponent(q)}`)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.items)).toBe(true);
      }
    });

    it('2.2 Should correctly find user matching sanitized special character string', async () => {
      const res = await request(app)
        .get(`/api/admin/users?search=${encodeURIComponent('deepak+special@example.com')}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].email).toBe('deepak+special@example.com');
    });

    it('2.3 Should filter users by multiple simultaneous criteria (status, verification, subscription)', async () => {
      const res = await request(app)
        .get('/api/admin/users?status=Active&verificationStatus=Approved&subscriptionPlan=Gold')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].mobile).toBe('9810000001');
      expect(res.body.data.items[0].accountStatus).toBe('Active');
      expect(res.body.data.items[0].verificationStatus).toBe('Approved');
    });

    it('2.4 Should handle pagination boundaries, limits and page offsets correctly', async () => {
      // Total 4 users currently seeded
      // Request page 1 with limit 2
      const resPage1 = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data.items.length).toBe(2);
      expect(resPage1.body.data.pagination.page).toBe(1);
      expect(resPage1.body.data.pagination.limit).toBe(2);
      expect(resPage1.body.data.pagination.total).toBe(4);
      expect(resPage1.body.data.pagination.totalPages).toBe(2);
      expect(resPage1.body.data.pagination.hasNextPage).toBe(true);
      expect(resPage1.body.data.pagination.hasPrevPage).toBe(false);

      // Request page 2 with limit 2
      const resPage2 = await request(app)
        .get('/api/admin/users?page=2&limit=2')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.items.length).toBe(2);
      expect(resPage2.body.data.pagination.page).toBe(2);
      expect(resPage2.body.data.pagination.hasNextPage).toBe(false);
      expect(resPage2.body.data.pagination.hasPrevPage).toBe(true);

      // Ensure distinct items on page 1 and page 2
      const idsPage1 = resPage1.body.data.items.map((u) => u._id);
      const idsPage2 = resPage2.body.data.items.map((u) => u._id);
      const overlap = idsPage1.filter((id) => idsPage2.includes(id));
      expect(overlap.length).toBe(0);

      // Request out of bounds page
      const resPage99 = await request(app)
        .get('/api/admin/users?page=99&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resPage99.status).toBe(200);
      expect(resPage99.body.data.items.length).toBe(0);
    });

    it('2.5 Should retrieve complete user inspection document with linked relations', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${userA._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(userA._id.toString());
      expect(Array.isArray(res.body.data.candidateProfiles)).toBe(true);
      expect(Array.isArray(res.body.data.subscriptions)).toBe(true);
      expect(Array.isArray(res.body.data.verifications)).toBe(true);
      expect(Array.isArray(res.body.data.payments)).toBe(true);
      expect(Array.isArray(res.body.data.complaints)).toBe(true);
    });

    it('2.6 Should return 404 when inspecting non-existent user ID', async () => {
      const fakeId = '65f000000000000000000099';
      const res = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('2.7 Should toggle user status to Suspended with reason and persist AuditLog', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${userA._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Suspended',
          reason: 'Inappropriate communications reported by multiple users'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('Suspended');
      expect(res.body.data.previousStatus).toBe('Active');
      expect(res.body.data.newStatus).toBe('Suspended');

      // Verify in DB
      const dbUser = await User.findById(userA._id);
      expect(dbUser.accountStatus).toBe('Suspended');

      // Verify Audit Log
      const log = await AuditLog.findOne({
        action: 'User Suspended',
        target: userA._id.toString()
      });
      expect(log).toBeTruthy();
      expect(log.adminName).toBe(superAdmin.name);
      expect(log.details).toContain('Inappropriate communications');
      expect(log.metadata.reason).toBe('Inappropriate communications reported by multiple users');
    });

    it('2.8 Should toggle suspended user back to Active and record AuditLog', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${userC._id}/status`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          status: 'Active',
          reason: 'Appeal approved after identity verification'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('Active');

      const dbUser = await User.findById(userC._id);
      expect(dbUser.accountStatus).toBe('Active');

      const log = await AuditLog.findOne({
        action: 'User Activated',
        target: userC._id.toString()
      });
      expect(log).toBeTruthy();
      expect(log.adminName).toBe(moderatorAdmin.name);
      expect(log.details).toContain('Appeal approved');
    });

    it('2.9 Should reject invalid status update payloads with 400', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${userA._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Deleted_Invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. CSV EXPORT INTEGRITY & RFC 4180 FORMATTING
  // =========================================================================
  describe('3. CSV Export Validation & Escaping Integrity', () => {
    it('3.1 Should export complete user CSV with correct headers and Content-Type', async () => {
      const res = await request(app)
        .get('/api/admin/users/export/csv')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="users_export_.*\.csv"/);

      const lines = res.text.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(5); // Header + 4 seeded users

      const header = lines[0];
      expect(header).toBe('User ID,Mobile,Name,Email,Account Status,Verification Status,Subscription Plan,Subscription Status,Profiles Count,Registered At');
    });

    it('3.2 Should properly escape fields with quotes, commas and special characters in CSV', async () => {
      const res = await request(app)
        .get('/api/admin/users/export/csv')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);

      // User D has name: Deepak, "The Elder" Goyal
      // RFC 4180 Escaped format: "Deepak, ""The Elder"" Goyal"
      expect(res.text).toContain('"Deepak, ""The Elder"" Goyal"');
      expect(res.text).toContain('"deepak+special@example.com"');
    });

    it('3.3 Should respect query filters during CSV export (e.g. status=Suspended)', async () => {
      const res = await request(app)
        .get('/api/admin/users/export/csv?status=Suspended')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const lines = res.text.trim().split('\n');
      // Header + exactly 1 suspended user (userC)
      expect(lines.length).toBe(2);
      expect(res.text).toContain('9810000003');
      expect(res.text).not.toContain('9810000001');
    });
  });

  // =========================================================================
  // 4. CMS STATIC PAGES CRUD & HERO BANNER MANAGEMENT
  // =========================================================================
  describe('4. CMS Static Pages & Hero Banners Management', () => {
    it('4.1 Should retrieve public active CMS page by case-insensitive key', async () => {
      // Case-insensitive check: "ABOUT-US", "About-Us", "about-us"
      const resUpper = await request(app).get('/api/cms/pages/ABOUT-US');
      expect(resUpper.status).toBe(200);
      expect(resUpper.body.success).toBe(true);
      expect(resUpper.body.data.page.key).toBe('about-us');
      expect(resUpper.body.data.page.title).toContain('About Agrawal Matrimony');

      const resMixed = await request(app).get('/api/cms/pages/About-Us');
      expect(resMixed.status).toBe(200);
      expect(resMixed.body.data.page.key).toBe('about-us');
    });

    it('4.2 Should return 404 for non-existent CMS page key', async () => {
      const res = await request(app).get('/api/cms/pages/non-existent-random-slug');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('4.3 Should create a brand new CMS page via admin upsert with audit log', async () => {
      const res = await request(app)
        .put('/api/admin/cms/pages/cancellation-policy')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Subscription Cancellation & Refund Policy',
          metaDescription: 'Official rules regarding plan refunds and cancellation periods.',
          content: 'Members can cancel their subscription at any time through account settings.',
          points: [
            { title: '7-Day Money Back Guarantee', description: 'Full refund if no contacts viewed.' },
            { title: 'Instant Processing', description: 'Refunds credited within 3-5 business days.' }
          ],
          isActive: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page.key).toBe('cancellation-policy');
      expect(res.body.data.page.title).toBe('Subscription Cancellation & Refund Policy');
      expect(res.body.data.page.points.length).toBe(2);

      // Verify Audit Log
      const audit = await AuditLog.findOne({
        action: 'Created CMS Page',
        target: 'CMS Page: cancellation-policy'
      });
      expect(audit).toBeTruthy();
      expect(audit.adminName).toBe(superAdmin.name);
    });

    it('4.4 Should reject new CMS page creation if required title is missing', async () => {
      const res = await request(app)
        .put('/api/admin/cms/pages/brand-new-page-without-title')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          content: 'Some content without title'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/title is required/i);
    });

    it('4.5 Inactive CMS page should be hidden from public GET but visible to Admin', async () => {
      // Create inactive page
      await CMSPage.create({
        key: 'secret-draft',
        title: 'Draft Secret Page',
        content: 'Draft content',
        isActive: false
      });

      // Public GET must return 404
      const pubRes = await request(app).get('/api/cms/pages/secret-draft');
      expect(pubRes.status).toBe(404);

      // Public list must not include it
      const listRes = await request(app).get('/api/cms/pages');
      expect(listRes.status).toBe(200);
      const keys = listRes.body.data.pages.map((p) => p.key);
      expect(keys).not.toContain('secret-draft');

      // Admin list MUST include it
      const adminRes = await request(app)
        .get('/api/admin/cms/pages')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(adminRes.status).toBe(200);
      const adminKeys = adminRes.body.data.pages.map((p) => p.key);
      expect(adminKeys).toContain('secret-draft');
    });

    it('4.6 Hero Banners: Public retrieval must strictly return active banners sorted by sortOrder ascending', async () => {
      // Create banners with various sortOrders and isActive states
      await Banner.deleteMany({});
      await Banner.create([
        { title: 'Banner 3rd', imageUrl: '/b3.jpg', sortOrder: 30, isActive: true },
        { title: 'Banner 1st', imageUrl: '/b1.jpg', sortOrder: 10, isActive: true },
        { title: 'Banner Inactive', imageUrl: '/b_inact.jpg', sortOrder: 5, isActive: false },
        { title: 'Banner 2nd', imageUrl: '/b2.jpg', sortOrder: 20, isActive: true }
      ]);

      const res = await request(app).get('/api/cms/banners');
      expect(res.status).toBe(200);
      expect(res.body.data.banners.length).toBe(3); // Inactive excluded

      const titles = res.body.data.banners.map((b) => b.title);
      expect(titles).toEqual(['Banner 1st', 'Banner 2nd', 'Banner 3rd']);
    });

    it('4.7 Hero Banners: Admin CRUD lifecycle with validation and Audit Logs', async () => {
      // 1. Validation error on missing required fields
      const badRes = await request(app)
        .post('/api/admin/banners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ subtitle: 'Missing title & imageUrl' });
      expect(badRes.status).toBe(400);

      // 2. Create Banner
      const createRes = await request(app)
        .post('/api/admin/banners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Special Holi Festival Offer',
          subtitle: '50% off on all Yearly Plans',
          imageUrl: '/uploads/banners/holi.png',
          targetUrl: '/plans',
          sortOrder: 100,
          isActive: true
        });

      expect(createRes.status).toBe(201);
      const bannerId = createRes.body.data.banner._id;

      // 3. Update Banner (Update sortOrder and title)
      const updateRes = await request(app)
        .put(`/api/admin/banners/${bannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Special Holi Festival Offer - Extended',
          sortOrder: 1
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.banner.title).toBe('Special Holi Festival Offer - Extended');
      expect(updateRes.body.data.banner.sortOrder).toBe(1);

      // 4. Delete Banner
      const deleteRes = await request(app)
        .delete(`/api/admin/banners/${bannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deletedBannerId).toBe(bannerId.toString());

      // DB check
      const checkDoc = await Banner.findById(bannerId);
      expect(checkDoc).toBeNull();

      // Verify Audit Log for Deletion
      const deleteAudit = await AuditLog.findOne({
        action: 'Deleted Banner',
        target: bannerId.toString()
      });
      expect(deleteAudit).toBeTruthy();
    });

    it('4.8 Should return 404 when updating or deleting a non-existent banner', async () => {
      const nonExistentId = '65f000000000000000000011';
      const updateRes = await request(app)
        .put(`/api/admin/banners/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'New Title' });
      expect(updateRes.status).toBe(404);

      const deleteRes = await request(app)
        .delete(`/api/admin/banners/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(deleteRes.status).toBe(404);
    });
  });

  // =========================================================================
  // 5. ABUSE COMPLAINTS & RESOLUTION CASCADE
  // =========================================================================
  describe('5. Abuse Complaints Lifecycle & Resolution Cascades', () => {
    it('5.1 Should prevent user from reporting their own account with 400', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reportedUserId: userA._id,
          reason: 'Attempting to report myself'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot report your own account/i);
    });

    it('5.2 Should reject complaint submission with missing reason or missing target', async () => {
      // Missing reason
      const res1 = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ reportedUserId: userB._id });
      expect(res1.status).toBe(400);

      // Missing reported target
      const res2 = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ reason: 'Target is missing' });
      expect(res2.status).toBe(400);
    });

    it('5.3 Should submit abuse report, assign human-readable complaintId, and appear in user reports', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reportedUserId: userB._id,
          reason: 'Harassment in chat messages',
          category: 'Harassment',
          description: 'Repeated unwanted contact attempts despite rejection.',
          evidenceUrls: ['/uploads/evidence/chat_proof.png']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.complaintId).toMatch(/^CMP-/);
      expect(res.body.data.complaint.status).toBe('Pending');

      const complaintId = res.body.data.complaint._id;

      // Check User's my-reports
      const myRes = await request(app)
        .get('/api/complaints/my-reports')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(myRes.status).toBe(200);
      expect(myRes.body.data.complaints.some((c) => c._id.toString() === complaintId.toString())).toBe(true);
    });

    it('5.4 Resolving complaint with "User Suspended" action must automatically set reported user accountStatus to Suspended', async () => {
      // Ensure target user is active initially
      await User.findByIdAndUpdate(userB._id, { accountStatus: 'Active' });
      const initialUser = await User.findById(userB._id);
      expect(initialUser.accountStatus).toBe('Active');

      // Create complaint
      const complaint = await Complaint.create({
        reporterUserId: userAToken ? userA._id : null,
        reportedUserId: userB._id,
        reason: 'Severe terms violation and fraud attempt',
        category: 'Fake Profile',
        status: 'Pending'
      });

      // Admin resolves complaint with "User Suspended"
      const resolveRes = await request(app)
        .put(`/api/admin/complaints/${complaint._id}/resolve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          resolutionAction: 'User Suspended',
          adminNotes: 'Confirmed fraudulent biodata and extortion threats. Immediate account suspension applied.'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.success).toBe(true);
      expect(resolveRes.body.data.complaint.status).toBe('Resolved');
      expect(resolveRes.body.data.complaint.resolutionAction).toBe('User Suspended');

      // Verify DB User accountStatus was auto-updated to 'Suspended'
      const updatedUser = await User.findById(userB._id);
      expect(updatedUser.accountStatus).toBe('Suspended');

      // Verify specific suspension AuditLog was logged
      const suspLog = await AuditLog.findOne({
        action: 'User Suspended via Complaint Resolution',
        target: userB._id.toString()
      });
      expect(suspLog).toBeTruthy();
      expect(suspLog.details).toContain('Immediate account suspension applied');

      // Verify complaint resolution AuditLog was logged
      const compLog = await AuditLog.findOne({
        action: 'Resolved Abuse Complaint',
        target: (complaint.complaintId || complaint._id).toString()
      });
      expect(compLog).toBeTruthy();
    });

    it('5.5 Resolving complaint with "Dismissed" should not suspend user and update status to Dismissed', async () => {
      const complaint = await Complaint.create({
        reporterUserId: userA._id,
        reportedUserId: userD._id,
        reason: 'False alarm report',
        category: 'Other',
        status: 'Pending'
      });

      const resolveRes = await request(app)
        .put(`/api/admin/complaints/${complaint._id}/resolve`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          resolutionAction: 'Dismissed',
          adminNotes: 'Investigated and verified profile is authentic. No violation found.'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.complaint.status).toBe('Dismissed');
      expect(resolveRes.body.data.complaint.resolutionAction).toBe('Dismissed');

      // User D must remain Active
      const userDoc = await User.findById(userD._id);
      expect(userDoc.accountStatus).toBe('Active');
    });

    it('5.6 Should reject invalid resolution actions with 400', async () => {
      const complaint = await Complaint.create({
        reporterUserId: userA._id,
        reportedUserId: userD._id,
        reason: 'Test',
        status: 'Pending'
      });

      const res = await request(app)
        .put(`/api/admin/complaints/${complaint._id}/resolve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          resolutionAction: 'CompletelyInvalidActionName'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 6. IMMUTABLE AUDIT TRAIL QUERYING & MULTI-FIELD SEARCH
  // =========================================================================
  describe('6. Immutable Audit Trail Logging & Multi-Field Search', () => {
    beforeEach(async () => {
      await AuditLog.deleteMany({});

      // Seed deliberate audit log history across dates, actors, actions and targets
      await AuditLog.create([
        {
          adminId: superAdmin._id,
          adminName: 'Super Administrator',
          adminRole: 'Super Admin',
          action: 'User Suspended',
          target: 'User: 9810000003',
          details: 'Fraudulent profile suspension',
          createdAt: new Date('2026-08-01T10:00:00Z')
        },
        {
          adminId: moderatorAdmin._id,
          adminName: 'Safety Moderator',
          adminRole: 'Moderator',
          action: 'Approved KYC Verification',
          target: 'Verification: 65f001',
          details: 'Aadhaar card document verified',
          createdAt: new Date('2026-08-05T14:30:00Z')
        },
        {
          adminId: superAdmin._id,
          adminName: 'Super Administrator',
          adminRole: 'Super Admin',
          action: 'Updated CMS Page',
          target: 'CMS Page: privacy-policy',
          details: 'Updated clause 5 regarding data encryption',
          createdAt: new Date('2026-08-10T09:15:00Z')
        },
        {
          adminId: moderatorAdmin._id,
          adminName: 'Safety Moderator',
          adminRole: 'Moderator',
          action: 'Resolved Abuse Complaint',
          target: 'CMP-990011',
          details: 'Dismissed frivolous report',
          createdAt: new Date('2026-08-12T16:45:00Z')
        }
      ]);
    });

    it('6.1 Should filter audit logs by action substring', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?action=KYC')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].action).toBe('Approved KYC Verification');
    });

    it('6.2 Should filter audit logs by actor / adminName', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?actor=Safety Moderator')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.items.every((log) => log.adminName === 'Safety Moderator')).toBe(true);
    });

    it('6.3 Should filter audit logs by ISO date ranges (inclusive boundary)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?startDate=2026-08-04&endDate=2026-08-11')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      // Aug 5 (KYC) and Aug 10 (CMS)
      expect(res.body.data.items.length).toBe(2);
      const actions = res.body.data.items.map((i) => i.action);
      expect(actions).toContain('Approved KYC Verification');
      expect(actions).toContain('Updated CMS Page');
    });

    it('6.4 Should support global search across all audit log fields', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?q=encryption')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].target).toBe('CMS Page: privacy-policy');
    });

    it('6.5 Should retrieve individual audit log by ID and return 404 for missing ID', async () => {
      const existing = await AuditLog.findOne({ action: 'User Suspended' });

      // Valid ID
      const resValid = await request(app)
        .get(`/api/admin/audit-logs/${existing._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resValid.status).toBe(200);
      expect(resValid.body.data.log.action).toBe('User Suspended');

      // Invalid / Missing ID
      const resInvalid = await request(app)
        .get('/api/admin/audit-logs/65f000000000000000000088')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resInvalid.status).toBe(404);
      expect(resInvalid.body.success).toBe(false);
    });

    it('6.6 Should reject unauthenticated or non-admin access to audit logs with 401', async () => {
      const res1 = await request(app).get('/api/admin/audit-logs');
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res2.status).toBe(401);
    });
  });
});
