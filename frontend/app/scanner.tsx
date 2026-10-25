import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { getMovie } from '../src/api/movies';

type Result = {
  status: 'valid' | 'used' | 'invalid';
  code?: string;
  title?: string;
  cinema?: string;
  date?: string;
  time?: string;
  seats?: string;
};

// Codes scanned in this session. Resets when the app restarts.
const usedCodes = new Set<string>();

function checkTicket(raw: string): Result {
  try {
    const data = JSON.parse(raw);
    if (typeof data?.code !== 'string' || !data.code.startsWith('YC-')) return { status: 'invalid' };

    const movie = getMovie(String(data.movie));
    if (!movie) return { status: 'invalid' };

    const info = {
      code: data.code,
      title: movie.title,
      cinema: data.cinema,
      date: data.date,
      time: data.time,
      seats: typeof data.seats === 'string' ? data.seats.split(',').join(', ') : '',
    };

    if (usedCodes.has(data.code)) return { status: 'used', ...info };
    usedCodes.add(data.code);
    return { status: 'valid', ...info };
  } catch {
    return { status: 'invalid' };
  }
}

const banner = {
  valid: { color: '#22C55E', mark: '✓', text: 'Valid ticket' },
  used: { color: '#F59E0B', mark: '!', text: 'Already used' },
  invalid: { color: '#EF4444', mark: '✕', text: 'Invalid ticket' },
} as const;

export default function Scanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<Result | null>(null);
  const locked = useRef(false);

  const onScan = ({ data }: { data: string }) => {
    if (locked.current) return;
    locked.current = true;
    setResult(checkTicket(data));
  };

  const scanNext = () => {
    locked.current = false;
    setResult(null);
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: insets.top + 12 }}>
      <Pressable
        onPress={() => router.back()}
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Ticket scanner</Text>
    </View>
  );

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}>{header}</View>;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
            Camera access is needed to scan tickets
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{ height: 50, paddingHorizontal: 28, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Allow camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const b = result ? banner[result.status] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}

      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <View style={{ flex: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={result ? undefined : onScan}
          />
          {!result ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 220, height: 220, borderRadius: 20, borderWidth: 3, borderColor: '#fff' }} />
            </View>
          ) : null}
        </View>

        {result && b ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 12, borderWidth: 2, borderColor: b.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: b.color, fontSize: 26, fontWeight: '800' }}>{b.mark}</Text>
              <Text style={{ color: b.color, fontSize: 20, fontWeight: '800' }}>{b.text}</Text>
            </View>

            {result.status !== 'invalid' ? (
              <View style={{ gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{result.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{result.cinema}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {result.date} · {result.time}
                </Text>
                <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Seats {result.seats}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{result.code}</Text>
              </View>
            ) : (
              <Text style={{ color: colors.muted, fontSize: 13 }}>This QR code is not a YUSA CINEMA ticket.</Text>
            )}

            <Pressable
              onPress={scanNext}
              style={{ height: 50, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Scan next ticket</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', paddingBottom: insets.bottom + 8 }}>
            Point the camera at the ticket QR code
          </Text>
        )}
      </View>
    </View>
  );
}