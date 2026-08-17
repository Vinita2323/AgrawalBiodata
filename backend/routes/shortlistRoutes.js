/**
 * Shortlist Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();
const shortlistController = require('../controllers/shortlistController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', shortlistController.addToShortlist);
router.get('/', shortlistController.getShortlists);
router.get('/check/:targetProfileId', shortlistController.checkShortlistStatus);
router.delete('/:targetProfileId', shortlistController.removeFromShortlist);

module.exports = router;
