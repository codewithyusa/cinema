import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

const days = [
  { day: 'Wed', date: '21' },
  { day: 'Thu', date: '22' },
  { day: 'Fri', date: '23' },
  { day: 'Sat', date: '24' },
  { day: 'Sun', date: '25' },
];

const cinemas = [
  { name: 'Cinemo Central', distance: '1.2 km', tags: ['IMAX', '2D'], times: ['4:30 PM', '7:30 PM', '10:15 PM'] },
  { name: 'Cinemo Riverside', distance: '3.8 km', tags: ['2D'], times: ['5:00 PM', '8:00 PM'] },
  { name: 'Cinemo Mall', distance: '6.1 km', tags: ['VIP', '2D'], times: ['6:15 PM', '9:00 PM'] },
];

export default function Showtimes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);
  const [selected, setSelected] = useState(0);

  const pick = (cinema: string, time: string) =>
    router.push({
      pathname: '/booking/seats',
      params: { id, cinema, time, date: `${days[selected].day} ${days[selected].date} Oct` },
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
              key={d.date}
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
                <Pressable
                  key={t}
                  onPress={() => pick(c.name, t)}
                  style={{
                    height: 40,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.red,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}