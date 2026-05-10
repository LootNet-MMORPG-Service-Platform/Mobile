import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL = 'http://localhost:5179/api';

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  return hostUri?.split(':')?.[0];
};

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const configuredUsesLocalhost =
    configuredUrl?.includes('localhost') || configuredUrl?.includes('127.0.0.1');

  if (Platform.OS !== 'web' && configuredUsesLocalhost) {
    const expoHost = getExpoHost();

    if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
      return `http://${expoHost}:5179/api`;
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5179/api';
    }
  }

  return configuredUrl || DEFAULT_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshTokenValue = null;
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshTokenValue = refreshToken;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async parseResponse(response) {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await this.parseResponse(response);

      if (!response.ok) {
        const message =
          typeof data === 'string'
            ? data
            : data?.message || data?.title || `API request failed (${response.status})`;
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async resetPassword(oldPassword, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async logout(refreshToken) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(refreshToken),
    });
  }

  async refreshToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(refreshToken),
    });
  }

  async getUserProfile() {
    return this.request('/auth/me');
  }

  async getMobileProfile() {
    return this.request('/mobile/me');
  }

  async getEquipment() {
    return this.request('/mobile/items');
  }

  async claimDailyReward() {
    return this.request('/mobile/daily', {
      method: 'POST',
    });
  }

  async getMarketListings(category = null, pageNumber = 1, pageSize = 20, sort = 'asc') {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      sort: sort,
      ...(category && { category: category }),
    });
    
    return this.request(`/market/listing?${params}`);
  }

  async createMarketListing(listingData) {
    return this.request('/market/sell', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async buyMarketItem(itemId) {
    return this.request(`/market/${itemId}/buy`, {
      method: 'POST',
    });
  }
}

export default new ApiService();
