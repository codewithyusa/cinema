export const REGULAR_PRICE = 12;
export const VIP_PRICE = 18;
export const VIP_ROWS = ['F', 'G'];

export const isVip = (seat: string) => VIP_ROWS.includes(seat.charAt(0));

export const seatPrice = (seat: string) => (isVip(seat) ? VIP_PRICE : REGULAR_PRICE);

export const seatsTotal = (seats: string[]) => seats.reduce((sum, s) => sum + seatPrice(s), 0);