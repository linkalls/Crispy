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
  Image,
  ScrollView,
} from "react-native";
import { ColorScheme, TimelineNote } from "../utils/types";
import { normalizeMisskeyReactionInput, resolveMisskeyEmojiUrl } from "../utils/misskeyApi";

const DEFAULT_REACTIONS = [
  "👍", "❤️", "🔥", "😂", "🎉", "😮", "😢", "🙏",
  "👏", "💯", "🥰", "✨", "🎊", "😆", "🤔", "👀",
];

export function ReactionPickerModal({
  visible,
  note,
  serverEmojis = [],
  colors,
  onClose,
  onSelectReaction,
}: {
  visible: boolean;
  note: TimelineNote | null;
  serverEmojis?: Array<{ name: string; url: string }>;
  colors: ColorScheme;
  onClose: () => void;
  onSelectReaction: (note: TimelineNote, reaction: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState("");
  const reactionChoices = React.useMemo(() => {
    const unique = new Map<string, { reaction: string; url?: string }>();
    [...note?.reactions.map((reaction) => reaction.emoji) || [], ...DEFAULT_REACTIONS].forEach((reaction) => {
      const normalized = normalizeMisskeyReactionInput(reaction);
      if (normalized && !unique.has(normalized)) {
        unique.set(normalized, {
          reaction,
          url: note ? resolveMisskeyEmojiUrl(note.emojis, reaction) : undefined,
        });
      }
    });
    return Array.from(unique.values());
  }, [note]);
  const customEmojiChoices = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return serverEmojis
      .filter((emoji) => !trimmed || emoji.name.toLowerCase().includes(trimmed))
      .slice(0, trimmed ? 240 : 120);
  }, [query, serverEmojis]);

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
    if (!visible) setQuery("");
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
            {reactionChoices.map((item) => (
              <Pressable
                key={item.reaction}
                style={({ pressed }) => [
                  styles.emojiButton,
                  { backgroundColor: colors.reactionBg },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  onClose();
                  onSelectReaction(note, item.reaction);
                }}
              >
                {item.url ? (
                  <Image source={{ uri: item.url }} style={styles.emojiImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.emojiText}>{item.reaction}</Text>
                )}
              </Pressable>
            ))}
          </View>

          <View style={[styles.customReactionContainer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="カスタム絵文字を検索"
              placeholderTextColor={colors.textMuted}
              style={[styles.customReactionInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.customEmojiList} contentContainerStyle={styles.customEmojiListContent}>
            {customEmojiChoices.map((emoji) => (
              <Pressable
                key={emoji.name}
                style={({ pressed }) => [
                  styles.customEmojiButton,
                  { backgroundColor: colors.reactionBg, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  onClose();
                  onSelectReaction(note, `:${emoji.name}:`);
                }}
              >
                <Image source={{ uri: emoji.url }} style={styles.customEmojiImage} resizeMode="contain" />
                <Text style={[styles.customEmojiName, { color: colors.textMuted }]} numberOfLines={1}>
                  :{emoji.name}:
                </Text>
              </Pressable>
            ))}
            {customEmojiChoices.length === 0 ? (
              <Text style={[styles.emptyCustomEmoji, { color: colors.textMuted }]}>一致する絵文字がありません</Text>
            ) : null}
          </ScrollView>
          
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
  emojiImage: {
    width: 30,
    height: 30,
  },
  customReactionContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  customReactionInput: {
    flex: 1,
    fontSize: 15,
  },
  customEmojiList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  customEmojiListContent: {
    gap: 8,
  },
  customEmojiButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customEmojiImage: {
    width: 24,
    height: 24,
  },
  customEmojiName: {
    fontSize: 13,
    flex: 1,
  },
  emptyCustomEmoji: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
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
