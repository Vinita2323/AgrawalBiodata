/**
 * Account Lifecycle, Contact Unlock & Preferences Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/* ---------------------- Account lifecycle ---------------------- */

/**
 * Send a verification code to a NEW mobile number.
 * POST /api/account/mobile/request-otp
 */
export async function requestMobileChangeOtp(mobile) {
  return api.post('/account/mobile/request-otp', { mobile });
}

/**
 * Confirm the code and switch the account's mobile number.
 * PUT /api/account/mobile
 */
export async function changeMobile(mobile, otp) {
  return api.put('/account/mobile', { mobile, otp });
}

/**
 * PUT /api/account/email
 */
export async function changeEmail(email) {
  return api.put('/account/email', { email });
}

/**
 * Hide every candidate profile from discovery. Reversible by logging back in.
 * PUT /api/account/deactivate
 */
export async function deactivateAccount() {
  return api.put('/account/deactivate');
}

/**
 * PUT /api/account/reactivate
 */
export async function reactivateAccount() {
  return api.put('/account/reactivate');
}

/**
 * Permanently delete the account. The API requires the literal confirmation
 * string, so a stray call can never destroy an account by accident.
 * DELETE /api/account
 */
export async function deleteAccount() {
  return api.delete('/account', { confirm: 'DELETE' });
}

/* ------------------------ Contact unlock ----------------------- */

/**
 * POST /api/contacts/unlock
 */
export async function unlockContact(targetProfileId) {
  return api.post('/contacts/unlock', { targetProfileId });
}

/**
 * GET /api/contacts/quota
 */
export async function getContactQuota() {
  return api.get('/contacts/quota');
}

/**
 * GET /api/contacts/status/:targetProfileId
 */
export async function getContactUnlockStatus(targetProfileId) {
  return api.get(`/contacts/status/${targetProfileId}`);
}

/**
 * GET /api/contacts/unlocked
 */
export async function getUnlockedContacts() {
  return api.get('/contacts/unlocked');
}

/* --------------------- Partner preferences --------------------- */

/**
 * GET /api/preferences
 */
export async function getPartnerPreferences(profileId = null) {
  return api.get(profileId ? `/preferences/${profileId}` : '/preferences');
}

/**
 * PUT /api/preferences
 */
export async function updatePartnerPreferences(preferences, profileId = null) {
  return api.put(profileId ? `/preferences/${profileId}` : '/preferences', preferences);
}

/* ----------------------- Saved searches ------------------------ */

/**
 * GET /api/preferences/searches
 */
export async function getSavedSearches(params = {}) {
  return api.get('/preferences/searches', params);
}

/**
 * POST /api/preferences/searches
 */
export async function recordSearch({ query = '', filters = {}, label = '', isSaved = false, resultCount = 0 }) {
  return api.post('/preferences/searches', { query, filters, label, isSaved, resultCount });
}

/**
 * DELETE /api/preferences/searches/:id
 */
export async function deleteSavedSearch(id) {
  return api.delete(`/preferences/searches/${id}`);
}

export const accountService = {
  requestMobileChangeOtp,
  changeMobile,
  changeEmail,
  deactivateAccount,
  reactivateAccount,
  deleteAccount,
  unlockContact,
  getContactQuota,
  getContactUnlockStatus,
  getUnlockedContacts,
  getPartnerPreferences,
  updatePartnerPreferences,
  getSavedSearches,
  recordSearch,
  deleteSavedSearch
};

export default accountService;
