/**
 * Subscription Plan Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const adminAuth = require('../middleware/adminAuth');
const { optionalAuth } = require('../middleware/auth');

// Public Plan Listing & Details
router.get('/', optionalAuth, getPlans);
router.get('/:id', getPlanById);

// Admin-Protected CRUD Endpoints
router.post('/', adminAuth(['Super Admin']), createPlan);
router.put('/:id', adminAuth(['Super Admin']), updatePlan);
router.delete('/:id', adminAuth(['Super Admin']), deletePlan);

module.exports = router;
