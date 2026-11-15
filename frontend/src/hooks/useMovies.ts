import { useEffect, useState } from 'react';
import { request } from '../api/http';
import { MovieItem, movies as localMovies } from '../api/movies';

export type MovieWithTrailer = MovieItem & { trailer_url?: string | null };

type ServerMovie = {
  id: number;
  title: string;
  genre: string;
  duration_min: number;
  rating: number;
  synopsis: string;
  poster_url: string | null;
  trailer_url: string | null;
};

const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

// A movie added in Admin has no local poster file, so it uses its poster link.
function fromServer(s: ServerMovie): MovieWithTrailer {
  return {
    id: String(s.id),
    title: s.title,
    genre: s.genre,
    duration: formatDuration(s.duration_min),
    rating: s.rating,
    color: '#2B2B2B',
    poster: { uri: s.poster_url ?? `https://picsum.photos/seed/yusa-movie-${s.id}/400/600` },
    synopsis: s.synopsis,
    cast: [],
    trailer_url: s.trailer_url,
  };
}

// Shared by all screens. Starts empty, fills after the first server answer.
let cache: MovieWithTrailer[] | null = null;
let inflight: Promise<MovieWithTrailer[]> | null = null;
const listeners = new Set<(movies: MovieWithTrailer[]) => void>();

async function loadMovies(): Promise<MovieWithTrailer[]> {
  const list = await request<ServerMovie[]>('/movies');
  if (!Array.isArray(list)) return localMovies;

  // Local movies get the server's fields (the ids match).
  const merged = localMovies.map((local): MovieWithTrailer => {
    const s = list.find((m) => String(m.id) === local.id);
    if (!s) return local;
    return {
      ...local,
      title: s.title,
      genre: s.genre,
      duration: formatDuration(s.duration_min),
      rating: s.rating,
      synopsis: s.synopsis,
      trailer_url: s.trailer_url,
    };
  });

  // Movies that exist only on the server (added in Admin) come after them.
  const localIds = new Set(localMovies.map((m) => m.id));
  const extra = list.filter((s) => !localIds.has(String(s.id))).map(fromServer);
  return [...merged, ...extra];
}

function fetchAll() {
  if (!inflight) {
    inflight = loadMovies()
      .then((result) => {
        cache = result;
        listeners.forEach((notify) => notify(result));
        return result;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// Forces a fresh load, for example right after a movie was added in Admin.
export function reloadMovies() {
  inflight = null;
  return fetchAll();
}

// Local movies first, then server data. If the server is off, local movies stay.
export function useMovies() {
  const [movies, setMovies] = useState<MovieWithTrailer[]>(cache ?? localMovies);

  useEffect(() => {
    listeners.add(setMovies);
    fetchAll().catch(() => {});
    return () => {
      listeners.delete(setMovies);
    };
  }, []);

  return { movies, fromServer: cache !== null };
}

// One movie by id, for detail screens.
export function useMovie(id?: string) {
  const { movies } = useMovies();
  return movies.find((m) => m.id === id);
}