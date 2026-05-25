import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace('ImageViewerModal', 'MediaViewerModal')
content = content.replace('previewImageUrls', 'previewMedia')
content = content.replace('setPreviewImageUrls', 'setPreviewMedia')
content = content.replace('const [previewMedia, setPreviewMedia] = useState<string[]>([]);', 'const [previewMedia, setPreviewMedia] = useState<{ url: string; type?: string }[]>([]);')

content = content.replace('const handleImagePress = (urls: string[], index: number) => {', 'const handleImagePress = (media: { url: string; type?: string }[], index: number) => {')
content = content.replace('setPreviewMedia(urls);', 'setPreviewMedia(media);')

content = content.replace('imageUrls={previewMedia}', 'media={previewMedia}')

with open('App.tsx', 'w') as f:
    f.write(content)
