import { BadRequestException } from '@nestjs/common';

// Prices are in ETB. They match the app's old dollar prices at about 50 ETB per dollar.
export const BOOKING_FEE_ETB = 75;
const MAX_SNACK_QTY = 20;

const SNACKS: Record<string, { name: string; price_etb: number }> = {
  popcorn: { name: 'Popcorn combo', price_etb: 400 },
  nachos: { name: 'Nachos', price_etb: 300 },
  soda: { name: 'Soda', price_etb: 200 },
};

const PROMOS: Record<string, { label: string; percent?: number; amount_etb?: number }> = {
  YUSA10: { label: '10% off', percent: 10 },
  WELCOME5: { label: '250 ETB off', amount_etb: 250 },
};

function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

export type OrderLine = { label: string; qty: number; unit_etb: number; total_etb: number };

export type Order = {
  lines: OrderLine[];
  seats_etb: number;
  snacks_etb: number;
  subtotal_etb: number;
  discount_etb: number;
  promo: { code: string; label: string } | null;
  fee_etb: number;
  total_etb: number;
};

export function priceOrder(
  seatCount: number,
  seatPriceEtb: number,
  snacks: Record<string, number> = {},
  promoCode?: string,
): Order {
  const lines: OrderLine[] = [];

  const seats_etb = seatCount * seatPriceEtb;
  lines.push({ label: 'Seats', qty: seatCount, unit_etb: seatPriceEtb, total_etb: seats_etb });

  let snacks_etb = 0;
  for (const [id, qty] of Object.entries(snacks)) {
    const snack = own(SNACKS, id);
    if (!snack) throw new BadRequestException(`Unknown snack: ${id}.`);
    if (!Number.isInteger(qty) || qty < 0 || qty > MAX_SNACK_QTY) {
      throw new BadRequestException(`Quantity for ${snack.name} must be a whole number from 0 to ${MAX_SNACK_QTY}.`);
    }
    if (qty === 0) continue;
    const total = qty * snack.price_etb;
    snacks_etb += total;
    lines.push({ label: snack.name, qty, unit_etb: snack.price_etb, total_etb: total });
  }

  const subtotal_etb = seats_etb + snacks_etb;

  let discount_etb = 0;
  let promo: Order['promo'] = null;
  const code = promoCode?.trim().toUpperCase();
  if (code) {
    const found = own(PROMOS, code);
    if (!found) throw new BadRequestException('This code is not valid.');
    const raw = found.percent ? Math.round((subtotal_etb * found.percent) / 100) : (found.amount_etb ?? 0);
    discount_etb = Math.min(raw, subtotal_etb);
    promo = { code, label: found.label };
  }

  return {
    lines,
    seats_etb,
    snacks_etb,
    subtotal_etb,
    discount_etb,
    promo,
    fee_etb: BOOKING_FEE_ETB,
    total_etb: subtotal_etb - discount_etb + BOOKING_FEE_ETB,
  };
}