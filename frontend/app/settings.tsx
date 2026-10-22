import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { signOut, useAuth } from '../src/store/authStore';
import { getSettings, saveSettings, Settings } from '../src/store/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({ notifications: true, reminders: true });
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const clearInbox = async () => {
    if (!user) return;
    try {
      await AsyncStorage.removeItem(`yusa_inbox_${user.email}`);
    } catch {}
    setCleared(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>NOTIFICATIONS</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
          <ToggleRow
            title="Booking notifications"
            desc="Get a message when your booking is confirmed"
            value={settings.notifications}
            onChange={(v) => update({ notifications: v })}
          />
          <ToggleRow
            title="Showtime reminders"
            desc="Reminder 1 hour before your movie"
            value={settings.reminders}
            onChange={(v) => update({ reminders: v })}
            last
          />
        </View>

        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>DATA</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
          <Pressable
            onPress={clearInbox}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: 60 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.text} />
            <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' }}>
              Clear notification history
            </Text>
            {cleared ? <Text style={{ color: colors.muted, fontSize: 13 }}>Cleared</Text> : null}
          </Pressable>
        </View>

        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>ABOUT</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
          <InfoRow label="App" value="YUSA CINEMA" />
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Signed in as" value={user?.email ?? '-'} last />
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

function ToggleRow({
  title,
  desc,
  value,
  onChange,
  last,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 68,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.red }}
        thumbColor="#fff"
      />
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 52,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}