import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { removeTicket, saveTicket } from '../../src/store/tickets';
import { notifyBooking } from '../../src/store/notifications';
import { useAuth } from '../../src/store/authStore';

const methodNames: Record<string, string> = {
  telebirr: 'Telebirr',
  mpesa: 'M-Pesa',
  card: 'Card',
  cash: 'Pay at cinema',
};

export default function Ticket() {
  const { id, cinema, date, time, seats, total, method, view } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    total: string;
    method: string;
    view?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const movie = getMovie(id);
  const [confirming, setConfirming] = useState(false);

  const isSavedView = view === '1';
  const isCash = method === 'cash';
  const amount = (Number(total) || 0).toFixed(2);
  const seatText = seats?.split(',').join(', ');
  const bookingCode = `YC-${id}-${(seats ?? '').replace(/,/g, '')}-${(time ?? '').replace(/\D/g, '')}`;
  const qrValue = JSON.stringify({ code: bookingCode, movie: id, cinema, date, time, seats });

  useEffect(() => {
    if (isSavedView || !user || !id || !seats) return;
    saveTicket(user.email, {
      code: bookingCode,
      id,
      cinema: cinema ?? '',
      date: date ?? '',
      time: time ?? '',
      seats,
      total: total ?? '0',
      method: method ?? '',
      createdAt: Date.now(),
    }).then((isNew) => {
      if (isNew) {
        notifyBooking(user.email, {
          movie: movie?.title ?? 'Your movie',
          cinema: cinema ?? '',
          date: date ?? '',
          time: time ?? '',
          seats: seats.split(',').join(', '),
        });
      }
    });
  }, [bookingCode, user?.email]);

  const cancelTicket = async () => {
    if (!user) return;
    await removeTicket(user.email, bookingCode);
    router.replace('/tickets');
  };

  const shareTicket = async () => {
    const message = [
      `🎬 ${movie?.title ?? 'Movie ticket'}`,
      `📍 ${cinema}`,
      `📅 ${date} · ${time}`,
      `💺 Seats: ${seatText}`,
      `🎟 Booking code: ${bookingCode}`,
      isCash ? `💵 To pay at cinema: $${amount}` : `✅ Paid: $${amount}`,
      '',
      'Booked with YUSA CINEMA',
    ].join('\n');

    try {
      await Share.share({ message });
    } catch {
      // Share menu was closed or failed. Nothing to do.
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        {isSavedView ? (
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Your ticket</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Saved on your phone</Text>
        </View>
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
            <Info label="Seats" value={seatText} />
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
            <Info label={isCash ? 'Payment' : 'Paid with'} value={methodNames[method ?? ''] ?? method} />
            <Info label={isCash ? 'To pay' : 'Total'} value={`$${amount}`} />
          </View>
        </View>

        <Pressable
          onPress={shareTicket}
          style={{
            height: 52,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Ionicons name="share-outline" size={18} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Share ticket</Text>
        </Pressable>

        {isSavedView ? (
          confirming ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 12 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Cancel this ticket?</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                The ticket will be removed from your phone. This cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setConfirming(false)}
                  style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Keep ticket</Text>
                </Pressable>
                <Pressable
                  onPress={cancelTicket}
                  style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Yes, cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirming(true)}
              style={{
                height: 52,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.red,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.redText} />
              <Text style={{ color: colors.redText, fontSize: 16, fontWeight: '800' }}>Cancel ticket</Text>
            </Pressable>
          )
        ) : null}
      </ScrollView>

      {!isSavedView ? (
        <View style={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
          <Pressable
            onPress={() => router.replace('/home')}
            style={{ height: 52, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Back to home</Text>
          </Pressable>
        </View>
      ) : null}
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