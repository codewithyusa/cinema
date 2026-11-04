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
  trailer_url: string | null;
};

const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

// Shared by all screens. Starts empty, fills after the first server answer.
let cache: MovieWithTrailer[] | null = null;
let inflight: Promise<MovieWithTrailer[]> | null = null;

async function loadMovies(): Promise<MovieWithTrailer[]> {
  const list = await request<ServerMovie[]>('/movies');
  if (!Array.isArray(list)) return localMovies;
  return localMovies.map((local): MovieWithTrailer => {
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
}

// Local movies first, then server data. If the server is off, local movies stay.
export function useMovies() {
  const [movies, setMovies] = useState<MovieWithTrailer[]>(cache ?? localMovies);

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