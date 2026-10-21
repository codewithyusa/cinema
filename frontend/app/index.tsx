import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme/colors';

export default function Splash() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 28, paddingBottom: 40 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            backgroundColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800' }}>Y</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 40, fontWeight: '800' }}>YUSA CINEMA</Text>
        <Text style={{ color: colors.muted, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
          Pick a film, choose your seats,{'\n'}walk straight in.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/login')}
        style={{
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Get started</Text>
      </Pressable>
    </View>
  );
}