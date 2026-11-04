import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

export type ComingSoon = {
  id: number;
  title: string;
  genre: string;
  duration_min: number;
  synopsis: string;
  poster_url: string | null;
  release_date: string;
};

const DAY = 24 * 60 * 60 * 1000;

// Release dates are set from the day the table is first filled.
const SEED = [
  {
    title: 'Midnight Harbor',
    genre: 'Thriller',
    duration_min: 128,
    synopsis: 'A night-shift harbor inspector finds a ledger that points to a shipment nobody admits to.',
    poster_url: 'https://picsum.photos/seed/midnight-harbor/400/600',
    days: 12,
  },
  {
    title: 'Solar Drift',
    genre: 'Sci-fi',
    duration_min: 140,
    synopsis: 'A crew drifts toward a dying star.',
    poster_url: 'https://picsum.photos/seed/solar-drift/400/600',
    days: 26,
  },
  {
    title: 'The Quiet Orchard',
    genre: 'Drama',
    duration_min: 114,
    synopsis: 'A family returns to the farm they left behind.',
    poster_url: 'https://picsum.photos/seed/quiet-orchard/400/600',
    days: 40,
  },
];

@Injectable()
export class ComingSoonService {
  constructor(private readonly db: DatabaseService) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS coming_soon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        synopsis TEXT NOT NULL,
        poster_url TEXT,
        release_date TEXT NOT NULL
      )
    `);
    // Fill the table once, only when it is empty.
    const count = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM coming_soon');
    if (!count || count.n === 0) {
      for (const m of SEED) {
        this.db.run(
          'INSERT INTO coming_soon (title, genre, duration_min, synopsis, poster_url, release_date) VALUES (?, ?, ?, ?, ?, ?)',
          m.title,
          m.genre,
          m.duration_min,
          m.synopsis,
          m.poster_url,
          new Date(Date.now() + m.days * DAY).toISOString().slice(0, 10),
        );
      }
    }
  }

  // Only movies that have not opened yet, soonest first.
  list(): ComingSoon[] {
    return this.db.all<ComingSoon>(
      "SELECT * FROM coming_soon WHERE release_date >= date('now') ORDER BY release_date, id",
    );
  }
}