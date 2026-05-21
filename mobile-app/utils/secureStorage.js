import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_PREFIX = 'lootnet_';
const KEYCHAIN_SERVICE = 'lootnet.auth';
const SECURE_STORE_OPTIONS = {
  keychainService: KEYCHAIN_SERVICE,
  keychainAccessible: ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
const memoryFallback = new Map();

const toStorageValue = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
const fromStorageValue = (value) => value ?? null;
const secureKey = (key) => `${KEY_PREFIX}${key}`;

const canUseWebStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage;

const logSecureStorageWarning = (operation, error) => {
  if (__DEV__) {
    console.warn(`Secure storage ${operation} failed`, error?.message || 'Unexpected storage error');
  }
};

class SecureStorage {
  static async canUseNativeSecureStore() {
    if (Platform.OS === 'web') return false;

    try {
      return await ExpoSecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  static async setItem(key, value) {
    const resolvedKey = secureKey(key);
    const resolvedValue = toStorageValue(value);

    try {
      if (await SecureStorage.canUseNativeSecureStore()) {
        await ExpoSecureStore.setItemAsync(resolvedKey, resolvedValue, SECURE_STORE_OPTIONS);
        memoryFallback.delete(resolvedKey);
        return true;
      }

      if (canUseWebStorage()) {
        window.localStorage.setItem(resolvedKey, resolvedValue);
      } else {
        await AsyncStorage.setItem(resolvedKey, resolvedValue);
      }
      memoryFallback.delete(resolvedKey);
      return true;
    } catch (error) {
      logSecureStorageWarning('set', error);
      memoryFallback.set(resolvedKey, resolvedValue);
      return false;
    }
  }

  static async getItem(key) {
    const resolvedKey = secureKey(key);

    try {
      if (await SecureStorage.canUseNativeSecureStore()) {
        return fromStorageValue(await ExpoSecureStore.getItemAsync(resolvedKey, SECURE_STORE_OPTIONS));
      }

      if (canUseWebStorage()) {
        return fromStorageValue(window.localStorage.getItem(resolvedKey));
      }

      return fromStorageValue(await AsyncStorage.getItem(resolvedKey));
    } catch (error) {
      logSecureStorageWarning('get', error);
      return memoryFallback.get(resolvedKey) ?? null;
    }
  }

  static async removeItem(key) {
    const resolvedKey = secureKey(key);

    try {
      if (await SecureStorage.canUseNativeSecureStore()) {
        await ExpoSecureStore.deleteItemAsync(resolvedKey, SECURE_STORE_OPTIONS);
      } else if (canUseWebStorage()) {
        window.localStorage.removeItem(resolvedKey);
      } else {
        await AsyncStorage.removeItem(resolvedKey);
      }
      return true;
    } catch (error) {
      logSecureStorageWarning('remove', error);
      return false;
    } finally {
      memoryFallback.delete(resolvedKey);
    }
  }

  static async multiRemove(keys) {
    await Promise.all(keys.map((key) => SecureStorage.removeItem(key)));
  }
}

export default SecureStorage;