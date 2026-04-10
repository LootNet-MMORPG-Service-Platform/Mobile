import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// In a real app, you would use a more secure key management system
// For demo purposes, we'll use a simple approach
const ENCRYPTION_KEY = 'your-secure-encryption-key-here'; // Replace with environment variable

class SecureStorage {
  static async setItem(key, value) {
    try {
      // Encrypt the value before storing
      const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
      await AsyncStorage.setItem(`secure_${key}`, encryptedValue);
      return true;
    } catch (error) {
      console.error('Secure storage set error:', error);
      return false;
    }
  }

  static async getItem(key) {
    try {
      const encryptedValue = await AsyncStorage.getItem(`secure_${key}`);
      if (!encryptedValue) {
        return null;
      }

      // Decrypt the value
      const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedValue) {
        return null;
      }

      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  static async removeItem(key) {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
      return true;
    } catch (error) {
      console.error('Secure storage remove error:', error);
      return false;
    }
  }

  static async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
      return true;
    } catch (error) {
      console.error('Secure storage clear error:', error);
      return false;
    }
  }

  // For non-sensitive data, use regular AsyncStorage
  static async setRegularItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Regular storage set error:', error);
      return false;
    }
  }

  static async getRegularItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Regular storage get error:', error);
      return null;
    }
  }
}

export default SecureStorage;
