import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

type Account = { name: string; email: string; salt: string; hash: string };
type Result = { ok: true } | { ok: false; error: string };

const KEY = 'yusa_accounts';

async function readAll(): Promise<Account[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + password);
}

export async function createAccount(name: string, email: string, password: string): Promise<Result> {
  const accounts = await readAll();
  const clean = email.trim().toLowerCase();
  if (accounts.some((a) => a.email === clean)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const salt = Crypto.randomUUID();
  const hash = await hashPassword(password, salt);
  accounts.push({ name: name.trim(), email: clean, salt, hash });
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(accounts));
  } catch {
    return { ok: false, error: 'Could not save your account. Try again.' };
  }
  return { ok: true };
}

export async function checkAccount(email: string, password: string): Promise<Result> {
  const accounts = await readAll();
  const account = accounts.find((a) => a.email === email.trim().toLowerCase());
  if (!account) return { ok: false, error: 'No account with this email. Please sign up first.' };
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) return { ok: false, error: 'Wrong password.' };
  return { ok: true };
}