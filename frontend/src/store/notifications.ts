import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { getSettings } from './settings';

export type InboxItem = { id: string; title: string; body: string; createdAt: number };

type NotificationsModule = typeof import('expo-notifications');

const keyFor = (email: string) => `yusa_inbox_${email}`;

let cached: NotificationsModule | null | undefined;

// Loads expo-notifications only when the phone app really includes it.
// Expo Go on Android does not, so we skip pop-ups there and nothing crashes.
function loadNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (cached !== undefined) return cached;

  if (Platform.OS === 'android' && !requireOptionalNativeModule('ExpoTopicSubscriptionModule')) {
    cached = null;
    return cached;
  }

  try {
    const mod = require('expo-notifications') as NotificationsModule;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

export async function getInbox(email: string): Promise<InboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addToInbox(email: string, title: string, body: string) {
  const all = await getInbox(email);
  const item: InboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    createdAt: Date.now(),
  };
  try {
    await AsyncStorage.setItem(keyFor(email), JSON.stringify([item, ...all]));
  } catch {}
}

async function allowed(N: NotificationsModule) {
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'default',
        importance: N.AndroidImportance.MAX,
      });
    }
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await N.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

const months: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// date like "Thu 22 Oct", time like "7:30 PM"
function showDate(date: string, time: string): Date | null {
  const d = date.match(/(\d+)\s+([A-Za-z]{3})/);
  const t = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!d || !t) return null;
  let hour = Number(t[1]) % 12;
  if (t[3].toUpperCase() === 'PM') hour += 12;
  return new Date(new Date().getFullYear(), months[d[2]] ?? 0, Number(d[1]), hour, Number(t[2]));
}

export async function notifyBooking(
  email: string,
  info: { movie: string; cinema: string; date: string; time: string; seats: string }
) {
  const confirmTitle = 'Booking confirmed';
  const confirmBody = `${info.movie} at ${info.cinema}, ${info.date} ${info.time}. Seats ${info.seats}.`;
  await addToInbox(email, confirmTitle, confirmBody);

  const settings = await getSettings();
  const when = showDate(info.date, info.time);
  const remindAt = when ? new Date(when.getTime() - 60 * 60 * 1000) : null;
  const canRemind = settings.reminders && remindAt !== null && remindAt.getTime() > Date.now();

  if (canRemind) {
    await addToInbox(email, 'Reminder set', `We will remind you 1 hour before ${info.movie}.`);
  }

  if (!settings.notifications) return;

  const N = loadNotifications();
  if (!N || !(await allowed(N))) return;

  try {
    await N.scheduleNotificationAsync({
      content: { title: confirmTitle, body: confirmBody },
      trigger: null,
    });

    if (canRemind && remindAt) {
      await N.scheduleNotificationAsync({
        content: {
          title: `${info.movie} starts in 1 hour`,
          body: `${info.cinema}, ${info.time}. Seats ${info.seats}. Have your QR code ready.`,
        },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: remindAt },
      });
    }
  } catch {}
}