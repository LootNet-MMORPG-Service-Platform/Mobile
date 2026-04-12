const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshToken = null;
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;
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

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication endpoints - TO BE IMPLEMENTED BY BACKEND
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async resetPassword(email) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints - TO BE IMPLEMENTED BY BACKEND
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(userData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Game endpoints - TO BE IMPLEMENTED BY BACKEND
  async getEquipment() {
    return this.request('/game/equipment');
  }

  async getStats() {
    return this.request('/game/stats');
  }

  async claimDailyReward() {
    return this.request('/game/daily-reward', {
      method: 'POST',
    });
  }

  async getDailyRewardStatus() {
    return this.request('/game/daily-reward/status');
  }

  async startBattle(botDifficulty = 'normal') {
    return this.request('/game/battle', {
      method: 'POST',
      body: JSON.stringify({ botDifficulty }),
    });
  }

  async getBattleHistory() {
    return this.request('/game/battle-history');
  }
}

export default new ApiService();
