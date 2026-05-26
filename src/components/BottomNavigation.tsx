import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/styles';
import { ColorScheme, MainScreenTab } from '../utils/types';

export function BottomNavigation({
  activeTab,
  onTabChange,
  colors,
}: {
  activeTab: MainScreenTab;
  onTabChange: (tab: MainScreenTab) => void;
  colors: ColorScheme;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
        },
      ]}
    >
      <Pressable style={styles.bottomNavTab} onPress={() => onTabChange('home')}>
        <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={24} color={activeTab === 'home' ? colors.text : colors.textMuted} />
      </Pressable>
      <Pressable style={styles.bottomNavTab} onPress={() => onTabChange('explore')}>
        <Ionicons name={activeTab === 'explore' ? 'search' : 'search-outline'} size={24} color={activeTab === 'explore' ? colors.text : colors.textMuted} />
      </Pressable>
      <Pressable style={styles.bottomNavTab} onPress={() => onTabChange('notifications')}>
        <Ionicons name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'} size={24} color={activeTab === 'notifications' ? colors.text : colors.textMuted} />
      </Pressable>
      <Pressable style={styles.bottomNavTab} onPress={() => onTabChange('profile')}>
        <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={24} color={activeTab === 'profile' ? colors.text : colors.textMuted} />
      </Pressable>
    </View>
  );
}
