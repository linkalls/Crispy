import test from 'node:test';
import assert from 'node:assert/strict';
import * as mk from 'misskey-js';
import {
  buildMisskeyEmojiMap,
  normalizeMisskeyEmojiName,
  normalizeMisskeyEndpoint,
  resolveImagePreviewUrl,
  resolveMisskeyEmojiUrl,
} from '../src/utils/misskeyApi.ts';

test('normalizeMisskeyEndpoint strips /api prefix', () => {
  assert.equal(normalizeMisskeyEndpoint('/api/notes/timeline'), 'notes/timeline');
  assert.equal(normalizeMisskeyEndpoint('api/notes/timeline'), 'notes/timeline');
  assert.equal(normalizeMisskeyEndpoint('notes/timeline'), 'notes/timeline');
});

test('normalizeMisskeyEndpoint rejects empty endpoint', () => {
  assert.throws(() => normalizeMisskeyEndpoint('/api/'), /endpoint is empty/i);
  assert.throws(() => normalizeMisskeyEndpoint('  '), /endpoint is empty/i);
});

test('resolveImagePreviewUrl prefers thumbnail URL when available', () => {
  assert.equal(
    resolveImagePreviewUrl('https://example.com/thumb.jpg', 'https://example.com/thumb.jpg'),
    'https://example.com/thumb.jpg',
  );
  assert.equal(
    resolveImagePreviewUrl('https://example.com/thumb.jpg', ''),
    'https://example.com/thumb.jpg',
  );
});

test('normalizeMisskeyEmojiName strips host suffix and colons', () => {
  assert.equal(normalizeMisskeyEmojiName(':_shi_@misskey.io:'), '_shi_');
  assert.equal(normalizeMisskeyEmojiName('party_parrot@remote.example'), 'party_parrot');
});

test('resolveMisskeyEmojiUrl matches host-qualified emoji names', () => {
  const emojiMap = buildMisskeyEmojiMap(
    [{ name: '_shi_', url: 'https://example.com/shi.png' }],
    { ':party_parrot@remote.example:': 'https://example.com/parrot.png' },
  );

  assert.equal(resolveMisskeyEmojiUrl(emojiMap, ':_shi_@misskey.io:'), 'https://example.com/shi.png');
  assert.equal(resolveMisskeyEmojiUrl(emojiMap, 'party_parrot'), 'https://example.com/parrot.png');
});

test('misskey-js APIClient uses POST for regular endpoints', async () => {
  let capturedMethod = '';
  let capturedUrl = '';

  const client = new mk.api.APIClient({
    origin: 'https://example.com',
    credential: 'token',
    fetch: async (url, init) => {
      capturedMethod = init?.method || '';
      capturedUrl = url;
      return {
        status: 200,
        async json() {
          return { ok: true };
        },
      };
    },
  });

  const result = await client.request('notes/local-timeline', { limit: 1 });
  assert.equal(capturedMethod, 'POST');
  assert.equal(capturedUrl, 'https://example.com/api/notes/local-timeline');
  assert.deepEqual(result, { ok: true });
});
