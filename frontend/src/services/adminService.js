/**
 * Admin API Operations Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/** Serializes a params object into a query string, dropping empty values. */
function qs(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : '';
}

export async function adminLogin(email, password) {
  const data = await api.post('/admin/auth/login', { email, password });
  if (data?.token) {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('admin_token', data.token);
    if (data.admin) {
      localStorage.setItem('admin_session', JSON.stringify({ token: data.token, admin: data.admin }));
    }
  }
  return data;
}

export async function getDashboardMetrics() {
  return api.get('/admin/dashboard/metrics');
}

export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/admin/users${query ? `?${query}` : ''}`);
}

export async function getUserById(userId) {
  return api.get(`/admin/users/${userId}`);
}

export async function updateUserStatus(userId, status, reason = '') {
  return api.put(`/admin/users/${userId}/status`, { status, reason });
}

export async function exportUsersCSV() {
  return api.get('/admin/users/export/csv');
}

export async function getVerifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/admin/verifications${query ? `?${query}` : ''}`);
}

export async function getVerificationById(id) {
  return api.get(`/admin/verifications/${id}`);
}

export async function approveVerification(id, notes = '') {
  return api.put(`/admin/verifications/${id}/approve`, { notes });
}

export async function rejectVerification(id, rejectionReason = 'Invalid Document', notes = '') {
  return api.put(`/admin/verifications/${id}/reject`, { rejectionReason, notes });
}

export async function getPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/payments/admin/all${query ? `?${query}` : ''}`);
}

export async function getComplaints(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/admin/complaints${query ? `?${query}` : ''}`);
}

/**
 * Resolve an abuse complaint.
 * @param {string} id Complaint document id
 * @param {'Warning Sent'|'User Suspended'|'Profile Removed'|'Dismissed'} resolutionAction
 * @param {string} [adminNotes]
 */
export async function resolveComplaint(id, resolutionAction, adminNotes = '') {
  return api.put(`/admin/complaints/${id}/resolve`, { resolutionAction, adminNotes });
}

export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/admin/audit-logs${query ? `?${query}` : ''}`);
}

export async function getCMSPages() {
  return api.get('/admin/cms/pages');
}

export async function updateCMSPage(key, pageData) {
  return api.put(`/admin/cms/pages/${key}`, pageData);
}

export async function getBanners() {
  return api.get('/admin/banners');
}

export async function createBanner(bannerData) {
  return api.post('/admin/banners', bannerData);
}

export async function updateBanner(id, bannerData) {
  return api.put(`/admin/banners/${id}`, bannerData);
}

export async function deleteBanner(id) {
  return api.delete(`/admin/banners/${id}`);
}

export async function deleteUser(userId, reason = '') {
  return api.delete(`/admin/users/${userId}`, { reason });
}

/* ----------------------- Subscription Plans ----------------------- */

export async function getPlans(params = {}) {
  return api.get(`/plans${qs(params)}`);
}

export async function createPlan(planData) {
  return api.post('/plans', planData);
}

export async function updatePlan(id, planData) {
  return api.put(`/plans/${id}`, planData);
}

export async function deletePlan(id) {
  return api.delete(`/plans/${id}`);
}

export async function getSubscriptions(params = {}) {
  return api.get(`/admin/subscriptions${qs(params)}`);
}

/* ------------------- Moderation & Match Data ---------------------- */

export async function getBlocks(params = {}) {
  return api.get(`/admin/blocks${qs(params)}`);
}

export async function setProfileFeatured(profileId, isFeatured) {
  return api.put(`/admin/profiles/${profileId}/featured`, { isFeatured });
}

export async function getMatchPairs(params = {}) {
  return api.get(`/admin/matches${qs(params)}`);
}

/* ------------------------ Admin Account --------------------------- */

export async function getAdminProfile() {
  return api.get('/admin/auth/profile');
}

export async function updateAdminProfile(profileData) {
  return api.put('/admin/auth/profile', profileData);
}

export async function updateAdminPassword(currentPassword, newPassword) {
  return api.put('/admin/auth/password', { currentPassword, newPassword });
}

export async function updateAdminPreferences(preferences) {
  return api.put('/admin/auth/preferences', preferences);
}

export const adminService = {
  adminLogin,
  getDashboardMetrics,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  exportUsersCSV,
  getVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
  getPayments,
  getComplaints,
  resolveComplaint,
  getAuditLogs,
  getCMSPages,
  updateCMSPage,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  getBlocks,
  setProfileFeatured,
  getMatchPairs,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  updateAdminPreferences
};

export default adminService;
