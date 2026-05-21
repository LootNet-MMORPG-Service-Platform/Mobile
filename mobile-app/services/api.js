import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL = 'https://lootnet-api.onrender.com/api';
const REQUEST_TIMEOUT_MS = 30000;
const GENERIC_ERROR_MESSAGE = 'Request failed. Please try again.';
const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const normalizeApiBaseUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const isLocalHttpUrl = (url) => (
  /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|\[::1\])/i.test(url) ||
  /^http:\/\/192\.168\./i.test(url) ||
  /^http:\/\/10\./i.test(url) ||
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\./i.test(url)
);

const validateApiBaseUrl = (url) => {
  if (!url) return url;

  if (!IS_DEV && /^http:\/\//i.test(url)) {
    throw new Error('Insecure API URL blocked in production. Use HTTPS.');
  }

  if (IS_DEV && /^http:\/\//i.test(url) && !isLocalHttpUrl(url)) {
    throw new Error('Insecure non-local API URL blocked. Use HTTPS for remote API hosts.');
  }

  return url;
};

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  return hostUri?.split(':')?.[0];
};

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return validateApiBaseUrl(normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL));
  }

  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const configuredUsesLocalhost =
    configuredUrl?.includes('localhost') || configuredUrl?.includes('127.0.0.1');

  if (Platform.OS !== 'web' && configuredUsesLocalhost) {
    const expoHost = getExpoHost();

    if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
      return validateApiBaseUrl(normalizeApiBaseUrl(`http://${expoHost}:5179/api`));
    }

    if (Platform.OS === 'android') {
      return validateApiBaseUrl(normalizeApiBaseUrl('http://10.0.2.2:5179/api'));
    }
  }

  return validateApiBaseUrl(normalizeApiBaseUrl(configuredUrl || DEFAULT_API_BASE_URL));
};

const sanitizeApiMessage = (data, status) => {
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Requested resource was not found.';

  const serverMessage = typeof data === 'string'
    ? data
    : data?.message || data?.title;

  if (!serverMessage) {
    return `${GENERIC_ERROR_MESSAGE} (${status})`;
  }

  return String(serverMessage)
    .replace(/https?:\/\/[^\s\]]+/gi, '[redacted-url]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 180);
};

const logApiWarning = (label, error) => {
  if (IS_DEV) {
    console.warn(label, error?.message || GENERIC_ERROR_MESSAGE);
  }
};

const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshTokenValue = null;
    this.onAuthExpired = null;
    this.onTokenRefresh = null;
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshTokenValue = refreshToken;
  }

  setAuthExpiredHandler(handler) {
    this.onAuthExpired = handler;
  }

  setTokenRefreshHandler(handler) {
    this.onTokenRefresh = handler;
  }

  getHeaders() {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  getMultipartHeaders() {
    const headers = {
      Accept: 'application/json',
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

  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...config,
        signal: config.signal || controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshTokenValue) {
      return false;
    }

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.refreshTokenValue),
      });

      const data = await this.parseResponse(response);

      if (!response.ok || !data?.token) {
        return false;
      }

      this.setToken(data.token, data.refreshToken || this.refreshTokenValue);
      if (this.onTokenRefresh) {
        await this.onTokenRefresh(data);
      }
      return data;
    } catch (error) {
      logApiWarning('Token refresh failed', error);
      return false;
    }
  }

  async request(endpoint, options = {}, retryOnUnauthorized = true) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, config);
      const data = await this.parseResponse(response);

      if (response.status === 401 && retryOnUnauthorized && this.refreshTokenValue) {
        const refreshResult = await this.refreshAccessToken();

        if (refreshResult?.token) {
          return this.request(endpoint, options, false);
        }
      }

      if (!response.ok) {
        if (response.status === 401 && this.onAuthExpired) {
          await this.onAuthExpired();
        }

        throw new Error(sanitizeApiMessage(data, response.status));
      }

      return data;
    } catch (error) {
      logApiWarning('API request failed', error);
      throw new Error(error?.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message || GENERIC_ERROR_MESSAGE);
    }
  }

  async requestForm(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      headers: this.getMultipartHeaders(),
      body: formData,
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, config);
      const data = await this.parseResponse(response);

      if (response.status === 401 && this.refreshTokenValue) {
        const refreshResult = await this.refreshAccessToken();

        if (refreshResult?.token) {
          return this.requestForm(endpoint, formData, { ...options, headers: this.getMultipartHeaders() });
        }
      }

      if (!response.ok) {
        throw new Error(sanitizeApiMessage(data, response.status));
      }

      return data;
    } catch (error) {
      logApiWarning('API form request failed', error);
      throw new Error(error?.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message || GENERIC_ERROR_MESSAGE);
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
    }, false);
  }

  async getUserProfile() {
    return this.request('/mobile/me');
  }

  async getMobileProfile() {
    return this.request('/mobile/me');
  }

  async getEquipment() {
    return this.request('/mobile/items');
  }

  async getInventory(scope = 'inventory') {
    const endpoints = {
      inventory: '/mobile/inventory',
      run: '/mobile/inventory/run',
      market: '/mobile/inventory/market',
    };
    return this.request(endpoints[scope] || endpoints.inventory);
  }

  async getEquippedItems() {
    return this.request('/mobile/equipment');
  }

  async equipWeapon(slot, itemId) {
    return this.request(`/mobile/equip/weapon/${slot}/${itemId}`, {
      method: 'POST',
    });
  }

  async equipArmor(itemId) {
    return this.request(`/mobile/equip/armor/${itemId}`, {
      method: 'POST',
    });
  }

  async unequip(itemId) {
    return this.request(`/mobile/unequip/${itemId}`, {
      method: 'POST',
    });
  }

  async returnFromMarket(itemId) {
    return this.request('/mobile/inventory/market/return', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  async uploadProfilePicture(uri, fileName = 'profile.jpg', mimeType = 'image/jpeg') {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    });

    return this.requestForm('/mobile/me/pfp', formData);
  }

  async claimDailyReward() {
    return this.request('/mobile/daily', {
      method: 'POST',
    });
  }

  async startRun(payload = {}) {
    return this.request('/run/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getActiveRun() {
    return this.request('/run/active');
  }

  async getCurrentBattle() {
    return this.request('/run/battle/current');
  }

  async goFurther() {
    return this.request('/run/go-further', {
      method: 'POST',
    });
  }

  async finishTurn(payload) {
    return this.request('/run/turn', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async endRun() {
    return this.request('/run/end', {
      method: 'POST',
    });
  }

  async getMarketListings(category = null, pageNumber = 1, pageSize = 20, sort = 'asc') {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
      sort,
      ...(category && { category }),
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