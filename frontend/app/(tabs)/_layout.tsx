import { Tabs } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { colors } from '../../src/theme/colors';

// The tab bar passes the color as a type that can be empty, so the function
// accepts any value and falls back to the muted color.
const icon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: unknown; size: number }) => (
    <Ionicons name={name} size={size} color={typeof color === 'string' ? color : colors.muted} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.redText,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="tickets" options={{ title: 'Tickets', tabBarIcon: icon('ticket') }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist', tabBarIcon: icon('heart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}