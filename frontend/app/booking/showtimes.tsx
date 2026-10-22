import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const days = Array.from({ length: 5 }, (_, i) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + i);
  return { full: d, day: dayNames[d.getDay()], date: String(d.getDate()), month: monthNames[d.getMonth()] };
});

const cinemas = [
  { name: 'Cinemo Central', distance: '1.2 km', tags: ['IMAX', '2D'], times: ['4:30 PM', '7:30 PM', '10:15 PM'] },
  { name: 'Cinemo Riverside', distance: '3.8 km', tags: ['2D'], times: ['5:00 PM', '8:00 PM'] },
  { name: 'Cinemo Mall', distance: '6.1 km', tags: ['VIP', '2D'], times: ['6:15 PM', '9:00 PM'] },
];

function hasPassed(day: Date, time: string) {
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return false;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  const show = new Date(day);
  show.setHours(hour, Number(m[2]), 0, 0);
  return show.getTime() <= Date.now();
}

function TimeChip({ time, past, onPress }: { time: string; past: boolean; onPress: () => void }) {
  const borderColor = past ? colors.border : colors.red;
  const textColor = past ? colors.muted : colors.redText;
  const decoration = past ? 'line-through' : 'none';

  return (
    <Pressable
      disabled={past}
      onPress={onPress}
      style={{
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: borderColor,
        opacity: past ? 0.4 : 1,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: textColor, fontSize: 13, fontWeight: '700', textDecorationLine: decoration }}>
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

  const pick = (cinema: string, time: string) =>
    router.push({
      pathname: '/booking/seats',
      params: {
        id,
        cinema,
        time,
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
        <View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{movie?.title ?? 'Showtimes'}</Text>
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

        {cinemas.map((c) => (
          <View key={c.name} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{c.distance} away</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {c.tags.map((t) => (
                  <View key={t} style={{ backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {c.times.map((t) => (
                <TimeChip
                  key={t}
                  time={t}
                  past={hasPassed(days[selected].full, t)}
                  onPress={() => pick(c.name, t)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}