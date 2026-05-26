import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Image, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Share } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobalState } from "../../src/context/GlobalState";
import { useInteractionState } from "../../src/context/InteractionState";
import { useMisskey } from "../../src/hooks";
import { TimelineNote, MisskeyNote } from "../../src/utils/types";
import { mapNote } from "../../src/utils/formatting";
import { Note, ReplyComposer } from "../../src/components";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors, openImageViewer } = useGlobalState();
  const { openReactionPicker, openRenoteOptions, showToast, refreshTrigger } = useInteractionState();
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
         setNote({
            id: id,
            targetId: id,
            content: "モックの詳細画面です！$[spin ぐるぐる]",
            createdAtLabel: "10分前",
            user: { id: "mock_user", name: "Mock User", username: "mock", host: activeAccountHost, avatar: activeAccount.avatarUrl || "" },
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
  }, [fetchNoteAndReplies, refreshTrigger]);

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
        await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: target.emoji }, true);
        showToast('成功', 'リアクションしました。');
      }
      fetchNoteAndReplies();
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

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
          <View style={{ padding: 8 }}>
            <Note
              note={note}
              isReplying={isReplying}
              replyText={replyText}
              isSendingReply={isSendingReply}
              colors={colors}
              onPress={() => {}}
              onReplyPress={() => setIsReplying(true)}
              onReplyTextChange={setReplyText}
              onReplySubmit={handleReplySubmit}
              onRenotePress={() => openRenoteOptions(note)}
              onSharePress={() => handleShare(note)}
              onReactionPress={(index) => handleReactionToggle(note, index)}
              onUserPress={(userId) => router.push(`/user/${userId}`)}
              onImagePress={openImageViewer}
            />
          </View>

          <View style={localStyles.repliesSection}>
             <Text style={[localStyles.repliesTitle, { color: colors.text }]}>返信</Text>
             {replies.length > 0 ? (
                replies.map(r => (
                  <View key={r.id} style={{ marginBottom: 4 }}>
                    <Note
                      note={r}
                      isReplying={false}
                      replyText=""
                      isSendingReply={false}
                      colors={colors}
                      onPress={() => router.push(`/note/${r.id}`)}
                      onReplyPress={() => {}}
                      onReplyTextChange={() => {}}
                      onReplySubmit={() => {}}
                      onRenotePress={() => openRenoteOptions(note)}
                      onSharePress={() => handleShare(note)}
                      onReactionPress={(index) => handleReactionToggle(note, index)}
                      onUserPress={(userId) => router.push(`/user/${userId}`)}
                      onImagePress={openImageViewer}
                    />
                  </View>
                ))
             ) : (
                <Text style={[localStyles.emptyRepliesText, { color: colors.textMuted }]}>
                  返信はまだありません
                </Text>
             )}
          </View>
        </ScrollView>
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
  repliesSection: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  repliesTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  emptyRepliesText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
});
