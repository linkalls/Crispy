import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace('const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);', 'const [previewImageUrls, setPreviewImageUrls] = useState<string[]>([]);\n  const [previewImageIndex, setPreviewImageIndex] = useState(0);')

content = content.replace('const handleImagePress = (url: string) => {', 'const handleImagePress = (urls: string[], index: number) => {')
content = content.replace('setPreviewImageUrl(url);', 'setPreviewImageUrls(urls);\n    setPreviewImageIndex(index);')

content = content.replace('imageUrl={previewImageUrl}', 'imageUrls={previewImageUrls}\n        initialIndex={previewImageIndex}')
content = content.replace('setPreviewImageUrl(null);', 'setPreviewImageUrls([]);\n          setPreviewImageIndex(0);')

with open('App.tsx', 'w') as f:
    f.write(content)
