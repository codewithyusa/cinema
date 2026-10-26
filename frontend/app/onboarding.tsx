import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

// Where to go when onboarding ends.
const NEXT_ROUTE = '/login';

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
const TAKEN = new Set(['A3', 'A4', 'B6', 'C1', 'C2', 'D5', 'D6', 'E7']);
const SELECTED = new Set(['C4', 'C5']);

const QR_SIZE = 15;
const qrCells = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const x = i % QR_SIZE;
  const y = Math.floor(i / QR_SIZE);
  const corners = [
    [0, 0],
    [QR_SIZE - 5, 0],
    [0, QR_SIZE - 5],
  ];
  for (const [cx, cy] of corners) {
    if (x >= cx && x < cx + 5 && y >= cy && y < cy + 5) {
      const fx = x - cx;
      const fy = y - cy;
      return fx === 0 || fy === 0 || fx === 4 || fy === 4 || (fx === 2 && fy === 2);
    }
  }
  return (x * 73 + y * 151 + x * y * 31) % 7 < 3;
});

const slides = [
  {
    title: 'Find your next movie',
    text: 'Browse what is showing, search by title and filter by genre.',
  },
  {
    title: 'Pick your perfect seat',
    text: 'See which seats are taken for every showtime and choose where you sit.',
  },
  {
    title: 'Show your QR, walk straight in',
    text: 'Your ticket is saved on your phone and ready at the entrance.',
  },
];

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <View
      style={{
        height: 30,
        paddingHorizontal: 16,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors.red : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.red : colors.border,
      }}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function BrowseArt() {
  return (
    <View style={{ alignItems: 'center', gap: 22 }}>
      <View
        style={{
          width: 300,
          height: 46,
          borderRadius: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 14 }}>Search movies</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, width: 300 }}>
        <Chip label="All" active />
        <Chip label="Sci-fi" />
        <Chip label="Action" />
      </View>

      <View style={{ width: 300, height: 240 }}>
        <Image
          source={require('../assets/Oppenheimer.jpg')}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: 0,
            top: 34,
            width: 130,
            height: 180,
            borderRadius: 16,
            transform: [{ rotate: '-8deg' }],
          }}
        />
        <Image
          source={require('../assets/The Dark Knight.jpg')}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: 170,
            top: 34,
            width: 130,
            height: 180,
            borderRadius: 16,
            transform: [{ rotate: '8deg' }],
          }}
        />
        <View style={{ position: 'absolute', left: 80, top: 0, width: 140, height: 200 }}>
          <Image
            source={require('../assets/Dune Part Two.jpg')}
            resizeMode="cover"
            style={{ width: 140, height: 200, borderRadius: 18 }}
          />
          <View
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              height: 24,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.55)',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>★ 8.5</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SeatsArt() {
  return (
    <View style={{ alignItems: 'center', gap: 22 }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={{ width: 280, height: 5, borderRadius: 3, backgroundColor: colors.red }} />
        <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 3, fontWeight: '700' }}>SCREEN</Text>
      </View>

      <View style={{ gap: 10 }}>
        {SEAT_ROWS.map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
              const id = `${row}${n}`;
              const taken = TAKEN.has(id);
              const selected = SELECTED.has(id);
              return (
                <View
                  key={id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: selected ? colors.red : taken ? '#4A3F45' : colors.surface,
                    borderWidth: selected || taken ? 0 : 1,
                    borderColor: '#6B5560',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 18 }}>
        {[
          { label: 'Available', color: colors.surface, border: true },
          { label: 'Taken', color: '#4A3F45', border: false },
          { label: 'Selected', color: colors.red, border: false },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                backgroundColor: l.color,
                borderWidth: l.border ? 1 : 0,
                borderColor: '#6B5560',
              }}
            />
            <Text style={{ color: colors.muted, fontSize: 12 }}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TicketArt() {
  return (
    <View style={{ width: 300, backgroundColor: colors.surface, borderRadius: 22, padding: 20, gap: 14 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Interstellar</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Cinema Mall</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[
          ['Date', 'Wed 28 Oct'],
          ['Time', '9:00 PM'],
          ['Seats', 'A5'],
        ].map(([label, value]) => (
          <View key={label} style={{ gap: 2 }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: colors.border }} />

      <View style={{ alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: QR_SIZE * 9 + 24,
            padding: 12,
            borderRadius: 14,
            backgroundColor: '#fff',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          {qrCells.map((on, i) => (
            <View key={i} style={{ width: 9, height: 9, backgroundColor: on ? '#0B0809' : '#fff' }} />
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: 11 }}>Show this code at the cinema entrance</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const last = index === slides.length - 1;
  const finish = () => router.replace(NEXT_ROUTE as never);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Y</Text>
        </View>
        {!last ? (
          <Pressable onPress={finish} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '700' }}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ minHeight: 44 }} />
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {index === 0 ? <BrowseArt /> : null}
        {index === 1 ? <SeatsArt /> : null}
        {index === 2 ? <TicketArt /> : null}
      </View>

      <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', lineHeight: 35 }}>
        {slides[index].title}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }}>
        {slides[index].text}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 24 }}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? colors.red : colors.border,
            }}
          />
        ))}
      </View>

      <Pressable
        onPress={() => (last ? finish() : setIndex(index + 1))}
        style={{
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{last ? 'Get started' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}