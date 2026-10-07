import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const TOKEN_KEY = 'coordinator_access_token';
const USER_KEY = 'coordinator_user';
export async function storeSession(token, user) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    globalThis.localStorage?.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}
export async function readSession() {
  try {
    const [token, userValue] = Platform.OS === 'web' ? [globalThis.localStorage?.getItem(TOKEN_KEY) ?? null, globalThis.localStorage?.getItem(USER_KEY) ?? null] : await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)]);
    if (!token || !userValue) return null;
    const user = JSON.parse(userValue);
    return user.role === 'coordinator' ? {
      token,
      user
    } : null;
  } catch {
    return null;
  }
}
export async function clearSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    globalThis.localStorage?.removeItem(USER_KEY);
    return;
  }
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
}
