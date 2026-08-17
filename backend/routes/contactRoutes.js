/**
 * Contact Unlock Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/unlock', contactController.unlockContact);
router.get('/quota', contactController.getQuota);
router.get('/unlocked', contactController.getUnlockedContacts);
router.get('/status/:targetProfileId', contactController.getUnlockStatus);

module.exports = router;
