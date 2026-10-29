import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CinemasService } from '../cinemas/cinemas.service';
import { vipPriceFor } from '../common/seat-class';
import { DatabaseService } from '../db/database.service';

export type SeatStatus = 'free' | 'held' | 'mine' | 'taken';

const HOLD_MINUTES = 5;

@Injectable()
export class SeatsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cinemas: CinemasService,
  ) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS seat_holds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        showtime_id INTEGER NOT NULL,
        seat TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        UNIQUE (showtime_id, seat)
      )
    `);
    // The UNIQUE rule is what makes a double booking impossible.
    this.db.run(`
      CREATE TABLE IF NOT EXISTS booked_seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        showtime_id INTEGER NOT NULL,
        seat TEXT NOT NULL,
        booking_id INTEGER NOT NULL,
        UNIQUE (showtime_id, seat)
      )
    `);
  }

  private clearExpired() {
    this.db.run('DELETE FROM seat_holds WHERE expires_at <= ?', new Date().toISOString());
  }

  list(showtimeId: number, userId: number) {
    const showtime = this.cinemas.getShowtime(showtimeId);
    this.clearExpired();

    const booked = new Set(
      this.db
        .all<{ seat: string }>('SELECT seat FROM booked_seats WHERE showtime_id = ?', showtimeId)
        .map((r) => r.seat),
    );
    const holds = new Map(
      this.db
        .all<{ seat: string; user_id: number }>(
          'SELECT seat, user_id FROM seat_holds WHERE showtime_id = ?',
          showtimeId,
        )
        .map((r) => [r.seat, r.user_id]),
    );

    const rows = [];
    for (let r = 0; r < showtime.row_count; r++) {
      const label = String.fromCharCode(65 + r);
      // The last row of the hall is VIP.
      const vip = r === showtime.row_count - 1;
      const seats = [];
      for (let n = 1; n <= showtime.seats_per_row; n++) {
        const id = `${label}${n}`;
        let status: SeatStatus = 'free';
        if (booked.has(id)) status = 'taken';
        else if (holds.has(id)) status = holds.get(id) === userId ? 'mine' : 'held';
        seats.push({ id, status, vip });
      }
      rows.push({ label, seats });
    }
    return {
      showtime_id: showtimeId,
      price_etb: showtime.price_etb,
      vip_price_etb: vipPriceFor(showtime.price_etb),
      rows,
    };
  }

  hold(showtimeId: number, userId: number, requested: string[]) {
    const showtime = this.cinemas.getShowtime(showtimeId);
    if (new Date(showtime.starts_at).getTime() <= Date.now()) {
      throw new BadRequestException('This showtime has already started.');
    }
    const seats = [...new Set(requested.map((s) => s.trim().toUpperCase()))];

    for (const seat of seats) {
      const match = /^([A-Z])(\d{1,2})$/.exec(seat);
      const row = match ? match[1].charCodeAt(0) - 65 : -1;
      const num = match ? Number(match[2]) : 0;
      if (row < 0 || row >= showtime.row_count || num < 1 || num > showtime.seats_per_row) {
        throw new BadRequestException(`Seat ${seat} does not exist in this hall.`);
      }
    }

    this.clearExpired();
    // A new hold replaces the user's older hold for this showtime.
    this.db.run('DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?', showtimeId, userId);

    for (const seat of seats) {
      const booked = this.db.get('SELECT id FROM booked_seats WHERE showtime_id = ? AND seat = ?', showtimeId, seat);
      if (booked) throw new ConflictException(`Seat ${seat} is already booked.`);
      const held = this.db.get('SELECT id FROM seat_holds WHERE showtime_id = ? AND seat = ?', showtimeId, seat);
      if (held) throw new ConflictException(`Seat ${seat} is being held by someone else.`);
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
    for (const seat of seats) {
      this.db.run(
        'INSERT INTO seat_holds (showtime_id, seat, user_id, expires_at) VALUES (?, ?, ?, ?)',
        showtimeId, seat, userId, expiresAt,
      );
    }
    return { seats, expires_at: expiresAt };
  }

  release(showtimeId: number, userId: number) {
    this.cinemas.getShowtime(showtimeId);
    this.db.run('DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?', showtimeId, userId);
    return { released: true };
  }
}