import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovies } from '../../src/api/movies';
import Poster from '../../src/components/Poster';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movies = getMovies();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');

  const genres = useMemo(() => ['All', ...Array.from(new Set(movies.map((m) => m.genre)))], [movies]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movies.filter((m) => {
      const matchGenre = genre === 'All' || m.genre === genre;
      const matchQuery =
        !q || m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q);
      return matchGenre && matchQuery;
    });
  }, [query, genre, movies]);

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

      <View style={{ height: 52, marginTop: 14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, alignItems: 'center' }}
        >
          {genres.map((g) => {
            const active = g === genre;
            return (
              <Pressable
                key={g}
                onPress={() => setGenre(g)}
                style={{
                  height: 38,
                  paddingHorizontal: 16,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.red : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.red : colors.border,
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontSize: 14, fontWeight: '700' }}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Ionicons name="film-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>
            {query ? `No movies found for "${query}"` : 'No movies in this genre'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          {results.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/movie/${m.id}`)}
              style={{ flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 }}
            >
              <Poster movie={m} style={{ width: 56, height: 80, borderRadius: 10 }} />
              <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{m.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {[m.genre, m.duration].filter(Boolean).join(' · ')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={13} color="#F5C518" />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{m.rating}</Text>
                </View>
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