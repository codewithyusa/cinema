import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = { name?: string; photo?: string };

const keyFor = (email: string) => `yusa_profile_${email}`;

export async function getProfile(email: string): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveProfile(email: string, patch: Profile): Promise<Profile> {
  const current = await getProfile(email);
  const next = { ...current, ...patch };
  try {
    await AsyncStorage.setItem(keyFor(email), JSON.stringify(next));
  } catch {}
  return next;
}