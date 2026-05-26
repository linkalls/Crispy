import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalState } from '../../src/context/GlobalState';
import { useMisskey } from '../../src/hooks';
import { ColorScheme, StoredAccount } from '../../src/utils/types';
import { useRouter } from 'expo-router';

// Defining inline interface since MisskeyNotification isn't exported from types
interface MisskeyNotification {
  id: string;
  type: string;
  createdAt: string;
  user?: any;
  note?: { id: string; text: string | null };
  reaction?: string;
  reactions?: Array<{ user: any; reaction: string }>;
  users?: any[];
  header?: string;
}

function getNotificationIcon(type: string): { name: string; color: string } {
  if (type.startsWith('reaction')) return { name: 'heart', color: '#f03e3e' };
  if (type.startsWith('renote')) return { name: 'repeat', color: '#20c997' };
  switch (type) {
    case 'app':
      return { name: 'information-circle', color: '#4dabf7' };
    case 'login':
      return { name: 'information-circle', color: '#4dabf7' };
    case 'reply':
      return { name: 'chatbubble', color: '#4dabf7' };
    case 'quote':
      return { name: 'chatbubble-ellipses', color: '#845ef7' };
    case 'follow':
    case 'receiveFollowRequest':
    case 'followRequestAccepted':
      return { name: 'person-add', color: '#339af0' };
    case 'mention':
      return { name: 'at', color: '#f59f00' };
    case 'pollEnded':
      return { name: 'bar-chart', color: '#20c997' };
    case 'achievementEarned':
      return { name: 'trophy', color: '#fcc419' };
    default:
      return { name: 'notifications', color: '#868e96' };
  }
}

function getNotificationMessage(type: string, reaction?: string): string {
  if (type.startsWith('reaction')) return `${reaction || ''} リアクションしました`;
  if (type.startsWith('renote')) return 'リノートしました';
  switch (type) {
    case 'app':
      return 'システムからのお知らせ';
    case 'login':
      return '新しいログインがありました';
    case 'reply':
      return '返信しました';
    case 'quote':
      return '引用しました';
    case 'follow':
      return 'フォローしました';
    case 'receiveFollowRequest':
      return 'フォローリクエストが届きました';
    case 'followRequestAccepted':
      return 'フォローリクエストが承認されました';
    case 'mention':
      return 'メンションしました';
    case 'pollEnded':
      return '投票が終了しました';
    case 'achievementEarned':
      return '実績を解除しました';
    default:
      return '通知';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { activeAccount, colors } = useGlobalState();
  const { misskeyRequest } = useMisskey(activeAccount);

  const [notifications, setNotifications] = useState<MisskeyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (!activeAccount) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeAccount.token === 'mock_token') {
        setNotifications([
          {
            id: 'notif_grouped_1',
            type: 'reaction:grouped',
            createdAt: new Date(Date.now() - 60000).toISOString(),
            reactions: [
              { user: { id: 'u0', name: 'Zack', username: 'zack', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=zack' }, reaction: '❤️' },
              { user: { id: 'u1', name: 'Alice', username: 'alice', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alice' }, reaction: '❤️' },
            ],
            note: { id: 'n0', text: 'すごい！' },
          },
          {
            id: 'notif_1',
            type: 'reaction',
            createdAt: new Date(Date.now() - 120000).toISOString(),
            user: { id: 'u1', name: 'Alice', username: 'alice', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alice', host: null },
            note: { id: 'n1', text: 'これはUIテスト用のモックノートです！' },
            reaction: '👍',
          },
        ]);
      } else {
        const data = await misskeyRequest<MisskeyNotification[]>('/api/i/notifications', { limit: 30 }, true);
        setNotifications(data);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount, misskeyRequest]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const renderNotification = ({ item }: { item: MisskeyNotification }) => {
    const icon = getNotificationIcon(item.type);

    let targetUser = item.user;
    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 0) {
      targetUser = item.reactions[item.reactions.length - 1].user;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 0) {
      targetUser = item.users[item.users.length - 1];
    }

    let reactionEmoji = item.reaction;
    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 0) {
      reactionEmoji = item.reactions[item.reactions.length - 1].reaction;
    }

    let message = getNotificationMessage(item.type, reactionEmoji);
    let userName = targetUser?.name || targetUser?.username;
    let userHost = targetUser?.host ? `@${targetUser.host}` : '';
    let suffix = '';

    if (item.type === 'app' || item.type === 'login') {
       userName = 'System';
       message = item.header || message;
    }
    userName = userName || '不明';

    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 1) {
      suffix = ` ほか${item.reactions.length - 1}人`;
      message = `${item.reactions.length}件のリアクション`;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 1) {
      suffix = ` ほか${item.users.length - 1}人`;
      message = `${item.users.length}件のリノート`;
    }

    return (
      <Pressable
        style={[localStyles.notifItem, { borderBottomColor: colors.border }]}
        onPress={() => { if (item.note?.id) router.push(`/note/${item.note.id}`); }}
      >
        <View style={localStyles.iconWrap}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <Pressable onPress={() => { if (targetUser?.id) router.push(`/user/${targetUser.id}`); }}>
          <Image
            source={{ uri: targetUser?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
            style={localStyles.avatar}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[localStyles.userName, { color: colors.text }]} numberOfLines={1}>
            {userName}
            {(targetUser?.username || suffix) && (
              <Text style={{ color: colors.textMuted, fontWeight: '400', fontSize: 13 }}>
                {suffix} {targetUser?.username ? `@${targetUser.username}${userHost}` : ''}
              </Text>
            )}
          </Text>
          <Text style={[localStyles.message, { color: colors.textMuted }]}>{message}</Text>
          {item.note?.text && (
            <Text style={[localStyles.notePreview, { color: colors.text }]} numberOfLines={2}>
              {item.note.text}
            </Text>
          )}
          <Text style={[localStyles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </Pressable>
    );
  };

  if (!activeAccount) return null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 40 }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 16 }}>通知はありません</Text>
          </View>
        }
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginTop: 2,
  },
  notePreview: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
});
