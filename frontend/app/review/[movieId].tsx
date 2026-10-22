import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '../../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { getMovie } from '../../src/api/movies';
import { getReviews, saveReview, Review } from '../../src/store/reviews';
import { useAuth } from '../../src/store/authStore';

export default function ReviewScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const movie = getMovie(movieId);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!movieId) return;
    getReviews(movieId).then((list) => {
      setReviews(list);
      const mine = list.find((r) => r.email === user?.email);
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment);
      }
    });
  }, [movieId, user?.email]);

  const submit = async () => {
    if (!user || !movieId || rating === 0) return;
    setReviews(await saveReview(movieId, user.email, rating, comment));
    setSaved(true);
  };

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Reviews</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
            {movie?.title}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Your rating</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  setRating(n);
                  setSaved(false);
                }}
                hitSlop={6}
              >
                <Ionicons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={34}
                  color={n <= rating ? '#F5C518' : colors.muted}
                />
              </Pressable>
            ))}
          </View>

          <TextInput
            value={comment}
            onChangeText={(t) => {
              setComment(t);
              setSaved(false);
            }}
            placeholder="Write a few words about the movie (optional)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={300}
            style={{
              minHeight: 96,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.text,
              padding: 14,
              fontSize: 14,
              textAlignVertical: 'top',
            }}
          />

          <Pressable
            onPress={submit}
            disabled={rating === 0}
            style={{
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.red,
              opacity: rating === 0 ? 0.45 : 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {saved ? 'Saved' : 'Submit review'}
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
            All reviews ({reviews.length})
          </Text>
          {average ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={15} color="#F5C518" />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{average}</Text>
            </View>
          ) : null}
        </View>

        {reviews.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14 }}>No reviews yet. Be the first.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                  {r.email.split('@')[0]}
                </Text>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= r.rating ? 'star' : 'star-outline'}
                      size={14}
                      color={n <= r.rating ? '#F5C518' : colors.muted}
                    />
                  ))}
                </View>
              </View>
              {r.comment ? (
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{r.comment}</Text>
              ) : null}
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}