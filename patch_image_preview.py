import re

with open('src/components/Note.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Linking to imports if not there
if 'Linking' not in content:
    content = content.replace("import { Image, Pressable, Text, View } from 'react-native';", "import { Image, Pressable, Text, View, Linking } from 'react-native';")

# Replace <Image ... /> with Pressable wrapping Image for main mediaItem
search_img = """                    {isImage || isVideo ? (
                      <Image
                        source={{ uri: file.thumbnailUrl || file.url }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    ) : ("""
replace_img = """                    {isImage || isVideo ? (
                      <Pressable onPress={() => Linking.openURL(file.url)}>
                        <Image
                          source={{ uri: file.thumbnailUrl || file.url }}
                          style={styles.mediaImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ) : ("""
content = content.replace(search_img, replace_img)

# Do the same for quoteMediaItem
search_qimg = """                        {isImage || isVideo ? (
                          <Image
                            source={{ uri: file.thumbnailUrl || file.url }}
                            style={styles.quoteMediaImage}
                            resizeMode="cover"
                          />
                        ) : ("""
replace_qimg = """                        {isImage || isVideo ? (
                          <Pressable onPress={() => Linking.openURL(file.url)}>
                            <Image
                              source={{ uri: file.thumbnailUrl || file.url }}
                              style={styles.quoteMediaImage}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ) : ("""
content = content.replace(search_qimg, replace_qimg)

with open('src/components/Note.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Note.tsx patched for image preview")
