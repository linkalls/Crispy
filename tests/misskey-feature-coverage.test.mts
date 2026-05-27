import assert from "node:assert/strict";
import test from "node:test";
import {
  incrementNoteRenoteLocally,
  toggleNoteReactionLocally,
} from "../src/utils/formatting.ts";
import { MISSKEY_EXPLORER_PRESETS } from "../src/utils/misskeyExplorer.generated.ts";
import {
  groupMisskeyExplorerPresets,
  normalizeMisskeyExplorerEndpoint,
  parseMisskeyExplorerPayload,
} from "../src/utils/misskeyExplorer.ts";
import {
  buildMisskeyExplorerPresetsFromDefinitionText,
  extractMisskeyEndpoints,
} from "../src/utils/misskeyExplorerGenerator.ts";
import {
  buildMisskeyMultipartEntries,
  getMockMisskeyResponse,
} from "../src/utils/misskeyMock.ts";

test("misskey explorer presets cover main feature groups", () => {
  const grouped = groupMisskeyExplorerPresets(MISSKEY_EXPLORER_PRESETS);
  assert.ok(grouped.Account.length > 0);
  assert.ok(grouped.Notes.length > 0);
  assert.ok(grouped.Users.length > 0);
  assert.ok(grouped.Drive.length > 0);
  assert.ok(grouped.Channels.length > 0);
  assert.ok(grouped.Pages.length > 0);
  assert.ok(grouped.Gallery.length > 0);
  assert.ok(grouped.Flash.length > 0);
  assert.ok(grouped.Federation.length > 0);
  assert.ok(grouped.System.length > 0);
  assert.ok(grouped.Account.length > 0);

  const titles = new Set(
    MISSKEY_EXPLORER_PRESETS.map(
      (preset) => `${preset.category}:${preset.title}`,
    ),
  );
  assert.equal(titles.size, MISSKEY_EXPLORER_PRESETS.length);
  assert.ok(MISSKEY_EXPLORER_PRESETS.length > 400);
  assert.ok(
    MISSKEY_EXPLORER_PRESETS.some(
      (preset) => preset.endpoint === "/api/notes/create",
    ),
  );
  assert.ok(
    MISSKEY_EXPLORER_PRESETS.some(
      (preset) => preset.endpoint === "/api/channels/timeline",
    ),
  );
  assert.ok(
    MISSKEY_EXPLORER_PRESETS.some(
      (preset) => preset.endpoint === "/api/federation/instances",
    ),
  );
});

test("generator extracts misskey endpoint definitions", () => {
  const sample = `
    export type Endpoints = {
      'notes/timeline': { req: EmptyRequest; res: NotesTimelineResponse; };
      'channels/timeline': { req: ChannelsTimelineRequest; res: ChannelsTimelineResponse; };
      'federation/instances': { req: FederationInstancesRequest; res: FederationInstancesResponse; };
    };
  `;

  assert.deepEqual(extractMisskeyEndpoints(sample), [
    "channels/timeline",
    "federation/instances",
    "notes/timeline",
  ]);
  const generated = buildMisskeyExplorerPresetsFromDefinitionText(sample);
  assert.equal(generated.length, 3);
  assert.equal(generated[0].endpoint, "/api/channels/timeline");
  assert.equal(generated[1].endpoint, "/api/federation/instances");
  assert.equal(generated[2].endpoint, "/api/notes/timeline");
});

test("normalizeMisskeyExplorerEndpoint adds /api prefix", () => {
  assert.equal(
    normalizeMisskeyExplorerEndpoint("notes/timeline"),
    "/api/notes/timeline",
  );
  assert.equal(
    normalizeMisskeyExplorerEndpoint("/api/notes/timeline"),
    "/api/notes/timeline",
  );
  assert.equal(
    normalizeMisskeyExplorerEndpoint("  /notes/search  "),
    "/api/notes/search",
  );
});

test("parseMisskeyExplorerPayload accepts objects and rejects arrays", () => {
  assert.deepEqual(parseMisskeyExplorerPayload(""), { ok: true, value: {} });
  assert.deepEqual(parseMisskeyExplorerPayload('{"limit":20}'), {
    ok: true,
    value: { limit: 20 },
  });

  const arrayResult = parseMisskeyExplorerPayload("[1,2,3]");
  assert.equal(arrayResult.ok, false);
});

test("mock misskey responses cover common screens", () => {
  const timeline = getMockMisskeyResponse("notes/timeline", {
    host: "misskey.io",
    payload: {},
  });
  assert.ok(Array.isArray(timeline));
  assert.ok((timeline as any[])[0].id);

  const notifications = getMockMisskeyResponse("i/notifications", {
    host: "misskey.io",
    payload: {},
  });
  assert.ok(Array.isArray(notifications));
  assert.equal((notifications as any[])[0].type, "reaction");

  const user = getMockMisskeyResponse("users/show", {
    host: "misskey.io",
    payload: { userId: "x" },
  });
  assert.equal((user as any).username, "crispy");

  const uploaded = getMockMisskeyResponse("drive/files/create", {
    host: "misskey.io",
    payload: {},
  });
  assert.equal((uploaded as any).id, "uploaded-file-id");
});

test("multipart entries keep files and stringify scalars", () => {
  const entries = buildMisskeyMultipartEntries(
    {
      file: {
        uri: "file:///tmp/image.png",
        name: "image.png",
        type: "image/png",
      },
      force: true,
      limit: 10,
      name: "hello",
      ignored: null,
    },
    "token-123",
  );

  assert.deepEqual(entries[0], ["i", "token-123"]);
  assert.deepEqual(entries[1], [
    "file",
    { uri: "file:///tmp/image.png", name: "image.png", type: "image/png" },
  ]);
  assert.deepEqual(entries[2], ["force", "true"]);
  assert.deepEqual(entries[3], ["limit", "10"]);
  assert.deepEqual(entries[4], ["name", "hello"]);
  assert.equal(
    entries.some(([key]) => key === "ignored"),
    false,
  );
});

test("note helpers keep local state consistent", () => {
  const note = {
    id: "n1",
    targetId: "n1",
    content: "hello",
    createdAtLabel: "1m",
    user: {
      id: "u1",
      name: "User",
      username: "user",
      host: "misskey.io",
      avatar: "",
    },
    renoteUser: null,
    reactions: [{ emoji: "👍", count: 1, reacted: false, isCustom: false }],
    replies: 1,
    renotes: 2,
    files: [],
    reply: null,
    quote: null,
    emojis: {},
  };

  const reacted = toggleNoteReactionLocally(note as any, "👍", true);
  assert.equal(reacted.reactions[0].count, 2);
  assert.equal(reacted.reactions[0].reacted, true);

  const renoted = incrementNoteRenoteLocally(note as any);
  assert.equal(renoted.renotes, 3);
});
