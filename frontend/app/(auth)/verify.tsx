import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { signIn } from '../../src/store/authStore';

export default function Verify() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    await signIn(email ?? '');
    router.replace('/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72, gap: 24 }}>
      <View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>Confirm it's you</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>
          Enter the 6-digit code we sent to {email || 'your email'}.
        </Text>
      </View>

      <TextInput
        placeholder="000000"
        placeholderTextColor={colors.border}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
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

      {error ? <Text style={{ color: colors.redText, fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}

      <Pressable
        onPress={submit}
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