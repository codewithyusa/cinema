import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from './http';
import { getToken } from '../store/authStore';
import {
  getWatchlist as getLocal,
  setWatchlist as setLocal,
  toggleWatchlist as toggleLocal,
} from '../store/watchlist';

const syncedKey = (email: string) => `yusa_watchlist_synced_${email}`;

async function fetchServer(): Promise<string[]> {
  const list = await request<number[]>('/watchlist', { token: getToken() });
  return list.map(String);
}

// Hearts saved before the server existed live only on this phone.
// They are sent to the server once, so they are not lost.
async function migrateOnce(email: string, serverIds: string[]): Promise<boolean> {
  try {
    if (await AsyncStorage.getItem(syncedKey(email))) return false;
    const missing = (await getLocal(email)).filter((id) => !serverIds.includes(id));
    for (const id of missing) {
      await request(`/watchlist/${id}`, { method: 'POST', token: getToken() }).catch(() => {});
    }
    await AsyncStorage.setItem(syncedKey(email), '1');
    return missing.length > 0;
  } catch {
    return false;
  }
}

// Server list first. If the server is off, the saved phone copy is used.
export async function getWatchlist(email: string): Promise<string[]> {
  try {
    let ids = await fetchServer();
    if (await migrateOnce(email, ids)) ids = await fetchServer();
    await setLocal(email, ids);
    return ids;
  } catch {
    return getLocal(email);
  }
}

export async function toggleWatchlist(email: string, movieId: string): Promise<string[]> {
  const current = await getWatchlist(email);
  const has = current.includes(movieId);
  try {
    const list = await request<number[]>(`/watchlist/${movieId}`, {
      method: has ? 'DELETE' : 'POST',
      token: getToken(),
    });
    const ids = list.map(String);
    await setLocal(email, ids);
    return ids;
  } catch {
    return toggleLocal(email, movieId);
  }
}