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
  return trimmed;
}

function isLikelyCustomReaction(value: string): boolean {
  return value.includes(":") || value.includes("@") || /^[a-zA-Z0-9_+-]+$/.test(value);
}

export function normalizeMisskeyReactionInput(reaction: string): string {
  const trimmed = reaction.trim();
  if (!trimmed) return "";
  if (!isLikelyCustomReaction(trimmed)) return trimmed;
  const normalized = normalizeMisskeyEmojiName(trimmed);
  return normalized ? `:${normalized}:` : "";
}

function getMisskeyEmojiCandidates(name: string): string[] {
  const trimmed = name.trim();
  const normalized = normalizeMisskeyEmojiName(trimmed);
  const hostless = normalized.split("@")[0] || normalized;
  const candidates = new Set<string>();

  [trimmed, normalized, hostless].filter(Boolean).forEach((value) => {
    const bare = value.replace(/^:+|:+$/g, "");
    if (!bare) return;
    candidates.add(value);
    candidates.add(bare);
    candidates.add(`:${bare}:`);
  });

  return Array.from(candidates);
}

export function buildMisskeyUserLookup(identifier: string): { userId?: string; username?: string; host?: string } {
  const trimmed = identifier.trim();
  if (!trimmed) return {};

  const normalized = trimmed.replace(/^@+/, "");
  const parts = normalized.split("@").filter(Boolean);

  if (parts.length >= 2) {
    return {
      username: parts[0],
      host: parts.slice(1).join("@"),
    };
  }

  return { userId: trimmed };
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

export function isSameMisskeyReaction(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  return normalizeMisskeyReactionInput(left) === normalizeMisskeyReactionInput(right);
}
