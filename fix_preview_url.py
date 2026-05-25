import re

with open('src/utils/misskeyApi.ts', 'r') as f:
    content = f.read()

content = content.replace(
'''export function resolveImagePreviewUrl(url: string, thumbnailUrl?: string | null): string {
  const trimmedThumbnail = thumbnailUrl?.trim();
  if (trimmedThumbnail) return trimmedThumbnail;
  return url;
}''',
'''export function resolveImagePreviewUrl(url: string, thumbnailUrl?: string | null): string {
  return url;
}'''
)

with open('src/utils/misskeyApi.ts', 'w') as f:
    f.write(content)
