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
import { ColorScheme, StoredAccount } from '../utils/types';

type MisskeyNotification = {
  id: string;
  type: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    username: string;
    host?: string | null;
    avatarUrl?: string | null;
  };
  note?: {
    id: string;
    text?: string | null;
  };
  reaction?: string;
};

function getNotificationIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'reaction':
      return { name: 'heart', color: '#ff6b6b' };
    case 'reply':
      return { name: 'chatbubble', color: '#4dabf7' };
    case 'renote':
      return { name: 'repeat', color: '#51cf66' };
    case 'quote':
      return { name: 'chatbubble-ellipses', color: '#845ef7' };
    case 'follow':
      return { name: 'person-add', color: '#339af0' };
    case 'mention':
      return { name: 'at', color: '#f59f00' };
    case 'pollEnded':
      return { name: 'bar-chart', color: '#20c997' };
    default:
      return { name: 'notifications', color: '#868e96' };
  }
}

function getNotificationMessage(type: string, reaction?: string): string {
  switch (type) {
    case 'reaction':
      return `${reaction || ''} リアクションしました`;
    case 'reply':
      return '返信しました';
    case 'renote':
      return 'リノートしました';
    case 'quote':
      return '引用しました';
    case 'follow':
      return 'フォローしました';
    case 'mention':
      return 'メンションしました';
    case 'pollEnded':
      return '投票が終了しました';
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

export function NotificationsScreen({
  colors,
  activeAccount,
  misskeyRequest,
}: {
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
}) {
  const [notifications, setNotifications] = useState<MisskeyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (!activeAccount) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Mock data for test account
      // Not mocking if we have a real token, but test account is gone. Let's just always request if no mock_token
      if (activeAccount.token === 'mock_token') {
        setNotifications([
          {
            id: 'notif_1',
            type: 'reaction',
            createdAt: new Date(Date.now() - 120000).toISOString(),
            user: { id: 'u1', name: 'Alice', username: 'alice', avatarUrl: 'https://sushi.ski/identicon/alice', host: null },
            note: { id: 'n1', text: 'これはUIテスト用のモックノートです！' },
            reaction: '👍',
          },
          {
            id: 'notif_2',
            type: 'follow',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            user: { id: 'u2', name: 'Bob', username: 'bob', avatarUrl: 'https://sushi.ski/identicon/bob', host: 'misskey.io' },
          },
          {
            id: 'notif_3',
            type: 'reply',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            user: { id: 'u3', name: 'Carol', username: 'carol', avatarUrl: 'https://sushi.ski/identicon/carol', host: null },
            note: { id: 'n2', text: 'いいですね！私もそう思います。' },
          },
          {
            id: 'notif_4',
            type: 'renote',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            user: { id: 'u4', name: 'Dave', username: 'dave', avatarUrl: 'https://sushi.ski/identicon/dave', host: null },
            note: { id: 'n3', text: 'Crispy開発中です！' },
          },
          {
            id: 'notif_5',
            type: 'mention',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            user: { id: 'u5', name: 'Eve', username: 'eve', avatarUrl: 'https://sushi.ski/identicon/eve', host: 'example.com' },
            note: { id: 'n4', text: '@testuser このアプリすごいですね！' },
          },
        ]);
      } else {
        const data = await misskeyRequest<MisskeyNotification[]>('/api/i/notifications', { limit: 30 }, true);
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
          setError("通知データの形式が不正です。");
        }
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
      setError(e instanceof Error ? e.message : '通知を読み込めませんでした。');
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
    const message = getNotificationMessage(item.type, item.reaction);
    const userName = item.user?.name || item.user?.username || '不明';
    const userHost = item.user?.host ? `@${item.user.host}` : '';

    return (
      <View style={[localStyles.notifItem, { borderBottomColor: colors.border }]}>
        <View style={localStyles.iconWrap}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <Image
          source={{ uri: item.user?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
          style={localStyles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[localStyles.userName, { color: colors.text }]} numberOfLines={1}>
            {userName}
            <Text style={{ color: colors.textMuted, fontWeight: '400', fontSize: 13 }}> @{item.user?.username}{userHost}</Text>
          </Text>
          <Text style={[localStyles.message, { color: colors.textMuted }]}>{message}</Text>
          {item.note?.text && (
            <Text style={[localStyles.notePreview, { color: colors.text }]} numberOfLines={2}>
              {item.note.text}
            </Text>
          )}
          <Text style={[localStyles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderNotification}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        error ? (
          <View style={{ padding: 16, backgroundColor: '#ffe3e3', marginHorizontal: 16, marginTop: 16, borderRadius: 8 }}>
            <Text style={{ color: '#c92a2a', fontWeight: 'bold' }}>エラーが発生しました</Text>
            <Text style={{ color: '#c92a2a', marginTop: 4 }}>{error}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        !error && !loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 16 }}>通知はありません</Text>
          </View>
        ) : null
      }
    />
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
