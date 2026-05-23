import { ActivityIndicator, Pressable, RefreshControl, FlatList, Text, View } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme, TimelineNote } from '../utils/types';
import { Note } from './Note';

export function Timeline({
  notes,
  isLoading,
  isRefreshing,
  error,
  replyingNoteId,
  replyText,
  isSendingReply,
  colors,
  onRefresh,
  onReplyPress,
  onReplyTextChange,
  onReplySubmit,
  onRenotePress,
  onSharePress,
  onReactionPress,
  onNotePress,
  onUserPress,
}: {
  notes: TimelineNote[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  replyingNoteId: string | null;
  replyText: string;
  isSendingReply: boolean;
  colors: ColorScheme;
  onRefresh: () => void;
  onReplyPress: (noteId: string) => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: () => void;
  onRenotePress: (note: TimelineNote) => void;
  onSharePress: (note: TimelineNote) => void;
  onReactionPress: (noteId: string, index: number) => void;
  onNotePress?: (note: TimelineNote) => void;
  onUserPress?: (userId: string) => void;
}) {
  if (isLoading) {
    return (
      <View style={styles.timelineLoading}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={[styles.timelineLoadingText, { color: colors.textMuted }]}>
          タイムラインを読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      style={styles.timeline}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        error ? <Text style={styles.timelineError}>{error}</Text> : null
      }
      ListEmptyComponent={
        !error ? (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              表示できるノートがありません
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              少し待ってから再読み込みしてください。
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: colors.reactionBg },
                pressed && styles.buttonPressed,
              ]}
              onPress={onRefresh}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>
                再読み込み
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item: note }) => (
        <Note
          note={note}
          isReplying={replyingNoteId === note.id}
          replyText={replyText}
          isSendingReply={isSendingReply}
          colors={colors}
          onPress={() => onNotePress?.(note)}
          onReplyPress={() => onReplyPress(note.id)}
          onReplyTextChange={onReplyTextChange}
          onReplySubmit={onReplySubmit}
          onRenotePress={() => onRenotePress(note)}
          onSharePress={() => onSharePress(note)}
          onReactionPress={(index) => onReactionPress(note.id, index)}
          onUserPress={onUserPress}
        />
      )}
    />
  );
}
