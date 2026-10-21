import { Text, View } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text }}>Screen</Text>
    </View>
  );
}
