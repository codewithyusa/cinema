import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { getWatchlist, toggleWatchlist } from '../../src/store/watchlist';
import { getReviews } from '../../src/store/reviews';
import { useAuth } from '../../src/store/authStore';
import Poster from '../../src/components/Poster';

export default function MovieDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const movie = getMovie(id);
  const [saved, setSaved] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [average, setAverage] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) getWatchlist(user.email).then((list) => setSaved(list.includes(id)));
  }, [user?.email, id]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getReviews(id).then((list) => {
        setReviewCount(list.length);
        setAverage(
          list.length ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1) : null
        );
      });
    }, [id])
  );

  const toggleSaved = async () => {
    if (!user || !id) return;
    const next = await toggleWatchlist(user.email, id);
    setSaved(next.includes(id));
  };

  const openTrailer = () => {
    if (!movie) return;
    const search = encodeURIComponent(`${movie.title} official trailer`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${search}`).catch(() => {});
  };

  if (!movie) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text }}>Movie not found</Text>
      </View>
    );
  }

  const circle = {
    position: 'absolute' as const,
    top: insets.top + 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Poster movie={movie} style={{ height: 380 }}>
          <Pressable onPress={() => router.back()} style={[circle, { left: 20 }]}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={toggleSaved} style={[circle, { right: 20 }]}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? colors.red : '#fff'}
            />
          </Pressable>
        </Poster>

        <View style={{ padding: 20, gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{movie.title}</Text>

          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color="#F5C518" />
              <Text style={{ color: colors.text, fontWeight: '700' }}>{movie.rating.toFixed(1)}</Text>
            </View>
            <Text style={{ color: colors.muted }}>{movie.duration}</Text>
            <Text style={{ color: colors.muted }}>{movie.genre}</Text>
          </View>

          <Pressable
            onPress={openTrailer}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.red,
            }}
          >
            <Ionicons name="film-outline" size={20} color={colors.redText} />
            <Text style={{ color: colors.redText, fontSize: 15, fontWeight: '800' }}>Watch trailer</Text>
          </Pressable>

          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 6 }}>Story</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{movie.synopsis}</Text>

          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 6 }}>Cast</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {movie.cast.map((name) => (
              <View
                key={name}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{name}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push(`/review/${id}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              height: 60,
              marginTop: 8,
              borderRadius: 18,
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Reviews</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {reviewCount === 0
                  ? 'No reviews yet. Write the first one'
                  : `${reviewCount} review${reviewCount === 1 ? '' : 's'}${average ? ` · ${average} average` : ''}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
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