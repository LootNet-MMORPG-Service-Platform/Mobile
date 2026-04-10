import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.tokenRefreshInterval = null;
  }

  async login(email, password) {
    try {
      const response = await api.login(email, password);
      const { token, refreshToken, user } = response;
      
      // Store tokens and user data securely
      await AsyncStorage.setItem('authToken', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Update API service with tokens
      api.setToken(token, refreshToken);
      
      // Update local state
      this.user = user;
      this.isAuthenticated = true;
      
      // Start token refresh monitoring
      this.startTokenRefreshMonitoring();
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      const response = await api.resetPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  startTokenRefreshMonitoring() {
    // Clear any existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    
    // Check token validity every 5 minutes
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        // Make a lightweight request to check if token is still valid
        await api.getUserProfile();
      } catch (error) {
        console.log('Token validation failed, attempting refresh');
        // The API service will handle token refresh automatically
        // If refresh fails, the user will need to login again
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopTokenRefreshMonitoring() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  async logout() {
    try {
      // Stop token refresh monitoring
      this.stopTokenRefreshMonitoring();
      
      // Call logout endpoint
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data from storage
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
      
      // Clear API tokens
      api.setToken(null, null);
      
      // Reset local state
      this.user = null;
      this.isAuthenticated = false;
    }
  }

  async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        // Validate token format (basic check)
        if (token.startsWith('eyJ') && token.includes('.')) {
          api.setToken(token, refreshToken);
          this.user = JSON.parse(userData);
          this.isAuthenticated = true;
          
          // Start token refresh monitoring
          this.startTokenRefreshMonitoring();
          
          return true;
        } else {
          // Invalid token format, clear storage
          await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading stored auth:', error);
      return false;
    }
  }

  async updateUserProfile(userData) {
    try {
      const response = await api.updateProfile(userData);
      this.user = { ...this.user, ...response.user };
      await AsyncStorage.setItem('userData', JSON.stringify(this.user));
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  getUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

export default new AuthService();
