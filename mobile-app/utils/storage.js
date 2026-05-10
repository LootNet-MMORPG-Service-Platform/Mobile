import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStorage = new Map();

const canUseWebStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage;

class Storage {
  static async getItem(key) {
    try {
      if (canUseWebStorage()) {
        return window.localStorage.getItem(key);
      }

      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`Storage getItem fallback for ${key}:`, error.message);
      return memoryStorage.get(key) ?? null;
    }
  }

  static async setItem(key, value) {
    try {
      if (canUseWebStorage()) {
        window.localStorage.setItem(key, value);
        return;
      }

      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Storage setItem fallback for ${key}:`, error.message);
      memoryStorage.set(key, value);
    }
  }

  static async removeItem(key) {
    try {
      if (canUseWebStorage()) {
        window.localStorage.removeItem(key);
        return;
      }

      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Storage removeItem fallback for ${key}:`, error.message);
    } finally {
      memoryStorage.delete(key);
    }
  }

  static async multiRemove(keys) {
    await Promise.all(keys.map((key) => Storage.removeItem(key)));
  }
}

export default Storage;
