import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { ApiError, SeatGrid, getSeats, holdSeats, releaseSeats } from '../../src/api/seats';

const GOLD = '#F5C518';
const MAX_SEATS = 6;

export default function Seats() {
  const { id, cinema, date, time, showtimeId: showtimeParam } = useLocalSearchParams<{
    id: string;
    cinema: string;
    date: string;
    time: string;
    showtimeId?: string;
  }>();
  const showtimeId = showtimeParam ?? '1';

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie = getMovie(id);

  const [grid, setGrid] = useState<SeatGrid | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getSeats(showtimeId);
      const status: Record<string, string> = {};
      const mine: string[] = [];
      data.rows.forEach((r) =>
        r.seats.forEach((s) => {
          status[s.id] = s.status;
          if (s.status === 'mine') mine.push(s.id);
        })
      );
      setGrid(data);
      // keep picks that are still available, plus seats this user already holds
      setSelected((prev) => {
        const next = new Set(prev.filter((s) => status[s] === 'free' || status[s] === 'mine'));
        mine.forEach((s) => next.add(s));
        return [...next];
      });
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const vipSeats = useMemo(() => {
    const set = new Set<string>();
    grid?.rows.forEach((r) => r.seats.forEach((s) => s.vip && set.add(s.id)));
    return set;
  }, [grid]);

  const toggle = (seat: string, status: string) => {
    if (status !== 'free' && status !== 'mine') return;
    setSelected((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : prev.length < MAX_SEATS ? [...prev, seat] : prev
    );
  };

  const onBack = async () => {
    try {
      await releaseSeats(showtimeId);
    } catch {}
    router.back();
  };

  const onContinue = async () => {
    setHolding(true);
    setError('');
    try {
      const hold = await holdSeats(showtimeId, selected);
      router.push({
        pathname: '/booking/summary',
        params: {
          id,
          cinema,
          date,
          time,
          showtimeId,
          seats: selected.join(','),
          expiresAt: hold.expires_at,
        },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server.');
      await load();
    } finally {
      setHolding(false);
    }
  };

  const price = grid?.price_etb ?? 0;
  const vipPrice = grid?.vip_price_etb ?? 0;
  const total = selected.reduce((sum, s) => sum + (vipSeats.has(s) ? vipPrice : price), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={onBack}
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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      ) : !grid ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <Text style={{ color: colors.redText, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            style={{ height: 48, paddingHorizontal: 28, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center', gap: 24 }}>
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={{ width: '80%', height: 6, borderRadius: 3, backgroundColor: colors.red }} />
            <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 3, marginTop: 6 }}>SCREEN</Text>
          </View>

          <View style={{ gap: 8 }}>
            {grid.rows.map((row) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ width: 16, color: colors.muted, fontSize: 11, fontWeight: '700' }}>{row.label}</Text>
                {row.seats.map((s, i) => {
                  const isSelected = selected.includes(s.id);
                  const isTaken = s.status !== 'free' && s.status !== 'mine';
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggle(s.id, s.status)}
                      disabled={isTaken}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        marginRight: i === Math.floor(row.seats.length / 2) - 1 ? 14 : 0,
                        backgroundColor: isSelected ? colors.red : isTaken ? colors.bg : colors.border,
                        borderWidth: 1,
                        borderStyle: isTaken ? 'dashed' : 'solid',
                        borderColor: isSelected ? colors.red : s.vip && !isTaken ? GOLD : colors.muted,
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Available', bg: colors.border, border: colors.muted, dashed: false },
              { label: 'Selected', bg: colors.red, border: colors.red, dashed: false },
              { label: 'Taken', bg: colors.bg, border: colors.muted, dashed: true },
              { label: 'VIP', bg: colors.border, border: GOLD, dashed: false },
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

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Regular</Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{price} ETB</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: GOLD }}>
              <Text style={{ color: GOLD, fontSize: 12 }}>VIP (last row)</Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{vipPrice} ETB</Text>
            </View>
          </View>

          {error ? <Text style={{ color: colors.redText, fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}
        </ScrollView>
      )}

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
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
            {selected.length ? `${selected.length} seat${selected.length > 1 ? 's' : ''} · ${selected.join(', ')}` : 'No seats selected'}
          </Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{total} ETB</Text>
        </View>
        <Pressable
          disabled={!selected.length || holding}
          onPress={onContinue}
          style={{
            height: 52,
            paddingHorizontal: 32,
            borderRadius: 14,
            backgroundColor: selected.length && !holding ? colors.red : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {holding ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Continue</Text>}
        </Pressable>
      </View>
    </View>
  );
}