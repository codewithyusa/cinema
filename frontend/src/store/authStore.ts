import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type User = { email: string; name: string; token: string };
type State = { user: User | null; ready: boolean };

const KEY = 'yusa_user';
let state: State = { user: null, ready: false };
let pending: User | null = null;
const listeners = new Set<() => void>();

function update(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    // Logins saved before the server existed have no token. They sign in again.
    update({ user: saved?.token ? saved : null, ready: true });
  } catch {
    update({ user: null, ready: true });
  }
}

// The server accepted the password. The user is not signed in until the
// verify screen finishes, so the session waits here in memory.
export function setPendingSession(user: User) {
  pending = user;
}

export async function completeSignIn(): Promise<boolean> {
  if (!pending) return false;
  const user = { ...pending, email: pending.email.trim().toLowerCase() };
  pending = null;
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
  update({ user });
  return true;
}

export async function signOut() {
  pending = null;
  await AsyncStorage.removeItem(KEY);
  update({ user: null });
}

export const getToken = () => state.user?.token ?? null;

export function useAuth() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}