import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '../constants/theme';

const THEME_KEY = '@antilate/appearance/v1';
let pendingWrite: Promise<void> = Promise.resolve();

export async function loadThemePreference(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function saveThemePreference(value: ThemePreference) {
  const write = pendingWrite
    .catch(() => {})
    .then(() => AsyncStorage.setItem(THEME_KEY, value));
  pendingWrite = write;
  return write;
}
