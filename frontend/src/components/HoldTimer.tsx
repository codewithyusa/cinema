import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { expiresAt?: string; onExpire: () => void };

export default function HoldTimer({ expiresAt, onExpire }: Props) {
  const end = expiresAt ? new Date(expiresAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((end - Date.now()) / 1000)));
  const expireRef = useRef(onExpire);
  const firedRef = useRef(false);
  expireRef.current = onExpire;

  useEffect(() => {
    if (!end) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !firedRef.current) {
        firedRef.current = true;
        expireRef.current();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end]);

  if (!end) return null;
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');
  const low = left <= 60;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 13 }}>Seats held for</Text>
      <Text style={{ color: low ? colors.redText : colors.text, fontSize: 15, fontWeight: '800' }}>
        {m}:{s}
      </Text>
    </View>
  );
}