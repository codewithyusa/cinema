import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function Verify() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72, gap: 24 }}>
      <View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>Confirm it's you</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>
          Enter the 6-digit code we sent to your phone.
        </Text>
      </View>

      <TextInput
        placeholder="000000"
        placeholderTextColor={colors.border}
        keyboardType="number-pad"
        maxLength={6}
        style={{
          height: 64,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: 12,
          textAlign: 'center',
        }}
      />

      <Pressable
        onPress={() => router.replace('/home')}
        style={{
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Verify</Text>
      </Pressable>
    </View>
  );
}