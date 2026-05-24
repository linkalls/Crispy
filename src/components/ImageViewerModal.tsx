import React from 'react';
import { Modal, View, Image, StyleSheet, Pressable, SafeAreaView, Dimensions, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ImageViewerModalProps = {
  visible: boolean;
  imageUrls: string[];
  initialIndex?: number;
  onClose: () => void;
};

export function ImageViewerModal({ visible, imageUrls, initialIndex = 0, onClose }: ImageViewerModalProps) {
  const { width, height } = Dimensions.get('window');

  if (!visible || imageUrls.length === 0) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </Pressable>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
        >
          {imageUrls.map((url, idx) => (
            <ScrollView
              key={idx}
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={{ width, height: height - 100, justifyContent: 'center', alignItems: 'center' }}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image source={{ uri: url }} style={{ width, height: height - 100 }} resizeMode="contain" />
            </ScrollView>
          ))}
        </ScrollView>
        {imageUrls.length > 1 && (
          <View style={styles.indicatorContainer}>
            <Text style={styles.indicatorText}>{imageUrls.length}枚の画像</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 14,
  },
});
