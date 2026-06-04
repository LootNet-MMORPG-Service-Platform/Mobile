import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SecureStorage from '../utils/secureStorage';

const memoryStorage = new Map();
const SENSITIVE_KEYS = new Set(['authToken', 'refreshToken']);

const canUseWebStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage;

const secureStorageStrategy = {
  canHandle(key) {
    return SENSITIVE_KEYS.has(key);
  },
  getItem(key) {
    return SecureStorage.getItem(key);
  },
  async setItem(key, value) {
    await SecureStorage.setItem(key, value);
  },
  removeItem(key) {
    return SecureStorage.removeItem(key);
  },
};

const webStorageStrategy = {
  canHandle() {
    return canUseWebStorage();
  },
  async getItem(key) {
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    window.localStorage.removeItem(key);
  },
};

const asyncStorageStrategy = {
  canHandle() {
    return true;
  },
  getItem(key) {
    return AsyncStorage.getItem(key);
  },
  setItem(key, value) {
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key) {
    return AsyncStorage.removeItem(key);
  },
};

const fallbackStorageStrategy = {
  async getItem(key) {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key, value) {
    memoryStorage.set(key, value);
  },
  async removeItem(key) {
    memoryStorage.delete(key);
  },
};

const storageStrategies = [secureStorageStrategy, webStorageStrategy, asyncStorageStrategy];

export const resolveStorageStrategy = (key) =>
  storageStrategies.find((strategy) => strategy.canHandle(key)) || asyncStorageStrategy;

export const getFallbackStorageStrategy = () => fallbackStorageStrategy;
