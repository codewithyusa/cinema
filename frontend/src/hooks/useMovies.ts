import { useEffect, useState } from 'react';
import { request } from '../api/http';
import { MovieItem, movies as localMovies } from '../api/movies';

type ServerMovie = {
  id: number;
  title: string;
  genre: string;
  duration_min: number;
  rating: number;
  synopsis: string;
};

const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

// Shared by all screens. Starts empty, fills after the first server answer.
let cache: MovieItem[] | null = null;
let inflight: Promise<MovieItem[]> | null = null;

async function loadMovies(): Promise<MovieItem[]> {
  const list = await request<ServerMovie[]>('/movies');
  if (!Array.isArray(list)) return localMovies;
  return localMovies.map((local) => {
    const s = list.find((m) => String(m.id) === local.id);
    if (!s) return local;
    return {
      ...local,
      title: s.title,
      genre: s.genre,
      duration: formatDuration(s.duration_min),
      rating: s.rating,
      synopsis: s.synopsis,
    };
  });
}

// Local movies first, then server data. If the server is off, local movies stay.
export function useMovies() {
  const [movies, setMovies] = useState<MovieItem[]>(cache ?? localMovies);

  useEffect(() => {
    let active = true;
    if (!inflight) {
      inflight = loadMovies()
        .then((result) => {
          cache = result;
          return result;
        })
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((result) => active && setMovies(result)).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return { movies, fromServer: cache !== null };
}

// One movie by id, for detail screens.
export function useMovie(id?: string) {
  const { movies } = useMovies();
  return movies.find((m) => m.id === id);
}