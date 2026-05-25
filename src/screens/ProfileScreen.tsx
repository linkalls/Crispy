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
import { ColorScheme, StoredAccount, TimelineNote } from '../utils/types';
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
  onImagePress,
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
  onImagePress?: (media: { url: string; thumbnailUrl?: string; type?: string }[], index: number) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'following' | 'followers'>('notes');
  const [following, setFollowing] = useState<any[]>([]);
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
        const [userInfo, userNotes, followingRes, followersRes] = await Promise.all([
          misskeyRequest<UserProfile>('/api/users/show', { userId: targetUserId }, true),
          misskeyRequest<any[]>('/api/users/notes', { userId: targetUserId, limit: 20 }, true),
          misskeyRequest<any[]>('/api/users/following', { userId: targetUserId, limit: 30 }, true),
          misskeyRequest<any[]>('/api/users/followers', { userId: targetUserId, limit: 30 }, true),
        ]);
        setProfile(userInfo);
        setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));
        setFollowing(followingRes.map((f: any) => f.followee));
        setFollowers(followersRes.map((f: any) => f.follower));
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
          <Text style={[localStyles.bio, { color: colors.text }]}>
            {profile.description}
          </Text>
        )}

        {/* Stats */}
        <View style={localStyles.statsRow}>
          <Pressable style={localStyles.statItem} onPress={() => setActiveTab('following')}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.followingCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロー</Text>
          </Pressable>
          <Pressable style={localStyles.statItem} onPress={() => setActiveTab('followers')}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.followersCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロワー</Text>
          </Pressable>
          <Pressable style={localStyles.statItem} onPress={() => setActiveTab('notes')}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.notesCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>ノート</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
          <Pressable onPress={() => setActiveTab('notes')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'notes' ? colors.primary : colors.textMuted }]}>投稿</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('following')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'following' ? colors.primary : colors.textMuted }]}>フォロー</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('followers')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'followers' ? colors.primary : colors.textMuted }]}>フォロワー</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderNote = ({ item }: { item: TimelineNote }) => (
    <Note
      note={item}
      isReplying={false}
      replyText=""
      isSendingReply={false}
      colors={colors}
      onPress={() => onNotePress?.(item)}
      onReplyPress={() => onReplyPress?.(item)}
      onReplyTextChange={() => {}}
      onReplySubmit={() => {}}
      onRenotePress={() => onRenotePress?.(item)}
      onSharePress={() => onSharePress?.(item)}
      onReactionPress={(index) => handleReactionPress(item, index)}
      onUserPress={onUserPress}
      onImagePress={onImagePress}
    />
  );

  const renderUser = ({ item }: { item: any }) => (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => onUserPress?.(item.id)}>
      <Image source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }} style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }} numberOfLines={1}>{item.name || item.username}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }} numberOfLines={1}>@{item.username}{item.host ? `@${item.host}` : ''}</Text>
        {item.description && <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>}
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={activeTab === 'notes' ? notes : activeTab === 'following' ? following : followers}
      keyExtractor={(item) => item.id}
      renderItem={activeTab === 'notes' ? renderNote : renderUser}
      ListHeaderComponent={renderHeader}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>{activeTab === 'notes' ? '投稿はまだありません' : 'ユーザーがいません'}</Text>
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
    fontWeight: '700',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
});
