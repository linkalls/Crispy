import re

files_to_update = [
    'src/components/Timeline.tsx',
    'src/components/Note.tsx',
    'src/components/NoteDetailModal.tsx',
    'src/screens/ExploreScreen.tsx',
    'src/screens/ProfileScreen.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace('onImagePress?: (urls: string[], index: number) => void;', 'onImagePress?: (media: { url: string; type?: string }[], index: number) => void;')

    with open(filepath, 'w') as f:
        f.write(content)
