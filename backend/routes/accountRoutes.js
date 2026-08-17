/**
 * Account Lifecycle Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const { auth } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');

router.use(auth);

router.post('/mobile/request-otp', otpLimiter, accountController.requestMobileChangeOtp);
router.put('/mobile', accountController.changeMobile);
router.put('/email', accountController.changeEmail);

router.put('/deactivate', accountController.deactivateAccount);
router.put('/reactivate', accountController.reactivateAccount);

router.delete('/', accountController.deleteAccount);

module.exports = router;
