import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Pressable, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import { useGlobalState } from '../../src/context/GlobalState';
import { useInteractionState } from '../../src/context/InteractionState';
import { useMisskey, useMisskeyStream } from '../../src/hooks';
import { Timeline, TabBar, FAB } from '../../src/components';
import { TimelineTab, TimelineNote } from '../../src/utils/types';
import { mapNote } from '../../src/utils/formatting';
import { normalizeMisskeyReactionInput } from '../../src/utils/misskeyApi';
import { styles } from '../../src/styles/styles';
import { StatusBar } from 'expo-status-bar';

const DEFAULT_HOST = "misskey.io";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors, openImageViewer } = useGlobalState();
  const { openReactionPicker, openRenoteOptions, setIsNoteComposerVisible, showToast, refreshTrigger } = useInteractionState();
  const { misskeyRequest } = useMisskey(activeAccount);
  const { isConnected, lastMessage } = useMisskeyStream(activeAccount);

  const [activeTab, setActiveTab] = useState<TimelineTab>('home');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Load Timeline
  const loadTimeline = useCallback(
    async (isRefresh = false) => {
      if (!activeAccount) return;
      if (isRefresh) setRefreshing(true);
      else setLoadingTimeline(true);

      setTimelineError(null);
      try {
        if (activeAccount.token === 'mock_token') {
          const res = await misskeyRequest<any[]>('notes/timeline', {}, true);
          setNotes(res.map((n) => mapNote(n, activeAccount.host)));
          return;
        }

        const endpoint =
          activeTab === 'home'
            ? '/api/notes/timeline'
            : activeTab === 'local'
            ? '/api/notes/local-timeline'
            : '/api/notes/global-timeline';

        const res = await misskeyRequest<any[]>(endpoint, { limit: 20 }, true);
        setNotes(res.map((n) => mapNote(n, activeAccount.host)));
      } catch (e: any) {
        setTimelineError(e.message || 'タイムラインの取得に失敗しました');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoadingTimeline(false);
      }
    },
    [activeAccount, activeTab, misskeyRequest]
  );

  useEffect(() => {
    loadTimeline(false);
  }, [activeAccount, activeTab, refreshTrigger]);

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
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
        showToast('成功', 'リアクションを解除しました。');
      } else {
        const normalizedReaction = normalizeMisskeyReactionInput(target.emoji);
        if (!normalizedReaction) return;
        await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: normalizedReaction }, true);
        showToast('成功', 'リアクションしました。');
      }
      loadTimeline(true);
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.channelId === activeTab) {
        setNotes((prev) => {
          const exists = prev.find(n => n.id === lastMessage.note.id);
          if (exists) return prev;
          return [mapNote(lastMessage.note, activeAccount?.host || DEFAULT_HOST), ...prev];
        });
      }
    }
  }, [lastMessage, activeAccount?.host, activeTab]);

  const handleNotePress = (note: TimelineNote) => {
    router.push(`/note/${note.id}`);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${encodeURIComponent(userId)}`);
  };

  if (!activeAccount) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style={colors.bg === "#ffffff" ? "light" : "dark"} />

      {/* Header component replacement logic */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.headerAccountButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/settings')}
        >
          {activeAccount.avatarUrl ? (
            <Image source={{ uri: activeAccount.avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <Ionicons name="person-circle" size={32} color={colors.textMuted} />
          )}
          <View>
            <Text style={[styles.headerAppName, { color: colors.primaryText }]}>Crispy</Text>
            <Text style={[styles.headerName, { color: colors.text }]}>{activeAccount.displayName}</Text>
            <Text style={[styles.headerMeta, { color: colors.textMuted }]}>@{activeAccount.username} · {activeAccount.host}</Text>
          </View>
          <Ionicons name="settings-outline" size={16} color={colors.textMuted} style={{ marginLeft: 'auto', padding: 8 }} />
        </Pressable>
      </View>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} colors={colors} />

      <Timeline
        notes={notes}
        isLoading={loadingTimeline}
        isRefreshing={refreshing}
        error={timelineError}
        replyingNoteId={null}
        replyText={""}
        isSendingReply={false}
        colors={colors}
        onRefresh={() => loadTimeline(true)}
        onReplyPress={() => {}}
        onReplyTextChange={() => {}}
        onReplySubmit={() => {}}
        onRenotePress={openRenoteOptions}
        onSharePress={handleShare}
        onReactionPress={(note, index) => handleReactionToggle(note, index)}
        onNotePress={handleNotePress}
        onUserPress={handleUserPress}
        onImagePress={openImageViewer}
        onReferencedNotePress={(noteId) => router.push(`/note/${noteId}`)}
      />
      <FAB onPress={() => setIsNoteComposerVisible(true)} colors={colors} />
    </View>
  );
}
