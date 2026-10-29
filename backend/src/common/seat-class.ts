// The last row of a hall is VIP and costs 1.5 times the normal seat price.
export const VIP_MULTIPLIER = 1.5;

export function isVipSeat(seat: string, rowCount: number): boolean {
  const row = seat.trim().toUpperCase().charCodeAt(0) - 65;
  return row === rowCount - 1;
}

export const vipPriceFor = (regularEtb: number) => Math.round(regularEtb * VIP_MULTIPLIER);