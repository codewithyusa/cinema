import { ReactNode, useState } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { Movie } from '../types';

type Props = {
  movie?: Movie;
  style?: ViewStyle;
  children?: ReactNode;
};

export default function Poster({ movie, style, children }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!movie?.poster && !failed;

  return (
    <View style={[{ backgroundColor: movie?.color ?? colors.border, overflow: 'hidden' }, style]}>
      {showImage ? (
        <Image
          source={{ uri: movie!.poster }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {children}
    </View>
  );
}