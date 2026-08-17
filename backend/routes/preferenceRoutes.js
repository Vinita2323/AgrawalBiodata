/**
 * Partner Preferences & Saved Search Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const preferenceController = require('../controllers/preferenceController');
const { auth } = require('../middleware/auth');

router.use(auth);

// Search routes are declared before /:profileId so "searches" is not captured
// as a profile id.
router.get('/searches', preferenceController.getSearches);
router.post('/searches', preferenceController.recordSearch);
router.delete('/searches/:id', preferenceController.deleteSearch);

router.get('/', preferenceController.getPreferences);
router.put('/', preferenceController.updatePreferences);
router.get('/:profileId', preferenceController.getPreferences);
router.put('/:profileId', preferenceController.updatePreferences);

module.exports = router;
