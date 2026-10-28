import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { ApiError } from '../../src/api/seats';
import { ShowtimeItem, getShowtimes } from '../../src/api/showtimes';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const days = Array.from({ length: 5 }, (_, i) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + i);
  return { full: d, day: dayNames[d.getDay()], date: String(d.getDate()), month: monthNames[d.getMonth()] };
});

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function TimeChip({ time, past, onPress }: { time: string; past: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={past}
      onPress={onPress}
      style={{
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: past ? colors.border : colors.red,
        opacity: past ? 0.4 : 1,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: past ? colors.muted : colors.redText,
          fontSize: 13,
          fontWeight: '700',
          textDecorationLine: past ? 'line-through' : 'none',
        }}
      >
        {time}
      </Text>
    </Pressable>
  );
}

export default function Showtimes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);

  const [selected, setSelected] = useState(0);
  const [items, setItems] = useState<ShowtimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getShowtimes(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Showtimes for the chosen day, grouped by cinema.
  const groups = useMemo(() => {
    const map = new Map<number, { name: string; shows: ShowtimeItem[] }>();
    for (const s of items) {
      if (!sameDay(new Date(s.starts_at), days[selected].full)) continue;
      if (!map.has(s.cinema_id)) map.set(s.cinema_id, { name: s.cinema_name, shows: [] });
      map.get(s.cinema_id)!.shows.push(s);
    }
    return [...map.values()];
  }, [items, selected]);

  const pick = (s: ShowtimeItem) =>
    router.push({
      pathname: '/booking/seats',
      params: {
        id,
        showtimeId: String(s.id),
        cinema: s.cinema_name,
        time: formatTime(s.starts_at),
        date: `${days[selected].day} ${days[selected].date} ${days[selected].month}`,
      },
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            {movie?.title ?? 'Showtimes'}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Choose date, cinema and time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {days.map((d, i) => (
            <Pressable
              key={`${d.month}-${d.date}`}
              onPress={() => setSelected(i)}
              style={{
                width: 58,
                height: 76,
                borderRadius: 16,
                backgroundColor: i === selected ? colors.red : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: i === selected ? '#fff' : colors.muted, fontSize: 12, fontWeight: '700' }}>
                {d.day}
              </Text>
              <Text style={{ color: i === selected ? '#fff' : colors.text, fontSize: 22, fontWeight: '800' }}>
                {d.date}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} size="large" />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', gap: 16, paddingVertical: 32 }}>
            <Text style={{ color: colors.redText, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            <Pressable
              onPress={load}
              style={{ height: 48, paddingHorizontal: 28, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Try again</Text>
            </Pressable>
          </View>
        ) : groups.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 32 }}>
            No showtimes on this day. Try another date.
          </Text>
        ) : (
          groups.map((g) => (
            <View key={g.name} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 12 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{g.name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.shows.map((s) => (
                  <TimeChip
                    key={s.id}
                    time={formatTime(s.starts_at)}
                    past={new Date(s.starts_at).getTime() <= Date.now()}
                    onPress={() => pick(s)}
                  />
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {g.shows[0].hall_name} · {g.shows[0].price_etb} ETB per seat
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}