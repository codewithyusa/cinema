import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yusa_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen() {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {}
}