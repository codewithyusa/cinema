import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

export type Cinema = { id: number; name: string; address: string };

export type Showtime = {
  id: number;
  movie_id: number;
  movie_title: string;
  hall_id: number;
  hall_name: string;
  cinema_id: number;
  cinema_name: string;
  row_count: number;
  seats_per_row: number;
  starts_at: string;
  price_etb: number;
};

const SHOWTIME_SELECT = `
  SELECT s.id, s.movie_id, m.title AS movie_title,
         s.hall_id, h.name AS hall_name,
         c.id AS cinema_id, c.name AS cinema_name,
         h.row_count, h.seats_per_row,
         s.starts_at, s.price_etb
  FROM showtimes s
  JOIN movies m ON m.id = s.movie_id
  JOIN halls h ON h.id = s.hall_id
  JOIN cinemas c ON c.id = h.cinema_id
`;

const DAYS_AHEAD = 7;

@Injectable()
export class CinemasService {
  constructor(private readonly db: DatabaseService) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cinemas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS halls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cinema_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        seats_per_row INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS showtimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        hall_id INTEGER NOT NULL,
        starts_at TEXT NOT NULL,
        price_etb INTEGER NOT NULL
      )
    `);
    this.seedCinemas();
    this.ensureShowtimes();
  }

  // Runs once, only when there are no cinemas yet.
  private seedCinemas() {
    const count = this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM cinemas');
    if (count && count.n > 0) return;

    const branches = [
      { name: 'YUSA Cinema Bole', address: 'Bole, Addis Ababa' },
      { name: 'YUSA Cinema Piassa', address: 'Piassa, Addis Ababa' },
    ];

    for (const branch of branches) {
      const cinemaId = Number(
        this.db.run('INSERT INTO cinemas (name, address) VALUES (?, ?)', branch.name, branch.address).lastInsertRowid,
      );
      for (const name of ['Hall 1', 'Hall 2']) {
        this.db.run(
          'INSERT INTO halls (cinema_id, name, row_count, seats_per_row) VALUES (?, ?, ?, ?)',
          cinemaId, name, 6, 8,
        );
      }
    }
  }

  // Runs on every start. Adds the missing showtimes for today and the next days,
  // so the app never runs out of future showtimes. Existing ones are not duplicated.
  private ensureShowtimes() {
    const halls = this.db.all<{ id: number; cinema_id: number }>(
      'SELECT id, cinema_id FROM halls ORDER BY cinema_id, id',
    );
    const hallsByCinema = new Map<number, number[]>();
    for (const h of halls) {
      const list = hallsByCinema.get(h.cinema_id) ?? [];
      list.push(h.id);
      hallsByCinema.set(h.cinema_id, list);
    }

    const now = new Date();
    this.db.run('BEGIN IMMEDIATE');
    try {
      for (const hallIds of hallsByCinema.values()) {
        if (hallIds.length < 2) continue;
        for (let day = 0; day < DAYS_AHEAD; day++) {
          for (let movieId = 1; movieId <= 10; movieId++) {
            const hallIndex = (movieId - 1) % 2;
            const hours = movieId <= 2 ? [12, 18] : [15, 21];
            for (const hour of hours) {
              // Cinema time is UTC+3, so subtract 3 to store UTC.
              const start = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, hour - 3),
              );
              if (start.getTime() <= now.getTime()) continue;

              const startsAt = start.toISOString();
              const exists = this.db.get(
                'SELECT id FROM showtimes WHERE movie_id = ? AND hall_id = ? AND starts_at = ?',
                movieId, hallIds[hallIndex], startsAt,
              );
              if (exists) continue;

              this.db.run(
                'INSERT INTO showtimes (movie_id, hall_id, starts_at, price_etb) VALUES (?, ?, ?, ?)',
                movieId, hallIds[hallIndex], startsAt, hallIndex === 0 ? 200 : 250,
              );
            }
          }
        }
      }
      this.db.run('COMMIT');
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  listCinemas(): Cinema[] {
    return this.db.all<Cinema>('SELECT * FROM cinemas ORDER BY id');
  }

  listShowtimes(movieId?: number, cinemaId?: number): Showtime[] {
    let sql = `${SHOWTIME_SELECT} WHERE s.starts_at > ?`;
    const params: (string | number)[] = [new Date().toISOString()];
    if (movieId) {
      sql += ' AND s.movie_id = ?';
      params.push(movieId);
    }
    if (cinemaId) {
      sql += ' AND c.id = ?';
      params.push(cinemaId);
    }
    sql += ' ORDER BY s.starts_at';
    return this.db.all<Showtime>(sql, ...params);
  }

  getShowtime(id: number): Showtime {
    const showtime = this.db.get<Showtime>(`${SHOWTIME_SELECT} WHERE s.id = ?`, id);
    if (!showtime) throw new NotFoundException('Showtime not found.');
    return showtime;
  }
}