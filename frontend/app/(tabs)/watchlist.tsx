import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { getWatchlist, toggleWatchlist } from '../../src/store/watchlist';
import { useAuth } from '../../src/store/authStore';

export default function Watchlist() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) getWatchlist(user.email).then(setIds);
      else setIds([]);
    }, [user?.email])
  );

  const remove = async (id: string) => {
    if (!user) return;
    setIds(await toggleWatchlist(user.email, id));
  };

  const movies: any[] = ids.map((id) => getMovie(id)).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>Watchlist</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Movies you want to see</Text>
      </View>

      {movies.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ionicons name="heart-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Your watchlist is empty.</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Tap the heart on a movie to save it.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          {movies.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/movie/${m.id}`)}
              style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 }}
            >
              <View style={{ width: 56, height: 80, borderRadius: 10, backgroundColor: m.color ?? colors.border }} />
              <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{m.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {[m.genre, m.duration].filter(Boolean).join(' · ')}
                </Text>
                {m.rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={13} color="#F5C518" />
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{m.rating}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={() => remove(m.id)} hitSlop={10} style={{ justifyContent: 'center' }}>
                <Ionicons name="heart" size={24} color={colors.red} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}