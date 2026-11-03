import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  author: string;
  user_id: number;
  created_at: string;
};

@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseService) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (movie_id, user_id)
      )
    `);
  }

  // Shown on the review card. Other users never see the email, only the name.
  private authorName(userId: number): string {
    try {
      const row = this.db.get<{ name: string | null; email: string }>(
        'SELECT name, email FROM users WHERE id = ?',
        userId,
      );
      return row?.name?.trim() || row?.email?.split('@')[0] || 'user';
    } catch {
      try {
        const row = this.db.get<{ email: string }>('SELECT email FROM users WHERE id = ?', userId);
        return row?.email ? row.email.split('@')[0] : 'user';
      } catch {
        return 'user';
      }
    }
  }

  // Newest first. "mine" tells the app which review belongs to the caller.
  list(movieId: number, userId: number) {
    const rows = this.db.all<ReviewRow>(
      'SELECT id, rating, comment, author, user_id, created_at FROM reviews WHERE movie_id = ? ORDER BY created_at DESC, id DESC',
      movieId,
    );
    return rows.map(({ user_id, ...r }) => ({ ...r, mine: user_id === userId }));
  }

  // One review per user per movie. A second one replaces the first.
  save(movieId: number, userId: number, rating: number, comment: string) {
    if (!this.db.get('SELECT id FROM movies WHERE id = ?', movieId)) {
      throw new NotFoundException('Movie not found.');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be a whole number from 1 to 5.');
    }
    this.db.run(
      `INSERT INTO reviews (movie_id, user_id, author, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (movie_id, user_id)
       DO UPDATE SET rating = excluded.rating, comment = excluded.comment, author = excluded.author, created_at = datetime('now')`,
      movieId,
      userId,
      this.authorName(userId),
      rating,
      (comment ?? '').trim().slice(0, 300),
    );
    return this.list(movieId, userId);
  }
}