import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as mfm from 'mfm-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
  Modal,
  StyleSheet
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  MfmRenderer,
  Timeline,
  NoteDetailModal,
  QuoteComposerModal,
  RenoteOptionsModal,
  ReactionPickerModal,
  ConfirmModal,
  Toast,
  BottomNavigation,
  FAB,
  NoteComposerModal,
} from './src/components';
import { NotificationsScreen, ExploreScreen, ProfileScreen } from './src/screens';
import { useMisskey, useMisskeyStream } from './src/hooks';
import { styles } from './src/styles/styles';
import { darkColors, lightColors } from './src/utils/colors';
import {
  DEFAULT_HOST,
  STORAGE_KEY,
  createSessionId,
  mapNote,
  normalizeHost,
  toRelativeTime,
} from './src/utils/formatting';
import {
  DebugState,
  MisskeyMiAuthCheck,
  MisskeyNote,
  PersistedState,
  StoredAccount,
  TimelineNote,
  TimelineTab,
  MainScreenTab
} from './src/utils/types';

WebBrowser.maybeCompleteAuthSession();

const DEFAULT_AVATAR =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Crispy&backgroundColor=b6e3f4';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [hydrated, setHydrated] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);

  const [serverHostInput, setServerHostInput] = useState(DEFAULT_HOST);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [activeAuthSession, setActiveAuthSession] = useState<{ session: string; host: string } | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [mainTab, setMainTab] = useState<MainScreenTab>('home');
  const [activeTab, setActiveTab] = useState<TimelineTab>('home');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [replyingNoteId, setReplyingNoteId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [debug, setDebug] = useState<DebugState>({
    lastPath: '',
    lastStatus: null,
    lastError: null,
  });

  // モーダル・投稿関連の状態
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<TimelineNote | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [quotingNote, setQuotingNote] = useState<TimelineNote | null>(null);
  const [isQuoteComposerVisible, setIsQuoteComposerVisible] = useState(false);
  const [selectedNoteForRenote, setSelectedNoteForRenote] = useState<TimelineNote | null>(null);
  const [isRenoteOptionsVisible, setIsRenoteOptionsVisible] = useState(false);
  const [selectedNoteForReaction, setSelectedNoteForReaction] = useState<TimelineNote | null>(null);
  const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);
  const [isNoteComposerVisible, setIsNoteComposerVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; message?: string; isError?: boolean }>({ visible: false, title: '' });
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  
  const showToast = (title: string, message?: string, isError = false) => {
    setToast({ visible: true, title, message, isError });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as PersistedState;
        if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
        setActiveAccountId(parsed.activeAccountId ?? null);
        setDevMode(Boolean(parsed.devMode));
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
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
      themeMode,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [accounts, activeAccountId, devMode, themeMode, hydrated]);

  const colorScheme = useColorScheme();
  const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) ?? null,
    [accounts, activeAccountId]
  );

  const { misskeyRequest } = useMisskey(activeAccount);
  const { isConnected, lastMessage } = useMisskeyStream(activeAccount);

  useEffect(() => {
    if (lastMessage && mainTab === 'home' && activeTab === 'home') {
      setNotes((prev) => {
        const exists = prev.find(n => n.id === lastMessage.id);
        if (exists) return prev;
        return [mapNote(lastMessage, activeAccount?.host || DEFAULT_HOST), ...prev];
      });
    }
  }, [lastMessage, activeAccount?.host, mainTab, activeTab]);

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
  }, [activeAccount, activeTab]);

  const finishMiAuthLogin = useCallback(async (session: string, host: string) => {
    const hadActiveAccount = Boolean(activeAccountId);
    try {
      setOauthLoading(true);
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
      if (!hadActiveAccount) {
        setActiveTab('home');
      }
      setActiveAuthSession(null);
      setOauthError(null);
      setAddingAccount(false);
      setAccountMenuOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      setOauthError(message);
    } finally {
      setOauthLoading(false);
    }
  }, [activeAccountId]);

  useEffect(() => {
    const handleUrl = (event: Linking.EventType) => {
      if (!activeAuthSession) return;
      const parsed = Linking.parse(event.url);
      const callbackSession =
        typeof parsed.queryParams?.session === 'string' ? parsed.queryParams.session : undefined;

      if (callbackSession && callbackSession === activeAuthSession.session) {
        finishMiAuthLogin(activeAuthSession.session, activeAuthSession.host);
      } else if (parsed.hostname === 'auth' && parsed.path === 'callback') {
        setOauthError('OAuth セッション検証に失敗しました。');
        setActiveAuthSession(null);
        setOauthLoading(false);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url && activeAuthSession) {
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeAuthSession, finishMiAuthLogin]);

  const startMiAuthLogin = async () => {
    const host = normalizeHost(serverHostInput);
    if (!host) {
      setOauthError('サーバーのホスト名を入力してください。');
      return;
    }

    setOauthLoading(true);
    setOauthError(null);

    const session = createSessionId();
    setActiveAuthSession({ session, host });

    const callbackUrl = Linking.createURL('auth/callback', { scheme: 'crispy' });
    const permission = [
      'read:account',
      'read:notes',
      'write:notes',
      'write:reactions',
      'read:notifications',
      'write:notifications',
    ].join(',');

    const authUrl = `https://${host}/miauth/${session}?name=${encodeURIComponent(
      'Crispy'
    )}&callback=${encodeURIComponent(callbackUrl)}&permission=${encodeURIComponent(permission)}`;

    try {
      await Linking.openURL(authUrl);
    } catch (error) {
      setOauthError('ブラウザを開けませんでした。');
      setOauthLoading(false);
      setActiveAuthSession(null);
    }
  };

  const handleReactionToggle = async (noteOrId: string | TimelineNote, reactionIndex: number) => {
    const noteId = typeof noteOrId === 'string' ? noteOrId : noteOrId.id;
    let note = typeof noteOrId === 'string' ? notes.find((item) => item.id === noteId) : noteOrId;
    if (!note) {
      note = selectedNoteForDetail?.id === noteId ? selectedNoteForDetail : undefined;
    }
    if (!note || !activeAccount) return;

    if (reactionIndex === -1) {
      setSelectedNoteForReaction(note);
      setIsReactionPickerVisible(true);
      return;
    }

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
        nextReacted ? { noteId: note.targetId, reaction: target.emoji } : { noteId: note.targetId },
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
      showToast('失敗', error instanceof Error ? error.message : 'リアクション更新に失敗しました。', true);
    }
  };

  const performReaction = async (note: TimelineNote, reaction: string) => {
    if (!activeAccount) return;
    try {
      const existingReaction = note.reactions.find(r => r.reacted);
      if (existingReaction) {
        if (existingReaction.emoji === reaction) return; // Already reacted with this
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
      }
      await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction }, true);
      showToast('成功', 'リアクションしました。');
      loadTimeline(true);
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

  const performPureRenote = async (note: TimelineNote) => {
    setNotes((current) =>
      current.map((item) =>
        item.id === note.id
          ? {
            ...item,
            renotes: item.renotes + 1,
          }
          : item
      )
    );

    try {
      await misskeyRequest('/api/notes/create', { renoteId: note.targetId }, true);
      showToast('成功', 'リポストしました。');
    } catch (error) {
      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? {
              ...item,
              renotes: Math.max(0, item.renotes - 1),
            }
            : item
        )
      );
      showToast('失敗', error instanceof Error ? error.message : 'リポストに失敗しました。', true);
    }
  };

  const handleRenoteOptions = (note: TimelineNote) => {
    setSelectedNoteForRenote(note);
    setIsRenoteOptionsVisible(true);
  };

  const handleQuoteSubmit = async (text: string) => {
    if (!quotingNote || !activeAccount) return;
    try {
      await misskeyRequest('/api/notes/create', { text, renoteId: quotingNote.targetId }, true);
      showToast('成功', '引用リポストを投稿しました。');
      loadTimeline(true);
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : '引用リポストに失敗しました。', true);
      throw error;
    }
  };

  const handleShare = async (note: TimelineNote) => {
    const noteUrl = `https://${note.user.host}/notes/${note.targetId}`;
    try {
      await Share.share({ message: noteUrl, url: noteUrl });
    } catch (error) {
      showToast('失敗', '共有を開始できませんでした。', true);
    }
  };

  const handleReplySubmit = async (note: TimelineNote) => {
    const text = replyText.trim();
    if (!text) {
      showToast('入力エラー', '返信内容を入力してください。', true);
      return;
    }

    try {
      setSendingReply(true);
      await misskeyRequest('/api/notes/create', { text, replyId: note.targetId }, true);
      setReplyText('');
      setReplyingNoteId(null);
      loadTimeline(true);
      showToast('成功', '返信しました。');
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : '返信に失敗しました。', true);
    } finally {
      setSendingReply(false);
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

  const confirmLogout = () => {
    if (!activeAccount) return;
    removeAccount(activeAccount.id);
    setIsLogoutConfirmVisible(false);
  };

  const logoutCurrent = () => {
    if (!activeAccount) return;
    setIsLogoutConfirmVisible(true);
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
        <StatusBar style={isDark ? "light" : "dark"} />
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
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.headerAccountButton, pressed && styles.buttonPressed]}
          onPress={() =>
            setAccountMenuOpen((current) => {
              if (current) {
                setAddingAccount(false);
                setOauthError(null);
              }
              return !current;
            })
          }
        >
          <Image source={{ uri: activeAccount.avatarUrl }} style={styles.headerAvatar} />
          <View>
            <Text style={[styles.headerAppName, { color: colors.primaryText }]}>Crispy</Text>
            <Text style={[styles.headerName, { color: colors.text }]}>{activeAccount.displayName}</Text>
            <Text style={[styles.headerMeta, { color: colors.textMuted }]}>@{activeAccount.username} · {activeAccount.host}</Text>
          </View>
          <Ionicons name={accountMenuOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {!viewingUserId && mainTab === 'home' && (
        <View style={[styles.tabBar, { backgroundColor: colors.tabBg }]}>
          <TabButton label="For You" active={activeTab === 'home'} onPress={() => setActiveTab('home')} colors={colors} />
          <TabButton label="Local" active={activeTab === 'local'} onPress={() => setActiveTab('local')} colors={colors} />
          <TabButton label="Global" active={activeTab === 'global'} onPress={() => setActiveTab('global')} colors={colors} />
        </View>
      )}

      <Modal
        visible={accountMenuOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setAccountMenuOpen(false);
          setAddingAccount(false);
          setOauthError(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={() => {
              setAccountMenuOpen(false);
              setAddingAccount(false);
              setOauthError(null);
            }}
          />
          <View style={[styles.accountMenuPanel, { backgroundColor: colors.bg, paddingBottom: 32 }]}>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.settingsTitle, { color: colors.text }]}>アカウント</Text>

            <View style={styles.devModeRow}>
              <Text style={[styles.devModeLabel, { color: colors.text }]}>テーマ: {themeMode}</Text>
              <Pressable
                onPress={() =>
                  setThemeMode((m) => (m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system'))
                }
                style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.border, borderRadius: 16 }}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>切替</Text>
              </Pressable>
            </View>

            <View style={styles.devModeRow}>
              <Text style={[styles.devModeLabel, { color: colors.text }]}>devモード</Text>
              <Switch value={devMode} onValueChange={setDevMode} />
            </View>

            <Text style={[styles.accountSectionTitle, { color: colors.textMuted }]}>アカウント切り替え</Text>
            {accounts.map((account) => (
              <View key={account.id} style={styles.accountRow}>
                <Pressable
                  style={styles.accountMain}
                  onPress={() => {
                    setActiveAccountId(account.id);
                    setAccountMenuOpen(false);
                    setAddingAccount(false);
                    setOauthError(null);
                  }}
                >
                  <Image source={{ uri: account.avatarUrl }} style={styles.accountAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>{account.displayName}</Text>
                    <Text style={[styles.accountHost, { color: colors.textMuted }]} numberOfLines={1}>@{account.username} · {account.host}</Text>
                  </View>
                  {activeAccountId === account.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
                {activeAccountId !== account.id && (
                  <Pressable onPress={() => removeAccount(account.id)} style={styles.removeAccountButton}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                )}
              </View>
            ))}

            <Pressable style={styles.addAccountBtn} onPress={() => {
              setServerHostInput(activeAccount.host);
              setOauthError(null);
              setAddingAccount(true);
            }}>
              <Ionicons name="add-outline" size={20} color={colors.primary} />
              <Text style={[styles.addAccountBtnText, { color: colors.primary }]}>既存のアカウントを追加</Text>
            </Pressable>

            {addingAccount ? (
              <View style={[styles.addAccountCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                <Text style={[styles.addAccountTitle, { color: colors.text }]}>新しいアカウント</Text>
                <TextInput
                  value={serverHostInput}
                  onChangeText={setServerHostInput}
                  style={[styles.addAccountInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="misskey.io"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={startMiAuthLogin}
                />
                <View style={styles.addAccountActions}>
                  <Pressable
                    style={({ pressed }) => [styles.addAccountActionButton, { borderColor: colors.border }, pressed && styles.buttonPressed]}
                    onPress={() => {
                      setAddingAccount(false);
                      setOauthError(null);
                    }}
                  >
                    <Text style={[styles.addAccountCancelText, { color: colors.textMuted }]}>キャンセル</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.addAccountActionButton,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={startMiAuthLogin}
                    disabled={oauthLoading}
                  >
                    {oauthLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.addAccountLoginText}>ログイン</Text>}
                  </Pressable>
                </View>
                {oauthError ? <Text style={styles.errorText}>{oauthError}</Text> : null}
              </View>
            ) : null}

            <Pressable style={styles.logoutBtn} onPress={logoutCurrent}>
              <Text style={styles.logoutBtnText}>@ {activeAccount.username} をログアウト</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {!viewingUserId && mainTab === 'home' && (
        <Timeline
          onUserPress={(userId) => setViewingUserId(userId)}
          notes={notes}
          isLoading={loadingTimeline}
          isRefreshing={refreshing}
          error={timelineError}
          replyingNoteId={replyingNoteId}
          replyText={replyText}
          isSendingReply={sendingReply}
          colors={colors}
          onRefresh={() => loadTimeline(true)}
          onReplyPress={(noteId) => {
            if (replyingNoteId === noteId) {
              setReplyingNoteId(null);
              setReplyText('');
            } else {
              const note = notes.find((n) => n.id === noteId);
              setReplyingNoteId(noteId);
              setReplyText(note ? `@${note.user.username} ` : '');
            }
          }}
          onReplyTextChange={setReplyText}
          onReplySubmit={() => {
            const note = notes.find((n) => n.id === replyingNoteId);
            if (note) handleReplySubmit(note);
          }}
          onRenotePress={handleRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={handleReactionToggle}
          onNotePress={(note) => {
            console.log('NOTE PRESSED IN APP.TSX', note.id);
            setSelectedNoteForDetail(note);
            setIsDetailModalVisible(true);
          }}
        />
      )}
      {!viewingUserId && mainTab === 'explore' && (
        <ExploreScreen
          onUserPress={(userId) => setViewingUserId(userId)}
          colors={colors}
          activeAccount={activeAccount}
          misskeyRequest={misskeyRequest}
          onNotePress={(note) => {
            setSelectedNoteForDetail(note);
            setIsDetailModalVisible(true);
          }}
          onReplyPress={(noteOrId) => {
            const note = typeof noteOrId === 'string' ? notes.find((n) => n.id === noteOrId) : noteOrId;
            if (note) {
              setSelectedNoteForDetail(note as any);
              setIsDetailModalVisible(true);
            }
          }}
          onRenotePress={handleRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={handleReactionToggle}
        />
      )}
      {!viewingUserId && mainTab === 'notifications' && (
        <NotificationsScreen
          colors={colors}
          activeAccount={activeAccount}
          misskeyRequest={misskeyRequest}
          onNotificationPress={async (noteId) => {
            try {
              if (activeAccount?.token === 'mock_token') return;
              const noteData = await misskeyRequest<any>('/api/notes/show', { noteId }, true);
              if (noteData && activeAccount) {
                const mapped = mapNote(noteData, activeAccount.host);
                setSelectedNoteForDetail(mapped);
                setIsDetailModalVisible(true);
              }
            } catch (e) {
              console.error('Failed to fetch note detail for notification', e);
            }
          }}
          onUserPress={(userId) => setViewingUserId(userId)}
        />
      )}
      {(viewingUserId || mainTab === 'profile') && (
        <ProfileScreen
          viewingUserId={viewingUserId}
          onBack={viewingUserId ? () => setViewingUserId(null) : undefined}
          onUserPress={(userId) => setViewingUserId(userId)}
          colors={colors}
          activeAccount={activeAccount}
          misskeyRequest={misskeyRequest}
          onNotePress={(note) => {
            setSelectedNoteForDetail(note);
            setIsDetailModalVisible(true);
          }}
          onReplyPress={(noteOrId) => {
            if (typeof noteOrId === 'object' && noteOrId !== null && 'id' in noteOrId) {
              setSelectedNoteForDetail(noteOrId as any);
              setIsDetailModalVisible(true);
            } else if (typeof noteOrId === 'string') {
              const note = notes.find((n) => n.id === noteOrId);
              if (note) {
                setSelectedNoteForDetail(note as any);
                setIsDetailModalVisible(true);
              }
            }
          }}
          onRenotePress={handleRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={handleReactionToggle}
        />
      )}

      <NoteDetailModal
        visible={isDetailModalVisible}
        note={selectedNoteForDetail}
        colors={colors}
        activeAccountHost={activeAccount?.host || ''}
        misskeyRequest={misskeyRequest}
        onShowToast={showToast}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedNoteForDetail(null);
        }}
        onReactionPress={handleReactionToggle}
        onRenotePress={handleRenoteOptions}
        onSharePress={handleShare}
        onReplySubmitSuccess={() => {
          if (mainTab === 'home' || mainTab === 'profile') {
            loadTimeline(true);
          }
        }}
        onUserPress={(userId) => {
          setIsDetailModalVisible(false);
          setViewingUserId(userId);
        }}
      />

      <QuoteComposerModal
        visible={isQuoteComposerVisible}
        note={quotingNote}
        colors={colors}
        onClose={() => {
          setIsQuoteComposerVisible(false);
          setQuotingNote(null);
        }}
        onSubmit={handleQuoteSubmit}
      />

      <RenoteOptionsModal
        visible={isRenoteOptionsVisible}
        note={selectedNoteForRenote}
        colors={colors}
        onClose={() => {
          setIsRenoteOptionsVisible(false);
          setSelectedNoteForRenote(null);
        }}
        onRenote={performPureRenote}
        onQuote={(note) => {
          setQuotingNote(note);
          setIsQuoteComposerVisible(true);
        }}
      />

      <ReactionPickerModal
        visible={isReactionPickerVisible}
        note={selectedNoteForReaction}
        colors={colors}
        onClose={() => {
          setIsReactionPickerVisible(false);
          setSelectedNoteForReaction(null);
        }}
        onSelectReaction={(note, reaction) => {
          performReaction(note, reaction);
        }}
      />

      <ConfirmModal
        visible={isLogoutConfirmVisible}
        title="ログアウト"
        message={`${activeAccount?.displayName || 'このアカウント'} を削除しますか？`}
        confirmText="ログアウト"
        isDanger={true}
        colors={colors}
        onConfirm={confirmLogout}
        onClose={() => setIsLogoutConfirmVisible(false)}
      />

      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        isError={toast.isError}
        colors={colors}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {devMode ? (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle}>Dev mode</Text>
          <Text style={styles.devText}>accountId: {activeAccount.id}</Text>
          <Text style={styles.devText}>host: {activeAccount.host}</Text>
          <Text style={styles.devText}>tab: {activeTab}</Text>
          <Text style={styles.devText}>WS: {isConnected ? 'Connected' : 'Disconnected'}</Text>
          <Text style={styles.devText}>lastPath: {debug.lastPath || '-'}</Text>
          <Text style={styles.devText}>lastStatus: {debug.lastStatus ?? '-'}</Text>
          <Text style={styles.devText}>lastError: {debug.lastError ?? '-'}</Text>
        </View>
      ) : null}

      {activeAccount && (
        <FAB onPress={() => setIsNoteComposerVisible(true)} colors={colors} />
      )}
      
      <BottomNavigation activeTab={mainTab} onTabChange={(tab) => { setMainTab(tab); setViewingUserId(null); }} colors={colors} />

      <NoteComposerModal
        visible={isNoteComposerVisible}
        colors={colors}
        activeAccount={activeAccount}
        onClose={() => setIsNoteComposerVisible(false)}
        onSubmit={async (text, cw, visibility, fileIds) => {
          try {
            await misskeyRequest('/api/notes/create', { text, cw, visibility, fileIds: fileIds.length > 0 ? fileIds : undefined }, true);
            showToast('投稿しました');
          } catch (e) {
            showToast('投稿に失敗しました', undefined, true);
          }
        }}
      />
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tabButton, active && styles.tabButtonActive, active && { backgroundColor: colors.tabActiveBg }, pressed && styles.buttonPressed]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, { color: colors.tabText }, active && styles.tabButtonTextActive, active && { color: colors.tabActiveText }]}>{label}</Text>
    </Pressable>
  );
}


// Helper functions imported from formatting utilities
