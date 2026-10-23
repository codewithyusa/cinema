import { Movie } from '../types';

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`;

export const movies: Movie[] = [
  { id: '1', title: 'Midnight Harbor', genre: 'Thriller', duration: '2h 08m', rating: 8.1, color: '#5A0F1E', poster: poster('midnight-harbor'), synopsis: 'A night-shift harbor inspector finds a ledger that points to a shipment nobody admits to.' },
  { id: '2', title: 'Solar Drift', genre: 'Sci-fi', duration: '2h 20m', rating: 7.6, color: '#2B2B2B', poster: poster('solar-drift'), synopsis: 'A crew drifts toward a dying star.' },
  { id: '3', title: 'The Quiet Orchard', genre: 'Drama', duration: '1h 54m', rating: 8.4, color: '#3A0A0F', poster: poster('quiet-orchard'), synopsis: 'A family returns to the farm they left behind.' },
  { id: '4', title: 'Neon Saints', genre: 'Action', duration: '2h 01m', rating: 7.2, color: '#5C1A1A', poster: poster('neon-saints'), synopsis: 'Four thieves, one night, one city.' },
  { id: '5', title: 'Dust & Thunder', genre: 'Western', duration: '2h 12m', rating: 7.9, color: '#1E1E1E', poster: poster('dust-thunder'), synopsis: 'A marshal rides into a town that wants him gone.' },
];

export const getMovies = () => movies;
export const getMovie = (id: string) => movies.find((m) => m.id === id);