import { MisskeyNote, TimelineNote } from "./types";
import { buildMisskeyEmojiMap, resolveMisskeyEmojiUrl } from "./misskeyApi";

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
  const quoteNote = (!isPureRenote && note.renote) ? mapNote(note.renote, fallbackHost) : null;

  // カスタム絵文字のマップを作成
  const noteEmojis = Array.isArray(note.emojis) ? note.emojis : [];
  const targetEmojis = Array.isArray(target.emojis) ? target.emojis : [];
  const noteUserEmojis = Array.isArray(note.user.emojis) ? note.user.emojis : [];
  const targetUserEmojis = Array.isArray(target.user.emojis) ? target.user.emojis : [];
  const emojiMap = buildMisskeyEmojiMap(
    [...noteEmojis, ...targetEmojis, ...noteUserEmojis, ...targetUserEmojis],
    target.reactionEmojis,
  );

  const reactions = Object.entries(target.reactions || {}).map(([emoji, count]) => {
    const reactionEmojiUrl = resolveMisskeyEmojiUrl(emojiMap, emoji);

    return {
      emoji,
      count,
      reacted: target.myReaction === emoji,
      isCustom: emoji.startsWith(':'),
      url: reactionEmojiUrl
    };
  });

  return {
    id: note.id,
    targetId: target.id,
    content: content || (note.renote ? "" : "(no text)"),
    createdAtLabel: toRelativeTime(target.createdAt),
    user: {
      id: target.user.id || '',
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
