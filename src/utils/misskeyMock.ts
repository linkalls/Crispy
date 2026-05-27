import type { MisskeyFile, MisskeyNote, MisskeyUser } from "./types.ts";

type MockContext = {
  host: string;
  payload: Record<string, unknown>;
};

type MockRecord = Record<string, unknown> | Array<unknown>;

function createUser(
  id: string,
  username: string,
  host: string | null = null,
): MisskeyUser {
  return {
    id,
    username,
    name: username.replace(/_/g, " "),
    host,
    avatarUrl: `https://sushi.ski/identicon/${username}`,
  };
}

function createNote(
  id: string,
  text: string,
  user: MisskeyUser,
  extra?: Partial<MisskeyNote>,
): MisskeyNote {
  return {
    id,
    text,
    createdAt: new Date().toISOString(),
    user,
    repliesCount: 0,
    renoteCount: 0,
    reactions: {},
    ...extra,
  };
}

function createFile(
  id: string,
  type: string,
  url: string,
  name: string,
): MisskeyFile {
  return {
    id,
    type,
    url,
    name,
    thumbnailUrl: type.startsWith("image/") ? url : null,
  };
}

function toNotification(user: MisskeyUser, type: string, reaction?: string) {
  return {
    id: `${type}-${user.id}`,
    type,
    createdAt: new Date().toISOString(),
    user,
    reaction,
    note: { id: "mock-note", text: "通知のモックです。" },
  };
}

export function getMockMisskeyResponse(
  endpoint: string,
  context: MockContext,
): MockRecord | null {
  const query = String(context.payload.query ?? "");
  const host = context.host;

  if (endpoint === "notes/children") {
    return [
      createNote(
        "mock_reply_1",
        "これは返信のモックデータです！ $[spin 最高]",
        createUser("mock_user_reply", "reply_user"),
      ),
      createNote(
        "mock_reply_2",
        "二つ目の返信です！",
        createUser("mock_user_reply2", "reply_user2"),
      ),
    ];
  }

  if (endpoint === "notes/search") {
    return [
      createNote(
        "mock_search_1",
        `「${query}」の検索結果のモックです！`,
        createUser("mock_user_search", "searcher"),
      ),
    ];
  }

  if (
    endpoint.includes("timeline") ||
    endpoint === "notes/featured" ||
    endpoint === "notes/recommended"
  ) {
    return [
      createNote(
        "mock_note_1",
        "これはUIテスト用のモックノートです！ $[spin MFMアニメーション]も表示されます。",
        createUser("mock_user_1", "crispy"),
      ),
      createNote(
        "mock_note_2",
        "画像付きのノートテスト",
        createUser("mock_user_2", "tester", host),
        {
          files: [
            createFile(
              "mock_file_1",
              "image/jpeg",
              "https://picsum.photos/400/300",
              "test.jpg",
            ),
          ],
          renoteCount: 10,
        },
      ),
    ];
  }

  if (endpoint === "i/notifications") {
    return [
      toNotification(createUser("u1", "alice", null), "reaction", "👍"),
      toNotification(createUser("u2", "bob", null), "renote"),
    ];
  }

  if (endpoint === "i") {
    return { id: "mock-me", username: "crispy", name: "Crispy User", host };
  }

  if (endpoint === "users/show") {
    return {
      id: "mock-user",
      username: "crispy",
      name: "Crispy User",
      host,
      followersCount: 42,
      followingCount: 128,
      notesCount: 256,
    };
  }

  if (
    endpoint === "users/notes" ||
    endpoint === "users/following" ||
    endpoint === "users/followers"
  ) {
    return [createUser("u1", "alice"), createUser("u2", "bob")];
  }

  if (endpoint === "drive/files") {
    return [
      createFile(
        "file-1",
        "image/jpeg",
        "https://picsum.photos/200/200",
        "image.jpg",
      ),
    ];
  }

  if (endpoint === "drive/files/create") {
    return { id: "uploaded-file-id" };
  }

  if (endpoint === "emojis") {
    return [{ name: "_shi_", url: "https://example.com/shi.png" }];
  }

  if (
    endpoint === "meta" ||
    endpoint === "stats" ||
    endpoint === "federation/instances" ||
    endpoint === "announcements"
  ) {
    return { ok: true, endpoint };
  }

  return null;
}

export function buildMisskeyMultipartEntries(
  payload: Record<string, unknown>,
  credential: string,
): Array<[string, string | { uri: string; name?: string; type?: string }]> {
  const entries: Array<
    [string, string | { uri: string; name?: string; type?: string }]
  > = [["i", credential]];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (
      key === "file" &&
      typeof value === "object" &&
      value !== null &&
      "uri" in value
    ) {
      entries.push([
        key,
        value as { uri: string; name?: string; type?: string },
      ]);
      continue;
    }
    if (
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      entries.push([key, String(value)]);
      continue;
    }
    entries.push([key, String(value)]);
  }

  return entries;
}
