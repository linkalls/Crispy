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
}: {
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
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
      if (activeAccount.token === 'mock_token' || activeAccount.id === 'test-account') {
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
            user: { name: 'Test User', username: 'testuser', host: 'sushi.ski', avatar: activeAccount.avatarUrl },
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
            user: { name: 'Test User', username: 'testuser', host: 'sushi.ski', avatar: activeAccount.avatarUrl },
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
        const [userInfo, userNotes] = await Promise.all([
          misskeyRequest<UserProfile>('/api/users/show', { userId: activeAccount.userId }, true),
          misskeyRequest<any[]>('/api/users/notes', { userId: activeAccount.userId, limit: 20 }, true),
        ]);
        setProfile(userInfo);
        setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));
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
    <View style={[localStyles.noteCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Image source={{ uri: item.user.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{item.user.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>@{item.user.username} · {item.createdAtLabel}</Text>
        </View>
      </View>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
      {item.reactions.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {item.reactions.map((r, i) => (
            <View key={i} style={[localStyles.reactionChip, { backgroundColor: r.reacted ? colors.reactionActiveBg : colors.reactionBg, borderColor: r.reacted ? colors.reactionActiveBorder : colors.reactionBorder }]}>
              <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>{r.count}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          {item.replies > 0 && <Text style={{ color: colors.textMuted, fontSize: 13 }}>{item.replies}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="repeat-outline" size={16} color={colors.textMuted} />
          {item.renotes > 0 && <Text style={{ color: colors.textMuted, fontSize: 13 }}>{item.renotes}</Text>}
        </View>
      </View>
    </View>
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
