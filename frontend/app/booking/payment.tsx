import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import HoldTimer from '../../src/components/HoldTimer';
import { ApiError, Booking, createBooking, initializePayment, verifyPayment } from '../../src/api/seats';

type Method = 'online' | 'cash';

const methods: { id: Method; name: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'online', name: 'Pay online', desc: 'Telebirr, CBE Birr, M-Pesa or card', icon: 'card-outline' },
  { id: 'cash', name: 'Pay at cinema', desc: 'Pay at the counter before the show', icon: 'cash-outline' },
];

export default function Payment() {
  const { id, cinema, date, time, seats, total, showtimeId, expiresAt, snacks, promo } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    total: string;
    showtimeId?: string;
    expiresAt?: string;
    snacks?: string;
    promo?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);
  const showtime = showtimeId ?? '1';

  const [method, setMethod] = useState<Method>('online');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [payTotal, setPayTotal] = useState<number | null>(null);
  const [holdUntil, setHoldUntil] = useState<string | undefined>(expiresAt);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const waiting = !!txRef;
  const amount = Math.round(payTotal ?? (Number(total) || 0));

  const snackMap = useMemo<Record<string, number>>(() => {
    try {
      return snacks ? JSON.parse(snacks) : {};
    } catch {
      return {};
    }
  }, [snacks]);

  const onExpire = () => {
    // Never throw the customer out while a payment is being started or checked.
    if (loading || checking || waiting) return;
    router.replace({
      pathname: '/booking/seats',
      params: { id, cinema, date, time, showtimeId },
    });
  };

  const goToTicket = (b: Booking, how: string) =>
    router.replace({
      pathname: '/booking/ticket',
      params: {
        id,
        cinema,
        date,
        time,
        seats: b.seats.join(','),
        total: String(b.total_etb),
        code: b.code,
        method: how,
        paid: b.paid ? '1' : '0',
      },
    });

  const openCheckout = (url: string) => {
    Linking.openURL(url).catch(() => setInfo('Could not open the payment page. Tap "Open payment page".'));
  };

  // Online: the server prices the order and asks Chapa for a checkout link.
  const payOnline = async () => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await initializePayment(showtime, snackMap, promo);
      setTxRef(res.tx_ref);
      setCheckoutUrl(res.checkout_url);
      setPayTotal(res.total_etb);
      setHoldUntil(res.hold_expires_at);
      openCheckout(res.checkout_url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // Pay at the cinema: the seats are booked now and paid at the counter.
  const reserve = async () => {
    setLoading(true);
    setError('');
    try {
      const booking = await createBooking(showtime, 'cash', snackMap, promo);
      goToTicket(booking, 'cash');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // Asks the server whether the payment went through. The server asks Chapa.
  const check = async (auto: boolean) => {
    if (!txRef || checking) return;
    setChecking(true);
    if (!auto) {
      setError('');
      setInfo('');
    }
    try {
      const r = await verifyPayment(txRef);
      if (r.status === 'paid' && r.booking) {
        goToTicket(r.booking, 'chapa');
        return;
      }
      if (r.status === 'failed') {
        setError('The payment was not completed. Open the payment page to try again.');
      } else if (!auto) {
        setInfo('We have not received your payment yet. Finish paying, then tap again.');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
    } finally {
      setChecking(false);
    }
  };

  // When the customer comes back to the app, check the payment on their behalf.
  const checkRef = useRef(check);
  checkRef.current = check;
  useEffect(() => {
    if (!waiting) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRef.current(true);
    });
    return () => sub.remove();
  }, [waiting]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          disabled={loading || checking}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Payment</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <HoldTimer expiresAt={holdUntil} onExpire={onExpire} />
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

        {waiting ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 12 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Finish your payment</Text>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              Complete the payment on the payment page, then come back here. Your seats are held while you pay.
            </Text>
            <Pressable
              onPress={() => openCheckout(checkoutUrl)}
              style={{ height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: colors.redText, fontWeight: '800' }}>Open payment page</Text>
            </Pressable>
          </View>
        ) : (
          <>
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

            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14 }}>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
                {method === 'online'
                  ? 'You will pay on a secure payment page. Your card or wallet details never go through this app.'
                  : 'Your seats are reserved. Show your booking code at the counter and pay before the show starts.'}
              </Text>
            </View>
          </>
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
            paddingHorizontal: 20,
            backgroundColor: colors.surface,
          }}
        >
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            textAlign: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: colors.surface,
          }}
        >
          {info}
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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{amount} ETB</Text>
        </View>
        <Pressable
          onPress={waiting ? () => check(false) : method === 'online' ? payOnline : reserve}
          disabled={loading || checking}
          style={{
            height: 52,
            minWidth: 150,
            paddingHorizontal: 28,
            borderRadius: 14,
            backgroundColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading || checking ? 0.7 : 1,
          }}
        >
          {loading || checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {waiting ? 'I have paid' : method === 'online' ? `Pay ${amount} ETB` : 'Reserve'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}