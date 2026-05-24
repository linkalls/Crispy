import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorScheme, StoredAccount, TimelineNote, ProfileTab, MisskeyUser } from '../utils/types';
import { mapNote } from '../utils/formatting';
import { Note } from '../components/Note';

type UserProfile = {
  id: string;
  name?: string | null;
  username: string;
  host?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  followersCount: number;
  followingCount: number;
  notesCount: number;
  createdAt: string;
};

export function ProfileScreen({
  colors,
  onImagePress,
  activeAccount,
  misskeyRequest,
  onNotePress,
  onReplyPress,
  onRenotePress,
  onSharePress,
  onReactionPress,
  viewingUserId,
  onBack,
  onUserPress,
}: {
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
  onNotePress?: (note: TimelineNote) => void;
  onReplyPress?: (noteOrId: string | TimelineNote) => void;
  onRenotePress?: (note: TimelineNote) => void;
  onSharePress?: (note: TimelineNote) => void;
  onReactionPress?: (noteOrId: string | TimelineNote, index: number) => void;
  viewingUserId?: string | null;
  onBack?: () => void;
  onUserPress?: (userId: string) => void;
  onImagePress?: (urls: string[], index: number) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('notes');
  const [follows, setFollows] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!activeAccount) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeAccount.token === 'mock_token') {
        // Mock profile
        setProfile({
          id: 'test',
          name: 'Test User',
          username: 'testuser',
          host: null,
          avatarUrl: activeAccount.avatarUrl,
          bannerUrl: 'https://picsum.photos/800/300',
          description: 'Crispyの開発テスト用アカウントです。\nMisskeyクライアントを開発中！🚀',
          followersCount: 42,
          followingCount: 128,
          notesCount: 256,
          createdAt: '2024-01-15T00:00:00Z',
        });
        // Mock notes
        setNotes([
          {
            id: 'my_note_1',
            targetId: 'my_note_1',
            content: 'Crispyの開発が順調に進んでいます！画像添付機能も実装しました 🎉',
            createdAtLabel: '3時間前',
            user: { id: 'test', name: 'Test User', username: 'testuser', host: 'sushi.ski', avatar: activeAccount.avatarUrl },
            renoteUser: null,
            reactions: [{ emoji: '👍', count: 3, reacted: false, isCustom: false }],
            replies: 1,
            renotes: 0,
            files: [],
            reply: null,
            quote: null,
            emojis: {},
          },
          {
            id: 'my_note_2',
            targetId: 'my_note_2',
            content: 'ボトムナビゲーションとFABを追加しました。だいぶアプリらしくなってきた！',
            createdAtLabel: '1日前',
            user: { id: 'test', name: 'Test User', username: 'testuser', host: 'sushi.ski', avatar: activeAccount.avatarUrl },
            renoteUser: null,
            reactions: [{ emoji: '🎉', count: 5, reacted: true, isCustom: false }],
            replies: 2,
            renotes: 3,
            files: [],
            reply: null,
            quote: null,
            emojis: {},
          },
        ]);
      } else {
        const targetUserId = viewingUserId || activeAccount.userId;
const [userInfo, userNotes, userFollowers, userFollowing] = await Promise.all([
          misskeyRequest<UserProfile>('/api/users/show', { userId: targetUserId }, true),
          misskeyRequest<any[]>('/api/users/notes', { userId: targetUserId, limit: 20 }, true),
          misskeyRequest<any[]>('/api/users/followers', { userId: targetUserId, limit: 20 }, true),
          misskeyRequest<any[]>('/api/users/following', { userId: targetUserId, limit: 20 }, true),
        ]);
        setProfile(userInfo);
        setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));
        setFollowers(userFollowers);
        setFollows(userFollowing);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount, misskeyRequest]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }


  const handleReactionPress = (noteOrId: string | TimelineNote, index: number) => {
    const noteId = typeof noteOrId === 'string' ? noteOrId : noteOrId.id;
    let note = typeof noteOrId === 'string' ? notes.find(n => n.id === noteId) : noteOrId;
    if (!note) return;

    if (index !== -1) {
      const target = note.reactions[index];
      if (target) {
        const nextReacted = !target.reacted;
        setNotes(current =>
          current.map(item => {
            if (item.id !== noteId) return item;
            const reactions = [...item.reactions];
            reactions[index] = {
              ...target,
              reacted: nextReacted,
              count: Math.max(0, target.count + (nextReacted ? 1 : -1)),
            };
            return { ...item, reactions };
          })
        );
      }
    }
    if (onReactionPress) onReactionPress(note, index);
  };

  const renderHeader = () => (
    <View>
      {/* Banner */}
      <View style={[localStyles.bannerWrap, { backgroundColor: colors.primary }]}>
        {onBack && (
          <Pressable
            style={localStyles.backButton}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        )}
        {profile?.bannerUrl && (
          <Image source={{ uri: profile.bannerUrl }} style={localStyles.banner} />
        )}
      </View>

      {/* Avatar overlapping banner */}
      <View style={localStyles.avatarWrap}>
        <Image
          source={{ uri: profile?.avatarUrl || activeAccount?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
          style={[localStyles.avatar, { borderColor: colors.bg }]}
        />
      </View>

      {/* Profile info */}
      <View style={[localStyles.infoWrap, { paddingTop: 48 }]}>
        <Text style={[localStyles.displayName, { color: colors.text }]}>
          {profile?.name || profile?.username || 'Unknown'}
        </Text>
        <Text style={[localStyles.username, { color: colors.textMuted }]}>
          @{profile?.username}{profile?.host ? `@${profile.host}` : ''}
        </Text>

        {profile?.description && (
          <Text style={[localStyles.description, { color: colors.text }]}>
            {profile.description}
          </Text>
        )}

        {/* Stats */}
        <View style={localStyles.statsRow}>
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statCount, { color: colors.text }]}>{profile?.followingCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロー</Text>
          </View>
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statCount, { color: colors.text }]}>{profile?.followersCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロワー</Text>
          </View>
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statCount, { color: colors.text }]}>{profile?.notesCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>ノート</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

        <Text style={[localStyles.sectionTitle, { color: colors.text }]}>投稿</Text>
      </View>

      <View style={localStyles.tabContainer}>
        <Pressable onPress={() => setActiveTab('notes')} style={[localStyles.tabButton, activeTab === 'notes' && localStyles.activeTabButton, activeTab === 'notes' && { borderBottomColor: colors.primary }]}>
          <Text style={[localStyles.tabText, { color: activeTab === 'notes' ? colors.primary : colors.textMuted }]}>ノート</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('follows')} style={[localStyles.tabButton, activeTab === 'follows' && localStyles.activeTabButton, activeTab === 'follows' && { borderBottomColor: colors.primary }]}>
          <Text style={[localStyles.tabText, { color: activeTab === 'follows' ? colors.primary : colors.textMuted }]}>フォロー</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('followers')} style={[localStyles.tabButton, activeTab === 'followers' && localStyles.activeTabButton, activeTab === 'followers' && { borderBottomColor: colors.primary }]}>
          <Text style={[localStyles.tabText, { color: activeTab === 'followers' ? colors.primary : colors.textMuted }]}>フォロワー</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'notes') {
      return (
        <Note
          note={item as TimelineNote}
          isReplying={false}
          replyText=""
          isSendingReply={false}
          colors={colors}
          onPress={() => onNotePress?.(item as TimelineNote)}
          onReplyPress={() => onReplyPress?.(item as TimelineNote)}
          onReplyTextChange={() => {}}
          onReplySubmit={() => {}}
          onRenotePress={() => onRenotePress?.(item as TimelineNote)}
          onSharePress={() => onSharePress?.(item as TimelineNote)}
          onReactionPress={(index) => handleReactionPress(item.id, index)}
          onUserPress={onUserPress}
          onImagePress={onImagePress}
        />
      );
    }

    const user = activeTab === 'follows' ? item.followee : item.follower;
    if (!user) return null;
    return (
      <Pressable style={[localStyles.userCard, { borderBottomColor: colors.border }]} onPress={() => onUserPress?.(user.id)}>
        <Image source={{ uri: user.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }} style={localStyles.userAvatar} />
        <View style={localStyles.userInfo}>
          <Text style={[localStyles.userName, { color: colors.text }]} numberOfLines={1}>{user.name || user.username}</Text>
          <Text style={[localStyles.userMeta, { color: colors.textMuted }]} numberOfLines={1}>@{user.username}{user.host ? `@${user.host}` : ''}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={activeTab === 'notes' ? notes : (activeTab === 'follows' ? follows : followers)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>投稿はまだありません</Text>
        </View>
      }
    />
  );
}




const localStyles = StyleSheet.create({
  bannerWrap: {
    height: 150,
    width: '100%',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    top: 110,
    left: 16,
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  infoWrap: {
    paddingHorizontal: 16,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    marginTop: 2,
  },
  descriptionWrap: {
    marginTop: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: 'bold',
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  userMeta: {
    fontSize: 13,
  }
});
