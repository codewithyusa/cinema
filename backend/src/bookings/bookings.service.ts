import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
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
    const order = priceOrder(seats.length, showtime.price_etb, dto.snacks, dto.promoCode);
    return { showtime_id: dto.showtimeId, seats, ...order };
  }

  create(userId: number, dto: CreateBookingDto) {
    const showtime = this.cinemas.getShowtime(dto.showtimeId);
    const seats = this.liveHold(userId, dto.showtimeId);
    const order = priceOrder(seats.length, showtime.price_etb, dto.snacks, dto.promoCode);
    // Demo payment: Telebirr and card count as paid. Real payment confirmation comes later.
    const paid = dto.method === 'cash' ? 0 : 1;

    this.db.run('BEGIN IMMEDIATE');
    try {
      let code = this.makeCode();
      while (this.db.get('SELECT id FROM bookings WHERE code = ?', code)) code = this.makeCode();

      const result = this.db.run(
        'INSERT INTO bookings (code, user_id, showtime_id, seats, total_etb, method, paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
        code, userId, dto.showtimeId, seats.join(','), order.total_etb, dto.method, paid,
      );
      const bookingId = Number(result.lastInsertRowid);

      for (const seat of seats) {
        try {
          this.db.run(
            'INSERT INTO booked_seats (showtime_id, seat, booking_id) VALUES (?, ?, ?)',
            dto.showtimeId, seat, bookingId,
          );
        } catch {
          throw new ConflictException(`Seat ${seat} was just booked by someone else.`);
        }
      }

      this.db.run('DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?', dto.showtimeId, userId);
      this.db.run('COMMIT');

      const row = this.db.get<BookingRow>('SELECT * FROM bookings WHERE id = ?', bookingId)!;
      return { ...this.present(row), breakdown: order };
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  list(userId: number) {
    const rows = this.db.all<BookingRow>(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC',
      userId,
    );
    return rows.map((r) => this.present(r));
  }
}