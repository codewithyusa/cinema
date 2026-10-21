import { Text } from 'react-native'; export default function S() { return <Text>screen</Text>; }
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

const FEE = 1.5;

const snacks = [
  { id: 'popcorn', name: 'Popcorn combo', desc: 'Large popcorn + 2 drinks', price: 8 },
  { id: 'nachos', name: 'Nachos', desc: 'With cheese dip', price: 6 },
  { id: 'soda', name: 'Soda', desc: 'Medium', price: 4 },
];

export default function Summary() {
  const { id, cinema, date, time, seats, total } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    total: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);
  const [qty, setQty] = useState<Record<string, number>>({});

  const change = (snackId: string, delta: number) =>
    setQty((prev) => ({ ...prev, [snackId]: Math.max(0, (prev[snackId] ?? 0) + delta) }));

  const tickets = Number(total) || 0;
  const snackTotal = snacks.reduce((sum, s) => sum + s.price * (qty[s.id] ?? 0), 0);
  const grandTotal = tickets + snackTotal + FEE;
  const seatCount = seats ? seats.split(',').length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Order summary</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 }}>
          <View style={{ width: 56, height: 80, borderRadius: 10, backgroundColor: movie?.color ?? colors.border }} />
          <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{movie?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{cinema}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {date} · {time}
            </Text>
            <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Seats {seats?.split(',').join(', ')}</Text>
          </View>
        </View>

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Add snacks</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
          {snacks.map((s, i) => (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 64,
                borderBottomWidth: i < snacks.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{s.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {s.desc} · ${s.price.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => change(s.id, -1)}
                  style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </Pressable>
                <Text style={{ color: colors.text, fontWeight: '800', width: 14, textAlign: 'center' }}>{qty[s.id] ?? 0}</Text>
                <Pressable
                  onPress={() => change(s.id, 1)}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Row label={`Tickets (${seatCount})`} value={tickets} />
          <Row label="Snacks" value={snackTotal} />
          <Row label="Booking fee" value={FEE} />
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
          <Text style={{ color: colors.muted, fontSize: 13 }}>Total</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>${grandTotal.toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/booking/payment',
              params: { id, cinema, date, time, seats, total: String(grandTotal) },
            })
          }
          style={{ height: 52, paddingHorizontal: 28, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Go to payment</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14 }}>${value.toFixed(2)}</Text>
    </View>
  );
}