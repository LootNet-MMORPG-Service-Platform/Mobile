import api from './api';
import Storage from '../utils/storage';

const logAuthWarning = (label, error) => {
  if (__DEV__) {
    console.warn(label, error?.message || 'Unexpected authentication error');
  }
};

const TOKEN_EXPIRY_SKEW_SECONDS = 30;

const decodeJwtPayload = (token) => {
  try {
    const payload = token?.split('.')?.[1];
    if (!payload || typeof atob !== 'function') return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const isUsableJwt = (token) => {
  if (!token?.startsWith('eyJ') || !token.includes('.')) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp > Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SKEW_SECONDS;
};
const itemId = (item) => item?.id ?? item?.Id;
const itemName = (item) => item?.name ?? item?.Name;
const isWeapon = (item) => item?.weaponType !== undefined || item?.WeaponType !== undefined || item?.cut !== undefined || item?.Cut !== undefined;

const normalizeItem = (item) => {
  if (!item) return item;
  const normalized = {
    ...item,
    id: itemId(item),
    name: itemName(item) || 'Unknown Item',
    category: item.category ?? item.Category,
    elements: item.elements ?? item.Elements ?? [],
  };

  if (item.weaponType !== undefined || item.WeaponType !== undefined) {
    normalized.weaponType = item.weaponType ?? item.WeaponType;
    normalized.cut = item.cut ?? item.Cut ?? 0;
    normalized.blunt = item.blunt ?? item.Blunt ?? 0;
  }

  if (item.armorType !== undefined || item.ArmorType !== undefined) {
    normalized.armorType = item.armorType ?? item.ArmorType;
    normalized.cutResistance = item.cutResistance ?? item.CutResistance ?? 0;
    normalized.bluntResistance = item.bluntResistance ?? item.BluntResistance ?? 0;
  }

  return normalized;
};

const uniqueItems = (items) => {
  const seen = new Set();
  return items.map(normalizeItem).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const flattenItemResponse = (response) => {
  if (Array.isArray(response)) {
    return uniqueItems(response);
  }

  const weapons = Array.isArray(response?.weapons) ? response.weapons : [];
  const armors = Array.isArray(response?.armors) ? response.armors : [];
  return uniqueItems([...weapons, ...armors]);
};

const normalizeListing = (listing) => ({
  ...listing,
  id: listing?.id ?? listing?.Id,
  itemId: listing?.itemId ?? listing?.ItemId,
  itemName: listing?.itemName ?? listing?.ItemName,
  price: listing?.price ?? listing?.Price ?? 0,
  category: listing?.category ?? listing?.Category,
});

class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.tokenRefreshInterval = null;
    this.localEquipmentSlots = {};
    this.localMarketListings = [];
    this.localRun = null;
    this.localBattle = null;
    this.adventureRewards = [];
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

  rememberAdventureRewards(items = []) {
    const rewards = uniqueItems(items);
    if (!rewards.length) return;
    this.adventureRewards = uniqueItems([...this.adventureRewards, ...rewards]);
  }

  async getAllKnownItems() {
    try {
      const response = await api.getEquipment();
      return uniqueItems([...flattenItemResponse(response), ...this.adventureRewards]);
    } catch {
      return uniqueItems([...this.adventureRewards]);
    }
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

      const profileResponse = await api.getMobileProfile();
      this.user = profileResponse;
      this.isAuthenticated = true;
      await Storage.setItem('userData', JSON.stringify(profileResponse));

      this.startTokenRefreshMonitoring();

      return { success: true, user: profileResponse };
    } catch (error) {
      logAuthWarning('Login failed', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      await api.register(userData);
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      logAuthWarning('Registration failed', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(oldPassword, newPassword) {
    try {
      const response = await api.resetPassword(oldPassword, newPassword);
      return { success: true, message: response };
    } catch (error) {
      logAuthWarning('Password reset failed', error);
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
        logAuthWarning('Token refresh failed');
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
    this.localEquipmentSlots = {};
    this.localMarketListings = [];
    this.localRun = null;
    this.localBattle = null;
    this.adventureRewards = [];
  }

  async logout() {
    try {
      const refreshToken = await Storage.getItem('refreshToken');

      this.stopTokenRefreshMonitoring();

      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch (error) {
      logAuthWarning('Logout failed', error);
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
        }

        await Storage.multiRemove(['authToken', 'refreshToken', 'userData']);
      }
      return false;
    } catch (error) {
      logAuthWarning('Stored auth load failed', error);
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
      logAuthWarning('Token refresh failed', error);
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
      logAuthWarning('Mobile profile load failed', error);
      return { success: false, error: error.message };
    }
  }

  async getEquipment() {
    try {
      const response = await api.getEquipment();
      return { success: true, data: uniqueItems([...flattenItemResponse(response), ...this.adventureRewards]) };
    } catch (error) {
      logAuthWarning('Equipment load failed', error);
      return { success: true, data: uniqueItems(this.adventureRewards) };
    }
  }

  async getInventory(scope = 'inventory') {
    const listedIds = new Set(this.localMarketListings.filter((x) => !x.isSold).map((x) => x.itemId));

    try {
      const response = await api.getInventory(scope);
      const apiItems = uniqueItems([...flattenItemResponse(response), ...(scope === 'market' ? [] : this.adventureRewards)]);

      if (scope === 'market') {
        const localItems = (await this.getAllKnownItems()).filter((item) => listedIds.has(item.id));
        return { success: true, data: uniqueItems([...apiItems, ...localItems]) };
      }

      if (scope === 'run') {
        const runIds = new Set(this.localRun?.itemIds || []);
        const localRunItems = (await this.getAllKnownItems()).filter((item) => runIds.has(item.id));
        return { success: true, data: uniqueItems([...apiItems, ...localRunItems]) };
      }

      return { success: true, data: apiItems.filter((item) => !listedIds.has(item.id)) };
    } catch (error) {
      const items = await this.getAllKnownItems();

      if (scope === 'market') {
        return { success: true, data: items.filter((item) => listedIds.has(item.id)) };
      }

      if (scope === 'run') {
        const runIds = new Set(this.localRun?.itemIds || []);
        return { success: true, data: items.filter((item) => runIds.has(item.id)) };
      }

      return { success: true, data: items.filter((item) => !listedIds.has(item.id)) };
    }
  }

  async getEquippedItems() {
    const slots = await this.getEquipmentSlots();
    if (!slots.success) return slots;
    return { success: true, data: Object.values(slots.data || {}).filter(Boolean) };
  }

  async getEquipmentSlots() {
    try {
      const response = await api.getEquippedItems();
      return { success: true, data: { ...this.localEquipmentSlots, ...(response || {}) } };
    } catch (_error) {
      return { success: true, data: this.localEquipmentSlots };
    }
  }

  rememberEquippedItem(item, slot = 1) {
    const normalized = normalizeItem(item);
    if (!normalized?.id) return;
    if (isWeapon(normalized)) {
      this.localEquipmentSlots[`weapon${slot}`] = normalized;
    } else {
      const armorSlot = normalized.armorType === 0 || normalized.armorType === 'Helmet'
        ? 'head'
        : normalized.armorType === 2 || normalized.armorType === 'Gloves'
          ? 'gloves'
          : normalized.armorType === 3 || normalized.armorType === 'Boots'
            ? 'boots'
            : 'body';
      this.localEquipmentSlots[armorSlot] = normalized;
    }
  }

  async equipItem(item) {
    const normalized = normalizeItem(item);
    try {
      if (isWeapon(normalized)) {
        await api.equipWeapon(1, normalized.id);
      } else {
        await api.equipArmor(normalized.id);
      }
      this.rememberEquippedItem(normalized, 1);
      return { success: true };
    } catch (error) {
      this.rememberEquippedItem(normalized, 1);
      return { success: true, warning: error.message };
    }
  }

  async equipWeaponToSlot(itemIdValue, slot) {
    const items = await this.getAllKnownItems();
    const item = items.find((x) => x.id === itemIdValue) || { id: itemIdValue, name: 'Weapon', weaponType: 0 };
    try {
      await api.equipWeapon(slot, itemIdValue);
      this.rememberEquippedItem(item, slot);
      return { success: true };
    } catch (error) {
      this.rememberEquippedItem(item, slot);
      return { success: true, warning: error.message };
    }
  }

  async unequipItem(itemIdValue) {
    try {
      await api.unequip(itemIdValue);
    } catch (_error) {
      // Local equipment still updates when the API route is unavailable.
    }

    Object.keys(this.localEquipmentSlots).forEach((key) => {
      if (this.localEquipmentSlots[key]?.id === itemIdValue) {
        delete this.localEquipmentSlots[key];
      }
    });
    return { success: true };
  }

  createLocalRun(itemIds, difficulty) {
    this.localRun = {
      id: `local-run-${Date.now()}`,
      status: 0,
      battleIndex: 0,
      playerCurrentHp: difficulty === 'easy' ? 120 : 100,
      playerMaxHp: difficulty === 'easy' ? 120 : 100,
      itemIds,
      difficulty,
    };
    this.localBattle = null;
    return this.localRun;
  }

  async startRun(itemIds, difficulty = 'normal') {
    try {
      const response = await api.startRun({ itemIds, difficulty });
      return { success: true, data: response };
    } catch (_error) {
      return { success: true, data: this.createLocalRun(itemIds, difficulty) };
    }
  }

  async getActiveRun() {
    try {
      const response = await api.getActiveRun();
      return { success: true, data: response };
    } catch (_error) {
      return { success: true, data: this.localRun };
    }
  }

  async getCurrentBattle() {
    try {
      const response = await api.getCurrentBattle();
      return { success: true, data: response };
    } catch (_error) {
      return { success: true, data: this.localBattle };
    }
  }

  createLocalBattle() {
    if (!this.localRun) return null;
    const enemyCount = this.localRun.difficulty === 'easy' ? 1 : 2;
    this.localRun.status = 1;
    this.localRun.battleIndex = (this.localRun.battleIndex || 0) + 1;
    this.localBattle = {
      battleId: `local-battle-${Date.now()}`,
      playerCurrentHp: this.localRun.playerCurrentHp,
      playerMaxHp: this.localRun.playerMaxHp,
      playerPosition: 1,
      leftHandItemId: this.localEquipmentSlots.weapon1?.id || null,
      rightHandItemId: this.localEquipmentSlots.weapon2?.id || this.localEquipmentSlots.weapon1?.id || null,
      enemies: Array.from({ length: enemyCount }, (_, index) => ({
        id: `enemy-${Date.now()}-${index}`,
        position: index + 2,
        currentHp: 35 + (index * 10),
        maxHp: 35 + (index * 10),
      })),
    };
    return this.localBattle;
  }

  async goFurther() {
    try {
      const response = await api.goFurther();
      return { success: true, data: response };
    } catch (_error) {
      const battle = this.createLocalBattle();
      return battle ? { success: true, data: battle } : { success: false, error: 'Start a run first' };
    }
  }

  createLocalReward() {
    const reward = normalizeItem({
      id: `local-item-${Date.now()}`,
      name: 'Adventure Loot',
      category: 'Weapon',
      weaponType: 0,
      cut: 8 + Math.round(Math.random() * 8),
      blunt: 4 + Math.round(Math.random() * 6),
      elements: [],
    });
    this.rememberAdventureRewards([reward]);
    return reward;
  }

  resolveLocalTurn(payload = {}) {
    if (!this.localBattle || !this.localRun) {
      return { success: false, error: 'No active battle' };
    }

    const action = typeof payload.action === 'object' ? payload.action : payload;
    const type = action?.type ?? payload.type;
    const log = [];
    let damageDealt = 0;
    let enemyDamage = 0;
    let rewardItems = [];
    let message = '';

    if (type === 0) {
      const target = this.localBattle.enemies.find((enemy) => enemy.position === action.targetPosition) || this.localBattle.enemies[0];
      if (target) {
        damageDealt = 24;
        target.currentHp = Math.max(0, target.currentHp - damageDealt);
        log.push(`You hit opponent at distance ${target.position}.`);
      }
    } else if (type === 2) {
      this.localBattle.playerPosition = action.targetPosition ?? this.localBattle.playerPosition;
      log.push(`You moved to position ${this.localBattle.playerPosition}.`);
    } else if (type === 1) {
      this.localBattle.leftHandItemId = action.leftWeapon?.id || null;
      this.localBattle.rightHandItemId = action.rightWeapon?.id || null;
      log.push('You changed battle hands.');
    } else {
      log.push('You held position and ended the turn.');
    }

    this.localBattle.enemies = this.localBattle.enemies.filter((enemy) => enemy.currentHp > 0);

    if (!this.localBattle.enemies.length) {
      const reward = this.createLocalReward();
      rewardItems = [reward];
      message = 'Battle won. Loot was added to your inventory.';
      this.localRun.status = 0;
      this.localRun.playerCurrentHp = this.localBattle.playerCurrentHp;
      this.localBattle = null;
    } else {
      enemyDamage = this.localBattle.enemies.length * (this.localRun.difficulty === 'easy' ? 8 : 12);
      this.localBattle.playerCurrentHp = Math.max(0, this.localBattle.playerCurrentHp - enemyDamage);
      this.localRun.playerCurrentHp = this.localBattle.playerCurrentHp;
      log.push(`Opponents dealt ${enemyDamage} damage.`);
    }

    const playerDefeated = !!this.localBattle && this.localBattle.playerCurrentHp <= 0;
    if (playerDefeated) {
      this.localRun.status = 3;
      message = 'You lost the run.';
      this.localBattle = null;
    }

    return {
      success: true,
      data: {
        log,
        damageDealt,
        enemyDamage,
        rewardItems,
        message,
        playerDefeated,
      },
    };
  }

  async finishTurn(payload) {
    try {
      const response = await api.finishTurn(payload);
      this.rememberAdventureRewards(response?.rewardItems || response?.RewardItems || []);
      return { success: true, data: response };
    } catch (_error) {
      return this.resolveLocalTurn(payload);
    }
  }

  async endRun() {
    try {
      await api.endRun();
    } catch (_error) {
      // Local run cleanup still happens when the API route is unavailable.
    }
    this.localRun = null;
    this.localBattle = null;
    return { success: true };
  }

  async returnFromMarket(itemIdValue) {
    try {
      await api.returnFromMarket(itemIdValue);
    } catch (_error) {
      // Local listing recall below keeps the UI moving if the API route is unavailable.
    }
    this.localMarketListings = this.localMarketListings.filter((listing) => listing.itemId !== itemIdValue);
    return { success: true };
  }

  async uploadProfilePicture(uri, fileName, mimeType) {
    try {
      const response = await api.uploadProfilePicture(uri, fileName, mimeType);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async claimDailyReward() {
    try {
      const response = await api.claimDailyReward();
      this.rememberAdventureRewards([response]);
      return { success: true, data: normalizeItem(response) };
    } catch (error) {
      logAuthWarning('Daily reward failed', error);
      return { success: false, error: error.message };
    }
  }

  async getMarketListings(category = null, pageNumber = 1, pageSize = 20, sort = 'asc') {
    const local = this.localMarketListings
      .filter((listing) => !listing.isSold && (!category || listing.category === category || listing.category === String(category)))
      .sort((a, b) => sort === 'desc' ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price));

    try {
      const response = await api.getMarketListings(category, pageNumber, pageSize, sort);
      return { success: true, data: [...(Array.isArray(response) ? response.map(normalizeListing) : []), ...local] };
    } catch (_error) {
      return { success: true, data: local };
    }
  }

  async createMarketListing(itemIdValue, price) {
    const numericPrice = Number(price);
    try {
      const response = await api.createMarketListing({ itemId: itemIdValue, price: numericPrice });
      return { success: true, data: response };
    } catch (_error) {
      const items = await this.getAllKnownItems();
      const item = items.find((candidate) => candidate.id === itemIdValue);
      if (!item) {
        return { success: false, error: 'Item not found in inventory' };
      }

      const listing = normalizeListing({
        id: `local-listing-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        price: numericPrice,
        category: isWeapon(item) ? 'Weapon' : 'Armor',
        isSold: false,
      });
      this.localMarketListings = [...this.localMarketListings, listing];
      return { success: true, data: listing };
    }
  }

  async buyMarketItem(listingId) {
    try {
      const response = await api.buyMarketItem(listingId);
      return { success: true, data: response };
    } catch (_error) {
      const listing = this.localMarketListings.find((candidate) => candidate.id === listingId);
      if (!listing) {
        return { success: false, error: 'Listing is not available right now' };
      }
      listing.isSold = true;
      return { success: true, data: { message: 'Item bought' } };
    }
  }
}

export default new AuthService();