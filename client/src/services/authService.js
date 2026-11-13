/**
 * Authentication API Service for BhoomiBandhu
 * Integrates with FastAPI /api/auth endpoints.
 *
 * TOKEN STORAGE SECURITY NOTICE:
 * The backend API contract returns tokens in JSON format (TokenResponse).
 * Therefore, tokens are stored in browser localStorage to maintain session across reloads.
 * SECURITY TRADE-OFF: localStorage is vulnerable to XSS if an attacker can inject JavaScript.
 * HttpOnly, Secure cookies would be more secure against XSS, but require backend cookie-setting
 * and CSRF mitigation support. This trade-off is documented and adheres to the existing backend API.
 */

const API_BASE = '/api/auth';
const ACCESS_TOKEN_KEY = 'bb_access_token';
const REFRESH_TOKEN_KEY = 'bb_refresh_token';
const USER_KEY = 'bb_user';

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setTokens(accessToken, refreshToken, user = null) {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/**
 * Standard fetch helper that attaches Bearer token if available.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = tokenStorage.getAccessToken();
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

let inFlightRefreshPromise = null;

function clearSessionIfMatchingToken(failedToken) {
  const currentToken = tokenStorage.getRefreshToken();
  if (!currentToken || currentToken === failedToken) {
    tokenStorage.clear();
  }
}

async function executeTokenRefresh(refreshToken) {
  try {
    const res = await request('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (res.access_token && res.refresh_token) {
      tokenStorage.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  } catch (err) {
    clearSessionIfMatchingToken(refreshToken);
    throw err;
  }
}

async function coordinatedRefresh(initialRefreshToken) {
  // If Web Locks API is supported by the browser, coordinate cross-tab
  if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
    return navigator.locks.request('bhoomibandhu_auth_refresh_lock', async () => {
      const currentRefreshToken = tokenStorage.getRefreshToken();
      if (!currentRefreshToken) {
        tokenStorage.clear();
        throw new Error('No refresh token available');
      }

      // If token in storage was already rotated while waiting for the lock, reuse the new session
      if (initialRefreshToken && currentRefreshToken !== initialRefreshToken) {
        return {
          access_token: tokenStorage.getAccessToken(),
          refresh_token: currentRefreshToken,
          user: tokenStorage.getUser(),
        };
      }

      return executeTokenRefresh(currentRefreshToken);
    });
  }

  // Fallback for environments without Web Locks (Node.js tests / legacy browsers)
  return executeTokenRefresh(initialRefreshToken);
}

export const authService = {
  /**
   * Request OTP code dispatch to mobile phone.
   * purpose: 'registration' | 'reset_password'
   */
  async sendOtp(mobile, purpose = 'registration') {
    return request('/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose }),
    });
  },

  /**
   * Request OTP resend (enforces 60s cooldown on backend).
   */
  async resendOtp(mobile, purpose = 'registration') {
    return request('/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose }),
    });
  },

  /**
   * Verify OTP code against challenge.
   */
  async verifyOtp(mobile, otp_code, purpose = 'registration') {
    return request('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp_code, purpose }),
    });
  },

  /**
   * Register a new Farmer account.
   */
  async registerFarmer(formData) {
    const res = await request('/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.access_token && res.refresh_token) {
      tokenStorage.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  /**
   * Register a Psychiatrist account (pending admin approval).
   */
  async registerPsychiatrist(formData) {
    const res = await request('/register/psychiatrist', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.access_token && res.refresh_token) {
      tokenStorage.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  /**
   * Register a Warehouse Owner account (pending admin approval).
   */
  async registerWarehouseOwner(formData) {
    const res = await request('/register/warehouse-owner', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.access_token && res.refresh_token) {
      tokenStorage.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  /**
   * Authenticate via mobile/email and password.
   */
  async login(identifier, password) {
    const res = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.access_token && res.refresh_token) {
      tokenStorage.setTokens(res.access_token, res.refresh_token, res.user);
    }
    return res;
  },

  /**
   * Rotate refresh token to obtain a fresh access token and replacement refresh token.
   * Deduplicates concurrent calls within the same tab using a shared in-flight promise,
   * and coordinates cross-tab refresh via Web Locks where available.
   */
  async refreshSession() {
    if (inFlightRefreshPromise) {
      return inFlightRefreshPromise;
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      throw new Error('No refresh token available');
    }

    inFlightRefreshPromise = coordinatedRefresh(refreshToken).finally(() => {
      inFlightRefreshPromise = null;
    });

    return inFlightRefreshPromise;
  },

  /**
   * Get current authenticated user profile details from backend.
   */
  async getCurrentUser() {
    return request('/me', { method: 'GET' });
  },

  /**
   * Request password reset OTP.
   */
  async forgotPassword(mobile) {
    return request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    });
  },

  /**
   * Reset password with verified OTP.
   */
  async resetPassword(mobile, otp_code, new_password) {
    return request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp_code, new_password }),
    });
  },

  /**
   * Logout single session by revoking the current refresh token.
   */
  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await request('/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      tokenStorage.clear();
    }
  },

  /**
   * Revoke all active sessions for current user (Logout All Devices).
   */
  async logoutAll() {
    try {
      await request('/logout-all', { method: 'POST' });
    } catch {
      // Ignore network errors during logout-all
    } finally {
      tokenStorage.clear();
    }
  },
};
