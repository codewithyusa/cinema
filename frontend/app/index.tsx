import { Text, View } from 'react-native';
import { colors } from '../src/theme/colors';

export default function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>YUSA CINEMA</Text>
    </View>
  );
}