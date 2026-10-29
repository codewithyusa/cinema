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

const keyFor = (email: string) => `yusa_tickets_${email}`;

export async function getTickets(email: string): Promise<SavedTicket[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTicket(email: string, ticket: SavedTicket): Promise<boolean> {
  try {
    const all = await getTickets(email);
    if (all.some((t) => t.code === ticket.code)) return false;
    await AsyncStorage.setItem(keyFor(email), JSON.stringify([ticket, ...all]));
    return true;
  } catch {
    return false;
  }
}

// Replaces the whole saved list. Used when the server list is the source of truth.
export async function setTickets(email: string, tickets: SavedTicket[]): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(email), JSON.stringify(tickets));
  } catch {}
}

export async function removeTicket(email: string, code: string): Promise<void> {
  try {
    const all = await getTickets(email);
    await AsyncStorage.setItem(keyFor(email), JSON.stringify(all.filter((t) => t.code !== code)));
  } catch {}
}