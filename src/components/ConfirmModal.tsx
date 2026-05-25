import React, { useEffect } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Platform, BackHandler } from "react-native";
import { ColorScheme } from "../utils/types";

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "OK",
  cancelText = "キャンセル",
  isDanger = false,
  colors,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  colors: ColorScheme;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 },
                pressed && { opacity: 0.7 }
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{cancelText}</Text>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: isDanger ? "#ff4444" : colors.primary },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => {
                onClose();
                onConfirm();
              }}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
