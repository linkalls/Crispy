import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  BackHandler,
  TextInput,
} from "react-native";
import { ColorScheme, TimelineNote } from "../utils/types";
import { normalizeMisskeyReactionInput } from "../utils/misskeyApi";

const DEFAULT_REACTIONS = [
  "👍", "❤️", "🔥", "😂", "🎉", "😮", "😢", "🙏",
  "👏", "💯", "🥰", "✨", "🎊", "😆", "🤔", "👀",
];

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
  const insets = useSafeAreaInsets();
  const [customReaction, setCustomReaction] = React.useState("");
  const reactionChoices = React.useMemo(() => {
    const unique = new Map<string, string>();
    [...note?.reactions.map((reaction) => reaction.emoji) || [], ...DEFAULT_REACTIONS].forEach((reaction) => {
      const normalized = normalizeMisskeyReactionInput(reaction);
      if (normalized && !unique.has(normalized)) {
        unique.set(normalized, reaction);
      }
    });
    return Array.from(unique.values());
  }, [note]);

  React.useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
  }, [visible, onClose]);

  React.useEffect(() => {
    if (!visible) setCustomReaction("");
  }, [visible]);

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
        <View style={[styles.sheet, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>リアクション</Text>
          
          <View style={styles.grid}>
            {reactionChoices.map((emoji) => (
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

          <View style={[styles.customReactionContainer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <TextInput
              value={customReaction}
              onChangeText={setCustomReaction}
              placeholder="カスタム絵文字 (:emoji:)"
              placeholderTextColor={colors.textMuted}
              style={[styles.customReactionInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={({ pressed }) => [
                styles.customReactionButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                const normalized = normalizeMisskeyReactionInput(customReaction);
                if (!normalized) return;
                onClose();
                onSelectReaction(note, normalized);
              }}
            >
              <Text style={styles.customReactionButtonText}>追加</Text>
            </Pressable>
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
        </View>
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
  customReactionContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  customReactionInput: {
    flex: 1,
    fontSize: 15,
  },
  customReactionButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  customReactionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
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
