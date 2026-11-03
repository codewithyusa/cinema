import { ApiError, request } from './http';
import { getToken } from '../store/authStore';
import { getReviews as getLocal, saveReview as saveLocal, Review } from '../store/reviews';

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  author: string;
  mine: boolean;
  createdAt: number;
};

type ServerReview = {
  id: number;
  rating: number;
  comment: string;
  author: string;
  mine: boolean;
  created_at: string;
};

const fromServer = (r: ServerReview): ReviewItem => ({
  id: String(r.id),
  rating: r.rating,
  comment: r.comment,
  author: r.author,
  mine: r.mine,
  createdAt: new Date(r.created_at.replace(' ', 'T') + 'Z').getTime(),
});

const fromLocal = (list: Review[], email?: string): ReviewItem[] =>
  list.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    author: r.email.split('@')[0],
    mine: r.email === email,
    createdAt: r.createdAt,
  }));

export async function getReviews(movieId: string, email?: string): Promise<ReviewItem[]> {
  try {
    const list = await request<ServerReview[]>(`/movies/${movieId}/reviews`, { token: getToken() });
    return list.map(fromServer);
  } catch {
    return fromLocal(await getLocal(movieId), email);
  }
}

export async function saveReview(
  movieId: string,
  email: string,
  rating: number,
  comment: string
): Promise<ReviewItem[]> {
  try {
    const list = await request<ServerReview[]>(`/movies/${movieId}/reviews`, {
      method: 'POST',
      body: { rating, comment },
      token: getToken(),
    });
    return list.map(fromServer);
  } catch (e) {
    // The server answered with an error (for example expired login): show it.
    if (e instanceof ApiError && e.status !== 0) throw e;
    // Server is off: keep the review on this phone.
    return fromLocal(await saveLocal(movieId, email, rating, comment), email);
  }
}