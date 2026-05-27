import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import authService from '../services/authService';
import { onRealtimeEvent, startRealtime, stopRealtime } from '../services/realtimeService';

const AuthContext = createContext();
const BACKGROUND_SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const logAuthContextWarning = (label, error) => {
  if (__DEV__) {
    console.warn(label, error?.message || 'Unexpected auth context error');
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const backgroundedAtRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.loadStoredAuth();
        if (isAuth) {
          setUser(authService.getUser());
          setIsAuthenticated(true);
        }
      } catch (error) {
        logAuthContextWarning('Auth check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      stopRealtime();
      return undefined;
    }

    startRealtime();
    const off = onRealtimeEvent(async (payload) => {
      const currentUserId = String(user?.id || user?.Id || '').toLowerCase();
      const isCurrentUserEvent = [
        payload?.userId,
        payload?.data?.userId,
        payload?.data?.buyerId,
        payload?.data?.sellerId,
      ].some((id) => String(id || '').toLowerCase() === currentUserId);

      if (payload?.domain === 'admin.user' && payload?.action === 'blocked' && isCurrentUserEvent) {
        await authService.clearLocalAuth();
        setUser(null);
        setIsAuthenticated(false);
        Alert.alert('Account blocked', 'Your account has been blocked. You have been signed out.');
        return;
      }

      if (
        isCurrentUserEvent &&
        (payload?.domain === 'reward' ||
          payload?.domain === 'market' ||
          payload?.domain === 'inventory' ||
          payload?.domain === 'profile')
      ) {
        const refreshed = await authService.getMobileProfile();
        if (refreshed.success) {
          authService.user = refreshed.data;
          setUser(refreshed.data);
        }
      }
    });

    return () => {
      off();
      stopRealtime();
    };
  }, [isAuthenticated, user?.id, user?.Id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAtRef.current = Date.now();
        return;
      }

      if (nextState === 'active' && backgroundedAtRef.current) {
        const backgroundTime = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        if (backgroundTime >= BACKGROUND_SESSION_TIMEOUT_MS) {
          await authService.clearLocalAuth();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          const refreshed = await authService.getMobileProfile();
          if (refreshed.success) {
            authService.user = refreshed.data;
            setUser(refreshed.data);
          }
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      logAuthContextWarning('Login failed', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      logAuthContextWarning('Registration failed', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      stopRealtime();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      logAuthContextWarning('Logout failed', error);
    }
  };

  const resetPassword = async (oldPassword, newPassword) => {
    try {
      const result = await authService.resetPassword(oldPassword, newPassword);
      return result;
    } catch (error) {
      logAuthContextWarning('Password reset failed', error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      const result = await authService.updateUserProfile(userData);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } catch (error) {
      logAuthContextWarning('Profile update failed', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
