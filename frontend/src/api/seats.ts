import { Platform } from 'react-native';
import { getToken } from '../store/authStore';

// Phone uses your PC's IP. The browser uses localhost.
export const API_URL = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://192.168.100.24:8080';

export type SeatStatus = 'free' | 'taken' | 'held' | 'mine' | string;
export type SeatGrid = {
  showtime_id: number;
  price_etb: number;
  vip_price_etb: number;
  rows: { label: string; seats: { id: string; status: SeatStatus; vip: boolean }[] }[];
};

export type Booking = {
  id: number;
  code: string;
  seats: string[];
  total_etb: number;
  method: string;
  paid: boolean;
};

export type ServerBooking = {
  id: number;
  code: string;
  showtime_id: number;
  movie_id: number;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  starts_at: string;
  seats: string[];
  total_etb: number;
  method: string;
  paid: boolean;
  created_at: string;
};

export type Quote = {
  showtime_id: number;
  seats: string[];
  lines: { label: string; qty: number; unit_etb: number; total_etb: number }[];
  seats_etb: number;
  snacks_etb: number;
  subtotal_etb: number;
  discount_etb: number;
  promo: { code: string; label: string } | null;
  fee_etb: number;
  total_etb: number;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError('Please sign in again.', 401);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new ApiError('Your session expired. Please sign in again.', 401);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(message ?? 'Request failed.', res.status);
  }
  return body as T;
}

export const getSeats = (showtimeId: string) => request<SeatGrid>(`/showtimes/${showtimeId}/seats`);

export const holdSeats = (showtimeId: string, seats: string[]) =>
  request<{ seats: string[]; expires_at: string }>(`/showtimes/${showtimeId}/seats/hold`, {
    method: 'POST',
    body: JSON.stringify({ seats }),
  });

export const releaseSeats = (showtimeId: string) =>
  request<{ released: boolean }>(`/showtimes/${showtimeId}/seats/hold`, { method: 'DELETE' });

export const getQuote = (showtimeId: string, snacks: Record<string, number>, promoCode?: string) =>
  request<Quote>('/bookings/quote', {
    method: 'POST',
    body: JSON.stringify({ showtimeId: Number(showtimeId), snacks, promoCode: promoCode || undefined }),
  });

export const createBooking = (
  showtimeId: string,
  method: 'telebirr' | 'card' | 'cash',
  snacks: Record<string, number>,
  promoCode?: string,
) =>
  request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      showtimeId: Number(showtimeId),
      method,
      snacks,
      promoCode: promoCode || undefined,
    }),
  });

export const cancelBooking = (code: string) =>
  request<{ cancelled: boolean; code: string }>(`/bookings/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });

export const getBookings = () => request<ServerBooking[]>('/bookings');