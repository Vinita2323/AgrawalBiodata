/**
 * Candidate Biodata & Multi-Profile Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadProfilePhoto, uploadGalleryPhoto } = require('../middleware/upload');

// 1. Me Profile & User Profiles Management
router.get('/me', auth, profileController.getMeProfile);
router.get('/me/completion', auth, profileController.getCompletionScore);
router.post('/me/photo', auth, uploadProfilePhoto, profileController.uploadProfilePhoto);
router.post('/me/gallery', auth, uploadGalleryPhoto, profileController.uploadGalleryPhoto);
router.get('/my-profiles', auth, profileController.getUserProfiles);
router.get('/user/all', auth, profileController.getUserProfiles);

// 2. Profile Creation & Active Profile Switching
router.post('/', auth, profileController.createProfile);
router.post('/switch-active', auth, profileController.switchActiveProfile);
router.put('/switch/:profileId', auth, profileController.switchActiveProfile);
router.post('/switch/:profileId', auth, profileController.switchActiveProfile);
router.put('/active/:profileId', auth, profileController.switchActiveProfile);
router.put('/me/active/:profileId', auth, profileController.switchActiveProfile);

// 3. Profile Uploads & Media
router.post('/:profileId/photo', auth, uploadProfilePhoto, profileController.uploadProfilePhoto);
router.post('/:profileId/gallery', auth, uploadGalleryPhoto, profileController.uploadGalleryPhoto);
router.delete('/:profileId/gallery/:photoId', auth, profileController.deleteGalleryPhoto);

// 4. Profile Completion Breakdown
router.get('/:profileId/completion', auth, profileController.getCompletionScore);

// 5. Profile CRUD by ID
router.get('/:profileId', optionalAuth, profileController.getProfileById);
router.put('/:profileId', auth, profileController.updateProfile);
router.delete('/:profileId', auth, profileController.deleteProfile);

module.exports = router;
