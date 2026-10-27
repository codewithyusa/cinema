import { API_URL } from '../config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

// One place for every server call. Screens never use fetch directly.
export async function request<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const raw = data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;
      throw new ApiError(message ?? 'Something went wrong. Try again.', res.status);
    }

    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }
}