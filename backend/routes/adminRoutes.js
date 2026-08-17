/**
 * Admin Operations & Management Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const cmsController = require('../controllers/cmsController');
const complaintController = require('../controllers/complaintController');
const auditController = require('../controllers/auditController');
const adminAuth = require('../middleware/adminAuth');

// All admin routes require valid admin authentication
router.use(adminAuth());

// Dashboard Metrics
router.get('/dashboard/metrics', adminController.getDashboardMetrics);
router.get('/dashboard/kpis', adminController.getDashboardMetrics);

// User Management
router.get('/users/export/csv', adminController.exportUsersCSV);
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminAuth(['Super Admin']), adminController.deleteUser);

// Subscriptions, Blocks & Featured Placement
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/blocks', adminController.getBlocks);
router.put('/profiles/:profileId/featured', adminController.setProfileFeatured);

// Computed Match Pairs
router.get('/matches', adminController.getMatchPairs);

// CMS Static Pages & Banners Management
router.get('/cms/pages', cmsController.getAdminPages);
router.put('/cms/pages/:key', cmsController.updatePage);
router.get('/banners', cmsController.getAdminBanners);
router.post('/banners', cmsController.createBanner);
router.put('/banners/:id', cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// Abuse Moderation & Complaints
router.get('/complaints', complaintController.getAdminComplaints);
router.get('/complaints/:id', complaintController.getAdminComplaintById);
router.put('/complaints/:id/resolve', complaintController.resolveComplaint);

// Audit Trail Logs
router.get('/audit-logs', auditController.getAuditLogs);
router.get('/audit-logs/:id', auditController.getAuditLogById);

module.exports = router;
