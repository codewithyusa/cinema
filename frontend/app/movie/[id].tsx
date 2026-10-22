import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';

export default function MovieDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const movie: any = getMovie(id);

  if (!movie) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text }}>Movie not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 320, backgroundColor: movie.color ?? colors.border, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: insets.top + 12,
              left: 20,
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={{ padding: 20, gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{movie.title}</Text>

          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            {movie.rating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={16} color="#F5C518" />
                <Text style={{ color: colors.text, fontWeight: '700' }}>{movie.rating}</Text>
              </View>
            ) : null}
            {movie.duration ? <Text style={{ color: colors.muted }}>{movie.duration}</Text> : null}
            {movie.genre ? <Text style={{ color: colors.muted }}>{movie.genre}</Text> : null}
          </View>

          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 6 }}>Story</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
            {movie.description ?? movie.overview ?? 'No description available yet.'}
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 20,
          paddingBottom: insets.bottom + 20,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.push({ pathname: '/booking/showtimes', params: { id } })}
          style={{ height: 52, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Book now</Text>
        </Pressable>
      </View>
    </View>
  );
}