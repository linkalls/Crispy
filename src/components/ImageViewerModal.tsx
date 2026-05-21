import React from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ImageViewerModal({
  visible,
  imageUrl,
  onClose,
}: {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);

  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.imageContainer}>
          {loading && (
            <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          )}
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 22,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
    zIndex: 1,
  },
});
