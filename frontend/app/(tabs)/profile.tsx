import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { signOut, useAuth } from '../../src/store/authStore';
import { getTickets } from '../../src/store/tickets';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (user) getTickets(user.email).then((t) => setTicketCount(t.length));
      else setTicketCount(0);
    }, [user?.email])
  );

  const name = user?.email.split('@')[0] ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>Profile</Text>

        <View style={{ alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 22, padding: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.red,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>{initial}</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{name}</Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{user?.email}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="Tickets" value={String(ticketCount)} />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
          <MenuItem icon="ticket-outline" label="My tickets" onPress={() => router.push('/tickets')} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
          <MenuItem icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} last />
        </View>

        <Pressable
          onPress={handleSignOut}
          style={{
            height: 52,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.redText} />
          <Text style={{ color: colors.redText, fontSize: 16, fontWeight: '800' }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 16, alignItems: 'center', gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: 56,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}