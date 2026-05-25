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
