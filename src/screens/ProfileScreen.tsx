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
  replyingNoteId,
  replyText,
  isSendingReply,
  onNotePress,
  onReplyPress,
  onReplyTextChange,
  onReplySubmit,
  onRenotePress,
  onSharePress,
  onReactionPress,
}: {
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
  replyingNoteId?: string | null;
  replyText?: string;
  isSendingReply?: boolean;
  onNotePress?: (note: TimelineNote) => void;
  onReplyPress?: (noteId: string, username?: string) => void;
  onReplyTextChange?: (text: string) => void;
  onReplySubmit?: () => void;
  onRenotePress?: (note: TimelineNote) => void;
  onSharePress?: (note: TimelineNote) => void;
  onReactionPress?: (noteId: string, index: number) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!activeAccount) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [userInfo, userNotes] = await Promise.all([
        misskeyRequest<UserProfile>('/api/users/show', { userId: activeAccount.userId }, true),
        misskeyRequest<any[]>('/api/users/notes', { userId: activeAccount.userId, limit: 20 }, true),
      ]);
      setProfile(userInfo);
      setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount, misskeyRequest]);

  // Handle local state updates for ProfileScreen when acting on notes
  const handleReplySubmit = async () => {
    if (!replyingNoteId || !replyText) return;
    try {
      await misskeyRequest('/api/notes/create', { text: replyText, replyId: replyingNoteId }, true);
      onReplyTextChange?.('');
      onReplyPress?.(replyingNoteId); // This toggles the replying note off in App.tsx
      loadProfile(true); // reload profile after successful reply
    } catch (error) {
      console.error('Failed to reply from profile:', error);
    }
  };

  const handleReactionPress = async (noteId: string, index: number) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note || !activeAccount) return;

    const target = note.reactions[index];
    if (!target) return;

    try {
      if (target.reacted) {
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
      } else {
        await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: target.emoji }, true);
      }
      loadProfile(true);
    } catch (error) {
      console.error('Failed to react from profile:', error);
    }
  };

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

  const renderHeader = () => (
    <View>
      {/* Banner */}
      <View style={[localStyles.bannerWrap, { backgroundColor: colors.primary }]}>
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
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.followingCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロー</Text>
          </View>
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.followersCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>フォロワー</Text>
          </View>
          <View style={localStyles.statItem}>
            <Text style={[localStyles.statNumber, { color: colors.text }]}>{profile?.notesCount ?? 0}</Text>
            <Text style={[localStyles.statLabel, { color: colors.textMuted }]}>ノート</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

        <Text style={[localStyles.sectionTitle, { color: colors.text }]}>投稿</Text>
      </View>
    </View>
  );

  const renderNote = ({ item }: { item: TimelineNote }) => (
    <Note
      note={item}
      isReplying={replyingNoteId === item.id}
      replyText={replyText || ''}
      isSendingReply={isSendingReply || false}
      colors={colors}
      onPress={() => onNotePress?.(item)}
      onReplyPress={() => onReplyPress?.(item.id, item.user.username)}
      onReplyTextChange={(text) => onReplyTextChange?.(text)}
      onReplySubmit={() => handleReplySubmit()}
      onRenotePress={() => onRenotePress?.(item)}
      onSharePress={() => onSharePress?.(item)}
      onReactionPress={(index) => handleReactionPress(item.id, index)}
    />
  );

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      renderItem={renderNote}
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
