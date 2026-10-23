import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '../src/components/Icon';
import { colors } from '../src/theme/colors';
import { useAuth } from '../src/store/authStore';
import { getInbox, InboxItem } from '../src/store/notifications';

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) getInbox(user.email).then(setItems);
    }, [user])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Notifications</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(n, i) => `${n.id}-${i}`}
        contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Ionicons name="notifications-outline" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 15 }}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{item.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}