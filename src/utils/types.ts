export type TimelineTab = "home" | "local" | "global";
export type MainScreenTab = "home" | "explore" | "notifications" | "profile";

export type MisskeyUser = {
  id: string;
  name?: string | null;
  username: string;
  host?: string | null;
  avatarUrl?: string | null;
};

export type MisskeyFile = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  name?: string;
  type?: string;
  size?: number;
};

export type MisskeyNote = {
  id: string;
  text?: string | null;
  cw?: string | null;
  createdAt: string;
  user: MisskeyUser;
  renote?: MisskeyNote | null;
  reactions?: Record<string, number>;
  reactionEmojis?: Record<string, string>;
  myReaction?: string | null;
  repliesCount?: number;
  renoteCount?: number;
  files?: MisskeyFile[];
  reply?: MisskeyNote | null;
  replyId?: string | null;
  emojis?: Array<{ name: string; url: string }>;
};

export type TimelineNote = {
  id: string;
  targetId: string;
  content: string;
  createdAtLabel: string;
  user: {
    id: string;
    name: string;
    username: string;
    host: string;
    avatar: string;
  };
  renoteUser: string | null;
  reactions: Array<{
    emoji: string;
    count: number;
    reacted: boolean;
    isCustom: boolean;
    url?: string;
  }>;
  replies: number;
  renotes: number;
  files: Array<{ url: string; thumbnailUrl?: string; type?: string }>;
  reply: TimelineNote | null;
  quote: TimelineNote | null;
  emojis: Record<string, string>;
};

export type StoredAccount = {
  id: string;
  host: string;
  token: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export type PersistedState = {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  devMode: boolean;
  themeMode?: "system" | "light" | "dark";
};

export type MisskeyMiAuthCheck = {
  ok: boolean;
  token: string;
  user: MisskeyUser;
};

export type DebugState = {
  lastPath: string;
  lastStatus: number | null;
  lastError: string | null;
};

export type ColorScheme = {
  bg: string;
  cardBg: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  tabBg: string;
  tabActiveBg: string;
  tabText: string;
  tabActiveText: string;
  headerBg: string;
  settingsBg: string;
  reactionBg: string;
  reactionBorder: string;
  reactionActiveBg: string;
  reactionActiveBorder: string;
};

export type ProfileTab = 'notes' | 'follows' | 'followers';
