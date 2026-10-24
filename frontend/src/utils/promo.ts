export type Promo = { code: string; label: string; percent?: number; amount?: number };

const PROMOS: Promo[] = [
  { code: 'YUSA10', label: '10% off', percent: 10 },
  { code: 'WELCOME5', label: '$5 off', amount: 5 },
];

export function findPromo(input: string): Promo | null {
  const code = input.trim().toUpperCase();
  return PROMOS.find((p) => p.code === code) ?? null;
}

export function discountFor(promo: Promo, subtotal: number): number {
  const raw = promo.percent ? (subtotal * promo.percent) / 100 : promo.amount ?? 0;
  return Math.min(raw, subtotal);
}