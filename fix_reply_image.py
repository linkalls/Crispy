import re

with open('src/components/NoteDetailModal.tsx', 'r') as f:
    content = f.read()

# Fix the reply section's media Items and index
content = content.replace(
'''                                  {isImage || isVideo ? (
                                    <Pressable onPress={() => {
                            const mediaItems = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));
                            const mediaIndex = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                            if (onImagePress) onImagePress(mediaItems, mediaIndex);
                          }}>''',
'''                                  {isImage || isVideo ? (
                                    <Pressable onPress={() => {
                                      const mediaItems = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));
                                      const mediaIndex = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                                      if (onImagePress) onImagePress(mediaItems, mediaIndex);
                                    }}>'''
)

with open('src/components/NoteDetailModal.tsx', 'w') as f:
    f.write(content)
