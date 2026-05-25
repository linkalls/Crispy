import re

with open('src/components/Note.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                          const urls = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));
                          const mediaIndex = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                          const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                          if (onImagePress) onImagePress(urls, mediaIndex);''',
'''                          const mediaItems = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));
                          const mediaIndex = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                          const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                          if (onImagePress) onImagePress(mediaItems, mediaIndex);'''
)

with open('src/components/Note.tsx', 'w') as f:
    f.write(content)
