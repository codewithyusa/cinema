import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

export type Movie = {
  id: number;
  title: string;
  genre: string;
  duration_min: number;
  rating: number;
  synopsis: string;
  poster_url: string | null;
  trailer_url: string | null;
};

const SEED: Omit<Movie, 'id'>[] = [
  { title: 'Dune: Part Two', genre: 'Sci-fi', duration_min: 166, rating: 8.5, synopsis: 'Paul Atreides unites with the Fremen to take revenge on those who destroyed his family.', poster_url: null, trailer_url: null },
  { title: 'Interstellar', genre: 'Sci-fi', duration_min: 169, rating: 8.7, synopsis: 'A team of explorers travels through a wormhole to save humanity.', poster_url: null, trailer_url: null },
  { title: 'The Dark Knight', genre: 'Action', duration_min: 152, rating: 9.0, synopsis: 'Batman faces the Joker, a criminal mastermind who spreads chaos in Gotham.', poster_url: null, trailer_url: null },
  { title: 'Inception', genre: 'Thriller', duration_min: 148, rating: 8.8, synopsis: 'A thief who steals secrets from dreams is given one last impossible job.', poster_url: null, trailer_url: null },
];

@Injectable()
export class MoviesService {
  constructor(private readonly db: DatabaseService) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        rating REAL NOT NULL,
        synopsis TEXT NOT NULL,
        poster_url TEXT,
        trailer_url TEXT
      )
    `);
    // Fill the table once, only when it is empty.
    const count = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM movies');
    if (!count || count.n === 0) {
      for (const m of SEED) {
        this.db.run(
          'INSERT INTO movies (title, genre, duration_min, rating, synopsis, poster_url, trailer_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          m.title, m.genre, m.duration_min, m.rating, m.synopsis, m.poster_url, m.trailer_url,
        );
      }
    }
  }

  list(genre?: string): Movie[] {
    if (genre) {
      return this.db.all<Movie>('SELECT * FROM movies WHERE genre = ? ORDER BY id', genre);
    }
    return this.db.all<Movie>('SELECT * FROM movies ORDER BY id');
  }

  get(id: number): Movie {
    const movie = this.db.get<Movie>('SELECT * FROM movies WHERE id = ?', id);
    if (!movie) throw new NotFoundException('Movie not found.');
    return movie;
  }
}