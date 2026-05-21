import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorage from './secureStorage';

const memoryStorage = new Map();
const SENSITIVE_KEYS = new Set(['authToken', 'refreshToken']);

const canUseWebStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage;

const isSensitiveKey = (key) => SENSITIVE_KEYS.has(key);

const logStorageWarning = (operation, key, error) => {
  if (__DEV__) {
    console.warn(`Storage ${operation} fallback for ${key}`, error?.message || 'Unexpected storage error');
  }
};

class Storage {
  static async getItem(key) {
    if (isSensitiveKey(key)) {
      return SecureStorage.getItem(key);
    }

    try {
      if (canUseWebStorage()) {
        return window.localStorage.getItem(key);
      }

      return await AsyncStorage.getItem(key);
    } catch (error) {
      logStorageWarning('getItem', key, error);
      return memoryStorage.get(key) ?? null;
    }
  }

  static async setItem(key, value) {
    if (isSensitiveKey(key)) {
      await SecureStorage.setItem(key, value);
      return;
    }

    try {
      if (canUseWebStorage()) {
        window.localStorage.setItem(key, value);
        return;
      }

      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logStorageWarning('setItem', key, error);
      memoryStorage.set(key, value);
    }
  }

  static async removeItem(key) {
    if (isSensitiveKey(key)) {
      await SecureStorage.removeItem(key);
      return;
    }

    try {
      if (canUseWebStorage()) {
        window.localStorage.removeItem(key);
        return;
      }

      await AsyncStorage.removeItem(key);
    } catch (error) {
      logStorageWarning('removeItem', key, error);
    } finally {
      memoryStorage.delete(key);
    }
  }

  static async multiRemove(keys) {
    await Promise.all(keys.map((key) => Storage.removeItem(key)));
  }
}

export default Storage;