import re

with open('tests/misskey-api.test.mts', 'r') as f:
    content = f.read()

content = content.replace("test('resolveImagePreviewUrl prefers thumbnail URL when available', () => {", "test('resolveImagePreviewUrl prefers original URL instead of thumbnail to load full quality', () => {")
content = content.replace("'https://example.com/thumb.jpg',", "'https://example.com/original.jpg',")

with open('tests/misskey-api.test.mts', 'w') as f:
    f.write(content)
