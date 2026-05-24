import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorScheme, TimelineNote, MisskeyNote } from "../utils/types";
import { MfmRenderer } from "./MfmRenderer";
import { ReplyComposer } from "./ReplyComposer";
import { mapNote } from "../utils/formatting";
import * as mfm from "mfm-js";

export function NoteDetailModal({
  visible,
  note,
  colors,
  activeAccountHost,
  misskeyRequest,
  onClose,
  onReactionPress,
  onReactionListPress,
  onRenotePress,
  onSharePress,
  onReplySubmitSuccess,
  onShowToast,
  onUserPress,
}: {
  visible: boolean;
  note: TimelineNote | null;
  colors: ColorScheme;
  activeAccountHost: string;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
  onClose: () => void;
  onReactionPress: (noteOrId: string | TimelineNote, reactionIndex: number) => Promise<void>;
  onReactionListPress?: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;
  onSharePress: (note: TimelineNote) => void;
  onReplySubmitSuccess: () => void;
  onShowToast: (title: string, msg?: string, isErr?: boolean) => void;
  onUserPress?: (userId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [replies, setReplies] = useState<TimelineNote[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchReplies = useCallback(async () => {
    if (!note) return;
    try {
      setLoadingReplies(true);
      const data = await misskeyRequest<MisskeyNote[]>("/api/notes/children", {
        noteId: note.id,
        limit: 30,
      }, true);
      setReplies(data.map((item) => mapNote(item, activeAccountHost)));
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  }, [note, misskeyRequest, activeAccountHost]);

  useEffect(() => {
    if (visible && note) {
      fetchReplies();
      setReplyText(`@${note.user.username} `);
    } else {
      setReplies([]);
    }
  }, [visible, note, fetchReplies]);

  if (!note) return null;

  const handleReplySubmit = async () => {
    const text = replyText.trim();
    if (!text) return;
    try {
      setSendingReply(true);
      await misskeyRequest("/api/notes/create", { text, replyId: note.targetId }, true);
      setReplyText(`@${note.user.username} `);
      onShowToast("成功", "返信を送信しました。");
      fetchReplies();
      onReplySubmitSuccess();
    } catch (error) {
      onShowToast("失敗", error instanceof Error ? error.message : "返信に失敗しました。", true);
    } finally {
      setSendingReply(false);
    }
  };

  const handleModalReactionPress = async (targetNoteId: string, index: number) => {
    // Call parent handler
    await onReactionPress(targetNoteId, index);
    
    // Update local state if the reaction is on the main note or inside replies
    if (note.id === targetNoteId) {
      // Parents handle main note state, but we can refetch replies or just update locally if needed
    } else {
      setReplies((current) =>
        current.map((item) => {
          if (item.id !== targetNoteId) return item;
          const reactions = [...item.reactions];
          const reaction = reactions[index];
          if (!reaction) return item;
          const nextReacted = !reaction.reacted;
          reactions[index] = {
            ...reaction,
            reacted: nextReacted,
            count: Math.max(0, reaction.count + (nextReacted ? 1 : -1)),
          };
          return { ...item, reactions };
        })
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.headerBg }]}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-down" size={24} color={colors.text} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>スレッド</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* 1. Parent Note (if exists) */}
            {note.reply && (
              <View style={styles.threadConnectorRow}>
                <View style={styles.leftCol}>
                  <Image source={{ uri: note.reply.user.avatar }} style={styles.threadAvatar} />
                  <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
                </View>
                <View style={styles.rightCol}>
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteName, { color: colors.text }]} numberOfLines={1}>
                      {note.reply.user.name}
                    </Text>
                    <Text style={[styles.noteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      @{note.reply.user.username}@{note.reply.user.host} · {note.reply.createdAtLabel}
                    </Text>
                  </View>
                  <MfmRenderer nodes={mfm.parse(note.reply.content)} emojis={note.reply.emojis} colors={colors} />
                </View>
              </View>
            )}

            {/* 2. Main Note Detailed Card */}
            <View style={[styles.mainNoteCard, { backgroundColor: colors.bg }]}>
              <View style={styles.mainNoteUserRow}>
                <Pressable onPress={() => { if (note.user.id) onUserPress?.(note.user.id); onClose(); }}>
                  <Image source={{ uri: note.user.avatar }} style={styles.mainNoteAvatar} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Pressable onPress={() => { if (note.user.id) onUserPress?.(note.user.id); onClose(); }}>
                    <Text style={[styles.mainNoteName, { color: colors.text }]}>
                      {note.user.name}
                    </Text>
                  </Pressable>
                  <Text style={[styles.mainNoteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    @{note.user.username}@{note.user.host}
                  </Text>
                </View>
              </View>

              <View style={styles.mainNoteContentContainer}>
                <MfmRenderer nodes={mfm.parse(note.content)} emojis={note.emojis} colors={colors} />
              </View>

              {note.files.length > 0 && (
                <View style={styles.mainNoteMediaContainer}>
                  {note.files.map((file, idx) => {
                    const isImage = file.type?.startsWith("image/");
                    const isVideo = file.type?.startsWith("video/");
                    return (
                      <View key={idx} style={styles.mainNoteMediaItem}>
                        {isImage || isVideo ? (
                          <Image
                            source={{ uri: file.thumbnailUrl || file.url }}
                            style={styles.mainNoteMediaImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.mainNoteMediaFile, { backgroundColor: colors.reactionBg }]}>
                            <Ionicons name="document-outline" size={32} color={colors.textMuted} />
                            <Text style={[styles.mainNoteMediaFileName, { color: colors.textMuted }]} numberOfLines={1}>
                              {file.url.split("/").pop() || "ファイル"}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* 引用ノート（Quote Renote）表示 */}
              {note.quote ? (
                <View style={[styles.quoteCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                  <View style={styles.quoteHeaderRow}>
                    <Image source={{ uri: note.quote.user.avatar }} style={styles.quoteAvatar} />
                    <Text style={[styles.quoteName, { color: colors.text }]} numberOfLines={1}>
                      {note.quote.user.name || note.quote.user.username}
                    </Text>
                    <Text style={[styles.quoteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      @{note.quote.user.username} · {note.quote.createdAtLabel}
                    </Text>
                  </View>
                  <MfmRenderer nodes={mfm.parse(note.quote.content)} emojis={note.quote.emojis} colors={colors} />
                </View>
              ) : null}

              {/* Reactions wrap */}
              {note.reactions && note.reactions.length > 0 ? (
                <View style={styles.reactionWrap}>
                  {note.reactions.slice(0, 8).map((reaction, index) => {
                    const reactionEmojiUrl = reaction.url;
                    return (
                      <Pressable
                        key={`${note.id}-${reaction.emoji}-${index}`}
                        style={({ pressed }) => [
                          styles.reactionButton,
                          { backgroundColor: colors.reactionBg, borderColor: colors.reactionBorder },
                          reaction.reacted && [
                            styles.reactionActive,
                            {
                              backgroundColor: colors.reactionActiveBg,
                              borderColor: colors.reactionActiveBorder,
                            },
                          ],
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => handleModalReactionPress(note.id, index)}
                      >
                        {reactionEmojiUrl ? (
                          <Image
                            source={{ uri: reactionEmojiUrl }}
                            style={{ width: 16, height: 16 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={[styles.reactionText, { color: colors.text }]}>{reaction.emoji}</Text>
                        )}
                        <Text style={[styles.reactionCount, { color: colors.textMuted }]}>
                          {reaction.count}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.mainNoteTimeContainer}>
                <Text style={[styles.mainNoteTime, { color: colors.textMuted }]}>
                  {note.createdAtLabel} · {note.user.host || 'local'}
                </Text>
              </View>

              {/* Actions */}
              <View style={[styles.actionRow, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 12, marginTop: 8 }]}>
                <View style={[styles.actionGroup, { justifyContent: 'space-around', width: '100%' }]}>
                  <Pressable style={styles.actionItem} onPress={() => {}}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                    {note.replies > 0 ? <Text style={[styles.actionCount, { color: colors.textMuted }]}>{note.replies}</Text> : null}
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={() => onRenotePress(note)}>
                    <Ionicons name="repeat-outline" size={20} color={colors.textMuted} />
                    {note.renotes > 0 ? <Text style={[styles.actionCount, { color: colors.textMuted }]}>{note.renotes}</Text> : null}
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={() => handleModalReactionPress(note.id, -1)}>
                    <Ionicons name="heart-outline" size={20} color={colors.textMuted} />
                    {note.reactions.reduce((sum, r) => sum + r.count, 0) > 0 ? <Text style={[styles.actionCount, { color: colors.textMuted }]}>{note.reactions.reduce((sum, r) => sum + r.count, 0)}</Text> : null}
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={() => onSharePress(note)}>
                    <Ionicons name="share-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Reply Composer */}
            <View style={[styles.composerContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <ReplyComposer
                replyText={replyText}
                onReplyTextChange={setReplyText}
                isSending={sendingReply}
                onSend={handleReplySubmit}
                colors={colors}
              />
            </View>

            {/* 3. Replies list */}
            <View style={styles.repliesSection}>
              <Text style={[styles.repliesTitle, { color: colors.text }]}>返信リスト</Text>
              
              {loadingReplies ? (
                <View style={styles.loadingRepliesContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : replies.length === 0 ? (
                <Text style={[styles.emptyRepliesText, { color: colors.textMuted }]}>
                  返信はまだありません。
                </Text>
              ) : (
                replies.map((replyNote) => (
                  <View
                    key={replyNote.id}
                    style={[styles.replyItemCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  >
                    <View style={styles.replyItemRow}>
                      <Image source={{ uri: replyNote.user.avatar }} style={styles.replyItemAvatar} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.noteHeader}>
                          <Text style={[styles.noteName, { color: colors.text }]} numberOfLines={1}>
                            {replyNote.user.name}
                          </Text>
                          <Text style={[styles.noteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                            @{replyNote.user.username}@{replyNote.user.host} · {replyNote.createdAtLabel}
                          </Text>
                        </View>
                        <MfmRenderer
                          nodes={mfm.parse(replyNote.content)}
                          emojis={replyNote.emojis}
                          colors={colors}
                        />

                        {replyNote.files.length > 0 && (
                          <View style={styles.replyMediaContainer}>
                            {replyNote.files.map((file, fIdx) => {
                              const isImage = file.type?.startsWith("image/");
                              const isVideo = file.type?.startsWith("video/");
                              return (
                                <View key={fIdx} style={styles.replyMediaItem}>
                                  {isImage || isVideo ? (
                                    <Image
                                      source={{ uri: file.thumbnailUrl || file.url }}
                                      style={styles.replyMediaImage}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View style={[styles.replyMediaFile, { backgroundColor: colors.reactionBg }]}>
                                      <Ionicons name="document-outline" size={14} color={colors.textMuted} />
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {/* Reactions wrap for replies */}
                        <View style={styles.replyItemReactions}>
                          {replyNote.reactions.slice(0, 6).map((reaction, index) => {
                            const reactionEmojiUrl = reaction.url;
                            return (
                              <Pressable
                                key={`${replyNote.id}-${reaction.emoji}-${index}`}
                                style={({ pressed }) => [
                                  styles.reactionBtn,
                                  { backgroundColor: colors.reactionBg, borderColor: colors.reactionBorder },
                                  reaction.reacted && [
                                    styles.reactionBtnActive,
                                    {
                                      backgroundColor: colors.reactionActiveBg,
                                      borderColor: colors.reactionActiveBorder,
                                    },
                                  ],
                                  pressed && styles.buttonPressed,
                                ]}
                                onPress={() => handleModalReactionPress(replyNote.id, index)}
                              >
                                {reactionEmojiUrl ? (
                                  <Image
                                    source={{ uri: reactionEmojiUrl }}
                                    style={{ width: 14, height: 14 }}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Text style={[styles.reactionBtnText, { color: colors.text, fontSize: 11 }]}>
                                    {reaction.emoji}
                                  </Text>
                                )}
                                <Text style={[styles.reactionBtnCount, { color: colors.textMuted, fontSize: 10 }]}>
                                  {reaction.count}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  scroll: {
    flex: 1,
  },
  threadConnectorRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  leftCol: {
    alignItems: "center",
  },
  threadAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    borderRadius: 1,
  },
  rightCol: {
    flex: 1,
    gap: 6,
    paddingBottom: 16,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  noteName: {
    fontWeight: "800",
    fontSize: 14,
  },
  noteMeta: {
    fontSize: 12,
  },
  mainNoteCard: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  mainNoteUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mainNoteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  mainNoteName: {
    fontWeight: "900",
    fontSize: 16,
  },
  mainNoteMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  mainNoteContentContainer: {
    marginTop: 4,
  },
  mainNoteMediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  mainNoteMediaItem: {
    flex: 1,
    minWidth: "48%",
    aspectRatio: 1.3,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mainNoteMediaImage: {
    width: "100%",
    height: "100%",
  },
  mainNoteMediaFile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mainNoteMediaFileName: {
    fontSize: 12,
    maxWidth: "90%",
  },
  quoteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  quoteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  quoteAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  quoteName: {
    fontWeight: "800",
    fontSize: 13,
  },
  quoteMeta: {
    fontSize: 12,
  },
  mainNoteTimeContainer: {
    marginTop: 8,
    paddingBottom: 12,
  },
  mainNoteTime: {
    fontSize: 14,
  },
  mainNoteStats: {
    flexDirection: "row",
    gap: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainNoteStatText: {
    fontSize: 14,
  },
  mainNoteStatCount: {
    fontWeight: "900",
  },
  mainNoteActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainActionBtn: {
    padding: 8,
  },
  mainNoteReactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionBtnActive: {
    borderColor: "#60a5fa",
    backgroundColor: "#dbeafe",
  },
  reactionBtnText: {
    fontSize: 12,
  },
  reactionBtnCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  composerContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  repliesSection: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  loadingRepliesContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyRepliesText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  replyItemCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  replyItemRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  replyItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  replyMediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  replyMediaItem: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: "hidden",
  },
  replyMediaImage: {
    width: "100%",
    height: "100%",
  },
  replyMediaFile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  replyItemReactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  reactionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  reactionActive: {
    borderWidth: 1,
  },
  reactionText: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "600",
  },
});
