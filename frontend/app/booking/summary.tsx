import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import Poster from '../../src/components/Poster';
import HoldTimer from '../../src/components/HoldTimer';
import { ApiError, Quote, getQuote } from '../../src/api/seats';

// Display prices. The server uses the same ids and sets the real price.
const snacks = [
  { id: 'popcorn', name: 'Popcorn combo', desc: 'Large popcorn + 2 drinks', price: 400 },
  { id: 'nachos', name: 'Nachos', desc: 'With cheese dip', price: 300 },
  { id: 'soda', name: 'Soda', desc: 'Medium', price: 200 },
];

const etb = (n: number) => `${Math.round(n)} ETB`;

const pickSnacks = (qty: Record<string, number>) =>
  Object.fromEntries(Object.entries(qty).filter(([, n]) => n > 0));

export default function Summary() {
  const { id, cinema, date, time, seats, showtimeId, expiresAt } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    seats: string;
    showtimeId?: string;
    expiresAt?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);
  const showtime = showtimeId ?? '1';
  const seatList = seats ? seats.split(',') : [];

  const [qty, setQty] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(0);

  // Ask the server for the price whenever snacks or the promo code change.
  useEffect(() => {
    const run = ++latest.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = await getQuote(showtime, pickSnacks(qty), promo);
        if (run !== latest.current) return;
        setQuote(q);
        setError('');
      } catch (e) {
        if (run !== latest.current) return;
        setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
      } finally {
        if (run === latest.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [qty, promo, showtime]);

  const change = (snackId: string, delta: number) =>
    setQty((prev) => ({ ...prev, [snackId]: Math.max(0, (prev[snackId] ?? 0) + delta) }));

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    try {
      await getQuote(showtime, pickSnacks(qty), code);
      setPromo(code);
      setPromoError('');
    } catch (e) {
      setPromo('');
      setPromoError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
    }
  };

  const removePromo = () => {
    setPromo('');
    setPromoInput('');
    setPromoError('');
  };

  const backToSeats = () =>
    router.replace({
      pathname: '/booking/seats',
      params: { id, cinema, date, time, showtimeId },
    });

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

      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <HoldTimer expiresAt={expiresAt} onExpire={backToSeats} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 }}>
          <Poster movie={movie} style={{ width: 56, height: 80, borderRadius: 10 }} />
          <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{movie?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{cinema}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {date} · {time}
            </Text>
            <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Seats {seatList.join(', ')}</Text>
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
                  {s.desc} · {etb(s.price)}
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

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Promo code</Text>
        {promo ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.red,
              paddingHorizontal: 14,
              height: 52,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
              {promo}
              {quote?.promo ? ` · ${quote.promo.label}` : ''}
            </Text>
            <Pressable onPress={removePromo}>
              <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '800' }}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={promoInput}
                onChangeText={(v) => {
                  setPromoInput(v);
                  setPromoError('');
                }}
                placeholder="Enter code"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: promoError ? colors.red : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: 15,
                  paddingHorizontal: 14,
                }}
              />
              <Pressable
                onPress={applyPromo}
                disabled={!promoInput.trim()}
                style={{
                  height: 52,
                  paddingHorizontal: 22,
                  borderRadius: 14,
                  backgroundColor: promoInput.trim() ? colors.red : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Apply</Text>
              </Pressable>
            </View>
            {promoError ? <Text style={{ color: colors.redText, fontSize: 12 }}>{promoError}</Text> : null}
          </View>
        )}

        {error ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.redText, fontSize: 13 }}>{error}</Text>
            <Pressable
              onPress={backToSeats}
              style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: colors.redText, fontWeight: '800' }}>Select seats again</Text>
            </Pressable>
          </View>
        ) : null}

        {quote ? (
          <View style={{ gap: 8, opacity: loading ? 0.5 : 1 }}>
            {quote.lines.map((l) => (
              <Row key={l.label} label={`${l.label} (${l.qty} × ${etb(l.unit_etb)})`} value={etb(l.total_etb)} />
            ))}
            {quote.discount_etb > 0 ? (
              <Row label={`Discount (${quote.promo?.code ?? ''})`} value={`-${etb(quote.discount_etb)}`} negative />
            ) : null}
            <Row label="Booking fee" value={etb(quote.fee_etb)} />
          </View>
        ) : null}
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
          {quote ? (
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', opacity: loading ? 0.5 : 1 }}>
              {etb(quote.total_etb)}
            </Text>
          ) : (
            <ActivityIndicator color={colors.red} />
          )}
        </View>
        <Pressable
          disabled={!quote || loading || !!error}
          onPress={() =>
            router.push({
              pathname: '/booking/payment',
              params: {
                id,
                cinema,
                date,
                time,
                seats,
                showtimeId: showtime,
                expiresAt,
                total: String(quote?.total_etb ?? 0),
                snacks: JSON.stringify(pickSnacks(qty)),
                promo,
              },
            })
          }
          style={{
            height: 52,
            paddingHorizontal: 28,
            borderRadius: 14,
            backgroundColor: !quote || loading || error ? colors.border : colors.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Go to payment</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: negative ? colors.redText : colors.text, fontSize: 14 }}>{value}</Text>
    </View>
  );
}