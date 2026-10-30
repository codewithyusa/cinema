import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import '../common/env';
import { QuoteDto } from '../bookings/bookings.dto';
import { BookingsService } from '../bookings/bookings.service';
import { DatabaseService } from '../db/database.service';
import { chapaInitialize, chapaVerify } from './chapa.client';

type PaymentRow = {
  id: number;
  tx_ref: string;
  user_id: number;
  showtime_id: number;
  seats: string;
  snacks: string;
  promo_code: string | null;
  total_etb: number;
  status: string;
  booking_code: string | null;
  created_at: string;
};

// How long the seats stay held while the customer pays on the provider's page.
const PAY_WINDOW_MINUTES = 15;

const MISMATCH_MESSAGE = 'The paid amount does not match the order. Contact support with this payment reference.';
const CONFLICT_MESSAGE =
  'Your payment was received, but the seats were taken by someone else. Contact support with this payment reference for a refund.';

const publicUrl = () => (process.env.PUBLIC_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly bookings: BookingsService,
  ) {
    // status: pending, processing, paid, failed, mismatch or conflict
    this.db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_ref TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        showtime_id INTEGER NOT NULL,
        seats TEXT NOT NULL,
        snacks TEXT NOT NULL,
        promo_code TEXT,
        total_etb INTEGER NOT NULL,
        status TEXT NOT NULL,
        booking_code TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  async initialize(userId: number, dto: QuoteDto) {
    const user = this.db.get<{ name: string; email: string }>('SELECT name, email FROM users WHERE id = ?', userId);
    if (!user) throw new NotFoundException('User not found.');

    // Prices the order from the live seat hold. Throws if the hold is gone or the promo code is wrong.
    const quote = this.bookings.quote(userId, dto);

    const txRef = 'YCP-' + randomBytes(10).toString('hex');
    this.db.run(
      'INSERT INTO payments (tx_ref, user_id, showtime_id, seats, snacks, promo_code, total_etb, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      txRef,
      userId,
      dto.showtimeId,
      quote.seats.join(','),
      JSON.stringify(dto.snacks ?? {}),
      dto.promoCode?.trim().toUpperCase() || null,
      quote.total_etb,
      'pending',
    );

    const [first, ...rest] = user.name.trim().split(/\s+/);
    let checkoutUrl: string;
    try {
      checkoutUrl = await chapaInitialize({
        amount: String(quote.total_etb),
        currency: 'ETB',
        email: user.email,
        first_name: first || 'Customer',
        last_name: rest.join(' ') || 'Customer',
        tx_ref: txRef,
        return_url: `${publicUrl()}/payments/done`,
        customization: { title: 'YUSA CINEMA', description: 'Movie tickets' },
      });
    } catch (e) {
      this.db.run("UPDATE payments SET status = 'failed' WHERE tx_ref = ?", txRef);
      throw e;
    }

    // Give the customer time to pay.
    const until = new Date(Date.now() + PAY_WINDOW_MINUTES * 60 * 1000).toISOString();
    this.db.run('UPDATE seat_holds SET expires_at = ? WHERE showtime_id = ? AND user_id = ?', until, dto.showtimeId, userId);

    return { tx_ref: txRef, checkout_url: checkoutUrl, total_etb: quote.total_etb, hold_expires_at: until };
  }

  async verify(userId: number, txRef: string) {
    const row = this.db.get<PaymentRow>('SELECT * FROM payments WHERE tx_ref = ? AND user_id = ?', txRef, userId);
    if (!row) throw new NotFoundException('Payment not found.');

    if (row.status === 'paid') return { status: 'paid', booking: this.bookings.find(userId, row.booking_code ?? '') };
    if (row.status === 'failed') return { status: 'failed' };
    if (row.status === 'mismatch') throw new ConflictException(MISMATCH_MESSAGE);
    if (row.status === 'conflict') throw new ConflictException(CONFLICT_MESSAGE);
    if (row.status === 'processing') return { status: 'pending' };

    const v = await chapaVerify(txRef);
    if (!v.found || v.status === 'pending') return { status: 'pending' };
    // The customer can retry on the same checkout page, so a failed attempt is not final.
    if (v.status !== 'success') return { status: 'failed' };

    const amountOk = Math.abs(v.amount - row.total_etb) < 0.01;
    if (v.tx_ref !== txRef || v.currency.toUpperCase() !== 'ETB' || !amountOk) {
      this.db.run("UPDATE payments SET status = 'mismatch' WHERE tx_ref = ?", txRef);
      throw new ConflictException(MISMATCH_MESSAGE);
    }

    // Only one request may turn a payment into a booking.
    const claim = this.db.run("UPDATE payments SET status = 'processing' WHERE tx_ref = ? AND status = 'pending'", txRef);
    if (Number(claim.changes) !== 1) return { status: 'pending' };

    try {
      const booking = this.bookings.book(userId, row.showtime_id, row.seats.split(','), row.total_etb, 'chapa', 1);
      this.db.run("UPDATE payments SET status = 'paid', booking_code = ? WHERE tx_ref = ?", booking.code, txRef);
      return { status: 'paid', booking };
    } catch (e) {
      if (e instanceof ConflictException) {
        this.db.run("UPDATE payments SET status = 'conflict' WHERE tx_ref = ?", txRef);
        throw new ConflictException(CONFLICT_MESSAGE);
      }
      this.db.run("UPDATE payments SET status = 'pending' WHERE tx_ref = ?", txRef);
      throw e;
    }
  }
}