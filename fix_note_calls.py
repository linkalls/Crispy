import re

with open('src/components/Note.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                              const urls = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));''',
'''                              const mediaItems = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));'''
)

content = content.replace(
'''                              if (onImagePress) onImagePress(urls, mediaIndex);''',
'''                              if (onImagePress) onImagePress(mediaItems, mediaIndex);'''
)

content = content.replace(
'''                              const urls = note.quote!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));''',
'''                              const mediaItems = note.quote!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));'''
)

with open('src/components/Note.tsx', 'w') as f:
    f.write(content)

with open('src/components/NoteDetailModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                            const urls = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));''',
'''                            const mediaItems = note!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));'''
)
content = content.replace(
'''                            if (onImagePress) onImagePress(urls, mediaIndex);''',
'''                            if (onImagePress) onImagePress(mediaItems, mediaIndex);'''
)

content = content.replace(
'''                                      const urls = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => resolveImagePreviewUrl(f.url, f.thumbnailUrl));''',
'''                                      const mediaItems = replyNote.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: resolveImagePreviewUrl(f.url, f.thumbnailUrl), type: f.type }));'''
)

content = content.replace(
'''                                      if (onImagePress) onImagePress(urls, mediaIndex);''',
'''                                      if (onImagePress) onImagePress(mediaItems, mediaIndex);'''
)

with open('src/components/NoteDetailModal.tsx', 'w') as f:
    f.write(content)
