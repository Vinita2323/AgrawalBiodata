/**
 * Centralized HTTP API Client
 * Agrawal Matrimony Platform
 * 
 * Provides unified request handling, automatic Bearer JWT injection,
 * automatic envelope unwrapping, multipart form upload support,
 * error normalization, and transparent 401 token refresh rotation.
 */
import safeStorage from '../utils/safeStorage';

/**
 * API origin.
 *
 * In development the Vite proxy forwards the relative `/api` prefix to the
 * backend, so no origin is needed. In production the frontend and backend are
 * deployed separately, so VITE_API_URL must point at the backend origin -
 * without it every request resolves against the static host and 404s.
 */
const API_ORIGIN = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

/** How long a request may run before it is treated as failed. */
const DEFAULT_TIMEOUT_MS = 15000;

/** Uploads move real files over mobile connections and need more room. */
const UPLOAD_TIMEOUT_MS = 60000;

/** Absolute origin for non-API assets such as /uploads/... image paths. */
export const ASSET_ORIGIN = API_ORIGIN;

/**
 * Resolve a backend-relative upload path into a URL the browser can load.
 * @param {string} path e.g. "/uploads/profiles/abc.jpg"
 */
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${ASSET_ORIGIN}${clean}`;
}

/**
 * Retrieve auth token from storage (supporting user and admin keys)
 */
export function getAuthToken() {
  // If currently in the admin section, prioritize admin tokens
  const isAdminRoute = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');

  if (isAdminRoute) {
    const adminToken = safeStorage.getItem('adminToken') || safeStorage.getItem('admin_token');
    if (adminToken) return adminToken;

    try {
      const adminSession = safeStorage.getItem('admin_session');
      if (adminSession) {
        const parsed = JSON.parse(adminSession);
        if (parsed?.token || parsed?.accessToken) {
          return parsed.token || parsed.accessToken;
        }
      }
    } catch {}
  }

  // Check standard user token keys
  const token = safeStorage.getItem('token') || 
                safeStorage.getItem('accessToken') || 
                safeStorage.getItem('adminToken') || 
                safeStorage.getItem('admin_token');
  if (token) return token;

  // Check structured admin session object
  try {
    const adminSession = safeStorage.getItem('admin_session');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      if (parsed?.token || parsed?.accessToken) {
        return parsed.token || parsed.accessToken;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Check structured user session object
  try {
    const userSession = safeStorage.getItem('user_session');
    if (userSession) {
      const parsed = JSON.parse(userSession);
      if (parsed?.token || parsed?.accessToken) {
        return parsed.token || parsed.accessToken;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return null;
}

/** Storage key holding the candidate profile the UI is currently showing. */
export const ACTIVE_PROFILE_ID_KEY = 'activeProfileId';

/**
 * The candidate profile the app is currently acting as.
 *
 * An account can run several profiles - a parent operating biodata for a son
 * and a daughter - so every request carries the one on screen. The server falls
 * back to the account's stored active profile when this is absent.
 */
export function getActiveProfileId() {
  return safeStorage.getItem(ACTIVE_PROFILE_ID_KEY) || null;
}

/** Records which profile subsequent requests should act as. */
export function setActiveProfileId(profileId) {
  if (profileId) {
    safeStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
  } else {
    safeStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
  }
}

/**
 * Retrieve refresh token from storage
 */
export function getRefreshToken() {
  return safeStorage.getItem('refreshToken') || safeStorage.getItem('refresh_token');
}

/**
 * Store auth tokens into storage
 */
export function setAuthTokens({ accessToken, token, refreshToken }) {
  const primaryToken = accessToken || token;
  if (primaryToken) {
    safeStorage.setItem('token', primaryToken);
    safeStorage.setItem('accessToken', primaryToken);
  }
  if (refreshToken) {
    safeStorage.setItem('refreshToken', refreshToken);
    safeStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Clear all auth tokens and session data from storage
 */
export function clearAuthTokens() {
  safeStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
  safeStorage.removeItem('token');
  safeStorage.removeItem('accessToken');
  safeStorage.removeItem('refreshToken');
  safeStorage.removeItem('refresh_token');
  safeStorage.removeItem('adminToken');
  safeStorage.removeItem('admin_token');
  safeStorage.removeItem('admin_session');
  safeStorage.removeItem('user_session');
}

/**
 * Serialize query parameter objects into query string
 */
export function buildQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Normalize and resolve the request URL
 */
function resolveUrl(endpoint) {
  if (!endpoint) return BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Callers may pass either "/profiles/me" or a fully-prefixed "/api/profiles/me".
  // Strip the duplicate prefix so both forms honour the configured origin.
  if (cleanEndpoint === '/api') return BASE_URL;
  if (cleanEndpoint.startsWith('/api/')) {
    return `${BASE_URL}${cleanEndpoint.slice(4)}`;
  }
  return `${BASE_URL}${cleanEndpoint}`;
}

// Track ongoing refresh token promise to prevent concurrent duplicate calls
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/**
 * Core HTTP Request Method
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    params = null,
    skipAuth = false,
    skipRefresh = false,
    ...restOptions
  } = options;

  let url = resolveUrl(endpoint);

  // Append query parameters if provided
  if (params) {
    const queryString = buildQueryString(params);
    url += queryString;
  }

  // Construct request headers
  const reqHeaders = new Headers(headers);

  // Auto-inject JWT Bearer Authorization header
  if (!skipAuth && !reqHeaders.has('Authorization')) {
    const token = getAuthToken();
    if (token) {
      reqHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  // Tell the server which candidate profile this request is acting as.
  if (!skipAuth && !reqHeaders.has('X-Profile-Id')) {
    const activeProfileId = getActiveProfileId();
    if (activeProfileId) {
      reqHeaders.set('X-Profile-Id', activeProfileId);
    }
  }

  let reqBody = body;

  // Handle payload serialization:
  // FormData: do NOT set Content-Type header so browser adds boundary automatically.
  // Object / JSON: serialize and set Content-Type: application/json
  if (body instanceof FormData) {
    reqHeaders.delete('Content-Type');
  } else if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    if (!reqHeaders.has('Content-Type')) {
      reqHeaders.set('Content-Type', 'application/json');
    }
    reqBody = JSON.stringify(body);
  }

  /**
   * Every request is given a deadline.
   *
   * `fetch` has no timeout of its own, so a connection that opens and then
   * stalls - a dropped mobile network, a wedged upstream - never settles. The
   * caller's spinner then runs forever, which is indistinguishable from an app
   * that has hung. Uploads get a longer budget because they legitimately take
   * one.
   */
  const timeoutMs = restOptions.timeoutMs
    ?? (body instanceof FormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  delete restOptions.timeoutMs;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // A caller-supplied signal still has to work, so abort on either.
  const callerSignal = restOptions.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  delete restOptions.signal;

  const fetchOptions = {
    method,
    headers: reqHeaders,
    body: reqBody,
    ...restOptions,
    signal: controller.signal
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    // An abort the caller asked for is not a fault; ours means we ran out of time.
    const isTimeout = networkError?.name === 'AbortError' && !callerSignal?.aborted;
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

    let message = 'Could not reach the server. Please try again.';
    let code = 'NETWORK_ERROR';

    if (callerSignal?.aborted) {
      message = 'Request cancelled';
      code = 'CANCELLED';
    } else if (isOffline) {
      message = 'You appear to be offline. Check your connection and try again.';
      code = 'OFFLINE';
    } else if (isTimeout) {
      message = 'The server took too long to respond. Please try again.';
      code = 'TIMEOUT';
    }

    const error = new Error(message);
    error.status = 0;
    error.code = code;
    error.originalError = networkError;
    throw error;
  } finally {
    clearTimeout(timer);
  }

  // Parse response payload
  const contentType = response.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else if (contentType.includes('text/')) {
    payload = await response.text();
  } else {
    try {
      payload = await response.blob();
    } catch {
      payload = null;
    }
  }

  // Handle 401 Unauthorized with automatic refresh token rotation
  if (response.status === 401 && !skipRefresh && !url.includes('/auth/refresh-token') && !url.includes('/auth/login') && !url.includes('/auth/send-otp')) {
    const isAdminRoute = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');
    const refreshToken = getRefreshToken();

    // Admin sessions carry no refresh token, so an expired/invalid admin
    // token can never be silently renewed - the session is simply over.
    // Log out and send the admin back to sign in instead of surfacing a raw
    // "invalid token" error that leaves the dashboard stuck on a Retry loop.
    if (!refreshToken && isAdminRoute) {
      clearAuthTokens();
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
      return new Promise(() => {}); // navigation is underway; never resolve
    }

    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // Deadlined like any other request: a stalled refresh would otherwise
          // hold every queued caller open indefinitely.
          const refreshController = new AbortController();
          const refreshTimer = setTimeout(() => refreshController.abort(), DEFAULT_TIMEOUT_MS);
          let refreshRes;
          let refreshPayload;
          try {
            refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
              signal: refreshController.signal
            });
            refreshPayload = await refreshRes.json();
          } finally {
            clearTimeout(refreshTimer);
          }

          if (refreshRes.ok && refreshPayload?.data?.accessToken) {
            const newAccessToken = refreshPayload.data.accessToken;
            const newRefreshToken = refreshPayload.data.refreshToken || refreshToken;
            setAuthTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
            isRefreshing = false;
            onRefreshed(newAccessToken);

            // Retry original request with new token
            reqHeaders.set('Authorization', `Bearer ${newAccessToken}`);
            return request(endpoint, {
              ...options,
              headers: reqHeaders,
              skipRefresh: true
            });
          } else {
            isRefreshing = false;
            clearAuthTokens();
          }
        } catch {
          isRefreshing = false;
          clearAuthTokens();
        }
      } else {
        // Wait for token refresh and retry
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              reqHeaders.set('Authorization', `Bearer ${newToken}`);
              resolve(
                request(endpoint, {
                  ...options,
                  headers: reqHeaders,
                  skipRefresh: true
                })
              );
            } else {
              const err = new Error('Session expired. Please log in again.');
              err.status = 401;
              err.code = 'UNAUTHORIZED';
              reject(err);
            }
          });
        });
      }
    }
  }

  // Normalize and throw error on non-2xx HTTP status
  if (!response.ok) {
    let errorMessage = 'Request failed';
    let errorCode = 'HTTP_ERROR';
    let errorDetails = null;

    if (payload && typeof payload === 'object') {
      errorMessage = payload.message || payload.error || errorMessage;
      errorCode = payload.code || errorCode;
      errorDetails = payload.errors || payload.data || null;

      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        const firstError = payload.errors[0];
        if (typeof firstError === 'string') {
          errorMessage = firstError;
        } else if (firstError?.msg || firstError?.message) {
          errorMessage = firstError.msg || firstError.message;
        }
      }
    } else if (typeof payload === 'string' && payload) {
      errorMessage = payload;
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = errorCode;
    error.errors = errorDetails;
    error.data = payload?.data || null;
    error.meta = payload?.meta || null;
    error.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: payload
    };

    throw error;
  }

  // Unwrap backend standard JSON envelope: { success, message, data, meta }
  if (payload && typeof payload === 'object' && 'success' in payload && payload.data !== undefined) {
    // If data is an object, attach metadata non-enumerable properties for caller flexibility
    const result = payload.data;
    if (result && typeof result === 'object' && !Array.isArray(result) && !(result instanceof Blob)) {
      try {
        Object.defineProperty(result, '_raw', { value: payload, writable: true, configurable: true, enumerable: false });
        if (payload.meta) {
          Object.defineProperty(result, '_meta', { value: payload.meta, writable: true, configurable: true, enumerable: false });
        }
        if (payload.message) {
          Object.defineProperty(result, '_message', { value: payload.message, writable: true, configurable: true, enumerable: false });
        }
      } catch {
        // Ignore frozen object define errors
      }
    }
    return result;
  }

  return payload;
}

/**
 * Convenience helper methods for standard REST verbs
 */
export const api = {
  request,

  get(endpoint, params = null, options = {}) {
    return request(endpoint, { method: 'GET', params, ...options });
  },

  post(endpoint, body = null, options = {}) {
    return request(endpoint, { method: 'POST', body, ...options });
  },

  put(endpoint, body = null, options = {}) {
    return request(endpoint, { method: 'PUT', body, ...options });
  },

  patch(endpoint, body = null, options = {}) {
    return request(endpoint, { method: 'PATCH', body, ...options });
  },

  delete(endpoint, bodyOrParams = null, options = {}) {
    const isParams = bodyOrParams && typeof bodyOrParams === 'object' && !('body' in options) && options.method !== 'DELETE';
    // If bodyOrParams is passed and options doesn't specify body, handle intelligently
    if (bodyOrParams instanceof FormData || (bodyOrParams && typeof bodyOrParams === 'object' && !options.params)) {
      return request(endpoint, { method: 'DELETE', body: bodyOrParams, ...options });
    }
    return request(endpoint, { method: 'DELETE', params: bodyOrParams, ...options });
  },

  upload(endpoint, formData, options = {}) {
    return request(endpoint, {
      method: 'POST',
      body: formData,
      ...options
    });
  }
};

export default api;
