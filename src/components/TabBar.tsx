import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme, TimelineTab } from '../utils/types';

function TabButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ColorScheme;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.tabButtonActive,
        active && { backgroundColor: colors.tabActiveBg },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: colors.tabText },
          active && styles.tabButtonTextActive,
          active && { color: colors.tabActiveText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TabBar({
  activeTab,
  onTabChange,
  colors,
}: {
  activeTab: TimelineTab;
  onTabChange: (tab: TimelineTab) => void;
  colors: ColorScheme;
}) {
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBg }]}>
      <TabButton
        label="For You"
        active={activeTab === 'home'}
        onPress={() => onTabChange('home')}
        colors={colors}
      />
      <TabButton
        label="Local"
        active={activeTab === 'local'}
        onPress={() => onTabChange('local')}
        colors={colors}
      />
      <TabButton
        label="Global"
        active={activeTab === 'global'}
        onPress={() => onTabChange('global')}
        colors={colors}
      />
    </View>
  );
}
