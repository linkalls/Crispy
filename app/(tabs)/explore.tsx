import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Timeline } from '../../src/components/Timeline';
import { ColorScheme, TimelineNote } from '../../src/utils/types';
import { mapNote } from '../../src/utils/formatting';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalState } from '../../src/context/GlobalState';
import { useMisskey } from '../../src/hooks';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();
  const { activeAccount, colors } = useGlobalState();
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

  if (!activeAccount) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 40 }}>
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
          onRenotePress={() => {}}
          onSharePress={() => {}}
          onReactionPress={() => {}}
          onUserPress={handleUserPress}
          onImagePress={() => {}}
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
