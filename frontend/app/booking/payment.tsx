import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

const methods = [
  { id: 'telebirr', name: 'Telebirr', desc: 'Pay with your mobile wallet', icon: 'phone-portrait-outline' },
  { id: 'mpesa', name: 'M-Pesa', desc: 'Pay with M-Pesa', icon: 'cash-outline' },
  { id: 'card', name: 'Card', desc: 'Visa or Mastercard', icon: 'card-outline' },
] as const;

export default function Payment() {
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
  const [method, setMethod] = useState<string>('telebirr');
  const [paying, setPaying] = useState(false);

  const amount = Number(total) || 0;

  const pay = () => {
    if (paying) return;
    setPaying(true);
    // Mock payment. Replace with a real call to your backend (create payment, then confirm via webhook).
    setTimeout(() => {
      setPaying(false);
      router.replace({
        pathname: '/booking/ticket',
        params: { id, cinema, date, time, seats, total: String(amount), method },
      });
    }, 1800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          disabled={paying}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 3 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{movie?.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{cinema}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {date} · {time}
          </Text>
          <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Seats {seats?.split(',').join(', ')}</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Payment method</Text>
        <View style={{ gap: 10 }}>
          {methods.map((m) => {
            const selected = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                disabled={paying}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.red : colors.border,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={m.icon} size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{m.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{m.desc}</Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.red : colors.muted}
                />
              </Pressable>
            );
          })}
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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>${amount.toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={pay}
          disabled={paying}
          style={{
            height: 52,
            minWidth: 150,
            paddingHorizontal: 28,
            borderRadius: 14,
            backgroundColor: colors.red,
            opacity: paying ? 0.7 : 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Pay now</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}