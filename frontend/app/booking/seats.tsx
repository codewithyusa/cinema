import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

const PRICE = 12;
const MAX_SEATS = 6;
const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const taken = new Set(['A3', 'A4', 'B6', 'B7', 'C8', 'C9', 'C10', 'D2', 'D3', 'D5', 'E4', 'E5', 'E6', 'F9', 'F10', 'G1', 'G2', 'G7']);

export default function Seats() {
  const { id, cinema, date, time } = useLocalSearchParams<{ id: string; cinema: string; date: string; time: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (seat: string) => {
    if (taken.has(seat)) return;
    setSelected((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : prev.length < MAX_SEATS ? [...prev, seat] : prev
    );
  };

  const total = selected.length * PRICE;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Select seats</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
            {movie?.title} · {date} · {time}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center', gap: 24 }}>
        <View style={{ alignItems: 'center', width: '100%' }}>
          <View style={{ width: '80%', height: 6, borderRadius: 3, backgroundColor: colors.red }} />
          <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 3, marginTop: 6 }}>SCREEN</Text>
        </View>

        <View style={{ gap: 8 }}>
          {rows.map((row) => (
            <View key={row} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ width: 16, color: colors.muted, fontSize: 11, fontWeight: '700' }}>{row}</Text>
              {Array.from({ length: 10 }, (_, i) => {
                const seat = `${row}${i + 1}`;
                const isTaken = taken.has(seat);
                const isSelected = selected.includes(seat);
                return (
                  <Pressable
                    key={seat}
                    onPress={() => toggle(seat)}
                    disabled={isTaken}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      marginRight: i === 4 ? 14 : 0,
                      backgroundColor: isSelected ? colors.red : isTaken ? colors.bg : colors.border,
                      borderWidth: 1,
                      borderStyle: isTaken ? 'dashed' : 'solid',
                      borderColor: isSelected ? colors.red : colors.muted,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 20 }}>
          {[
            { label: 'Available', bg: colors.border, border: colors.muted, dashed: false },
            { label: 'Selected', bg: colors.red, border: colors.red, dashed: false },
            { label: 'Taken', bg: colors.bg, border: colors.muted, dashed: true },
          ].map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: l.bg,
                  borderWidth: 1,
                  borderColor: l.border,
                  borderStyle: l.dashed ? 'dashed' : 'solid',
                }}
              />
              <Text style={{ color: colors.muted, fontSize: 12 }}>{l.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          paddingBottom: insets.bottom + 20,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {selected.length ? `${selected.length} seat${selected.length > 1 ? 's' : ''} · ${selected.join(', ')}` : 'No seats selected'}
          </Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>${total.toFixed(2)}</Text>
        </View>
        <Pressable
          disabled={!selected.length}
          onPress={() =>
            router.push({
              pathname: '/booking/summary',
              params: { id, cinema, date, time, seats: selected.join(','), total: String(total) },
            })
          }
          style={{
            height: 52,
            paddingHorizontal: 32,
            borderRadius: 14,
            backgroundColor: selected.length ? colors.red : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}