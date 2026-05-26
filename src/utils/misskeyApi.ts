export function normalizeMisskeyEndpoint(path: string): string {
  const trimmed = path.trim();
  const endpoint = trimmed.replace(/^\/?api\//, "").replace(/^\/+/, "");
  if (!endpoint) {
    throw new Error("Misskey API endpoint is empty.");
  }
  return endpoint;
}

export function resolveImagePreviewUrl(url: string, thumbnailUrl?: string | null): string {
  const trimmedThumbnail = thumbnailUrl?.trim();
  if (trimmedThumbnail) return trimmedThumbnail;
  return url;
}

export function normalizeMisskeyEmojiName(name: string): string {
  const trimmed = name.trim().replace(/^:+|:+$/g, "");
  if (!trimmed) return "";
  return trimmed.split("@")[0] || trimmed;
}

function getMisskeyEmojiCandidates(name: string): string[] {
  const trimmed = name.trim();
  const normalized = normalizeMisskeyEmojiName(trimmed);
  const candidates = new Set<string>();

  [trimmed, normalized].filter(Boolean).forEach((value) => {
    const bare = value.replace(/^:+|:+$/g, "");
    if (!bare) return;
    candidates.add(value);
    candidates.add(bare);
    candidates.add(`:${bare}:`);
  });

  return Array.from(candidates);
}

export function addMisskeyEmojiToMap(
  emojiMap: Record<string, string>,
  name: string,
  url?: string | null,
): Record<string, string> {
  if (!url) return emojiMap;
  getMisskeyEmojiCandidates(name).forEach((candidate) => {
    emojiMap[candidate] = url;
  });
  return emojiMap;
}

export function buildMisskeyEmojiMap(
  emojis?: Array<{ name: string; url: string }> | null,
  reactionEmojis?: Record<string, string> | null,
): Record<string, string> {
  const emojiMap: Record<string, string> = {};

  (emojis || []).forEach((emoji) => {
    addMisskeyEmojiToMap(emojiMap, emoji.name, emoji.url);
  });

  Object.entries(reactionEmojis || {}).forEach(([name, url]) => {
    addMisskeyEmojiToMap(emojiMap, name, url);
  });

  return emojiMap;
}

export function resolveMisskeyEmojiUrl(
  emojiMap: Record<string, string>,
  name: string,
): string | undefined {
  const match = getMisskeyEmojiCandidates(name).find((candidate) => emojiMap[candidate]);
  return match ? emojiMap[match] : undefined;
}
