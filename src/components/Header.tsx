import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme, StoredAccount } from '../utils/types';

export function Header({
  activeAccount,
  accountMenuOpen,
  onAccountMenuToggle,
  colors,
}: {
  activeAccount: StoredAccount;
  accountMenuOpen: boolean;
  onAccountMenuToggle: () => void;
  colors: ColorScheme;
}) {
  return (
    <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.headerAccountButton, pressed && styles.buttonPressed]}
        onPress={onAccountMenuToggle}
      >
        <Image source={{ uri: activeAccount.avatarUrl }} style={styles.headerAvatar} />
        <View>
          <Text style={[styles.headerAppName, { color: colors.primaryText }]}>Crispy</Text>
          <Text style={[styles.headerName, { color: colors.text }]}>{activeAccount.displayName}</Text>
          <Text style={[styles.headerMeta, { color: colors.textMuted }]}>
            @{activeAccount.username} · {activeAccount.host}
          </Text>
        </View>
        <Ionicons
          name={accountMenuOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}
