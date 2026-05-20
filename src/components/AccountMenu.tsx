import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme, StoredAccount } from '../utils/types';

export function AccountMenu({
  accounts,
  activeAccount,
  devMode,
  themeMode,
  isOpen,
  isAddingAccount,
  serverHostInput,
  oauthLoading,
  oauthError,
  colors,
  onClose,
  onAccountSelect,
  onRemoveAccount,
  onAddAccountClick,
  onServerHostChange,
  onLogin,
  onDevModeToggle,
  onThemeModeChange,
}: {
  accounts: StoredAccount[];
  activeAccount: StoredAccount;
  devMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  isOpen: boolean;
  isAddingAccount: boolean;
  serverHostInput: string;
  oauthLoading: boolean;
  oauthError: string | null;
  colors: ColorScheme;
  onClose: () => void;
  onAccountSelect: (accountId: string) => void;
  onRemoveAccount: (accountId: string) => void;
  onAddAccountClick: () => void;
  onServerHostChange: (text: string) => void;
  onLogin: () => void;
  onDevModeToggle: (value: boolean) => void;
  onThemeModeChange: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <Pressable style={styles.accountMenuBackdrop} onPress={onClose} />
      <View style={[styles.accountMenuPanel, { backgroundColor: colors.settingsBg, borderColor: colors.border }]}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>アカウント</Text>

        {/* テーマ設定 */}
        <View style={styles.devModeRow}>
          <Text style={[styles.devModeLabel, { color: colors.text }]}>テーマ設定: {themeMode}</Text>
          <Pressable
            onPress={onThemeModeChange}
            style={{ padding: 8, backgroundColor: colors.border, borderRadius: 8 }}
          >
            <Text style={{ color: colors.text }}>{themeMode}</Text>
          </Pressable>
        </View>

        {/* devモード */}
        <View style={styles.devModeRow}>
          <Text style={[styles.devModeLabel, { color: colors.text }]}>devモード</Text>
          <Switch value={devMode} onValueChange={onDevModeToggle} />
        </View>

        {/* アカウント切り替え */}
        <Text style={[styles.accountSectionTitle, { color: colors.textMuted }]}>アカウント切り替え</Text>
        {accounts.map((account) => (
          <View key={account.id} style={styles.accountRow}>
            <Pressable
              style={styles.accountMain}
              onPress={() => {
                onAccountSelect(account.id);
                onClose();
              }}
            >
              <Image source={{ uri: account.avatarUrl }} style={styles.accountAvatar} />
              <View>
                <Text style={[styles.accountName, { color: colors.text }]}>{account.displayName}</Text>
                <Text style={[styles.accountHost, { color: colors.textMuted }]}>
                  @{account.username} · {account.host}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => onRemoveAccount(account.id)} style={styles.removeAccountButton}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        ))}

        {/* ボタン */}
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: colors.reactionBg }]}
          onPress={() => {
            // ロジックは App.tsx で処理
            onClose();
          }}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>
            現在アカウントを削除
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { backgroundColor: colors.reactionBg }]}
          onPress={onAddAccountClick}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>
            別アカウントを追加
          </Text>
        </Pressable>

        {/* 別アカウント追加パネル */}
        {isAddingAccount ? (
          <View style={[styles.addAccountCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Text style={[styles.addAccountTitle, { color: colors.text }]}>別アカウントを追加</Text>
            <TextInput
              value={serverHostInput}
              onChangeText={onServerHostChange}
              style={[
                styles.addAccountInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="misskey.io"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={onLogin}
            />
            <View style={styles.addAccountActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.addAccountActionButton,
                  { borderColor: colors.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onClose}
              >
                <Text style={[styles.addAccountCancelText, { color: colors.textMuted }]}>
                  キャンセル
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.addAccountActionButton,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onLogin}
                disabled={oauthLoading}
              >
                {oauthLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.addAccountLoginText}>ログイン</Text>
                )}
              </Pressable>
            </View>
            {oauthError ? <Text style={styles.oauthErrorText}>{oauthError}</Text> : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
