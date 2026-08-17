/**
 * CMS Public & Content Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const cmsController = require('../controllers/cmsController');
const adminAuth = require('../middleware/adminAuth');

// Public CMS Endpoints
router.get('/pages', cmsController.getAllPages);
router.get('/pages/:key', cmsController.getPageByKey);
router.get('/banners', cmsController.getActiveBanners);

// Admin CMS Endpoints (Direct Access /api/cms/...)
router.put('/pages/:key', adminAuth(), cmsController.updatePage);
router.post('/banners', adminAuth(), cmsController.createBanner);
router.put('/banners/:id', adminAuth(), cmsController.updateBanner);
router.delete('/banners/:id', adminAuth(), cmsController.deleteBanner);

module.exports = router;
