import { getFallbackStorageStrategy, resolveStorageStrategy } from '../patterns/storageStrategies';

const logStorageWarning = (operation, key, error) => {
  if (__DEV__) {
    console.warn(
      `Storage ${operation} fallback for ${key}`,
      error?.message || 'Unexpected storage error',
    );
  }
};

class Storage {
  static async getItem(key) {
    try {
      return await resolveStorageStrategy(key).getItem(key);
    } catch (error) {
      logStorageWarning('getItem', key, error);
      return getFallbackStorageStrategy().getItem(key);
    }
  }

  static async setItem(key, value) {
    try {
      await resolveStorageStrategy(key).setItem(key, value);
    } catch (error) {
      logStorageWarning('setItem', key, error);
      await getFallbackStorageStrategy().setItem(key, value);
    }
  }

  static async removeItem(key) {
    try {
      await resolveStorageStrategy(key).removeItem(key);
    } catch (error) {
      logStorageWarning('removeItem', key, error);
    } finally {
      await getFallbackStorageStrategy().removeItem(key);
    }
  }

  static async multiRemove(keys) {
    await Promise.all(keys.map((key) => Storage.removeItem(key)));
  }
}

export default Storage;
