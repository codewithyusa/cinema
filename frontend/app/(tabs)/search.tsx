import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovies } from '../../src/api/movies';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movies: any[] = getMovies();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return movies;
    return movies.filter(
      (m) => m.title?.toLowerCase().includes(q) || m.genre?.toLowerCase().includes(q)
    );
  }, [query, movies]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>Search</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 52,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search movies or genres"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ionicons name="film-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>No movies found for "{query}"</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          {results.map((m) => (
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
              <View style={{ justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}