import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type TimelineTab = 'home' | 'local' | 'global';

type ReactionChip = {
  emoji: string;
  count: number;
  reacted: boolean;
  isCustom?: boolean;
};

type TimelineNote = {
  id: string;
  user: {
    name: string;
    username: string;
    host: string;
    avatar: string;
  };
  content: string;
  time: string;
  renote: {
    user: string;
  } | null;
  reactions: ReactionChip[];
  replies: number;
  renotes: number;
};

type MisskeyUser = {
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

const DEFAULT_HOST = 'misskey.io';

export default function App() {
  const [activeTab, setActiveTab] = useState<TimelineTab>('local');
  const [serverHostInput, setServerHostInput] = useState(DEFAULT_HOST);
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [host, setHost] = useState(DEFAULT_HOST);
  const [apiToken, setApiToken] = useState('');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedHost = useMemo(() => normalizeHost(host), [host]);

  const tabStyles = useMemo(
    () => ({
      home: activeTab === 'home' ? styles.tabButtonActiveHome : null,
      local: activeTab === 'local' ? styles.tabButtonActiveLocal : null,
      global: activeTab === 'global' ? styles.tabButtonActiveGlobal : null,
    }),
    [activeTab]
  );

  const misskeyRequest = useCallback(
    async <T,>(
      path: string,
      payload: Record<string, unknown>,
      requiresAuth = false
    ): Promise<T> => {
      const baseUrl = `https://${normalizedHost}`;
      const body: Record<string, unknown> = { ...payload };

      if (apiToken) {
        body.i = apiToken;
      }

      if (requiresAuth && !apiToken) {
        throw new Error('HOME タイムラインには API トークンが必要です。');
      }

      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Misskey API error: ${response.status}`);
      }

      return (await response.json()) as T;
    },
    [apiToken, normalizedHost]
  );

  const loadTimeline = useCallback(
    async (tab: TimelineTab, useRefreshing = false) => {
      if (useRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const endpointMap: Record<TimelineTab, string> = {
          home: '/api/notes/timeline',
          local: '/api/notes/local-timeline',
          global: '/api/notes/global-timeline',
        };

        const data = await misskeyRequest<MisskeyNote[]>(
          endpointMap[tab],
          {
            limit: 20,
            allowPartial: false,
            withFiles: false,
            withReplies: true,
            withRenotes: true,
          },
          tab === 'home'
        );

        setNotes(data.map((note) => mapMisskeyNote(note, normalizedHost)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load timeline.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [misskeyRequest, normalizedHost]
  );

  const handleConnect = () => {
    const cleanedHost = normalizeHost(serverHostInput);
    if (!cleanedHost) {
      setError('Misskey サーバーのホスト名を入力してください。');
      return;
    }
    setHost(cleanedHost);
    setApiToken(apiTokenInput.trim());
  };

  useEffect(() => {
    loadTimeline(activeTab);
  }, [host, apiToken, activeTab, loadTimeline]);

  const handleReactionClick = async (noteId: string, reactionIndex: number) => {
    if (!apiToken) {
      Alert.alert('API トークンが必要です', 'リアクション操作には Misskey API トークンが必要です。');
      return;
    }

    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    const reaction = note.reactions[reactionIndex];
    if (!reaction) return;

    const nextReacted = !reaction.reacted;

    setNotes((currentNotes) =>
      currentNotes.map((item) => {
        if (item.id !== noteId) return item;
        const updated = [...item.reactions];
        const target = updated[reactionIndex];
        if (!target) return item;
        updated[reactionIndex] = {
          ...target,
          reacted: nextReacted,
          count: Math.max(0, target.count + (nextReacted ? 1 : -1)),
        };
        return { ...item, reactions: updated };
      })
    );

    try {
      if (nextReacted) {
        await misskeyRequest('/api/notes/reactions/create', {
          noteId,
          reaction: reaction.emoji,
        }, true);
      } else {
        await misskeyRequest('/api/notes/reactions/delete', {
          noteId,
          reaction: reaction.emoji,
        }, true);
      }
    } catch (err) {
      setNotes((currentNotes) =>
        currentNotes.map((item) => {
          if (item.id !== noteId) return item;
          const updated = [...item.reactions];
          const target = updated[reactionIndex];
          if (!target) return item;
          updated[reactionIndex] = {
            ...target,
            reacted: reaction.reacted,
            count: reaction.count,
          };
          return { ...item, reactions: updated };
        })
      );
      const message = err instanceof Error ? err.message : 'Reaction update failed.';
      Alert.alert('リアクション更新に失敗', message);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarGlowWrap}>
              <View style={styles.avatarGlow} />
              <Image source={{ uri: meAvatar }} style={styles.myAvatar} resizeMode="cover" />
            </View>

            <Text style={styles.logoText}>Crispy</Text>

            <Pressable style={styles.menuButton}>
              <Ionicons name="menu" size={20} color="#cbd5e1" />
            </Pressable>
          </View>

          <View style={styles.connectionPanel}>
            <TextInput
              value={serverHostInput}
              onChangeText={setServerHostInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="misskey.io"
              placeholderTextColor="#64748b"
              style={styles.input}
            />
            <TextInput
              value={apiTokenInput}
              onChangeText={setApiTokenInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="API token (optional for local/global)"
              placeholderTextColor="#64748b"
              style={styles.input}
            />
            <Pressable onPress={handleConnect} style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          </View>

          <View style={styles.tabCapsule}>
            <Pressable onPress={() => setActiveTab('home')} style={[styles.tabButton, tabStyles.home]}>
              <Ionicons
                name="home-outline"
                size={14}
                color={activeTab === 'home' ? '#A3E635' : '#64748b'}
              />
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActiveHome]}>HOME</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('local')} style={[styles.tabButton, tabStyles.local]}>
              <Ionicons
                name="flash-outline"
                size={14}
                color={activeTab === 'local' ? '#FACC15' : '#64748b'}
              />
              <Text style={[styles.tabLabel, activeTab === 'local' && styles.tabLabelActiveLocal]}>LOCAL</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('global')} style={[styles.tabButton, tabStyles.global]}>
              <Ionicons
                name="earth-outline"
                size={14}
                color={activeTab === 'global' ? '#22D3EE' : '#64748b'}
              />
              <Text style={[styles.tabLabel, activeTab === 'global' && styles.tabLabelActiveGlobal]}>
                GLOBAL
              </Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#A3E635" />
            <Text style={styles.loadingText}>Loading {activeTab} timeline...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.timeline}
            contentContainerStyle={styles.timelineContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadTimeline(activeTab, true)}
                tintColor="#A3E635"
              />
            }
          >
            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                {note.renote && (
                  <View style={styles.renoteLabel}>
                    <Ionicons name="repeat" size={12} color="#34d399" />
                    <Text style={styles.renoteText}>{note.renote.user} がリノート</Text>
                  </View>
                )}

                <View style={styles.noteRow}>
                  <Image source={{ uri: note.user.avatar }} style={styles.noteAvatar} />

                  <View style={styles.noteMain}>
                    <View style={styles.noteHead}>
                      <Text style={styles.noteName} numberOfLines={1}>
                        {note.user.name}
                      </Text>
                      <Text style={styles.noteUsername} numberOfLines={1}>
                        {note.user.username}
                      </Text>
                      <Text style={styles.hostChip}>@{note.user.host}</Text>
                    </View>

                    <Text style={styles.noteContent}>{note.content}</Text>

                    <View style={styles.reactionDeck}>
                      {note.reactions.map((reaction, index) => (
                        <Pressable
                          key={`${note.id}-${reaction.emoji}-${index}`}
                          onPress={() => handleReactionClick(note.id, index)}
                          style={[styles.reactionButton, reaction.reacted && styles.reactionButtonActive]}
                        >
                          <Text style={reaction.isCustom ? styles.reactionEmojiCustom : styles.reactionEmoji}>
                            {reaction.emoji}
                          </Text>
                          <Text style={styles.reactionCount}>{reaction.count}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.actionRow}>
                      <View style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
                        <Text style={styles.actionText}>{note.replies > 0 ? note.replies : ''}</Text>
                      </View>
                      <View style={styles.actionButton}>
                        <Ionicons name="repeat" size={16} color="#94a3b8" />
                        <Text style={styles.actionText}>{note.renotes > 0 ? note.renotes : ''}</Text>
                      </View>
                      <View style={styles.actionButton}>
                        <Ionicons name="heart-outline" size={16} color="#94a3b8" />
                      </View>
                      <View style={styles.actionButtonRight}>
                        <Ionicons name="ellipsis-horizontal" size={16} color="#94a3b8" />
                      </View>
                    </View>

                    <Text style={styles.timeLabel}>{note.time}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color="#0f172a" />
        </Pressable>

        <View style={styles.bottomNavWrap}>
          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavItemActive}>
              <View style={styles.bottomNavHomeBubble}>
                <Ionicons name="home" size={20} color="#a3e635" />
              </View>
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <MaterialCommunityIcons name="pound" size={20} color="#94a3b8" />
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <View>
                <Ionicons name="notifications-outline" size={20} color="#94a3b8" />
                <View style={styles.notifyDot} />
              </View>
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <Image source={{ uri: meAvatar }} style={styles.profileAvatar} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function normalizeHost(rawHost: string): string {
  return rawHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
}

function toRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  return `${day}日前`;
}

function mapMisskeyNote(note: MisskeyNote, defaultHost: string): TimelineNote {
  const display = note.renote && !note.text ? note.renote : note;

  const contentParts = [display.cw, display.text].filter(Boolean) as string[];
  const reactions = Object.entries(display.reactions ?? {}).map(([emoji, count]) => ({
    emoji,
    count,
    reacted: display.myReaction === emoji,
    isCustom: emoji.startsWith(':'),
  }));

  return {
    id: note.id,
    user: {
      name: display.user.name || display.user.username,
      username: `@${display.user.username}`,
      host: display.user.host || defaultHost,
      avatar: display.user.avatarUrl || meAvatar,
    },
    content: contentParts.length > 0 ? contentParts.join('\n') : '(no text)',
    time: toRelativeTime(display.createdAt),
    renote: note.renote
      ? {
          user: note.user.name || note.user.username,
        }
      : null,
    reactions,
    replies: display.repliesCount ?? 0,
    renotes: display.renoteCount ?? 0,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#0f172a',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarGlowWrap: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#84cc16',
    opacity: 0.35,
    transform: [{ scale: 1.15 }],
  },
  myAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#A3E635',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionPanel: {
    gap: 6,
    marginBottom: 10,
  },
  input: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0b1324',
    color: '#e2e8f0',
    paddingHorizontal: 10,
    fontSize: 12,
  },
  connectButton: {
    height: 34,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  tabCapsule: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonActiveHome: {
    backgroundColor: '#1e293b',
  },
  tabButtonActiveLocal: {
    backgroundColor: '#1e293b',
  },
  tabButtonActiveGlobal: {
    backgroundColor: '#1e293b',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  tabLabelActiveHome: {
    color: '#A3E635',
  },
  tabLabelActiveLocal: {
    color: '#FACC15',
  },
  tabLabelActiveGlobal: {
    color: '#22D3EE',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  errorCard: {
    backgroundColor: '#7f1d1d66',
    borderColor: '#ef444444',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 12,
  },
  noteCard: {
    backgroundColor: '#1e293b88',
    borderWidth: 1,
    borderColor: '#334155aa',
    borderRadius: 24,
    padding: 14,
  },
  renoteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 4,
  },
  renoteText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#334155',
  },
  noteMain: {
    flex: 1,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  noteName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 90,
  },
  noteUsername: {
    color: '#94a3b8',
    fontSize: 11,
    maxWidth: 72,
  },
  hostChip: {
    color: '#cbd5e1',
    backgroundColor: '#334155',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noteContent: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  reactionDeck: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#02061788',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 6,
    marginBottom: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#33415588',
    borderRadius: 10,
  },
  reactionButtonActive: {
    backgroundColor: '#84cc1633',
    borderWidth: 1,
    borderColor: '#84cc1650',
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionEmojiCustom: {
    fontSize: 10,
    color: '#e2e8f0',
    backgroundColor: '#1e293b',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reactionCount: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 22,
  },
  actionButtonRight: {
    marginLeft: 'auto',
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  timeLabel: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 10,
  },
  bottomSpacer: {
    height: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#84cc16',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 30,
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    zIndex: 25,
  },
  bottomNav: {
    height: 64,
    borderRadius: 24,
    backgroundColor: '#1e293bee',
    borderWidth: 1,
    borderColor: '#33415588',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavItemActive: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavHomeBubble: {
    backgroundColor: '#84cc1633',
    borderRadius: 14,
    padding: 8,
  },
  notifyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ec4899',
    position: 'absolute',
    right: -2,
    top: -1,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
  },
});

const meAvatar =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Poteto&backgroundColor=b6e3f4';
