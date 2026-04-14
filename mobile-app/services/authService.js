import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.tokenRefreshInterval = null;
  }

  async login(username, password) {
    try {
      const response = await api.login(username, password);
      const { token, refreshToken } = response;
      
      await AsyncStorage.setItem('authToken', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      
      api.setToken(token, refreshToken);
      
      const profileResponse = await api.getUserProfile();
      this.user = profileResponse;
      this.isAuthenticated = true;
      await AsyncStorage.setItem('userData', JSON.stringify(profileResponse));
      
      this.startTokenRefreshMonitoring();
      
      return { success: true, user: profileResponse };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(oldPassword, newPassword) {
    try {
      const response = await api.resetPassword(oldPassword, newPassword);
      return { success: true, message: response };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  startTokenRefreshMonitoring() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        await api.getUserProfile();
      } catch (error) {
        console.log('Token validation failed, attempting refresh');
      }
    }, 5 * 60 * 1000);
  }

  stopTokenRefreshMonitoring() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  async logout() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      this.stopTokenRefreshMonitoring();
      
      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
      
      api.setToken(null, null);
      
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
        if (token.startsWith('eyJ') && token.includes('.')) {
          api.setToken(token, refreshToken);
          this.user = JSON.parse(userData);
          this.isAuthenticated = true;
          
          this.startTokenRefreshMonitoring();
          
          return true;
        } else {
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
      return { success: false, error: 'Profile update not available yet' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.refreshToken(refreshToken);
      const { token, refreshToken: newRefreshToken } = response;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      
      api.setToken(token, newRefreshToken);
      
      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }

  getUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  async getMobileProfile() {
    try {
      const response = await api.getMobileProfile();
      return { success: true, data: response };
    } catch (error) {
      console.error('Mobile profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async getEquipment() {
    try {
      const response = await api.getEquipment();
      return { success: true, data: response };
    } catch (error) {
      console.error('Equipment error:', error);
      return { success: false, error: error.message };
    }
  }

  async claimDailyReward() {
    try {
      const response = await api.claimDailyReward();
      return { success: true, data: response };
    } catch (error) {
      console.error('Daily reward error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();
