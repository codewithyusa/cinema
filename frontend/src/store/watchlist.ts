import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (email: string) => `yusa_watchlist_${email}`;

export async function getWatchlist(email: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleWatchlist(email: string, movieId: string): Promise<string[]> {
  const list = await getWatchlist(email);
  const next = list.includes(movieId) ? list.filter((x) => x !== movieId) : [movieId, ...list];
  try {
    await AsyncStorage.setItem(keyFor(email), JSON.stringify(next));
  } catch {}
  return next;
}