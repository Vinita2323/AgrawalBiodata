/**
 * Centralized HTTP API Client
 * Agrawal Matrimony Platform
 * 
 * Provides unified request handling, automatic Bearer JWT injection,
 * automatic envelope unwrapping, multipart form upload support,
 * error normalization, and transparent 401 token refresh rotation.
 */

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
 * Retrieve auth token from localStorage (supporting user and admin keys)
 */
export function getAuthToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  // Check standard user token keys
  const token = localStorage.getItem('token') || 
                localStorage.getItem('accessToken') || 
                localStorage.getItem('adminToken') || 
                localStorage.getItem('admin_token');
  if (token) return token;

  // Check structured admin session object
  try {
    const adminSession = localStorage.getItem('admin_session');
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
    const userSession = localStorage.getItem('user_session');
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

/**
 * Retrieve refresh token from localStorage
 */
export function getRefreshToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
}

/**
 * Store auth tokens into localStorage
 */
export function setAuthTokens({ accessToken, token, refreshToken }) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const primaryToken = accessToken || token;
  if (primaryToken) {
    localStorage.setItem('token', primaryToken);
    localStorage.setItem('accessToken', primaryToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Clear all auth tokens and session data from localStorage
 */
export function clearAuthTokens() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_session');
  localStorage.removeItem('user_session');
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

  const fetchOptions = {
    method,
    headers: reqHeaders,
    body: reqBody,
    ...restOptions
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    const error = new Error(networkError.message || 'Network connection failed');
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    error.originalError = networkError;
    throw error;
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
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshPayload = await refreshRes.json();

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
