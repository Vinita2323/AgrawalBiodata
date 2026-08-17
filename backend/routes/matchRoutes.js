/**
 * Match Discovery Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { auth } = require('../middleware/auth');

// All match routes require user authentication
router.use(auth);

router.get('/', matchController.getMatches);
router.get('/today', matchController.getTodayMatches);
router.get('/search', matchController.searchMatches);
router.get('/score/:targetProfileId', matchController.getMatchScore);

module.exports = router;
