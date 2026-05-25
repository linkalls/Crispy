import test from 'node:test';
import assert from 'node:assert/strict';
import * as mk from 'misskey-js';
import { normalizeMisskeyEndpoint, resolveImagePreviewUrl } from '../src/utils/misskeyApi.ts';

test('normalizeMisskeyEndpoint strips /api prefix', () => {
  assert.equal(normalizeMisskeyEndpoint('/api/notes/timeline'), 'notes/timeline');
  assert.equal(normalizeMisskeyEndpoint('api/notes/timeline'), 'notes/timeline');
  assert.equal(normalizeMisskeyEndpoint('notes/timeline'), 'notes/timeline');
});

test('normalizeMisskeyEndpoint rejects empty endpoint', () => {
  assert.throws(() => normalizeMisskeyEndpoint('/api/'), /endpoint is empty/i);
  assert.throws(() => normalizeMisskeyEndpoint('  '), /endpoint is empty/i);
});

test('resolveImagePreviewUrl prefers original URL instead of thumbnail to load full quality', () => {
  assert.equal(
    resolveImagePreviewUrl('https://example.com/original.jpg', 'https://example.com/thumb.jpg'),
    'https://example.com/original.jpg',
  );
  assert.equal(
    resolveImagePreviewUrl('https://example.com/original.jpg', ''),
    'https://example.com/original.jpg',
  );
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
