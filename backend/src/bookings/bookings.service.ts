import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import '../common/env';
import { CinemasService } from '../cinemas/cinemas.service';
import { DatabaseService } from '../db/database.service';
import { CreateBookingDto, QuoteDto } from './bookings.dto';
import { priceOrder } from './pricing';

type BookingRow = {
  id: number;
  code: string;
  user_id: number;
  showtime_id: number;
  seats: string;
  total_etb: number;
  method: string;
  paid: number;
  created_at: string;
  cancelled_at: string | null;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cinemas: CinemasService,
  ) {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        showtime_id INTEGER NOT NULL,
        seats TEXT NOT NULL,
        total_etb INTEGER NOT NULL,
        method TEXT NOT NULL,
        paid INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    // Older databases do not have this column yet. The error means it already exists.
    try {
      this.db.run('ALTER TABLE bookings ADD COLUMN cancelled_at TEXT');
    } catch {}
  }

  private makeCode() {
    const bytes = randomBytes(6);
    let code = 'YC';
    for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
    return code;
  }

  // The seats come from this user's own live hold, never from the app.
  private liveHold(userId: number, showtimeId: number): string[] {
    const holds = this.db.all<{ seat: string }>(
      'SELECT seat FROM seat_holds WHERE showtime_id = ? AND user_id = ? AND expires_at > ? ORDER BY seat',
      showtimeId,
      userId,
      new Date().toISOString(),
    );
    if (holds.length === 0) {
      throw new BadRequestException('Your seat hold has expired or was never made. Select seats again.');
    }
    return holds.map((h) => h.seat);
  }

  private present(row: BookingRow) {
    const showtime = this.cinemas.getShowtime(row.showtime_id);
    return {
      id: row.id,
      code: row.code,
      showtime_id: row.showtime_id,
      movie_id: showtime.movie_id,
      movie_title: showtime.movie_title,
      cinema_name: showtime.cinema_name,
      hall_name: showtime.hall_name,
      starts_at: showtime.starts_at,
      seats: row.seats.split(','),
      total_etb: row.total_etb,
      method: row.method,
      paid: row.paid === 1,
      created_at: row.created_at,
    };
  }

  // Shows the price of the order without booking anything.
  quote(userId: number, dto: QuoteDto) {
    const showtime = this.cinemas.getShowtime(dto.showtimeId);
    const seats = this.liveHold(userId, dto.showtimeId);
    const order = priceOrder(seats, showtime.row_count, showtime.price_etb, dto.snacks, dto.promoCode);
    return { showtime_id: dto.showtimeId, seats, ...order };
  }

  // Saves a booking and its seats in one step. Used by direct booking and by confirmed payments.
  book(userId: number, showtimeId: number, seats: string[], totalEtb: number, method: string, paid: number) {
    this.db.run('BEGIN IMMEDIATE');
    try {
      let code = this.makeCode();
      while (this.db.get('SELECT id FROM bookings WHERE code = ?', code)) code = this.makeCode();

      const result = this.db.run(
        'INSERT INTO bookings (code, user_id, showtime_id, seats, total_etb, method, paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
        code, userId, showtimeId, seats.join(','), totalEtb, method, paid,
      );
      const bookingId = Number(result.lastInsertRowid);

      for (const seat of seats) {
        try {
          this.db.run(
            'INSERT INTO booked_seats (showtime_id, seat, booking_id) VALUES (?, ?, ?)',
            showtimeId, seat, bookingId,
          );
        } catch {
          throw new ConflictException(`Seat ${seat} was just booked by someone else.`);
        }
      }

      this.db.run('DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?', showtimeId, userId);
      this.db.run('COMMIT');

      const row = this.db.get<BookingRow>('SELECT * FROM bookings WHERE id = ?', bookingId)!;
      return this.present(row);
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  create(userId: number, dto: CreateBookingDto) {
    // Once online payments are live, set ALLOW_DEMO_PAYMENTS=false so that only
    // "Pay at cinema" can be booked without paying online.
    if (dto.method !== 'cash' && process.env.ALLOW_DEMO_PAYMENTS === 'false') {
      throw new BadRequestException('Pay online to book. Only "Pay at cinema" can be booked directly.');
    }

    const showtime = this.cinemas.getShowtime(dto.showtimeId);
    const seats = this.liveHold(userId, dto.showtimeId);
    const order = priceOrder(seats, showtime.row_count, showtime.price_etb, dto.snacks, dto.promoCode);
    // Demo payment: Telebirr and card count as paid. Real payments go through /payments.
    const paid = dto.method === 'cash' ? 0 : 1;

    const booking = this.book(userId, dto.showtimeId, seats, order.total_etb, dto.method, paid);
    return { ...booking, breakdown: order };
  }

  find(userId: number, code: string) {
    const row = this.db.get<BookingRow>('SELECT * FROM bookings WHERE code = ? AND user_id = ?', code, userId);
    return row ? this.present(row) : undefined;
  }

  list(userId: number) {
    const rows = this.db.all<BookingRow>(
      'SELECT * FROM bookings WHERE user_id = ? AND cancelled_at IS NULL ORDER BY id DESC',
      userId,
    );
    return rows.map((r) => this.present(r));
  }

  // Frees the seats of a booking. Only the owner can cancel, and only before the show starts.
  cancel(userId: number, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const row = this.db.get<BookingRow>(
      'SELECT * FROM bookings WHERE code = ? AND user_id = ?',
      code,
      userId,
    );
    if (!row) throw new NotFoundException('Booking not found.');

    // Cancelling twice is harmless.
    if (row.cancelled_at) return { cancelled: true, code };

    const showtime = this.cinemas.getShowtime(row.showtime_id);
    if (new Date(showtime.starts_at).getTime() <= Date.now()) {
      throw new BadRequestException('This showtime has already started, so the booking cannot be cancelled.');
    }

    this.db.run('BEGIN IMMEDIATE');
    try {
      this.db.run('DELETE FROM booked_seats WHERE booking_id = ?', row.id);
      this.db.run('UPDATE bookings SET cancelled_at = ? WHERE id = ?', new Date().toISOString(), row.id);
      this.db.run('COMMIT');
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
    return { cancelled: true, code };
  }
}