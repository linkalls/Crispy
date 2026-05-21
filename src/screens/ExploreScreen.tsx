import { View, Text } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme } from '../utils/types';

export function ExploreScreen({ colors, onImagePress }: { colors: ColorScheme, onImagePress?: (url: string) => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 16 }}>見つける画面</Text>
    </View>
  );
}
