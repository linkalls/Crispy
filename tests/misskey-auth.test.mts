import * as mk from "misskey-js";
import assert from "node:assert/strict";
import test from "node:test";
import {
  checkMiAuthSession,
  createMisskeyApiClient,
} from "../src/utils/misskeyAuth.ts";

test("createMisskeyApiClient normalizes host and credential", async () => {
  let capturedUrl = "";
  let capturedMethod = "";

  const client = new mk.api.APIClient({
    origin: "https://example.com/",
    credential: "token",
    fetch: async (url, init) => {
      capturedUrl = url;
      capturedMethod = init?.method || "";
      return {
        status: 200,
        async json() {
          return { ok: true };
        },
      };
    },
  });

  const result = await client.request("notes/timeline", { limit: 1 });
  assert.equal(capturedUrl, "https://example.com/api/notes/timeline");
  assert.equal(capturedMethod, "POST");
  assert.deepEqual(result, { ok: true });

  const helperClient = createMisskeyApiClient("example.com/", "token");
  assert.ok(helperClient);
});

test("checkMiAuthSession hits miauth session check", async () => {
  let capturedUrl = "";

  const client = {
    request: async (endpoint: string) => {
      capturedUrl = `https://misskey.example/api/${endpoint}`;
      return {
        ok: true,
        token: "abc",
        user: { id: "u1", username: "user", name: "User" },
      };
    },
  };

  const result = await checkMiAuthSession(
    "misskey.example",
    "session-1",
    client as any,
  );
  assert.equal(
    capturedUrl,
    "https://misskey.example/api/miauth/session-1/check",
  );
  assert.equal(result.ok, true);
  assert.equal(result.token, "abc");
});
