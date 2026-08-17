/**
 * Audit Trail Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const auditController = require('../controllers/auditController');
const adminAuth = require('../middleware/adminAuth');

// All audit trail queries require admin authentication
router.use(adminAuth());

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLogById);

module.exports = router;
