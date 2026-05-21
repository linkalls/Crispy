import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorScheme, TimelineNote } from "../utils/types";
import { MfmRenderer } from "./MfmRenderer";
import * as mfm from "mfm-js";

export function QuoteComposerModal({
  visible,
  note,
  colors,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  note: TimelineNote | null;
  colors: ColorScheme;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!note) return null;

  const handlePublish = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      await onSubmit(trimmed);
      setText("");
      onClose();
    } catch {
      // Errors should be handled by the parent
    } finally {
      setLoading(false);
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
            <Pressable onPress={onClose} disabled={loading} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>キャンセル</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>引用リポスト</Text>
            <Pressable
              onPress={handlePublish}
              disabled={loading || !text.trim()}
              style={[
                styles.publishButton,
                { backgroundColor: colors.primary },
                (loading || !text.trim()) && styles.publishButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.publishButtonText}>リポスト</Text>
              )}
            </Pressable>
          </View>

          {/* Composer Body */}
          <View style={styles.body}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="コメントを追加..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              style={[styles.input, { color: colors.text }]}
            />

            {/* Quoted Note Preview */}
            <View style={[styles.quotedNote, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <View style={styles.quoteHeader}>
                <Image source={{ uri: note.user.avatar }} style={styles.quoteAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quoteName, { color: colors.text }]} numberOfLines={1}>
                    {note.user.name}
                  </Text>
                  <Text style={[styles.quoteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    @{note.user.username}@{note.user.host} · {note.createdAtLabel}
                  </Text>
                </View>
              </View>
              <MfmRenderer nodes={mfm.parse(note.content)} emojis={note.emojis} colors={colors} />
            </View>
          </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  quotedNote: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quoteAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  quoteName: {
    fontWeight: "800",
    fontSize: 14,
  },
  quoteMeta: {
    fontSize: 12,
  },
});
