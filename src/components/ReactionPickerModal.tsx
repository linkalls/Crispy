import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { ColorScheme, TimelineNote } from "../utils/types";

const DEFAULT_REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢", "🙏", "👀"];

export function ReactionPickerModal({
  visible,
  note,
  colors,
  onClose,
  onSelectReaction,
}: {
  visible: boolean;
  note: TimelineNote | null;
  colors: ColorScheme;
  onClose: () => void;
  onSelectReaction: (note: TimelineNote, reaction: string) => void;
}) {
  if (!note) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>リアクション</Text>
          
          <View style={styles.grid}>
            {DEFAULT_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={({ pressed }) => [
                  styles.emojiButton,
                  { backgroundColor: colors.reactionBg },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  onClose();
                  onSelectReaction(note, emoji);
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: colors.bg, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>キャンセル</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  emojiButton: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 28,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
