export type MisskeyExplorerPreset = {
  category: string;
  title: string;
  endpoint: string;
  payload: Record<string, unknown>;
  requiresAuth?: boolean;
};

export { MISSKEY_EXPLORER_PRESETS } from "./misskeyExplorer.generated.ts";

export function groupMisskeyExplorerPresets(presets: MisskeyExplorerPreset[]) {
  return presets.reduce<Record<string, MisskeyExplorerPreset[]>>(
    (groups, preset) => {
      if (!groups[preset.category]) groups[preset.category] = [];
      groups[preset.category].push(preset);
      return groups;
    },
    {},
  );
}

export function normalizeMisskeyExplorerEndpoint(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/api/";
  return trimmed.startsWith("/api/")
    ? trimmed
    : `/api/${trimmed.replace(/^\/+/, "")}`;
}

export function parseMisskeyExplorerPayload(
  input: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, value: {} };

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        error: "payload は object 形式の JSON である必要があります。",
      };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "payload が JSON として読み取れません。" };
  }
}
