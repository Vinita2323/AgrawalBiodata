/**
 * Express Interest Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. Express interest in a candidate profile
 * POST /api/interests
 * @param {string} recipientProfileId Target candidate profile ID
 * @param {string} [message] Optional introductory message
 */
export async function sendInterest(recipientProfileId, message = '') {
  return api.post('/interests', {
    recipientProfileId,
    message
  });
}

export const expressInterest = sendInterest;

/**
 * 2. Accept received interest request
 * PUT /api/interests/:id/accept
 * @param {string} id Interest record ID
 */
export async function acceptInterest(id) {
  return api.put(`/interests/${id}/accept`);
}

/**
 * 3. Decline received interest request
 * PUT /api/interests/:id/decline
 * @param {string} id Interest record ID
 */
export async function declineInterest(id) {
  return api.put(`/interests/${id}/decline`);
}

/**
 * 4. Cancel sent interest request
 * PUT /api/interests/:id/cancel
 * @param {string} id Interest record ID
 */
export async function cancelInterest(id) {
  return api.put(`/interests/${id}/cancel`);
}

/**
 * 5. Get sent interests
 * GET /api/interests/sent or GET /api/interests?type=sent
 * @param {Object} [params] Query filters (status, page, limit)
 */
export async function getSentInterests(params = {}) {
  return api.get('/interests/sent', params);
}

/**
 * 6. Get received interests
 * GET /api/interests/received or GET /api/interests?type=received
 * @param {Object} [params] Query filters (status, page, limit)
 */
export async function getReceivedInterests(params = {}) {
  return api.get('/interests/received', params);
}

/**
 * 7. Get all interests with optional filter
 * GET /api/interests
 * @param {Object} [params] Query filters (type, status, page, limit)
 */
export async function getInterests(params = {}) {
  return api.get('/interests', params);
}

/**
 * 8. Check interest relationship status with a specific candidate
 * GET /api/interests/status/:targetProfileId
 * @param {string} targetProfileId Target candidate profile ID
 */
export async function getInterestStatus(targetProfileId) {
  return api.get(`/interests/status/${targetProfileId}`);
}

export const interestService = {
  sendInterest,
  expressInterest,
  acceptInterest,
  declineInterest,
  cancelInterest,
  getSentInterests,
  getReceivedInterests,
  getInterests,
  getInterestStatus
};

export default interestService;
