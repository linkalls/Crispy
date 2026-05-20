import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type TimelineTab = 'home' | 'local' | 'global';

type MisskeyUser = {
  id: string;
  name?: string | null;
  username: string;
  host?: string | null;
  avatarUrl?: string | null;
};

type MisskeyNote = {
  id: string;
  text?: string | null;
  cw?: string | null;
  createdAt: string;
  user: MisskeyUser;
  renote?: MisskeyNote | null;
  reactions?: Record<string, number>;
  myReaction?: string | null;
  repliesCount?: number;
  renoteCount?: number;
};

type TimelineNote = {
  id: string;
  content: string;
  createdAtLabel: string;
  user: {
    name: string;
    username: string;
    host: string;
    avatar: string;
  };
  renoteUser: string | null;
  reactions: Array<{ emoji: string; count: number; reacted: boolean; isCustom: boolean }>;
  replies: number;
  renotes: number;
};

type StoredAccount = {
  id: string;
  host: string;
  token: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

type PersistedState = {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  devMode: boolean;
};

type MisskeyMiAuthCheck = {
  ok: boolean;
  token: string;
  user: MisskeyUser;
};

type DebugState = {
  lastPath: string;
  lastStatus: number | null;
  lastError: string | null;
};

const STORAGE_KEY = 'crispy:state:v2';
const DEFAULT_HOST = 'misskey.io';
const DEFAULT_AVATAR =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Crispy&backgroundColor=b6e3f4';

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [serverHostInput, setServerHostInput] = useState(DEFAULT_HOST);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TimelineTab>('home');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugState>({
    lastPath: '',
    lastStatus: null,
    lastError: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as PersistedState;
        if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
        setActiveAccountId(parsed.activeAccountId ?? null);
        setDevMode(Boolean(parsed.devMode));
      } catch {
        // noop
      } finally {
        setHydrated(true);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = {
      accounts,
      activeAccountId,
      devMode,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [accounts, activeAccountId, devMode, hydrated]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) ?? null,
    [accounts, activeAccountId]
  );

  const misskeyRequest = useCallback(
    async <T,>(path: string, payload: Record<string, unknown>, requiresAuth = false): Promise<T> => {
      if (!activeAccount) {
        throw new Error('先にログインしてください。');
      }

      if (requiresAuth && !activeAccount.token) {
        throw new Error('認証が必要です。');
      }

      const response = await fetch(`https://${activeAccount.host}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, i: activeAccount.token }),
      });

      setDebug((current) => ({
        ...current,
        lastPath: path,
        lastStatus: response.status,
        lastError: null,
      }));

      if (!response.ok) {
        throw new Error(`Misskey API error: ${response.status}`);
      }

      return (await response.json()) as T;
    },
    [activeAccount]
  );

  const loadTimeline = useCallback(
    async (isRefresh = false) => {
      if (!activeAccount) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingTimeline(true);
      }
      setTimelineError(null);

      const endpointMap: Record<TimelineTab, string> = {
        home: '/api/notes/timeline',
        local: '/api/notes/local-timeline',
        global: '/api/notes/global-timeline',
      };

      try {
        const data = await misskeyRequest<MisskeyNote[]>(endpointMap[activeTab], {
          limit: 25,
          allowPartial: false,
          withFiles: true,
          withReplies: true,
          withRenotes: true,
        }, true);

        setNotes(data.map((note) => mapNote(note, activeAccount.host)));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'タイムラインを取得できませんでした。';
        setTimelineError(message);
        setDebug((current) => ({
          ...current,
          lastError: message,
        }));
      } finally {
        setLoadingTimeline(false);
        setRefreshing(false);
      }
    },
    [activeAccount, activeTab, misskeyRequest]
  );

  useEffect(() => {
    if (!activeAccount) {
      setNotes([]);
      return;
    }
    loadTimeline(false);
  }, [activeAccount, activeTab, loadTimeline]);

  const startMiAuthLogin = async () => {
    const host = normalizeHost(serverHostInput);
    if (!host) {
      setOauthError('サーバーのホスト名を入力してください。');
      return;
    }

    setOauthLoading(true);
    setOauthError(null);

    const session = createSessionId();
    const callbackUrl = Linking.createURL('auth/callback', { scheme: 'crispy' });
    const permission = [
      'read:account',
      'read:notes',
      'write:notes',
      'write:reactions',
      'write:notifications',
    ].join(',');

    const authUrl = `https://${host}/miauth/${session}?name=${encodeURIComponent(
      'Crispy'
    )}&callback=${encodeURIComponent(callbackUrl)}&permission=${encodeURIComponent(permission)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);

      if (result.type !== 'success') {
        throw new Error('ログインがキャンセルされました。');
      }

      const parsed = Linking.parse(result.url);
      const callbackSession =
        typeof parsed.queryParams?.session === 'string' ? parsed.queryParams.session : undefined;

      if (callbackSession && callbackSession !== session) {
        throw new Error('OAuth セッション検証に失敗しました。');
      }

      const checkResponse = await fetch(`https://${host}/api/miauth/${session}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!checkResponse.ok) {
        throw new Error(`セッション確認失敗: ${checkResponse.status}`);
      }

      const auth = (await checkResponse.json()) as MisskeyMiAuthCheck;
      if (!auth.ok || !auth.token || !auth.user?.id) {
        throw new Error('ログイン情報が不正です。');
      }

      const newAccount: StoredAccount = {
        id: `${host}:${auth.user.id}`,
        host,
        token: auth.token,
        userId: auth.user.id,
        username: auth.user.username,
        displayName: auth.user.name || auth.user.username,
        avatarUrl: auth.user.avatarUrl || DEFAULT_AVATAR,
      };

      setAccounts((current) => {
        const withoutCurrent = current.filter((account) => account.id !== newAccount.id);
        return [newAccount, ...withoutCurrent];
      });
      setActiveAccountId(newAccount.id);
      setServerHostInput(host);
      setActiveTab('home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      setOauthError(message);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleReactionToggle = async (noteId: string, reactionIndex: number) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note || !activeAccount) return;

    const target = note.reactions[reactionIndex];
    if (!target) return;

    const nextReacted = !target.reacted;

    setNotes((current) =>
      current.map((item) => {
        if (item.id !== noteId) return item;
        const reactions = [...item.reactions];
        const reaction = reactions[reactionIndex];
        if (!reaction) return item;
        reactions[reactionIndex] = {
          ...reaction,
          reacted: nextReacted,
          count: Math.max(0, reaction.count + (nextReacted ? 1 : -1)),
        };
        return { ...item, reactions };
      })
    );

    try {
      await misskeyRequest(
        nextReacted ? '/api/notes/reactions/create' : '/api/notes/reactions/delete',
        {
          noteId,
          reaction: target.emoji,
        },
        true
      );
    } catch (error) {
      setNotes((current) =>
        current.map((item) => {
          if (item.id !== noteId) return item;
          const reactions = [...item.reactions];
          const reaction = reactions[reactionIndex];
          if (!reaction) return item;
          reactions[reactionIndex] = {
            ...reaction,
            reacted: target.reacted,
            count: target.count,
          };
          return { ...item, reactions };
        })
      );
      Alert.alert('失敗', error instanceof Error ? error.message : 'リアクション更新に失敗しました。');
    }
  };

  const removeAccount = (accountId: string) => {
    setAccounts((current) => current.filter((account) => account.id !== accountId));
    setActiveAccountId((currentActive) => {
      if (currentActive !== accountId) return currentActive;
      const next = accounts.find((account) => account.id !== accountId);
      return next?.id ?? null;
    });
  };

  const logoutCurrent = () => {
    if (!activeAccount) return;
    Alert.alert('ログアウト', `${activeAccount.displayName} を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => removeAccount(activeAccount.id),
      },
    ]);
  };

  if (!hydrated) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.centerLoadingText}>Starting Crispy...</Text>
      </View>
    );
  }

  if (!activeAccount) {
    return (
      <SafeAreaView style={styles.onboardingScreen}>
        <StatusBar style="dark" />
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingBrand}>
            <View style={styles.onboardingBrandIcon}>
              <Ionicons name="sparkles" size={20} color="#ffffff" />
            </View>
            <Text style={styles.onboardingBrandText}>Crispy</Text>
          </View>
          <Text style={styles.onboardingTitle}>Misskeyをもっと快適に</Text>
          <Text style={styles.onboardingSubTitle}>Misskey にログインしてはじめる</Text>

          <Text style={styles.inputLabel}>サーバー</Text>
          <TextInput
            value={serverHostInput}
            onChangeText={setServerHostInput}
            style={styles.onboardingInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="misskey.io"
            placeholderTextColor="#6b7280"
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={startMiAuthLogin}
          />

          <Pressable
            style={({ pressed }) => [styles.oauthButton, pressed && styles.buttonPressed]}
            onPress={startMiAuthLogin}
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.oauthButtonText}>Misskeyでログイン</Text>
            )}
          </Pressable>

          {oauthError ? <Text style={styles.oauthErrorText}>{oauthError}</Text> : null}
          <Text style={styles.onboardingHint}>
            初回起動時にサーバーを入力し、OAuth(MiAuth) でログインします。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: activeAccount.avatarUrl }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerAppName}>Crispy</Text>
            <Text style={styles.headerName}>{activeAccount.displayName}</Text>
            <Text style={styles.headerMeta}>@{activeAccount.username} · {activeAccount.host}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
          onPress={() => setSettingsOpen((current) => !current)}
        >
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <TabButton label="For You" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <TabButton label="Local" active={activeTab === 'local'} onPress={() => setActiveTab('local')} />
        <TabButton label="Global" active={activeTab === 'global'} onPress={() => setActiveTab('global')} />
      </View>

      {settingsOpen ? (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>設定</Text>

          <View style={styles.devModeRow}>
            <Text style={styles.devModeLabel}>devモード</Text>
            <Switch value={devMode} onValueChange={setDevMode} />
          </View>

          <Text style={styles.accountSectionTitle}>アカウント切り替え</Text>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountRow}>
              <Pressable style={styles.accountMain} onPress={() => setActiveAccountId(account.id)}>
                <Image source={{ uri: account.avatarUrl }} style={styles.accountAvatar} />
                <View>
                  <Text style={styles.accountName}>{account.displayName}</Text>
                  <Text style={styles.accountHost}>@{account.username} · {account.host}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => removeAccount(account.id)} style={styles.removeAccountButton}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.secondaryButton} onPress={logoutCurrent}>
            <Text style={styles.secondaryButtonText}>現在アカウントを削除</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={startMiAuthLogin}>
            <Text style={styles.secondaryButtonText}>別アカウントを追加</Text>
          </Pressable>
        </View>
      ) : null}

      {loadingTimeline ? (
        <View style={styles.timelineLoading}>
          <ActivityIndicator size="large" color="#1d9bf0" />
          <Text style={styles.timelineLoadingText}>タイムラインを読み込み中...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.timeline}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTimeline(true)} />}
          showsVerticalScrollIndicator={false}
        >
          {timelineError ? <Text style={styles.timelineError}>{timelineError}</Text> : null}
          {!timelineError && notes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>表示できるノートがありません</Text>
              <Text style={styles.emptyStateText}>少し待ってから再読み込みしてください。</Text>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => loadTimeline(true)}
              >
                <Text style={styles.secondaryButtonText}>再読み込み</Text>
              </Pressable>
            </View>
          ) : null}

          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              {note.renoteUser ? <Text style={styles.renoteText}>{note.renoteUser} がリノート</Text> : null}
              <View style={styles.noteRow}>
                <Image source={{ uri: note.user.avatar }} style={styles.noteAvatar} />
                <View style={styles.noteMain}>
                  <View style={styles.noteHeaderRow}>
                    <Text style={styles.noteName}>{note.user.name}</Text>
                    <Text style={styles.noteMeta}>
                      @{note.user.username}@{note.user.host} · {note.createdAtLabel}
                    </Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>

                  <View style={styles.noteActions}>
                    <Text style={styles.noteCount}>💬 {note.replies}</Text>
                    <Text style={styles.noteCount}>🔁 {note.renotes}</Text>
                  </View>

                  <View style={styles.reactionWrap}>
                    {note.reactions.slice(0, 6).map((reaction, index) => (
                      <Pressable
                        key={`${note.id}-${reaction.emoji}-${index}`}
                        style={({ pressed }) => [
                          styles.reactionButton,
                          reaction.reacted && styles.reactionActive,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => handleReactionToggle(note.id, index)}
                      >
                        <Text style={styles.reactionText}>{reaction.emoji}</Text>
                        <Text style={styles.reactionCount}>{reaction.count}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {devMode ? (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle}>Dev mode</Text>
          <Text style={styles.devText}>accountId: {activeAccount.id}</Text>
          <Text style={styles.devText}>host: {activeAccount.host}</Text>
          <Text style={styles.devText}>tab: {activeTab}</Text>
          <Text style={styles.devText}>lastPath: {debug.lastPath || '-'}</Text>
          <Text style={styles.devText}>lastStatus: {debug.lastStatus ?? '-'}</Text>
          <Text style={styles.devText}>lastError: {debug.lastError ?? '-'}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tabButton, active && styles.tabButtonActive, pressed && styles.buttonPressed]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function normalizeHost(input: string): string {
  return input.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
}

function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function toRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (!Number.isFinite(sec) || sec < 0) return '';
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  return `${Math.floor(hour / 24)}d`;
}

function mapNote(note: MisskeyNote, fallbackHost: string): TimelineNote {
  const target = note.renote && !note.text ? note.renote : note;
  const content = [target.cw, target.text].filter(Boolean).join('\n');

  return {
    id: note.id,
    content: content || '(no text)',
    createdAtLabel: toRelativeTime(target.createdAt),
    user: {
      name: target.user.name || target.user.username,
      username: target.user.username,
      host: target.user.host || fallbackHost,
      avatar: target.user.avatarUrl || DEFAULT_AVATAR,
    },
    renoteUser: note.renote ? note.user.name || note.user.username : null,
    reactions: Object.entries(target.reactions || {}).map(([emoji, count]) => ({
      emoji,
      count,
      reacted: target.myReaction === emoji,
      isCustom: emoji.startsWith(':'),
    })),
    replies: target.repliesCount ?? 0,
    renotes: target.renoteCount ?? 0,
  };
}

const styles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f6ff',
    gap: 12,
  },
  centerLoadingText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  onboardingScreen: {
    flex: 1,
    backgroundColor: '#eef3ff',
    justifyContent: 'center',
    padding: 22,
  },
  onboardingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#dbe5ff',
    gap: 14,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  onboardingBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onboardingBrandIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  onboardingBrandText: {
    color: '#1e3a8a',
    fontWeight: '900',
    fontSize: 18,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  onboardingSubTitle: {
    color: '#475569',
    fontSize: 16,
    marginBottom: 6,
  },
  inputLabel: {
    color: '#334155',
    fontWeight: '700',
  },
  onboardingInput: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    backgroundColor: '#f8fbff',
  },
  oauthButton: {
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 3,
  },
  oauthButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  oauthErrorText: {
    color: '#dc2626',
    fontSize: 12,
  },
  onboardingHint: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f6f8ff',
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  headerAppName: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerName: {
    fontWeight: '900',
    fontSize: 16,
    color: '#0f172a',
  },
  headerMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  settingsButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#eff6ff',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginTop: 8,
    backgroundColor: '#eaf1ff',
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabButtonText: {
    color: '#475569',
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#1e40af',
  },
  settingsPanel: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fbff',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  settingsTitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#0f172a',
  },
  devModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devModeLabel: {
    color: '#1e293b',
    fontWeight: '700',
  },
  accountSectionTitle: {
    color: '#334155',
    fontWeight: '800',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accountAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  accountName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  accountHost: {
    color: '#64748b',
    fontSize: 12,
  },
  removeAccountButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  timelineLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timelineLoadingText: {
    color: '#64748b',
  },
  timeline: {
    flex: 1,
    marginTop: 6,
  },
  timelineError: {
    color: '#dc2626',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyStateCard: {
    margin: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  emptyStateTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 13,
  },
  noteCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
  },
  renoteText: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 6,
    marginLeft: 0,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  noteMain: {
    flex: 1,
    gap: 6,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  noteName: {
    color: '#0f172a',
    fontWeight: '800',
  },
  noteMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  noteContent: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 21,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
  },
  noteCount: {
    color: '#64748b',
    fontSize: 12,
  },
  reactionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: '#f8fbff',
  },
  reactionActive: {
    borderColor: '#60a5fa',
    backgroundColor: '#dbeafe',
  },
  reactionText: {
    fontSize: 12,
  },
  reactionCount: {
    color: '#334155',
    fontSize: 11,
  },
  devPanel: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#0f172a',
    padding: 10,
    gap: 2,
  },
  devTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    marginBottom: 4,
  },
  devText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
