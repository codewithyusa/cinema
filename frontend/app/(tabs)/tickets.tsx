import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { getTickets, SavedTicket } from '../../src/store/tickets';
import { useAuth } from '../../src/store/authStore';
import Poster from '../../src/components/Poster';

export default function Tickets() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) getTickets(user.email).then(setTickets);
      else setTickets([]);
    }, [user?.email])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>My tickets</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Works even without internet</Text>
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