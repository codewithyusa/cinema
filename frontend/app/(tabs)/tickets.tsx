import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { ServerBooking, getBookings } from '../../src/api/seats';
import { getTickets, setTickets as replaceTickets, SavedTicket } from '../../src/store/tickets';
import { useAuth } from '../../src/store/authStore';
import Poster from '../../src/components/Poster';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Codes made by the server look like YCK4M2PX. Older tickets made before the server
// existed have a different format and only live on this phone.
const SERVER_CODE = /^YC[A-Z2-9]{6}$/;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function toSavedTicket(b: ServerBooking): SavedTicket {
  return {
    code: b.code,
    id: String(b.movie_id),
    cinema: b.cinema_name,
    date: formatDate(b.starts_at),
    time: formatTime(b.starts_at),
    seats: b.seats.join(','),
    total: String(b.total_etb),
    method: b.method,
    createdAt: new Date(b.created_at.replace(' ', 'T') + 'Z').getTime(),
  };
}

// The server list is the truth for server tickets. Old phone-only tickets are kept.
async function syncTickets(email: string): Promise<SavedTicket[]> {
  const local = await getTickets(email);
  const remote = await getBookings();
  const legacy = local.filter((t) => !SERVER_CODE.test(t.code));
  const merged = [...remote.map(toSavedTicket), ...legacy].sort((a, b) => b.createdAt - a.createdAt);
  await replaceTickets(email, merged);
  return merged;
}

export default function Tickets() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [offline, setOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setTickets([]);
        return;
      }
      const email = user.email;

      // Show the saved tickets at once, then refresh from the server.
      getTickets(email).then((list) => {
        if (active) setTickets(list);
      });
      syncTickets(email)
        .then((list) => {
          if (!active) return;
          setTickets(list);
          setOffline(false);
        })
        .catch(() => {
          if (active) setOffline(true);
        });

      return () => {
        active = false;
      };
    }, [user?.email])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>My tickets</Text>
        <Text style={{ color: offline ? colors.redText : colors.muted, fontSize: 13, marginTop: 4 }}>
          {offline ? 'Offline. Showing tickets saved on this phone' : 'Works even without internet'}
        </Text>
      </View>

      {tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ionicons name="ticket-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>No tickets yet. Book a movie first.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          {tickets.map((t) => {
            const movie = getMovie(t.id);
            return (
              <Pressable
                key={t.code}
                onPress={() =>
                  router.push({
                    pathname: '/booking/ticket',
                    params: {
                      id: t.id,
                      cinema: t.cinema,
                      date: t.date,
                      time: t.time,
                      seats: t.seats,
                      total: t.total,
                      method: t.method,
                      code: t.code,
                      view: '1',
                    },
                  })
                }
                style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 }}
              >
                <Poster movie={movie} style={{ width: 56, height: 80, borderRadius: 10 }} />
                <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{movie?.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{t.cinema}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {t.date} · {t.time}
                  </Text>
                  <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>
                    Seats {t.seats.split(',').join(', ')}
                  </Text>
                </View>
                <View style={{ justifyContent: 'center' }}>
                  <Ionicons name="qr-code-outline" size={26} color={colors.text} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}