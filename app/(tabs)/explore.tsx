import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Timeline } from '../../src/components/Timeline';
import { ColorScheme, TimelineNote } from '../../src/utils/types';
import { mapNote } from '../../src/utils/formatting';
import { normalizeMisskeyReactionInput } from '../../src/utils/misskeyApi';
import { Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import { useGlobalState } from '../../src/context/GlobalState';
import { useInteractionState } from '../../src/context/InteractionState';
import { useMisskey } from '../../src/hooks';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors, openImageViewer } = useGlobalState();
  const { openReactionPicker, openRenoteOptions, showToast } = useInteractionState();
  const { misskeyRequest } = useMisskey(activeAccount);

  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !activeAccount) return;
    setLoading(true);
    try {
      if (activeAccount.token === 'mock_token') {
         const data = await misskeyRequest<any[]>('notes/search', { query: query.trim() }, true);
         setNotes(data.map(n => mapNote(n, activeAccount.host)));
         setSearched(true);
         return;
      }
      const data = await misskeyRequest<any[]>('/api/notes/search', { query: query.trim(), limit: 30 }, true);
      setNotes(data.map(n => mapNote(n, activeAccount.host)));
      setSearched(true);
    } catch (e) {
      console.error('Failed to search notes:', e);
    } finally {
      setLoading(false);
    }
  }, [query, activeAccount, misskeyRequest]);

  const handleNotePress = (note: TimelineNote) => {
    router.push(`/note/${note.id}`);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
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
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
        showToast('成功', 'リアクションを解除しました。');
      } else {
        const normalizedReaction = normalizeMisskeyReactionInput(target.emoji);
        if (!normalizedReaction) return;
        await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: normalizedReaction }, true);
        showToast('成功', 'リアクションしました。');
      }
      handleSearch();
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

  if (!activeAccount) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={[localStyles.searchBarContainer, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={localStyles.searchIcon} />
        <TextInput
          style={[localStyles.searchInput, { color: colors.text, backgroundColor: colors.bg }]}
          placeholder="ノートを検索"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>
      {loading ? (
        <View style={localStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notes.length > 0 ? (
        <Timeline
          notes={notes}
          isLoading={loading}
          isRefreshing={loading}
          error={null}
          replyingNoteId={null}
          replyText=""
          isSendingReply={false}
          colors={colors}
          onRefresh={handleSearch}
          onReplyTextChange={() => {}}
          onReplySubmit={() => {}}
          onNotePress={handleNotePress}
          onReplyPress={() => {}}
          onRenotePress={openRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={(note, index) => handleReactionToggle(note, index)}
          onUserPress={handleUserPress}
          onImagePress={openImageViewer}
          onReferencedNotePress={(noteId) => router.push(`/note/${noteId}`)}
        />
      ) : searched ? (
        <View style={localStyles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.border} />
          <Text style={[localStyles.emptyText, { color: colors.textMuted }]}>ノートが見つかりませんでした</Text>
        </View>
      ) : (
        <View style={localStyles.center}>
          <Ionicons name="search-outline" size={64} color={colors.border} />
          <Text style={[localStyles.emptyText, { color: colors.textMuted }]}>キーワードを入力して検索できます</Text>
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
