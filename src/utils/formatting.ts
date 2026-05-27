import {
  buildMisskeyEmojiMap,
  isSameMisskeyReaction,
  resolveMisskeyEmojiUrl,
} from "./misskeyApi.ts";
import type { MisskeyNote, TimelineNote } from "./types.ts";

const DEFAULT_AVATAR =
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Crispy&backgroundColor=b6e3f4";

export function normalizeHost(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .trim();
}

export function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function toRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (!Number.isFinite(sec) || sec < 0) return "";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  return `${Math.floor(hour / 24)}d`;
}

export function mapNote(note: MisskeyNote, fallbackHost: string): TimelineNote {
  const isPureRenote = note.renote && !note.text;
  const target = isPureRenote ? note.renote! : note;
  const content = [target.cw, target.text].filter(Boolean).join("\n");

  // リプライを再帰的にマップ
  const replyNote = target.reply ? mapNote(target.reply, fallbackHost) : null;

  // 引用元のノートをマップ（本文があるリノートの場合のみ）
  const quoteNote =
    !isPureRenote && note.renote ? mapNote(note.renote, fallbackHost) : null;

  // カスタム絵文字のマップを作成 — handle both array and object formats
  const toEmojiArray = (e: any): Array<{ name: string; url: string }> => {
    if (Array.isArray(e)) return e;
    if (e && typeof e === "object")
      return Object.entries(e).map(([name, url]) => ({
        name,
        url: url as string,
      }));
    return [];
  };
  const noteEmojis = toEmojiArray(note.emojis);
  const targetEmojis = toEmojiArray(target.emojis);
  const noteUserEmojis = toEmojiArray(note.user.emojis);
  const targetUserEmojis = toEmojiArray(target.user.emojis);
  const emojiMap = buildMisskeyEmojiMap(
    [...noteEmojis, ...targetEmojis, ...noteUserEmojis, ...targetUserEmojis],
    target.reactionEmojis,
  );

  const reactions = Object.entries(target.reactions || {}).map(
    ([emoji, count]) => {
      const reactionEmojiUrl = resolveMisskeyEmojiUrl(emojiMap, emoji);

      return {
        emoji,
        count,
        reacted: isSameMisskeyReaction(target.myReaction, emoji),
        isCustom: emoji.startsWith(":"),
        url: reactionEmojiUrl,
      };
    },
  );

  return {
    id: note.id,
    targetId: target.id,
    content: content || (note.renote ? "" : "(no text)"),
    createdAtLabel: toRelativeTime(target.createdAt),
    user: {
      id: target.user.id || "",
      name: target.user.name || target.user.username,
      username: target.user.username,
      host: target.user.host || fallbackHost,
      avatar: target.user.avatarUrl || DEFAULT_AVATAR,
    },
    renoteUser: isPureRenote ? note.user.name || note.user.username : null,
    reactions: reactions,
    replies: target.repliesCount ?? 0,
    renotes: target.renoteCount ?? 0,
    files: (target.files || []).map((f) => ({
      url: f.url,
      thumbnailUrl: f.thumbnailUrl ?? undefined,
      type: f.type,
    })),
    reply: replyNote,
    quote: quoteNote,
    emojis: emojiMap,
  };
}

export const DEFAULT_HOST = "misskey.io";
export const STORAGE_KEY = "crispy:state:v2";

export function toggleNoteReactionLocally(
  note: TimelineNote,
  emoji: string,
  isReacting: boolean,
): TimelineNote {
  const newReactions = [...note.reactions];
  const targetIndex = newReactions.findIndex((r) => r.emoji === emoji);

  if (targetIndex !== -1) {
    const r = newReactions[targetIndex];
    if (isReacting) {
      if (!r.reacted) {
        newReactions[targetIndex] = { ...r, count: r.count + 1, reacted: true };
      }
    } else {
      if (r.reacted) {
        newReactions[targetIndex] = {
          ...r,
          count: Math.max(0, r.count - 1),
          reacted: false,
        };
      }
    }
    // Remove if count goes to 0 (optional, but Misskey sometimes keeps it or drops it. We can drop if 0)
    if (newReactions[targetIndex].count === 0) {
      newReactions.splice(targetIndex, 1);
    }
  } else if (isReacting) {
    // Add new reaction
    newReactions.push({
      emoji,
      count: 1,
      reacted: true,
      isCustom: emoji.startsWith(":"),
      // url might be missing if it's a custom emoji and we don't have the global map here,
      // but MfmRenderer/Note can fallback or we just rely on existing cache.
    });
  }

  return {
    ...note,
    reactions: newReactions,
  };
}

export function incrementNoteRenoteLocally(note: TimelineNote): TimelineNote {
  return {
    ...note,
    renotes: note.renotes + 1,
  };
}

export function incrementNoteReplyLocally(note: TimelineNote): TimelineNote {
  return {
    ...note,
    replies: note.replies + 1,
  };
}
