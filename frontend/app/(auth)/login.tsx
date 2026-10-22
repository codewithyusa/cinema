import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

const input = {
  height: 52,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  color: colors.text,
  paddingHorizontal: 16,
  fontSize: 15,
} as const;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    router.push({ pathname: '/verify', params: { email: email.trim() } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72, gap: 20 }}>
      <View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>Welcome back</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>
          Sign in to book seats and see your tickets.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Email</Text>
        <TextInput
          style={input}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Password</Text>
        <TextInput
          style={input}
          placeholder="Enter password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text style={{ color: colors.redText, fontSize: 13 }}>{error}</Text> : null}

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
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Sign in</Text>
      </Pressable>
    </View>
  );
}