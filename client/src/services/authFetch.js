/**
 * Authenticated Fetch Utility for BhoomiBandhu
 * 
 * Generic wrapper around fetch() that automatically attaches
 * the stored Bearer token from localStorage. Intended for
 * API calls outside the /api/auth namespace (e.g., /api/admin).
 *
 * Uses the same token storage keys as authService.js.
 */

const ACCESS_TOKEN_KEY = 'bb_access_token';

/**
 * Performs an authenticated fetch request.
 * Automatically attaches Authorization header with Bearer token.
 * Parses JSON response and throws an Error with `status` and `data` on failure.
 *
 * @param {string} url - The URL to fetch (e.g., '/api/admin/stats')
 * @param {object} [options={}] - Standard fetch options (method, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { detail: 'Unexpected response from server' };
  }

  if (!response.ok) {
    const message = data.detail || data.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
