import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { loading: boolean; error: string | null; onRetry: () => void };

export function LoadState({ loading, error, onRetry }: Props) {
  if (!loading && !error) return null;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: colors.bg,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" color={colors.red} />
      ) : (
        <>
          <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
          <Pressable
            onPress={onRetry}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: colors.red,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}