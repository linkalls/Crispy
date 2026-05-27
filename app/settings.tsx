import React, { useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Image, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalState } from '../src/context/GlobalState';
import { styles } from '../src/styles/styles';
import { createSessionId, DEFAULT_HOST, normalizeHost } from '../src/utils/formatting';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    accounts,
    activeAccount,
    devMode,
    themeMode,
    colors,
    setAccounts,
    setActiveAccountId,
    setDevMode,
    setThemeMode,
    removeAccount,
  } = useGlobalState();

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [serverHostInput, setServerHostInput] = useState(DEFAULT_HOST);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleThemeModeChange = () => {
    const nextMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(nextMode);
  };

  const handleLogin = async () => {
    if (!serverHostInput.trim()) return;
    setOauthLoading(true);
    setOauthError(null);
    try {
      if (serverHostInput.trim() === 'mock') {
        const mockHost = 'sushi.ski';
        const mockUserId = `mock_user_${Date.now()}`;
        setAccounts((prev) => [
          ...prev,
          {
            id: `${mockHost}-${mockUserId}`,
            host: mockHost,
            token: 'mock_token',
            userId: mockUserId,
            username: 'mock_user',
            displayName: 'Mock User',
            avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=mock_${Date.now()}`,
          },
        ]);
        setActiveAccountId(`${mockHost}-${mockUserId}`);
        setIsAddingAccount(false);
        setOauthLoading(false);
        return;
      }

      const hostUrl = normalizeHost(serverHostInput);
      const session = createSessionId();
      const returnUrl = Linking.createURL('/oauth-callback');
      const authUrl = `https://${hostUrl}/miauth/${session}?name=Crispy&callback=${encodeURIComponent(returnUrl)}&permission=read:account,write:account,read:blocks,write:blocks,read:drive,write:drive,read:favorites,write:favorites,read:following,write:following,read:messaging,write:messaging,read:mutes,write:mutes,write:notes,read:notifications,write:notifications,read:reactions,write:reactions,write:votes,read:pages,write:pages,write:page-likes,read:page-likes,read:user-groups,write:user-groups,read:channels,write:channels,read:gallery,write:gallery,read:gallery-likes,write:gallery-likes`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      if (result.type === 'success' && result.url) {
        // Assume session verified, ideally this uses deep link handling similar to index.tsx
        const res = await fetch(`https://${hostUrl}/api/miauth/${session}/check`, { method: 'POST' });
        if (!res.ok) throw new Error('認証チェックに失敗しました');
        const data = await res.json();
        if (data.ok && data.token) {
          setAccounts((prev) => [
            ...prev,
            {
              id: `${hostUrl}-${data.user.id}`,
              host: hostUrl,
              token: data.token,
              userId: data.user.id,
              username: data.user.username,
              displayName: data.user.name || data.user.username,
              avatarUrl: data.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${data.user.username}`,
            },
          ]);
          setActiveAccountId(`${hostUrl}-${data.user.id}`);
          setIsAddingAccount(false);
        } else {
          throw new Error('認証が完了していません');
        }
      }
    } catch (e: any) {
      setOauthError(e.message);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[localStyles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={localStyles.headerIcon}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: colors.text }]}>設定</Text>
        <View style={localStyles.headerIcon} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={localStyles.section}>
          <Text style={[localStyles.sectionTitle, { color: colors.textMuted }]}>表示設定</Text>
          <View style={[localStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={localStyles.row}>
              <Text style={[localStyles.rowText, { color: colors.text }]}>テーマモード</Text>
              <Pressable
                onPress={handleThemeModeChange}
                style={[localStyles.themeButton, { backgroundColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>{themeMode === 'system' ? 'システム' : themeMode === 'light' ? 'ライト' : 'ダーク'}</Text>
              </Pressable>
            </View>
            <View style={[localStyles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[localStyles.rowText, { color: colors.text }]}>デベロッパーモード</Text>
              <Switch value={devMode} onValueChange={setDevMode} />
            </View>
          </View>
        </View>

        <View style={localStyles.section}>
          <Text style={[localStyles.sectionTitle, { color: colors.textMuted }]}>アカウント</Text>
          <View style={[localStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {accounts.map((account, index) => (
              <View key={account.id} style={[localStyles.accountRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Pressable
                  style={localStyles.accountMain}
                  onPress={() => setActiveAccountId(account.id)}
                >
                  <Image source={{ uri: account.avatarUrl }} style={localStyles.accountAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[localStyles.accountName, { color: colors.text }]} numberOfLines={1}>
                      {account.displayName}
                      {activeAccount?.id === account.id && <Text style={{ color: colors.primary, fontWeight: 'bold' }}> (アクティブ)</Text>}
                    </Text>
                    <Text style={[localStyles.accountHost, { color: colors.textMuted }]} numberOfLines={1}>
                      @{account.username} · {account.host}
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => removeAccount(account.id)} style={localStyles.removeButton}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {!isAddingAccount ? (
           <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 40 }}>
             <Pressable
               style={({ pressed }) => [localStyles.addButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
               onPress={() => setIsAddingAccount(true)}
             >
               <Ionicons name="add" size={20} color="#fff" />
               <Text style={localStyles.addButtonText}>別のアカウントを追加</Text>
             </Pressable>
           </View>
        ) : (
          <View style={[localStyles.section, { marginBottom: 40 }]}>
             <View style={[localStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, padding: 16 }]}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>アカウントの追加</Text>
                <TextInput
                  value={serverHostInput}
                  onChangeText={setServerHostInput}
                  style={[localStyles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="misskey.io"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                {oauthError ? <Text style={{ color: '#ef4444', marginTop: 8, fontSize: 13 }}>{oauthError}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Pressable
                    style={({ pressed }) => [localStyles.addActionButton, { backgroundColor: colors.border }, pressed && { opacity: 0.8 }]}
                    onPress={() => setIsAddingAccount(false)}
                  >
                    <Text style={{ color: colors.text }}>キャンセル</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [localStyles.addActionButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
                    onPress={handleLogin}
                    disabled={oauthLoading}
                  >
                    {oauthLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>ログイン</Text>}
                  </Pressable>
                </View>
             </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerIcon: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  accountMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  accountHost: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addActionButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
