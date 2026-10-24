import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { signOut, useAuth } from '../../src/store/authStore';
import { getTickets } from '../../src/store/tickets';
import { getProfile, saveProfile, Profile as ProfileData } from '../../src/store/profile';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getTickets(user.email).then((t) => setTicketCount(t.length));
        getProfile(user.email).then(setProfile);
      } else {
        setTicketCount(0);
        setProfile({});
      }
    }, [user?.email])
  );

  const defaultName = user?.email.split('@')[0] ?? 'Guest';
  const name = profile.name?.trim() || defaultName;
  const initial = name.charAt(0).toUpperCase();

  const pickPhoto = async () => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const photo = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setProfile(await saveProfile(user.email, { photo }));
    } catch {}
  };

  const removePhoto = async () => {
    if (!user) return;
    setProfile(await saveProfile(user.email, { photo: undefined }));
  };

  const startEdit = () => {
    setDraft(profile.name ?? '');
    setEditing(true);
  };

  const saveName = async () => {
    if (!user) return;
    setProfile(await saveProfile(user.email, { name: draft.trim() }));
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>Profile</Text>

        <View style={{ alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 22, padding: 24 }}>
          <Pressable onPress={pickPhoto}>
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: colors.red,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {profile.photo ? (
                <Image source={{ uri: profile.photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 38, fontWeight: '800' }}>{initial}</Text>
              )}
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={pickPhoto}>
              <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>
                {profile.photo ? 'Change photo' : 'Add photo'}
              </Text>
            </Pressable>
            {profile.photo ? (
              <Pressable onPress={removePhoto}>
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>

          {editing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                maxLength={24}
                autoFocus
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: 16,
                  paddingHorizontal: 12,
                }}
              />
              <Pressable
                onPress={saveName}
                style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEdit} style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{name}</Text>
              <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Edit name</Text>
            </Pressable>
          )}

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