import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import * as mfm from 'mfm-js';
import { useGlobalState } from '../../src/context/GlobalState';
import { useInteractionState } from '../../src/context/InteractionState';
import { useMisskey } from '../../src/hooks';
import { Note } from '../../src/components/Note';
import { TimelineNote } from '../../src/utils/types';
import { mapNote, toggleNoteReactionLocally, incrementNoteRenoteLocally } from '../../src/utils/formatting';
import { MfmRenderer } from '../../src/components/MfmRenderer';
import { buildMisskeyEmojiMap, buildMisskeyUserLookup, normalizeMisskeyReactionInput } from '../../src/utils/misskeyApi';
import { globalEvents } from '../../src/context/InteractionState';

type UserProfile = {
  id: string;
  name?: string | null;
  username: string;
  host?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  emojis?: Array<{ name: string; url: string }>;
  followersCount: number;
  followingCount: number;
  notesCount: number;
  createdAt: string;
};

export default function ProfileScreen({ viewingUserId }: { viewingUserId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors, openImageViewer, serverEmojiMap } = useGlobalState();
  const { openReactionPicker, openRenoteOptions, showToast } = useInteractionState();
  const { misskeyRequest } = useMisskey(activeAccount);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'following' | 'followers'>('notes');
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const profileEmojiMap = buildMisskeyEmojiMap(profile?.emojis);
  const profileName = profile?.name || profile?.username || 'Unknown';

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!activeAccount) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeAccount.token === 'mock_token') {
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
        ]);
      } else {
        const targetUserIdentifier = viewingUserId || activeAccount.userId;
        const userInfo = await misskeyRequest<UserProfile>(
          '/api/users/show',
          buildMisskeyUserLookup(targetUserIdentifier),
          true,
        );
        const [userNotes, followingRes, followersRes] = await Promise.all([
          misskeyRequest<any[]>('/api/users/notes', { userId: userInfo.id, limit: 20 }, true),
          misskeyRequest<any[]>('/api/users/following', { userId: userInfo.id, limit: 30 }, true),
          misskeyRequest<any[]>('/api/users/followers', { userId: userInfo.id, limit: 30 }, true),
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
  }, [activeAccount, misskeyRequest, viewingUserId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return globalEvents.on('noteUpdated', (payload) => {
      if (payload.action === 'reaction') {
        setNotes(prev => prev.map(n => n.id === payload.noteId ? toggleNoteReactionLocally(n, payload.emoji, payload.isReacting) : n));
      } else if (payload.action === 'renote') {
        setNotes(prev => prev.map(n => n.id === payload.noteId ? incrementNoteRenoteLocally(n) : n));
      }
    });
  }, []);

  const handleNotePress = (note: TimelineNote) => {
    router.push(`/note/${note.id}`);
  };

  const handleUserPress = (userId: string) => {
    if (userId === activeAccount?.userId) return; // already here
    router.push(`/user/${encodeURIComponent(userId)}`);
  };

  const handleShare = async (note: TimelineNote) => {
    const noteUrl = `https://${note.user.host}/notes/${note.targetId}`;
    try {
      await Share.share({ message: noteUrl, url: noteUrl });
    } catch (error) {
      showToast('失敗', '共有を開始できませんでした。', true);
    }
  };

  const handleReactionToggle = async (note: TimelineNote, index: number) => {
    if (index === -1) {
      openReactionPicker(note);
      return;
    }
    const target = note.reactions[index];
    if (!target) return;
    try {
      if (target.reacted) {
        setNotes(prev => prev.map(n => n.id === note.id ? toggleNoteReactionLocally(n, target.emoji, false) : n));
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
        showToast('成功', 'リアクションを解除しました。');
      } else {
        const normalizedReaction = normalizeMisskeyReactionInput(target.emoji);
        if (!normalizedReaction) return;
        setNotes(prev => prev.map(n => n.id === note.id ? toggleNoteReactionLocally(n, target.emoji, true) : n));
        await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: normalizedReaction }, true);
        showToast('成功', 'リアクションしました。');
      }
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={[localStyles.bannerWrap, { backgroundColor: colors.primary }]}>
        {profile?.bannerUrl && (
          <Image source={{ uri: profile.bannerUrl }} style={localStyles.banner} />
        )}
      </View>
      <View style={localStyles.avatarWrap}>
        <Image
          source={{ uri: profile?.avatarUrl || activeAccount?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
          style={[localStyles.avatar, { borderColor: colors.bg }]}
        />
      </View>
      <View style={[localStyles.infoWrap, { paddingTop: 48 }]}>
        <MfmRenderer
          nodes={mfm.parse(profileName)}
          emojis={{ ...serverEmojiMap, ...profileEmojiMap }}
          colors={colors}
          textStyle={[localStyles.displayName, { color: colors.text }]}
          emojiSize={22}
        />
        <Text style={[localStyles.username, { color: colors.textMuted }]}>
          @{profile?.username}{profile?.host ? `@${profile.host}` : ''}
        </Text>
        {profile?.description && (
          <MfmRenderer
            nodes={mfm.parse(profile.description)}
            emojis={{ ...serverEmojiMap, ...profileEmojiMap }}
            colors={colors}
            textStyle={[localStyles.bio, { color: colors.text }]}
          />
        )}
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
      onPress={() => handleNotePress(item)}
      onReplyPress={() => {}}
      onReplyTextChange={() => {}}
      onReplySubmit={() => {}}
      onRenotePress={() => openRenoteOptions(item)}
      onSharePress={() => handleShare(item)}
      onReactionPress={(index) => handleReactionToggle(item, index)}
      onUserPress={handleUserPress}
      onImagePress={openImageViewer}
      onReferencedNotePress={(noteId) => router.push(`/note/${noteId}`)}
    />
  );

  const renderUser = ({ item }: { item: any }) => (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => handleUserPress(item.id)}>
      <Image source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }} style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View style={{ flex: 1 }}>
        <MfmRenderer
          nodes={mfm.parse(item.name || item.username)}
          emojis={{ ...serverEmojiMap, ...buildMisskeyEmojiMap(item.emojis) }}
          colors={colors}
          textStyle={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}
          emojiSize={18}
        />
        <Text style={{ color: colors.textMuted, fontSize: 14 }} numberOfLines={1}>@{item.username}{item.host ? `@${item.host}` : ''}</Text>
        {item.description && <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>}
      </View>
    </Pressable>
  );

  if (!activeAccount) return null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 96 }}
      data={activeTab === 'notes' ? notes : activeTab === 'following' ? following : followers}
      keyExtractor={(item) => item.id}
      renderItem={activeTab === 'notes' ? renderNote : renderUser}
      ListHeaderComponent={renderHeader}
      style={{ flex: 1, backgroundColor: colors.bg }}
      scrollIndicatorInsets={{ bottom: insets.bottom + 96 }}
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
  bannerWrap: { height: 150, width: '100%' },
  banner: { width: '100%', height: '100%' },
  avatarWrap: { position: 'absolute', top: 110, left: 16, zIndex: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4 },
  infoWrap: { paddingHorizontal: 16 },
  displayName: { fontSize: 22, fontWeight: '700' },
  username: { fontSize: 14, marginTop: 2 },
  bio: { fontSize: 15, lineHeight: 22, marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 14 },
  divider: { height: 1, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
});
