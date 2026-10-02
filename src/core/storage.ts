import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store has no web support, so fall back to localStorage there.
export const storage = {
  getItem: async (k: string) =>
    Platform.OS === 'web' ? localStorage.getItem(k) : SecureStore.getItemAsync(k),
  setItem: async (k: string, v: string) =>
    Platform.OS === 'web' ? void localStorage.setItem(k, v) : SecureStore.setItemAsync(k, v),
  removeItem: async (k: string) =>
    Platform.OS === 'web' ? void localStorage.removeItem(k) : SecureStore.deleteItemAsync(k),
};
