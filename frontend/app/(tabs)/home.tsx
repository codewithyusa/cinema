import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovies } from '../../src/api/movies';
import MovieCard from '../../src/components/MovieCard';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movies = getMovies();
  const hero = movies[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, gap: 24 }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>Good evening</Text>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>What are we watching?</Text>
      </View>

      <Pressable
        onPress={() => router.push(`/movie/${hero.id}`)}
        style={{
          marginHorizontal: 20,
          height: 220,
          borderRadius: 20,
          backgroundColor: hero.color,
          justifyContent: 'flex-end',
          padding: 20,
        }}
      >
        <Text style={{ color: colors.redText, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
          NOW SHOWING
        </Text>
        <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800' }}>{hero.title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          {hero.genre} · {hero.duration} · {hero.rating} rating
        </Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', paddingHorizontal: 20 }}>
          Now showing
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}