import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedTicket = {
  code: string;
  id: string;
  cinema: string;
  date: string;
  time: string;
  seats: string;
  total: string;
  method: string;
  createdAt: number;
};

const KEY = 'yusa_tickets';

export async function getTickets(): Promise<SavedTicket[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTicket(ticket: SavedTicket) {
  try {
    const all = await getTickets();
    if (all.some((t) => t.code === ticket.code)) return;
    await AsyncStorage.setItem(KEY, JSON.stringify([ticket, ...all]));
  } catch {}
}