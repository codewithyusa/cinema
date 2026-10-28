import { API_URL, ApiError } from './seats';

export type ShowtimeItem = {
  id: number;
  movie_id: number;
  cinema_id: number;
  cinema_name: string;
  hall_name: string;
  starts_at: string;
  price_etb: number;
};

export async function getShowtimes(movieId: string): Promise<ShowtimeItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/showtimes?movieId=${encodeURIComponent(movieId)}`);
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }
  if (!res.ok) throw new ApiError('Could not load showtimes.', res.status);
  return (await res.json()) as ShowtimeItem[];
}