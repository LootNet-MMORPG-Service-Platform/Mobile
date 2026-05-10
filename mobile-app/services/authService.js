import api from './api';
import Storage from '../utils/storage';

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.tokenRefreshInterval = null;
    api.setAuthExpiredHandler(() => {
      this.clearLocalAuth();
    });
    api.setTokenRefreshHandler(async ({ token, refreshToken }) => {
      await Storage.setItem('authToken', token);
      if (refreshToken) {
        await Storage.setItem('refreshToken', refreshToken);
      }
    });
  }

  async login(username, password) {
    try {
      const response = await api.login(username, password);
      const { token, refreshToken } = response;
      
      await Storage.setItem('authToken', token);
      if (refreshToken) {
        await Storage.setItem('refreshToken', refreshToken);
      }
      
      api.setToken(token, refreshToken);
      
      const profileResponse = await api.getUserProfile();
      this.user = profileResponse;
      this.isAuthenticated = true;
      await Storage.setItem('userData', JSON.stringify(profileResponse));
      
      this.startTokenRefreshMonitoring();
      
      return { success: true, user: profileResponse };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      await api.register(userData);
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
        await api.refreshAccessToken();
      } catch (_error) {
        console.log('Token refresh failed');
      }
    }, 5 * 60 * 1000);
  }

  stopTokenRefreshMonitoring() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  async clearLocalAuth() {
    this.stopTokenRefreshMonitoring();
    await Storage.multiRemove(['authToken', 'refreshToken', 'userData']);
    api.setToken(null, null);
    this.user = null;
    this.isAuthenticated = false;
  }

  async logout() {
    try {
      const refreshToken = await Storage.getItem('refreshToken');
      
      this.stopTokenRefreshMonitoring();
      
      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearLocalAuth();
    }
  }

  async loadStoredAuth() {
    try {
      const token = await Storage.getItem('authToken');
      const refreshToken = await Storage.getItem('refreshToken');
      const userData = await Storage.getItem('userData');
      
      if (token && userData) {
        if (token.startsWith('eyJ') && token.includes('.')) {
          api.setToken(token, refreshToken);
          this.user = JSON.parse(userData);
          this.isAuthenticated = true;
          
          this.startTokenRefreshMonitoring();
          
          return true;
        } else {
          await Storage.multiRemove(['authToken', 'refreshToken']);
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading stored auth:', error);
      return false;
    }
  }

  async updateUserProfile(_userData) {
    return { success: false, error: 'Profile update not available yet' };
  }

  async refreshToken() {
    try {
      const refreshToken = await Storage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.refreshToken(refreshToken);
      const { token, refreshToken: newRefreshToken } = response;
      
      await Storage.setItem('authToken', token);
      await Storage.setItem('refreshToken', newRefreshToken);
      
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

  async getMarketListings(category = null, pageNumber = 1, pageSize = 20, sort = 'asc') {
    try {
      const response = await api.getMarketListings(category, pageNumber, pageSize, sort);
      return { success: true, data: response };
    } catch (error) {
      console.error('Marketplace listings error:', error);
      return { success: false, error: error.message };
    }
  }

  async createMarketListing(itemId, price) {
    try {
      const response = await api.createMarketListing({ itemId, price: Number(price) });
      return { success: true, data: response };
    } catch (error) {
      console.error('Create market listing error:', error);
      return { success: false, error: error.message };
    }
  }

  async buyMarketItem(listingId) {
    try {
      const response = await api.buyMarketItem(listingId);
      return { success: true, data: response };
    } catch (error) {
      console.error('Buy market item error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();
