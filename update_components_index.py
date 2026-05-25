with open('src/components/index.ts', 'r') as f:
    content = f.read()

content = content.replace('export * from "./ImageViewerModal";', 'export * from "./MediaViewerModal";')

with open('src/components/index.ts', 'w') as f:
    f.write(content)
