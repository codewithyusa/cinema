import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { Movie } from '../types';

export default function MovieCard({ movie }: { movie: Movie }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/movie/${movie.id}`)} style={{ width: 110 }}>
      <View style={{ height: 154, borderRadius: 14, backgroundColor: movie.color }}>
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: colors.gold,
            borderRadius: 4,
            paddingHorizontal: 5,
            paddingVertical: 1,
          }}
        >
          <Text style={{ color: colors.bg, fontSize: 11, fontWeight: '800' }}>{movie.rating}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8 }}>
        {movie.title}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{movie.genre}</Text>
    </Pressable>
  );
}