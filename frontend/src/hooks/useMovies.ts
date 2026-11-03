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

// Starts with the local movies, then updates them with server data.
// If the server is off, the app keeps showing the local movies.
export function useMovies() {
  const [movies, setMovies] = useState<MovieItem[]>(localMovies);
  const [fromServer, setFromServer] = useState(false);

  useEffect(() => {
    let active = true;
    request<ServerMovie[]>('/movies')
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        setMovies(
          localMovies.map((local) => {
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
          })
        );
        setFromServer(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return { movies, fromServer };
}