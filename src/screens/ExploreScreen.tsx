import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Timeline } from '../components/Timeline';
import { ColorScheme, TimelineNote, StoredAccount } from '../utils/types';
import { mapNote } from '../utils/formatting';
import { Ionicons } from '@expo/vector-icons';

export function ExploreScreen({
  colors,
  activeAccount,
  misskeyRequest,
  onNotePress,
  onReplyPress,
  onRenotePress,
  onSharePress,
  onReactionPress,
  onUserPress,
}: {
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
  onNotePress: (note: TimelineNote) => void;
  onReplyPress: (noteOrId: string | TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;
  onSharePress: (note: TimelineNote) => void;
  onReactionPress: (noteOrId: string | TimelineNote, index: number) => void;
  onUserPress?: (userId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !activeAccount) return;
    setLoading(true);
    try {
      const data = await misskeyRequest<any[]>('/api/notes/search', { query: query.trim(), limit: 30 }, true);
      setNotes(data.map(n => mapNote(n, activeAccount.host)));
      setSearched(true);
    } catch (e) {
      console.error('Failed to search notes:', e);
    } finally {
      setLoading(false);
    }
  }, [query, activeAccount, misskeyRequest]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.searchBarContainer, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.bg }]}
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
        <View style={styles.center}>
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
          onNotePress={onNotePress}
          onReplyPress={onReplyPress}
          onRenotePress={onRenotePress}
          onSharePress={onSharePress}
          onReactionPress={onReactionPress}
          onUserPress={onUserPress}
        />
      ) : searched ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>ノートが見つかりませんでした</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>キーワードを入力して検索できます</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
