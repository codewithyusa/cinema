import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { createAccount } from '../../src/store/accounts';
import { saveProfile } from '../../src/store/profile';

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

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) return setError('Enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setError('');
    setLoading(true);
    const result = await createAccount(name, email, password);

    if (!result.ok) {
      setLoading(false);
      return setError(result.error);
    }

    await saveProfile(email.trim().toLowerCase(), { name: name.trim() });
    setLoading(false);
    router.push({ pathname: '/verify', params: { email: email.trim() } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 72, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>Create account</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>
          Sign up to book seats and keep your tickets.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Full name</Text>
        <TextInput
          style={input}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          maxLength={24}
          value={name}
          onChangeText={setName}
        />
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
          placeholder="At least 6 characters"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Confirm password</Text>
        <TextInput
          style={input}
          placeholder="Repeat password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
      </View>

      {error ? <Text style={{ color: colors.redText, fontSize: 13 }}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={loading}
        style={{
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Sign up</Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>Already have an account?</Text>
        <Pressable onPress={() => router.replace('/login')} hitSlop={10}>
          <Text style={{ color: colors.redText, fontSize: 14, fontWeight: '800' }}>Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}