import { ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovies } from '../../src/api/movies';
import MovieCard from '../../src/components/MovieCard';
import Poster from '../../src/components/Poster';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
  const hero = movies[0];

  const topRated = useMemo(
    () => [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [movies]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, gap: 24 }}
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

      <Pressable onPress={() => router.push(`/movie/${hero.id}`)} style={{ marginHorizontal: 20 }}>
        <Poster movie={hero} style={{ height: 220, borderRadius: 20, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', padding: 20 }}>
            <Text style={{ color: colors.redText, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
              NOW SHOWING
            </Text>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800' }}>{hero.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {hero.genre} · {hero.duration} · {hero.rating} rating
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
    </ScrollView>
  );
}