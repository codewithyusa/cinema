import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = { notifications: boolean; reminders: boolean };

const KEY = 'yusa_settings';
const defaults: Settings = { notifications: true, reminders: true };

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export async function saveSettings(settings: Settings) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}