import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import HoldTimer from '../../src/components/HoldTimer';
import { ApiError, createBooking } from '../../src/api/seats';

type Method = 'telebirr' | 'card' | 'cash';

const methods: { id: Method; name: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'telebirr', name: 'Telebirr', desc: 'Pay with your phone number', icon: 'phone-portrait-outline' },
  { id: 'card', name: 'Credit / Debit card', desc: 'Visa, Mastercard', icon: 'card-outline' },
  { id: 'cash', name: 'Pay at cinema', desc: 'Pay at the counter before the show', icon: 'cash-outline' },
];

const inputStyle = {
  height: 50,
  borderRadius: 12,
  backgroundColor: colors.bg,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: 14,
  color: colors.text,
  fontSize: 15,
} as const;

export default function Payment() {
  const { id, cinema, date, time, seats, total, showtimeId, expiresAt } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    total: string;
    showtimeId?: string;
    expiresAt?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);

  const [method, setMethod] = useState<Method>('telebirr');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = Number(total) || 0;

  const onExpire = () => {
    // Do not interrupt a payment that is already being processed.
    if (loading) return;
    router.replace({
      pathname: '/booking/seats',
      params: { id, cinema, date, time, showtimeId },
    });
  };

  const validate = () => {
    if (method === 'telebirr' && !/^(\+251|0)?9\d{8}$/.test(phone.replace(/\s/g, ''))) {
      return 'Enter a valid phone number, for example 0912345678';
    }
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return 'Enter a valid 16 digit card number';
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Expiry must look like 08/28';
      if (cvv.length < 3) return 'Enter the 3 digit CVV';
    }
    return '';
  };

  const pay = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;

    setLoading(true);
    try {
      // Card details stay on the phone. Only the payment method goes to the server.
      const booking = await createBooking(showtimeId ?? '1', method);
      router.replace({
        pathname: '/booking/ticket',
        params: {
          id,
          cinema,
          date,
          time,
          seats: booking.seats.join(','),
          total: String(amount),
          code: booking.code,
          method,
          paid: booking.paid ? '1' : '0',
        },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          disabled={loading}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Payment</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <HoldTimer expiresAt={expiresAt} onExpire={onExpire} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
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
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  setMethod(m.id);
                  setError('');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: active ? colors.red : colors.border,
                }}
              >
                <Ionicons name={m.icon} size={24} color={active ? colors.red : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{m.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{m.desc}</Text>
                </View>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.red : colors.muted} />
              </Pressable>
            );
          })}
        </View>

        {method === 'telebirr' && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 10 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Telebirr phone number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="09 1234 5678"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </View>
        )}

        {method === 'card' && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 10 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Card number</Text>
            <TextInput
              value={cardNumber}
              onChangeText={(t) =>
                setCardNumber(
                  t
                    .replace(/\D/g, '')
                    .slice(0, 16)
                    .replace(/(.{4})/g, '$1 ')
                    .trim()
                )
              }
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={inputStyle}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Expiry</Text>
                <TextInput
                  value={expiry}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '').slice(0, 4);
                    setExpiry(d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d);
                  }}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>CVV</Text>
                <TextInput
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  secureTextEntry
                  style={inputStyle}
                />
              </View>
            </View>
          </View>
        )}

        {method === 'cash' && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14 }}>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              Your seats are reserved. Show your booking code at the counter and pay before the show starts.
            </Text>
          </View>
        )}
      </ScrollView>

      {error ? (
        <Text
          style={{
            color: colors.redText,
            fontSize: 13,
            fontWeight: '700',
            textAlign: 'center',
            paddingVertical: 10,
            backgroundColor: colors.surface,
          }}
        >
          {error}
        </Text>
      ) : null}

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
          disabled={loading}
          style={{
            height: 52,
            minWidth: 150,
            paddingHorizontal: 28,
            borderRadius: 14,
            backgroundColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {method === 'cash' ? 'Reserve' : `Pay $${amount.toFixed(2)}`}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}