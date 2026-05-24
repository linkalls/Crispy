with open('src/components/ReactionListModal.tsx', 'w', encoding='utf-8') as f:
    f.write('''import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, SafeAreaView, FlatList, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ColorScheme, TimelineNote } from "../utils/types";

export function ReactionListModal({
  visible,
  note,
  colors,
  onClose,
  misskeyRequest,
}: {
  visible: boolean;
  note: TimelineNote | null;
  colors: ColorScheme;
  onClose: () => void;
  misskeyRequest: <T>(path: string, payload: Record<string, unknown>, requiresAuth?: boolean) => Promise<T>;
}) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && note) {
      setLoading(true);
      misskeyRequest<any[]>('/api/notes/reactions', { noteId: note.targetId, limit: 100 }, true)
        .then(data => setReactions(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setReactions([]);
    }
  }, [visible, note, misskeyRequest]);

  if (!visible || !note) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.bg, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>リアクションしたユーザー</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ padding: 20 }} />
          ) : (
            <FlatList
              data={reactions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <View style={styles.userRow}>
                  <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.user.name || item.user.username}</Text>
                    <Text style={[styles.username, { color: colors.textMuted }]} numberOfLines={1}>@{item.user.username}</Text>
                  </View>
                  <View style={[styles.reactionBadge, { backgroundColor: colors.reactionBg }]}>
                    <Text style={{ fontSize: 16 }}>{item.type.replace('@.', '')}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, maxHeight: "80%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "bold" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { fontWeight: "bold", fontSize: 15 },
  username: { fontSize: 13 },
  reactionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
});
''')
print("ReactionListModal.tsx created")
