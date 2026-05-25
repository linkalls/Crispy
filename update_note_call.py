import re

with open('src/components/Note.tsx', 'r') as f:
    content = f.read()

# For the main note media
content = content.replace(
'''                          const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                          if (onImagePress) onImagePress(previewUrl);
                          else Linking.openURL(previewUrl);''',
'''                          const urls = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));
                          const mediaIndex = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                          const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                          if (onImagePress) onImagePress(urls, mediaIndex);
                          else Linking.openURL(previewUrl);'''
)

# For the quote media
content = content.replace(
'''                              const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                              if (onImagePress) onImagePress(previewUrl);
                              else Linking.openURL(previewUrl);''',
'''                              const urls = note.quote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));
                              const mediaIndex = note.quote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                              const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                              if (onImagePress) onImagePress(urls, mediaIndex);
                              else Linking.openURL(previewUrl);'''
)

with open('src/components/Note.tsx', 'w') as f:
    f.write(content)

with open('src/components/NoteDetailModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                          <Pressable onPress={() => onImagePress ? onImagePress(resolveImagePreviewUrl(file.url, file.thumbnailUrl)) : undefined}>''',
'''                          <Pressable onPress={() => {
                            const urls = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));
                            const mediaIndex = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                            if (onImagePress) onImagePress(urls, mediaIndex);
                          }}>'''
)

content = content.replace(
'''                                    <Pressable onPress={() => onImagePress ? onImagePress(resolveImagePreviewUrl(file.url, file.thumbnailUrl)) : undefined}>''',
'''                                    <Pressable onPress={() => {
                                      const urls = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));
                                      const mediaIndex = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                                      if (onImagePress) onImagePress(urls, mediaIndex);
                                    }}>'''
)

with open('src/components/NoteDetailModal.tsx', 'w') as f:
    f.write(content)
