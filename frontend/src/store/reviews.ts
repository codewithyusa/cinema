import AsyncStorage from '@react-native-async-storage/async-storage';

export type Review = {
  id: string;
  movieId: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: number;
};

const keyFor = (movieId: string) => `yusa_reviews_${movieId}`;

export async function getReviews(movieId: string): Promise<Review[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(movieId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// One review per user per movie. Sending a new one replaces the old one.
export async function saveReview(
  movieId: string,
  email: string,
  rating: number,
  comment: string
): Promise<Review[]> {
  const all = await getReviews(movieId);
  const review: Review = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    movieId,
    email,
    rating,
    comment: comment.trim(),
    createdAt: Date.now(),
  };
  const next = [review, ...all.filter((r) => r.email !== email)];
  try {
    await AsyncStorage.setItem(keyFor(movieId), JSON.stringify(next));
  } catch {}
  return next;
}