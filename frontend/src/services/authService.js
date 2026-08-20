/**
 * User Authentication Service
 * Agrawal Matrimony Platform
 */

import { api, setAuthTokens, clearAuthTokens } from './api';

/**
 * 1. Request 6-digit OTP code to mobile number
 * POST /api/auth/send-otp
 * @param {string} mobile 10-digit mobile number
 */
export async function sendOtp(mobile) {
  const cleanMobile = typeof mobile === 'string' ? mobile.trim().replace(/^\+91\s*/, '') : mobile;
  return api.post('/auth/send-otp', { mobile: cleanMobile });
}

/**
 * 2. Verify OTP code and obtain token pair
 * POST /api/auth/verify-otp
 * @param {string} mobile 10-digit mobile number
 * @param {string} otp 6-digit OTP
 */
export async function verifyOtp(mobile, otp) {
  const cleanMobile = typeof mobile === 'string' ? mobile.trim().replace(/^\+91\s*/, '') : mobile;
  const cleanOtp = typeof otp === 'string' ? otp.trim() : otp;

  const data = await api.post('/auth/verify-otp', {
    mobile: cleanMobile,
    otp: cleanOtp
  });

  // Store tokens if present in response
  if (data?.accessToken || data?.token) {
    setAuthTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken
    });
  }

  // Store user info if present
  if (data?.user) {
    try {
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Ignore localStorage error
    }
  }

  return data;
}

/**
 * 3. Complete user registration
 * POST /api/auth/register
 * @param {Object} userData Registration details
 */
export async function register(userData) {
  const payload = { ...userData };
  if (payload.mobile) {
    payload.mobile = payload.mobile.trim().replace(/^\+91\s*/, '');
  }

  const data = await api.post('/auth/register', payload);

  if (data?.accessToken || data?.token) {
    setAuthTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken
    });
  }

  if (data?.user) {
    try {
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Ignore localStorage error
    }
  }

  return data;
}

/**
 * 4. Get currently authenticated user details
 * GET /api/auth/me
 */
export async function getCurrentUser() {
  const data = await api.get('/auth/me');
  if (data?.user) {
    try {
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Ignore
    }
  }
  return data;
}

export const getMe = getCurrentUser;

/**
 * 5. Refresh authentication token
 * POST /api/auth/refresh-token
 * @param {string} [token] Optional explicit refresh token
 */
export async function refreshToken(token) {
  const tokenToUse = token || localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
  const data = await api.post('/auth/refresh-token', { refreshToken: tokenToUse }, { skipRefresh: true });

  if (data?.accessToken || data?.token) {
    setAuthTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken || tokenToUse
    });
  }

  return data;
}

/**
 * 6. Logout user session and revoke token
 * POST /api/auth/logout
 */
export async function logout() {
  try {
    const token = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    await api.post('/auth/logout', { refreshToken: token }, { skipRefresh: true });
  } catch {
    // Ignore network or logout API errors during local logout cleanup
  } finally {
    clearAuthTokens();
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('activeProfile');
      // The "account created" screen belongs to a single registration; a new
      // sign-in in this tab must not replay it.
      sessionStorage.removeItem('justSignedUp');
    } catch {
      // Ignore
    }

    // Drop the realtime connection so the next user does not inherit this
    // session's socket rooms.
    try {
      const { disconnectSocket } = await import('./socket');
      disconnectSocket();
    } catch {
      // Ignore - the socket module may not have been loaded at all.
    }
  }
  return { success: true };
}

/**
 * Check if a user is currently logged in locally
 */
export function isAuthenticated() {
  return Boolean(localStorage.getItem('token') || localStorage.getItem('accessToken'));
}

/**
 * Get cached user profile from localStorage
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const authService = {
  sendOtp,
  verifyOtp,
  register,
  getCurrentUser,
  getMe,
  refreshToken,
  logout,
  isAuthenticated,
  getStoredUser
};

export default authService;
