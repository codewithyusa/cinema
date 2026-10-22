import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type User = { email: string };
type State = { user: User | null; ready: boolean };

const KEY = 'yusa_user';
let state: State = { user: null, ready: false };
const listeners = new Set<() => void>();

function update(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    update({ user: raw ? JSON.parse(raw) : null, ready: true });
  } catch {
    update({ user: null, ready: true });
  }
}

export async function signIn(email: string) {
  const user = { email: email.trim().toLowerCase() };
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
  update({ user });
}

export async function signOut() {
  await AsyncStorage.removeItem(KEY);
  update({ user: null });
}

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