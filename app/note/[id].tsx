import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Image, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobalState } from "../../src/context/GlobalState";
import { useMisskey } from "../../src/hooks";
import { TimelineNote, MisskeyNote } from "../../src/utils/types";
import { mapNote } from "../../src/utils/formatting";
import { MfmRenderer, ReplyComposer } from "../../src/components";
import { resolveImagePreviewUrl } from "../../src/utils/misskeyApi";
import * as mfm from "mfm-js";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors } = useGlobalState();
  const { misskeyRequest } = useMisskey(activeAccount);

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<TimelineNote | null>(null);
  const [replies, setReplies] = useState<TimelineNote[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const activeAccountHost = activeAccount?.host || "misskey.io";

  const fetchNoteAndReplies = useCallback(async () => {
    if (!id || !activeAccount) return;
    setLoading(true);
    try {
      if (activeAccount.token === "mock_token") {
         // Mock
         setNote({
            id: id,
            targetId: id,
            content: "モックの詳細画面です！$[spin ぐるぐる]",
            createdAtLabel: "10分前",
            user: {
              id: "mock_user",
              name: "Mock User",
              username: "mock",
              host: activeAccountHost,
              avatar: activeAccount.avatarUrl || "",
            },
            renoteUser: null,
            reactions: [],
            replies: 0,
            renotes: 0,
            files: [],
            reply: null,
            quote: null,
            emojis: {},
          });
         setLoading(false);
         return;
      }
      const noteData = await misskeyRequest<MisskeyNote>("/api/notes/show", { noteId: id }, true);
      setNote(mapNote(noteData, activeAccountHost));

      const children = await misskeyRequest<MisskeyNote[]>("/api/notes/children", { noteId: id, limit: 30 }, true);
      setReplies(children.map((child) => mapNote(child, activeAccountHost)));
    } catch (e) {
      console.error("Failed to load note detail", e);
    } finally {
      setLoading(false);
    }
  }, [id, activeAccount, misskeyRequest, activeAccountHost]);

  useEffect(() => {
    fetchNoteAndReplies();
  }, [fetchNoteAndReplies]);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !activeAccount || !note) return;
    setIsSendingReply(true);
    try {
      if (activeAccount.token !== "mock_token") {
         await misskeyRequest("/api/notes/create", { text: replyText.trim(), replyId: note.id }, true);
      }
      setReplyText("");
      setIsReplying(false);
      fetchNoteAndReplies();
    } catch (e) {
      console.error("Failed to send reply", e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const renderNoteCard = (n: TimelineNote, isMain = false) => {
    const isQuote = !!n.quote;
    const isRenote = !!n.renoteUser;
    const contentToRender = n.content;

    let parsedAst: mfm.MfmNode[] | null = null;
    if (contentToRender) {
      try {
        parsedAst = mfm.parse(contentToRender);
      } catch (e) {
        console.error("MFM parse error in Detail", e);
      }
    }

    return (
      <View style={[localStyles.noteContainer, { backgroundColor: isMain ? colors.cardBg : colors.bg, borderBottomColor: colors.border }]}>
        {isRenote && (
          <View style={localStyles.renoteLabel}>
            <Ionicons name="repeat" size={14} color={colors.textMuted} />
            <Text style={[localStyles.renoteText, { color: colors.textMuted }]} numberOfLines={1}>
              {n.renoteUser} がリノート
            </Text>
          </View>
        )}
        <View style={localStyles.noteMain}>
          <Pressable onPress={() => router.push(`/user/${n.user.id}`)}>
            <Image source={{ uri: n.user.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=default" }} style={localStyles.avatar} />
          </Pressable>
          <View style={localStyles.noteContent}>
            <View style={localStyles.headerRow}>
              <Text style={[localStyles.name, { color: colors.text }]} numberOfLines={1}>
                {n.user.name}
              </Text>
              <Text style={[localStyles.username, { color: colors.textMuted }]} numberOfLines={1}>
                @{n.user.username}{n.user.host !== activeAccountHost ? `@${n.user.host}` : ""}
              </Text>
              <Text style={[localStyles.time, { color: colors.textMuted }]}>{n.createdAtLabel}</Text>
            </View>

            {parsedAst ? (
              <MfmRenderer nodes={parsedAst} emojis={n.emojis} colors={colors} />
            ) : contentToRender ? (
              <Text style={[localStyles.content, { color: colors.text }]}>{contentToRender}</Text>
            ) : null}

            {n.files && n.files.length > 0 && (
              <View style={localStyles.mediaContainer}>
                {n.files.map((file, idx) => (
                  <View key={idx} style={localStyles.mediaItem}>
                     <Image source={{ uri: file.thumbnailUrl || file.url }} style={localStyles.mediaImage} />
                  </View>
                ))}
              </View>
            )}

            {isMain && (
              <View style={localStyles.actionRow}>
                <Pressable style={localStyles.actionButton} onPress={() => setIsReplying(true)}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                  {n.replies > 0 && <Text style={[localStyles.actionCount, { color: colors.textMuted }]}>{n.replies}</Text>}
                </Pressable>
                <Pressable style={localStyles.actionButton}>
                  <Ionicons name="repeat" size={20} color={colors.textMuted} />
                  {n.renotes > 0 && <Text style={[localStyles.actionCount, { color: colors.textMuted }]}>{n.renotes}</Text>}
                </Pressable>
                <Pressable style={localStyles.actionButton}>
                  <Ionicons name="add-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            )}

            {n.reactions && n.reactions.length > 0 && (
              <View style={localStyles.reactionsRow}>
                {n.reactions.map((r, i) => (
                  <View key={i} style={[localStyles.reactionChip, { backgroundColor: r.reacted ? colors.reactionActiveBg : colors.reactionBg, borderColor: r.reacted ? colors.reactionActiveBorder : colors.reactionBorder }]}>
                    <Text style={localStyles.reactionEmoji}>{r.emoji}</Text>
                    <Text style={[localStyles.reactionCount, { color: r.reacted ? colors.primary : colors.text }]}>{r.count}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading || !note) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[localStyles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: colors.text }]}>ノート</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }}>
          {renderNoteCard(note, true)}

          {replies.length > 0 && (
             <View style={{ marginTop: 8 }}>
               {replies.map(r => <React.Fragment key={r.id}>{renderNoteCard(r, false)}</React.Fragment>)}
             </View>
          )}
        </ScrollView>

        {isReplying && (
          <ReplyComposer
             replyText={replyText}
             isSending={isSendingReply}
             colors={colors}
             onReplyTextChange={setReplyText}
             onSend={handleReplySubmit}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  renoteLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginLeft: 36,
  },
  renoteText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "600",
  },
  noteMain: {
    flexDirection: "row",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 4,
  },
  username: {
    fontSize: 14,
    marginRight: 8,
  },
  time: {
    fontSize: 14,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  mediaItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
    paddingRight: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 13,
  },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "bold",
  },
});
