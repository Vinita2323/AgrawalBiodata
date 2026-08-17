/**
 * Milestone 5 Integration Test Suite: Admin Ops, CMS, Moderation & Audit Trails
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. Admin Dashboard KPIs & Metrics Real-Time Aggregation
 * 2. User Management (Search, Filters, Pagination, Profile Inspection, Status Toggle & CSV Export)
 * 3. CMS Static Pages (Public Access, Admin Upsert/Update, Points List)
 * 4. Hero Banner Management (Public Sorted List, Admin CRUD Operations)
 * 5. Abuse Complaints Lifecycle (User Filing, Admin Investigation, Resolution with Automated Suspension)
 * 6. Immutable Audit Trail Logging & Multi-Field Search / Querying
 * 7. Security, Authorization & Error Handling
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
const { signAccessToken, signAdminToken } = require('../utils/token');

describe('Milestone 5: Admin Ops, CMS, Moderation & Audit Trails Test Suite', () => {
  let superAdmin, moderatorAdmin, user1, user2, user3;
  let superAdminToken, moderatorToken, userToken1, userToken2;
  let profile1, profile2, profile3;
  let testPlan;

  beforeEach(async () => {
    // 1. Create Admins
    superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@matrimonyhub.com',
      password: 'hashedPassword123',
      role: 'Super Admin',
      status: 'Active'
    });
    superAdminToken = signAdminToken(superAdmin);

    moderatorAdmin = await Admin.create({
      name: 'Moderator Staff',
      email: 'moderator@matrimonyhub.com',
      password: 'hashedPassword123',
      role: 'Moderator',
      status: 'Active'
    });
    moderatorToken = signAdminToken(moderatorAdmin);

    // 2. Create Plan
    testPlan = await Plan.create({
      name: 'Gold',
      pricing: { monthly: 999, quarterly: 2499, yearly: 6999 },
      features: ['View 50 Contacts', 'Direct Message'],
      contactViewLimit: 50,
      isActive: true
    });

    // 3. Create Users
    user1 = await User.create({
      mobile: '9811122201',
      name: 'Aakash Agrawal',
      email: 'aakash@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Approved',
      subscriptionPlan: 'Gold',
      subscriptionStatus: 'Active'
    });
    userToken1 = signAccessToken(user1);

    user2 = await User.create({
      mobile: '9811122202',
      name: 'Priya Bansal',
      email: 'priya@example.com',
      accountStatus: 'Active',
      verificationStatus: 'Pending',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free'
    });
    userToken2 = signAccessToken(user2);

    user3 = await User.create({
      mobile: '9811122203',
      name: 'Ramesh Gupta',
      email: 'ramesh@example.com',
      accountStatus: 'Suspended',
      verificationStatus: 'Rejected',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'Free'
    });

    // 4. Create Profiles
    profile1 = await Profile.create({
      userId: user1._id,
      profileId: 'PRF-M5-001',
      fullName: 'Aakash Agrawal',
      gender: 'Male',
      dob: new Date('1995-05-15'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      verified: true
    });

    profile2 = await Profile.create({
      userId: user2._id,
      profileId: 'PRF-M5-002',
      fullName: 'Priya Bansal',
      gender: 'Female',
      dob: new Date('1997-09-20'),
      gotra: 'Bansal',
      motherGotra: 'Garg',
      verified: false
    });

    profile3 = await Profile.create({
      userId: user3._id,
      profileId: 'PRF-M5-003',
      fullName: 'Ramesh Gupta',
      gender: 'Male',
      dob: new Date('1992-01-10'),
      gotra: 'Mittal',
      verified: false
    });

    await User.findByIdAndUpdate(user1._id, { activeProfileId: profile1._id, profiles: [profile1._id] });
    await User.findByIdAndUpdate(user2._id, { activeProfileId: profile2._id, profiles: [profile2._id] });
    await User.findByIdAndUpdate(user3._id, { activeProfileId: profile3._id, profiles: [profile3._id] });

    // 5. Create Verification Records
    await Verification.create({
      userId: user1._id,
      profileId: profile1._id,
      documentType: 'Aadhaar',
      documentNumber: '123456789012',
      idProofUrl: '/uploads/documents/id1.jpg',
      status: 'Approved'
    });

    await Verification.create({
      userId: user2._id,
      profileId: profile2._id,
      documentType: 'PAN',
      documentNumber: 'ABCDE1234F',
      idProofUrl: '/uploads/documents/id2.jpg',
      status: 'Pending'
    });

    // 6. Create Successful Payment
    await Payment.create({
      userId: user1._id,
      orderId: 'order_test_1001',
      paymentId: 'pay_test_1001',
      amount: 999,
      status: 'Success',
      planId: testPlan._id,
      billingCycle: 'monthly'
    });

    // 7. Create Active Subscription
    await Subscription.create({
      userId: user1._id,
      planId: testPlan._id,
      billingCycle: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
      amountPaid: 999
    });

    // 8. Create a Pending Complaint
    await Complaint.create({
      reporterUserId: user1._id,
      reporterProfileId: profile1._id,
      reportedUserId: user3._id,
      reportedProfileId: profile3._id,
      reason: 'Spam messages and inappropriate behavior',
      category: 'Harassment',
      status: 'Pending'
    });
  });

  // =========================================================================
  // TIER 1: DASHBOARD METRICS & KPIs AGGREGATION
  // =========================================================================
  describe('Tier 1: Dashboard Metrics & KPIs', () => {
    it('should aggregate real-time platform KPIs accurately', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const metrics = res.body.data;
      expect(metrics.totalUsers).toBe(3);
      expect(metrics.activeUsers).toBe(2);
      expect(metrics.suspendedUsers).toBe(1);
      expect(metrics.pendingVerifications).toBe(1);
      expect(metrics.totalCandidateProfiles).toBe(3);
      expect(metrics.verifiedProfiles).toBe(1);
      expect(metrics.totalRevenue).toBe(999);
      expect(metrics.activeSubscriptions).toBe(1);
      expect(metrics.pendingComplaints).toBe(1);
    });

    it('should reject unauthenticated access to dashboard metrics', async () => {
      const res = await request(app).get('/api/admin/dashboard/metrics');
      expect(res.status).toBe(401);
    });

    it('should reject standard user access to admin dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${userToken1}`);

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // TIER 2: USER MANAGEMENT & CSV EXPORT
  // =========================================================================
  describe('Tier 2: Admin User Management', () => {
    it('should list users with pagination and search by phone number', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=9811122201')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].mobile).toBe('9811122201');
      expect(res.body.data.items[0].name).toBe('Aakash Agrawal');
    });

    it('should filter users by account status (Suspended)', async () => {
      const res = await request(app)
        .get('/api/admin/users?status=Suspended')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].mobile).toBe('9811122203');
    });

    it('should filter users by verification status (Approved)', async () => {
      const res = await request(app)
        .get('/api/admin/users?verificationStatus=Approved')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].mobile).toBe('9811122201');
    });

    it('should retrieve detailed user inspection data including linked profiles and subscriptions', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${user1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.mobile).toBe('9811122201');
      expect(res.body.data.candidateProfiles.length).toBe(1);
      expect(res.body.data.subscriptions.length).toBe(1);
      expect(res.body.data.verifications.length).toBe(1);
      expect(res.body.data.payments.length).toBe(1);
    });

    it('should toggle user status to Suspended and generate an immutable audit log', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${user1._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Suspended',
          reason: 'Violated terms of service'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('Suspended');

      // Verify DB update
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.accountStatus).toBe('Suspended');

      // Verify Audit Log
      const auditEntry = await AuditLog.findOne({
        action: 'User Suspended',
        target: user1._id.toString()
      });
      expect(auditEntry).toBeDefined();
      expect(auditEntry.details).toContain('Suspended');
      expect(auditEntry.details).toContain('Violated terms of service');
    });

    it('should export user list to CSV with proper content-type and headers', async () => {
      const res = await request(app)
        .get('/api/admin/users/export/csv')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('User ID,Mobile,Name,Email');
      expect(res.text).toContain('9811122201');
      expect(res.text).toContain('9811122202');
    });
  });

  // =========================================================================
  // TIER 3: CMS STATIC PAGES & BANNER MANAGEMENT
  // =========================================================================
  describe('Tier 3: CMS Pages & Banners Management', () => {
    beforeEach(async () => {
      await seedCMS();
    });

    it('should fetch public CMS page by key (about-us)', async () => {
      const res = await request(app).get('/api/cms/pages/about-us');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page.key).toBe('about-us');
      expect(res.body.data.page.title).toContain('About Agrawal Matrimony');
      expect(res.body.data.page.points.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent CMS page', async () => {
      const res = await request(app).get('/api/cms/pages/non-existent-page-key');
      expect(res.status).toBe(404);
    });

    it('should list all active CMS pages', async () => {
      const res = await request(app).get('/api/cms/pages');
      expect(res.status).toBe(200);
      expect(res.body.data.pages.length).toBeGreaterThanOrEqual(6);
    });

    it('should update/upsert a CMS static page as admin with audit log', async () => {
      const res = await request(app)
        .put('/api/admin/cms/pages/privacy-policy')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Updated Privacy Policy 2026',
          content: 'We use end-to-end encryption for all personal biodata.',
          points: [
            { title: 'Zero Third-Party Sharing', description: 'Data is never sold to advertisers.' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page.title).toBe('Updated Privacy Policy 2026');

      // Verify Audit Log
      const audit = await AuditLog.findOne({
        action: 'Updated CMS Page',
        target: 'CMS Page: privacy-policy'
      });
      expect(audit).toBeDefined();
    });

    it('should fetch public active hero banners sorted by sortOrder', async () => {
      const res = await request(app).get('/api/cms/banners');
      expect(res.status).toBe(200);
      expect(res.body.data.banners.length).toBe(3);
      expect(res.body.data.banners[0].sortOrder).toBeLessThanOrEqual(res.body.data.banners[1].sortOrder);
    });

    it('should allow admin to create, update, and delete a hero banner with audit logs', async () => {
      // 1. Create Banner
      const createRes = await request(app)
        .post('/api/admin/banners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Special Diwali Discount',
          subtitle: 'Get 40% off on Diamond Plan',
          imageUrl: '/uploads/banners/diwali.jpg',
          targetUrl: '/plans',
          sortOrder: 4,
          isActive: true
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.banner.title).toBe('Special Diwali Discount');
      const bannerId = createRes.body.data.banner._id;

      // 2. Update Banner
      const updateRes = await request(app)
        .put(`/api/admin/banners/${bannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Special Diwali Discount Extended',
          sortOrder: 1
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.banner.title).toBe('Special Diwali Discount Extended');
      expect(updateRes.body.data.banner.sortOrder).toBe(1);

      // 3. Delete Banner
      const deleteRes = await request(app)
        .delete(`/api/admin/banners/${bannerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deletedBannerId).toBe(bannerId.toString());

      // Verify deletion from DB
      const bannerCheck = await Banner.findById(bannerId);
      expect(bannerCheck).toBeNull();

      // Verify Audit Log
      const auditLog = await AuditLog.findOne({
        action: 'Deleted Banner',
        target: bannerId.toString()
      });
      expect(auditLog).toBeDefined();
    });
  });

  // =========================================================================
  // TIER 4: ABUSE COMPLAINTS & MODERATION WORKFLOW
  // =========================================================================
  describe('Tier 4: Abuse Moderation & Complaints Lifecycle', () => {
    let complaintId;

    it('should allow registered user to file an abuse complaint', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          reportedUserId: user2._id,
          reportedProfileId: profile2._id,
          reason: 'Inappropriate profile photograph and incorrect Gotra',
          category: 'Fake Profile',
          description: 'The uploaded photo belongs to a celebrity.',
          evidenceUrls: ['/uploads/evidence/screen1.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint).toBeDefined();
      expect(res.body.data.complaint.complaintId).toMatch(/^CMP-/);
      expect(res.body.data.complaint.status).toBe('Pending');
      complaintId = res.body.data.complaint._id;
    });

    it('should allow user to view their submitted reports', async () => {
      const res = await request(app)
        .get('/api/complaints/my-reports')
        .set('Authorization', `Bearer ${userToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.complaints.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to list and inspect complaints with populated user references', async () => {
      const res = await request(app)
        .get('/api/admin/complaints?status=Pending')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].reporterUserId).toBeDefined();

      const detailRes = await request(app)
        .get(`/api/admin/complaints/${res.body.data.items[0]._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.complaint.reason).toBeDefined();
    });

    it('should resolve complaint with "User Suspended" action and automatically suspend the reported user', async () => {
      // Find the existing pending complaint against user3
      const existingComplaint = await Complaint.findOne({ reportedUserId: user3._id });

      // First set user3 to Active to test auto-suspension
      await User.findByIdAndUpdate(user3._id, { accountStatus: 'Active' });

      const res = await request(app)
        .put(`/api/admin/complaints/${existingComplaint._id}/resolve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          resolutionAction: 'User Suspended',
          adminNotes: 'Confirmed fake biodata and abusive messages. Account suspended permanently.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.status).toBe('Resolved');
      expect(res.body.data.complaint.resolutionAction).toBe('User Suspended');

      // Verify reported user was automatically suspended in User model
      const reportedUser = await User.findById(user3._id);
      expect(reportedUser.accountStatus).toBe('Suspended');

      // Verify audit logs for both complaint resolution and suspension
      const suspensionAudit = await AuditLog.findOne({
        action: 'User Suspended via Complaint Resolution',
        target: user3._id.toString()
      });
      expect(suspensionAudit).toBeDefined();
      expect(suspensionAudit.details).toContain('Account suspended permanently');
    });

    it('should reject invalid complaint resolution action', async () => {
      const complaint = await Complaint.findOne();
      const res = await request(app)
        .put(`/api/admin/complaints/${complaint._id}/resolve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          resolutionAction: 'InvalidAction'
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // TIER 5: AUDIT TRAIL QUERY API & MULTI-FIELD SEARCH
  // =========================================================================
  describe('Tier 5: Audit Trail Query API', () => {
    beforeEach(async () => {
      // Create some audit entries
      await AuditLog.create([
        {
          adminId: superAdmin._id,
          adminName: 'Super Admin',
          adminRole: 'Super Admin',
          action: 'User Suspended',
          target: 'User: 9811122201',
          details: 'Manual suspension due to fraud',
          createdAt: new Date('2026-08-01')
        },
        {
          adminId: moderatorAdmin._id,
          adminName: 'Moderator Staff',
          adminRole: 'Moderator',
          action: 'Approved KYC Verification',
          target: 'User: 9811122202',
          details: 'Aadhaar card verified',
          createdAt: new Date('2026-08-05')
        },
        {
          adminId: superAdmin._id,
          adminName: 'Super Admin',
          adminRole: 'Super Admin',
          action: 'Updated CMS Page',
          target: 'CMS Page: terms-of-service',
          details: 'Updated clause 4',
          createdAt: new Date('2026-08-10')
        }
      ]);
    });

    it('should query paginated audit logs with sorting and actor filter', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?actor=Moderator')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].adminName).toBe('Moderator Staff');
      expect(res.body.data.items[0].action).toBe('Approved KYC Verification');
    });

    it('should filter audit logs by action and date range', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?action=Suspended&startDate=2026-08-01&endDate=2026-08-02')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].action).toBe('User Suspended');
    });

    it('should support multi-field global search across audit records', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?q=terms-of-service')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].target).toContain('terms-of-service');
    });

    it('should retrieve single audit log record by ID', async () => {
      const log = await AuditLog.findOne({ action: 'Updated CMS Page' });
      const res = await request(app)
        .get(`/api/admin/audit-logs/${log._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.log.action).toBe('Updated CMS Page');
    });
  });
});
