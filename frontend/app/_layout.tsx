import { useEffect } from 'react';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { colors } from '../src/theme/colors';
import { loadUser, useAuth } from '../src/store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { user, ready } = useAuth();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!ready || !navState?.key) return;
    const inAuth = segments[0] === '(auth)';
    const atSplash = segments.length === 0;
    const atOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuth && !atSplash && !atOnboarding) {
      router.replace('/');
    } else if (user && (inAuth || atSplash || atOnboarding)) {
      router.replace('/home');
    }
  }, [user, ready, segments, navState?.key]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}