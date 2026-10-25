import { ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getComingSoon, getMovies } from '../../src/api/movies';
import MovieCard from '../../src/components/MovieCard';
import Poster from '../../src/components/Poster';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function releaseLabel(days: number) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', paddingHorizontal: 20 }}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movies = getMovies();
  const upcoming = getComingSoon();
  const hero = movies[0];

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');

  const topRated = useMemo(
    () => [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [movies]
  );

  const genres = useMemo(() => ['All', ...Array.from(new Set(movies.map((m) => m.genre)))], [movies]);

  const isFiltering = query.trim().length > 0 || genre !== 'All';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movies.filter((m) => {
      const matchesGenre = genre === 'All' || m.genre === genre;
      const matchesQuery = !q || m.title.toLowerCase().includes(q);
      return matchesGenre && matchesQuery;
    });
  }, [movies, query, genre]);

  const clearFilters = () => {
    setQuery('');
    setGenre('All');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
        }}
      >
        <View>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{greeting()}</Text>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>What are we watching?</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.push('/scanner')}
            style={{
              height: 44,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Scan</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/notifications')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginHorizontal: 20,
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search movies"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          {genres.map((g) => {
            const active = genre === g;
            return (
              <Pressable
                key={g}
                onPress={() => setGenre(g)}
                style={{
                  height: 38,
                  paddingHorizontal: 18,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.red : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.red : colors.border,
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '700' }}>{g}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isFiltering ? (
        <View style={{ gap: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
            <Pressable onPress={clearFilters} hitSlop={10}>
              <Text style={{ color: colors.redText, fontSize: 13, fontWeight: '700' }}>Clear</Text>
            </Pressable>
          </View>

          {results.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
              {results.map((m) => (
                <MovieCard key={`result-${m.id}`} movie={m} />
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 6, paddingVertical: 40, paddingHorizontal: 20 }}>
              <Ionicons name="search-outline" size={36} color={colors.muted} />
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>No movies found</Text>
              <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
                Try a different title or genre.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <Pressable onPress={() => router.push(`/movie/${hero.id}`)} style={{ marginHorizontal: 20 }}>
            <Poster movie={hero} style={{ height: 220, borderRadius: 20, justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', padding: 20 }}>
                <Text style={{ color: colors.redText, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                  NOW SHOWING
                </Text>
                <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800' }}>{hero.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                  {hero.genre} · {hero.duration} · {hero.rating.toFixed(1)} rating
                </Text>
              </View>
            </Poster>
          </Pressable>

          <Section title="Now showing">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </Section>

          <Section title="Top rated">
            {topRated.map((m) => (
              <MovieCard key={`top-${m.id}`} movie={m} />
            ))}
          </Section>

          <Section title="Coming soon">
            {upcoming.map((m) => (
              <View key={m.id} style={{ width: 140, gap: 8 }}>
                <Poster movie={m} style={{ width: 140, height: 200, borderRadius: 16 }} />
                <View style={{ gap: 2 }}>
                  <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                    {m.title}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{m.genre}</Text>
                  <Text style={{ color: colors.redText, fontSize: 12, fontWeight: '700' }}>
                    Opens {releaseLabel(m.releaseInDays)}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        </>
      )}
    </ScrollView>
  );
}