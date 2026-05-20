import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme } from '../utils/types';

export function FAB({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: ColorScheme;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name="pencil" size={24} color={colors.primaryText} />
    </Pressable>
  );
}
