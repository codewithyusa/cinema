import { useEffect, useState } from 'react';
import { request } from '../api/http';
import { UpcomingMovie, comingSoon as localUpcoming } from '../api/movies';

type ServerUpcoming = {
  id: number;
  title: string;
  genre: string;
  duration_min: number;
  synopsis: string;
  poster_url: string | null;
  release_date: string;
};

const DAY = 24 * 60 * 60 * 1000;
const COLORS = ['#5A0F1E', '#2B2B2B', '#3A0A0F'];

const formatDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

function toUpcoming(s: ServerUpcoming, index: number): UpcomingMovie {
  // Whole days from today's date to the release date.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const release = new Date(`${s.release_date}T00:00:00`);
  const days = Math.max(0, Math.round((release.getTime() - today.getTime()) / DAY));

  return {
    id: `u${s.id}`,
    title: s.title,
    genre: s.genre,
    duration: formatDuration(s.duration_min),
    rating: 0,
    color: COLORS[index % COLORS.length],
    poster: s.poster_url ?? `https://picsum.photos/seed/${encodeURIComponent(s.title)}/400/600`,
    synopsis: s.synopsis,
    releaseInDays: days,
  };
}

// Local list first, then the server list. If the server is off, the local list stays.
export function useComingSoon() {
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>(localUpcoming);

  useEffect(() => {
    let active = true;
    request<ServerUpcoming[]>('/coming-soon')
      .then((list) => {
        if (active && Array.isArray(list)) setUpcoming(list.map(toUpcoming));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return { upcoming };
}