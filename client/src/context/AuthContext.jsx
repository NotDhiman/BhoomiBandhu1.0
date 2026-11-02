import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, tokenStorage } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStorage.getUser());
  const [accessToken, setAccessToken] = useState(tokenStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = tokenStorage.getAccessToken();
      const storedRefreshToken = tokenStorage.getRefreshToken();

      if (!storedToken && !storedRefreshToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        // Attempt to fetch fresh user profile using current access token
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          tokenStorage.setUser(currentUser);
        }
      } catch (err) {
        // If access token expired, try to rotate refresh token
        if (storedRefreshToken) {
          try {
            const tokenRes = await authService.refreshSession();
            if (isMounted) {
              setUser(tokenRes.user);
              setAccessToken(tokenRes.access_token);
            }
          } catch (refreshErr) {
            // Refresh token invalid or expired — clear session
            if (isMounted) {
              setUser(null);
              setAccessToken(null);
              tokenStorage.clear();
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setAccessToken(null);
            tokenStorage.clear();
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    setUser(res.user);
    setAccessToken(res.access_token);
    return res.user;
  }, []);

  const registerFarmer = useCallback(async (formData) => {
    const res = await authService.registerFarmer(formData);
    setUser(res.user);
    setAccessToken(res.access_token);
    return res.user;
  }, []);

  const registerPsychiatrist = useCallback(async (formData) => {
    const res = await authService.registerPsychiatrist(formData);
    setUser(res.user);
    setAccessToken(res.access_token);
    return res.user;
  }, []);

  const registerWarehouseOwner = useCallback(async (formData) => {
    const res = await authService.registerWarehouseOwner(formData);
    setUser(res.user);
    setAccessToken(res.access_token);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const refreshAuthSession = useCallback(async () => {
    try {
      const res = await authService.refreshSession();
      setUser(res.user);
      setAccessToken(res.access_token);
      return res;
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      throw err;
    }
  }, []);

  const isApproved = useCallback(() => {
    if (!user) return false;
    if (user.role === 'farmer' || user.role === 'admin') return true;
    return !!user.profile_details?.is_approved;
  }, [user]);

  const value = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    isFarmer: user?.role === 'farmer',
    isPsychiatrist: user?.role === 'psychiatrist',
    isWarehouseOwner: user?.role === 'warehouse_owner',
    isAdmin: user?.role === 'admin',
    isApproved: isApproved(),
    login,
    registerFarmer,
    registerPsychiatrist,
    registerWarehouseOwner,
    logout,
    logoutAll,
    refreshAuthSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
