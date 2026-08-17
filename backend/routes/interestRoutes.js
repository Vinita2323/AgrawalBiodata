/**
 * Interest Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', interestController.expressInterest);
router.get('/', interestController.getInterests);
router.get('/received', interestController.getInterests);
router.get('/sent', interestController.getInterests);
router.get('/status/:targetProfileId', interestController.getInterestStatus);

router.put('/:interestId/accept', interestController.acceptInterest);
router.put('/:interestId/decline', interestController.declineInterest);
router.put('/:interestId/cancel', interestController.cancelInterest);
router.put('/:interestId', interestController.updateInterest);
router.delete('/:interestId', interestController.cancelInterest);

module.exports = router;
