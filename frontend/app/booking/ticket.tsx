import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { saveTicket } from '../../src/store/tickets';

const methodNames: Record<string, string> = {
  telebirr: 'Telebirr',
  mpesa: 'M-Pesa',
  card: 'Card',
};

export default function Ticket() {
  const { id, cinema, date, time, seats, total, method } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    total: string;
    method: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);

  const bookingCode = `YC-${id}-${(seats ?? '').replace(/,/g, '')}-${(time ?? '').replace(/\D/g, '')}`;
  const qrValue = JSON.stringify({ code: bookingCode, movie: id, cinema, date, time, seats });

  useEffect(() => {
    if (!id || !seats) return;
    saveTicket({
      code: bookingCode,
      id,
      cinema: cinema ?? '',
      date: date ?? '',
      time: time ?? '',
      seats,
      total: total ?? '0',
      method: method ?? '',
      createdAt: Date.now(),
    });
  }, [bookingCode]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Your ticket</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Saved on your phone</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 22, padding: 20, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{movie?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{cinema}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Info label="Date" value={date} />
            <Info label="Time" value={time} />
            <Info label="Seats" value={seats?.split(',').join(', ')} />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
              <QRCode value={qrValue} size={200} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Show this code at the cinema entrance</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', letterSpacing: 1 }}>{bookingCode}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Info label="Paid with" value={methodNames[method ?? ''] ?? method} />
            <Info label="Total" value={`$${(Number(total) || 0).toFixed(2)}`} />
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={() => router.replace('/')}
          style={{ height: 52, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Back to home</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}