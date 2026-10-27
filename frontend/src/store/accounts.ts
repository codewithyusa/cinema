import { ApiError, request } from '../api/http';
import { setPendingSession } from './authStore';

type Result = { ok: true } | { ok: false; error: string };
type AuthResponse = { token: string; user: { id: number; name: string; email: string } };

async function authenticate(path: string, body: object): Promise<Result> {
  try {
    const res = await request<AuthResponse>(path, { method: 'POST', body });
    setPendingSession({ email: res.user.email, name: res.user.name, token: res.token });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : 'Something went wrong. Try again.' };
  }
}

// Accounts now live on the server. The screens keep calling the same two
// functions as before.
export const createAccount = (name: string, email: string, password: string) =>
  authenticate('/auth/signup', { name, email, password });

export const checkAccount = (email: string, password: string) =>
  authenticate('/auth/login', { email, password });