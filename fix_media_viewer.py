import re

with open('src/components/MediaViewerModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''export function MediaViewerModal({ visible, media, initialIndex = 0, onClose }: MediaViewerModalProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = Dimensions.get('window');''',
'''export function MediaViewerModal({ visible, media, initialIndex = 0, onClose }: MediaViewerModalProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = Dimensions.get('window');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);'''
)

content = content.replace(
'''  const renderItem = ({ item }: { item: MediaItem }) => {
    if (isVideo(item)) {''',
'''  const renderItem = ({ item, index }: { item: MediaItem, index: number }) => {
    if (isVideo(item)) {'''
)

content = content.replace(
'''            isLooping
            shouldPlay
          />''',
'''            isLooping
            shouldPlay={currentIndex === index}
          />'''
)

content = content.replace(
'''          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({''',
'''          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          getItemLayout={(_, index) => ({'''
)

with open('src/components/MediaViewerModal.tsx', 'w') as f:
    f.write(content)
