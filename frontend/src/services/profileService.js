/**
 * Candidate Biodata & Profile Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. Fetch active candidate profile for current authenticated user
 * GET /api/profiles/me
 */
export async function getMyProfile() {
  const data = await api.get('/profiles/me');
  if (data?.profile) {
    try {
      localStorage.setItem('activeProfile', JSON.stringify(data.profile));
    } catch {
      // Ignore
    }
  }
  return data;
}

export const getMeProfile = getMyProfile;

/**
 * 2. Create a new candidate profile
 * POST /api/profiles
 * @param {Object} profileData Candidate biodata payload
 */
export async function createProfile(profileData) {
  const data = await api.post('/profiles', profileData);
  if (data?.profile) {
    try {
      localStorage.setItem('activeProfile', JSON.stringify(data.profile));
    } catch {
      // Ignore
    }
  }
  return data;
}

/**
 * 3. Update an existing candidate profile
 * PUT /api/profiles/:id
 * @param {string} id Profile ID (ObjectId or PRF-xxxxx)
 * @param {Object} profileData Updated biodata fields
 */
export async function updateProfile(id, profileData) {
  const endpoint = id ? `/profiles/${id}` : '/profiles/me';
  const data = await api.put(endpoint, profileData);
  if (data?.profile) {
    try {
      localStorage.setItem('activeProfile', JSON.stringify(data.profile));
    } catch {
      // Ignore
    }
  }
  return data;
}

/**
 * 4. Upload primary profile photo
 * POST /api/profiles/me/photo or POST /api/profiles/:id/photo
 * @param {File|Blob|FormData} fileOrFormData Image file or pre-constructed FormData
 * @param {string} [id] Optional candidate profile ID
 */
export async function uploadPhoto(fileOrFormData, id = null) {
  let formData;
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append('photo', fileOrFormData);
  }

  const endpoint = id ? `/profiles/${id}/photo` : '/profiles/me/photo';
  return api.upload(endpoint, formData);
}

export const uploadProfilePhoto = uploadPhoto;

/**
 * 5. Get 5-section completion score breakdown
 * GET /api/profiles/me/completion or GET /api/profiles/:id/completion
 * @param {string} [id] Optional candidate profile ID
 */
export async function getCompletionScore(id = null) {
  const endpoint = id ? `/profiles/${id}/completion` : '/profiles/me/completion';
  return api.get(endpoint);
}

/**
 * 6. Get public candidate profile by ID
 * GET /api/profiles/:id
 * @param {string} id Candidate Profile ID
 */
export async function getProfileById(id) {
  return api.get(`/profiles/${id}`);
}

/**
 * 7. Get authentic 18 Agarwal Gotras reference
 * GET /api/gotras
 */
export async function getGotras() {
  return api.get('/gotras');
}

/**
 * 8. Get all candidate profiles associated with the logged-in user account
 * GET /api/profiles/my-profiles
 */
export async function getUserProfiles() {
  return api.get('/profiles/my-profiles');
}

export const getMyProfiles = getUserProfiles;

/**
 * 9. Switch active candidate profile
 * POST /api/profiles/switch-active
 * @param {string} profileId ID of profile to make active
 */
export async function switchActiveProfile(profileId) {
  const data = await api.post('/profiles/switch-active', { profileId });
  if (data?.activeProfile) {
    try {
      localStorage.setItem('activeProfile', JSON.stringify(data.activeProfile));
    } catch {
      // Ignore
    }
  }
  return data;
}

/**
 * 10. Delete a candidate profile
 * DELETE /api/profiles/:id
 * @param {string} id Candidate Profile ID
 */
export async function deleteProfile(id) {
  return api.delete(`/profiles/${id}`);
}

/**
 * 11. Upload gallery photo
 * POST /api/profiles/me/gallery or POST /api/profiles/:id/gallery
 * @param {File|Blob|FormData} fileOrFormData Image file or FormData
 * @param {string} [id] Optional candidate profile ID
 * @param {string} [caption] Optional image caption
 * @param {boolean} [isPrimary] Optional isPrimary flag
 */
export async function uploadGalleryPhoto(fileOrFormData, id = null, caption = '', isPrimary = false) {
  let formData;
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append('photo', fileOrFormData);
    if (caption) formData.append('caption', caption);
    if (isPrimary) formData.append('isPrimary', 'true');
  }

  const endpoint = id ? `/profiles/${id}/gallery` : '/profiles/me/gallery';
  return api.upload(endpoint, formData);
}

/**
 * 12. Delete gallery photo
 * DELETE /api/profiles/:profileId/gallery/:photoId
 * @param {string} photoId Gallery photo ID
 * @param {string} [profileId] Optional profile ID (defaults to 'me')
 */
export async function deleteGalleryPhoto(photoId, profileId = 'me') {
  return api.delete(`/profiles/${profileId}/gallery/${photoId}`);
}

export const profileService = {
  getMyProfile,
  getMeProfile,
  createProfile,
  updateProfile,
  uploadPhoto,
  uploadProfilePhoto,
  getCompletionScore,
  getProfileById,
  getGotras,
  getUserProfiles,
  getMyProfiles,
  switchActiveProfile,
  deleteProfile,
  uploadGalleryPhoto,
  deleteGalleryPhoto
};

export default profileService;
