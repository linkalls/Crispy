import React, { useEffect } from 'react';
import { Modal, View, Image, StyleSheet, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import ImageViewer from 'react-native-image-zoom-viewer';

export interface MediaItem {
  url: string;
  thumbnailUrl?: string;
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

  const imagesForViewer = media.map(item => ({ url: item.url, props: { type: item.type, source: { uri: item.url }, thumbnail: item.thumbnailUrl } }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ImageViewer
          imageUrls={imagesForViewer}
          index={initialIndex}
          onSwipeDown={onClose}
          enableSwipeDown={true}
          renderIndicator={() => <View />}
          renderHeader={() => (
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
              <Ionicons name="close" size={28} color="#ffffff" onPress={onClose} style={styles.closeButton} />
            </View>
          )}
          loadingRender={() => <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.2)" />}
          renderImage={(props) => {
            const item = media.find(m => m.url === props.source.uri);
            if (item && isVideo(item)) {
              return (
                <View style={props.style}>
                  <Video
                    source={{ uri: item.url }}
                    style={{ width: '100%', height: '100%' }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay
                  />
                </View>
              );
            }

            // Render original if available, but since we are overriding renderImage, the viewer passes the downloaded source in props
            return (
              <View style={props.style}>
                <Image {...props} style={StyleSheet.absoluteFill} resizeMode="contain" />
              </View>
            );
          }}
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
    overflow: 'hidden',
  },
});
