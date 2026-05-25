import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Image, Pressable, StyleSheet, Platform, BackHandler, FlatList, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

export interface MediaItem {
  url: string;
  type?: string;
}

export interface MediaViewerModalProps {
  visible: boolean;
  media: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaViewerModal({ visible, media, initialIndex = 0, onClose }: MediaViewerModalProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = Dimensions.get('window');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
  }, [visible, onClose]);

  if (!media || media.length === 0) return null;

  const isVideo = (item: MediaItem) => {
    if (item.type?.startsWith('video/')) return true;
    return item.url.match(/\.(mp4|webm|mov|mkv)$/i) !== null;
  };

  const renderItem = ({ item, index }: { item: MediaItem, index: number }) => {
    if (isVideo(item)) {
      return (
        <View style={[styles.itemContainer, { width, height }]}>
          <Video
            source={{ uri: item.url }}
            style={{ width: '100%', height: '100%' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={currentIndex === index}
          />
        </View>
      );
    }

    return (
      <View style={[styles.itemContainer, { width, height }]}>
        <ScrollView
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable style={styles.imageContainer} onPress={onClose}>
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              resizeMode="contain"
            />
          </Pressable>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={media}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
