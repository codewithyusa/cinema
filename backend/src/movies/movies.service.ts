import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  hidden?: number;
};

// Same 10 movies, in the same order, as the app's movies.ts. The ids must match.
const SEED: Omit<Movie, 'id'>[] = [
  { title: 'Dune: Part Two', genre: 'Sci-fi', duration_min: 166, rating: 8.5, synopsis: 'Paul Atreides joins the Fremen and sets out to avenge his family.', poster_url: null, trailer_url: null },
  { title: 'Oppenheimer', genre: 'Drama', duration_min: 180, rating: 8.3, synopsis: 'The story of the scientist who led the creation of the atomic bomb.', poster_url: null, trailer_url: null },
  { title: 'Inception', genre: 'Sci-fi', duration_min: 148, rating: 8.8, synopsis: 'A thief who steals secrets from dreams is given one impossible job.', poster_url: null, trailer_url: null },
  { title: 'The Dark Knight', genre: 'Action', duration_min: 152, rating: 9.0, synopsis: 'Batman faces the Joker, who pushes Gotham City into chaos.', poster_url: null, trailer_url: null },
  { title: 'Interstellar', genre: 'Sci-fi', duration_min: 169, rating: 8.7, synopsis: 'Explorers travel through a wormhole to find a new home for humanity.', poster_url: null, trailer_url: null },
  { title: 'Avatar: The Way of Water', genre: 'Adventure', duration_min: 192, rating: 7.6, synopsis: 'Jake Sully and his family seek refuge among the ocean clans of Pandora.', poster_url: null, trailer_url: null },
  { title: 'Spider-Man: Across the Spider-Verse', genre: 'Animation', duration_min: 140, rating: 8.6, synopsis: 'Miles Morales travels across the multiverse and meets a team of Spider-People.', poster_url: null, trailer_url: null },
  { title: 'John Wick: Chapter 4', genre: 'Action', duration_min: 169, rating: 7.7, synopsis: 'John Wick takes on the High Table in a fight for his freedom.', poster_url: null, trailer_url: null },
  { title: 'Top Gun: Maverick', genre: 'Action', duration_min: 130, rating: 8.2, synopsis: 'Maverick trains a new class of elite pilots for an impossible mission.', poster_url: null, trailer_url: null },
  { title: 'Furious 7', genre: 'Action', duration_min: 137, rating: 7.1, synopsis: 'Dom and his crew face a deadly enemy who is hunting each of them down.', poster_url: null, trailer_url: null },
];

// YouTube video ids by movie title. A movie that is not listed here keeps
// trailer_url empty, and the app opens a YouTube search for it instead.
// To add one: put the id here, then restart the backend.
const TRAILER_IDS: Record<string, string> = {
  'Dune: Part Two': 'Mm456_D4ZvE',
  'Oppenheimer': 'GrT5lpK6L1E',
  'Inception': '7DwuVKfjctk',
  'The Dark Knight': 'EXeTwQWrcwY',
  'Interstellar': '-gieJQejbHQ',
  'Avatar: The Way of Water': 'd9MyW72ELq0',
  'Spider-Man: Across the Spider-Verse': 'cqGjhVJWtEg',
  'John Wick: Chapter 4': 'qEVUtrk8_B4',
  'Top Gun: Maverick': 'qSqVVswa420',
  'Furious 7': 'yISKeT6sDOg',
};

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
    // Older databases do not have this column yet. The error means it already exists.
    try {
      this.db.run('ALTER TABLE movies ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0');
    } catch {}

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
    this.fillTrailers();
  }

  // Runs on every start. Only fills empty trailer links, so a link that is
  // already set (for example edited by hand) is never overwritten.
  private fillTrailers() {
    for (const [title, videoId] of Object.entries(TRAILER_IDS)) {
      this.db.run(
        'UPDATE movies SET trailer_url = ? WHERE title = ? AND trailer_url IS NULL',
        `https://www.youtube.com/watch?v=${videoId}`, title,
      );
    }
  }

  // Public list: hidden movies are left out.
  list(genre?: string): Movie[] {
    if (genre) {
      return this.db.all<Movie>('SELECT * FROM movies WHERE hidden = 0 AND genre = ? ORDER BY id', genre);
    }
    return this.db.all<Movie>('SELECT * FROM movies WHERE hidden = 0 ORDER BY id');
  }

  // Admin: every movie, including hidden ones.
  adminList(): Movie[] {
    return this.db.all<Movie>('SELECT * FROM movies ORDER BY id');
  }

  get(id: number): Movie {
    const movie = this.db.get<Movie>('SELECT * FROM movies WHERE id = ?', id);
    if (!movie) throw new NotFoundException('Movie not found.');
    return movie;
  }

  // Admin: hides or shows a movie in the app.
  setHidden(id: number, hidden: boolean): Movie {
    this.get(id);
    this.db.run('UPDATE movies SET hidden = ? WHERE id = ?', hidden ? 1 : 0, id);
    return this.get(id);
  }

  // Admin: adds a new movie. Its id continues after the 10 seeded ones.
  create(input: {
    title?: string;
    genre?: string;
    duration_min?: number;
    rating?: number;
    synopsis?: string;
    poster_url?: string;
    trailer_url?: string;
  }): Movie {
    const title = String(input.title ?? '').trim();
    const genre = String(input.genre ?? '').trim();
    const synopsis = String(input.synopsis ?? '').trim();
    const duration = Number(input.duration_min);
    const rating = Number(input.rating ?? 0);
    const poster = String(input.poster_url ?? '').trim();
    const trailer = String(input.trailer_url ?? '').trim();

    if (!title || !genre || !synopsis) {
      throw new BadRequestException('Title, genre and synopsis are required.');
    }
    if (!Number.isInteger(duration) || duration < 30 || duration > 400) {
      throw new BadRequestException('Duration must be 30 to 400 minutes.');
    }
    if (!(rating >= 0 && rating <= 10)) {
      throw new BadRequestException('Rating must be 0 to 10.');
    }
    for (const url of [poster, trailer]) {
      if (url && !/^https?:\/\//i.test(url)) {
        throw new BadRequestException('Links must start with http:// or https://');
      }
    }
    if (this.db.get('SELECT id FROM movies WHERE LOWER(title) = LOWER(?)', title)) {
      throw new ConflictException('A movie with this title already exists.');
    }

    const result = this.db.run(
      'INSERT INTO movies (title, genre, duration_min, rating, synopsis, poster_url, trailer_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      title, genre, duration, rating, synopsis, poster || null, trailer || null,
    );
    return this.get(Number(result.lastInsertRowid));
  }
}