/**
 * Block Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', blockController.blockProfile);
router.get('/', blockController.getBlockedProfiles);
router.get('/check/:targetProfileId', blockController.checkBlockStatus);
router.delete('/:targetProfileId', blockController.unblockProfile);

module.exports = router;
