/**
 * Visitor Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', visitorController.recordVisit);
router.post('/record/:targetProfileId', visitorController.recordVisit);
router.get('/', visitorController.getVisitors);
router.get('/recent', visitorController.getVisitors);
router.get('/count', visitorController.getVisitorMetrics);

module.exports = router;
