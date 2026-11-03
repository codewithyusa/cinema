import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly db: DatabaseService) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS watchlist (
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, movie_id)
      )
    `);
  }

  // Movie ids, newest first.
  list(userId: number): number[] {
    return this.db
      .all<{ movie_id: number }>(
        'SELECT movie_id FROM watchlist WHERE user_id = ? ORDER BY created_at DESC, rowid DESC',
        userId,
      )
      .map((r) => r.movie_id);
  }

  // Adding a movie that is already saved changes nothing.
  add(userId: number, movieId: number): number[] {
    if (!this.db.get('SELECT id FROM movies WHERE id = ?', movieId)) {
      throw new NotFoundException('Movie not found.');
    }
    this.db.run('INSERT OR IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)', userId, movieId);
    return this.list(userId);
  }

  // Removing a movie that is not saved changes nothing.
  remove(userId: number, movieId: number): number[] {
    this.db.run('DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?', userId, movieId);
    return this.list(userId);
  }
}