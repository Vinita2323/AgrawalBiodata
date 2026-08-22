/**
 * Match Engine & Recommendation Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. Fetch paginated candidate matches with 6-factor Gotra compatibility score
 * GET /api/matches
 * @param {Object} [params] Query filters (gotra, city, minAge, maxAge, manglik, page, limit, sort)
 */
export async function getMatches(params = {}) {
  return api.get('/matches', params);
}

/**
 * 2. Fetch top daily recommended candidates for carousel
 * GET /api/matches/today
 * @param {number} [limit=10] Maximum items to fetch
 */
export async function getTodayMatches(limit = 10) {
  return api.get('/matches/today', { limit });
}

/**
 * 3. Multi-field search across candidate matches
 * GET /api/matches/search
 * @param {Object|string} query Search params or keyword string
 */
export async function searchMatches(query = {}) {
  const params = typeof query === 'string' ? { q: query } : query;
  return api.get('/matches/search', params);
}

/**
 * 4. Get detailed 6-factor compatibility score breakdown with specific candidate
 * GET /api/matches/score/:targetProfileId
 * @param {string} targetProfileId Target candidate profile ID
 */
export async function getMatchScore(targetProfileId) {
  return api.get(`/matches/score/${targetProfileId}`);
}

/**
 * 5. Get the caller's daily profile-view quota status
 * GET /api/matches/quota
 */
export async function getMatchQuota() {
  return api.get('/matches/quota');
}

export const matchService = {
  getMatches,
  getTodayMatches,
  searchMatches,
  getMatchScore,
  getMatchQuota
};

export default matchService;
