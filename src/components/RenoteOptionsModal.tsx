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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ColorScheme, TimelineNote } from "../utils/types";

export function RenoteOptionsModal({
  visible,
  note,
  colors,
  onClose,
  onRenote,
  onQuote,
}: {
  visible: boolean;
  note: TimelineNote | null;
  colors: ColorScheme;
  onClose: () => void;
  onRenote: (note: TimelineNote) => void;
  onQuote: (note: TimelineNote) => void;
}) {
  const insets = useSafeAreaInsets();
  React.useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
  }, [visible, onClose]);

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
          
          <Text style={[styles.title, { color: colors.text }]}>リポスト</Text>
          
          <View style={styles.optionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                pressed && { backgroundColor: colors.reactionBg },
              ]}
              onPress={() => {
                onClose();
                onRenote(note);
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.reactionBg }]}>
                <Ionicons name="repeat-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>リポスト</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  そのままフォロワーに共有します
                </Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                pressed && { backgroundColor: colors.reactionBg },
              ]}
              onPress={() => {
                onClose();
                onQuote(note);
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.reactionBg }]}>
                <Ionicons name="chatbox-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>引用</Text>
                <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                  コメントを追加して共有します
                </Text>
              </View>
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
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 12,
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
