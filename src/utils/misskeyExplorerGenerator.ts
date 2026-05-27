import type { MisskeyExplorerPreset } from './misskeyExplorer.ts';

const CATEGORY_TITLES: Record<string, string> = {
  admin: 'Admin',
  antennas: 'Antennas',
  ap: 'AP',
  app: 'Apps',
  auth: 'Auth',
  blocking: 'Social',
  'bubble-game': 'Games',
  channels: 'Channels',
  charts: 'Charts',
  chat: 'Chat',
  clips: 'Clips',
  drive: 'Drive',
  email: 'Account',
  emojis: 'System',
  federation: 'Federation',
  flash: 'Flash',
  following: 'Social',
  gallery: 'Gallery',
  hashtags: 'Discover',
  i: 'Account',
  invite: 'Account',
  miauth: 'Auth',
  mute: 'Social',
  notes: 'Notes',
  notifications: 'Account',
  pages: 'Pages',
  promo: 'System',
  renote: 'Social',
  roles: 'Admin',
  sw: 'System',
  test: 'System',
  users: 'Users',
};

function titleCase(input: string): string {
  return input
    .split(/[-/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferCategory(endpoint: string): string {
  const root = endpoint.split('/')[0] || 'misc';
  return CATEGORY_TITLES[root] || titleCase(root);
}

function inferTitle(endpoint: string): string {
  return titleCase(endpoint.replace(/^\/?/, ''));
}

function inferRequiresAuth(endpoint: string): boolean {
  return ![
    'admin/meta',
    'emojis',
    'federation/instances',
    'federation/stats',
    'hashtags/trend',
    'promo/read',
    'stats',
  ].includes(endpoint);
}

function inferPayload(endpoint: string): Record<string, unknown> {
  if (endpoint.startsWith('notes/')) {
    if (endpoint.endsWith('/show')) return { noteId: '' };
    if (endpoint.endsWith('/children')) return { noteId: '', limit: 30 };
    if (endpoint.endsWith('/search')) return { query: '', limit: 30 };
    if (endpoint.endsWith('/create')) return { text: 'Hello from Crispy' };
    if (endpoint.endsWith('/delete')) return { noteId: '' };
    if (endpoint.endsWith('/reactions/create')) return { noteId: '', reaction: '👍' };
    if (endpoint.endsWith('/reactions/delete')) return { noteId: '' };
    if (endpoint.endsWith('/timeline') || endpoint.endsWith('/local-timeline') || endpoint.endsWith('/global-timeline')) return { limit: 20 };
  }

  if (endpoint.startsWith('users/')) {
    if (endpoint.endsWith('/show')) return { userId: '' };
    if (endpoint.endsWith('/notes')) return { userId: '', limit: 20 };
    if (endpoint.endsWith('/following') || endpoint.endsWith('/followers')) return { userId: '', limit: 20 };
    if (endpoint.endsWith('/search')) return { query: '', limit: 20 };
    if (endpoint.endsWith('/reactions')) return { userId: '', limit: 20 };
  }

  if (endpoint.startsWith('drive/')) {
    if (endpoint.endsWith('/files')) return { limit: 20 };
    if (endpoint.endsWith('/files/create')) return { name: 'upload.png' };
    if (endpoint.endsWith('/folders')) return { limit: 20 };
    if (endpoint.endsWith('/folders/create')) return { name: 'New folder' };
  }

  if (endpoint.startsWith('channels/')) {
    if (endpoint.endsWith('/timeline')) return { channelId: '', limit: 20 };
    if (endpoint.endsWith('/show') || endpoint.endsWith('/favorite') || endpoint.endsWith('/unfavorite')) return { channelId: '' };
    if (endpoint.endsWith('/search')) return { query: '', limit: 20 };
    if (endpoint.endsWith('/create')) return { name: 'New channel' };
  }

  if (endpoint.startsWith('pages/')) {
    if (endpoint.endsWith('/show') || endpoint.endsWith('/delete') || endpoint.endsWith('/like') || endpoint.endsWith('/unlike')) return { pageId: '' };
    if (endpoint.endsWith('/create')) return { title: 'New page' };
    if (endpoint.endsWith('/update')) return { pageId: '' };
  }

  if (endpoint.startsWith('gallery/')) {
    if (endpoint.endsWith('/show')) return { postId: '' };
    if (endpoint.endsWith('/create')) return { title: 'New gallery post' };
  }

  if (endpoint.startsWith('flash/')) {
    if (endpoint.endsWith('/show')) return { flashId: '' };
    if (endpoint.endsWith('/featured') || endpoint.endsWith('/published') || endpoint.endsWith('/my') || endpoint.endsWith('/my-likes')) return { limit: 20 };
  }

  if (endpoint.startsWith('messages/') || endpoint.startsWith('messaging/')) {
    return { userId: '', limit: 20 };
  }

  if (endpoint.startsWith('federation/instances')) return { limit: 20 };
  if (endpoint.startsWith('emojis')) return { limit: 2000 };
  if (endpoint.startsWith('i/notifications')) return { limit: 20 };
  if (endpoint.startsWith('announcements')) return {};
  if (endpoint.startsWith('meta')) return {};
  if (endpoint.startsWith('stats')) return {};

  return {};
}

export function extractMisskeyEndpoints(definitionText: string): string[] {
  const matches = definitionText.matchAll(/'([^']+)':\s*\{/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1]).filter(Boolean))).sort();
}

export function buildMisskeyExplorerPresetsFromEndpoints(endpoints: string[]): MisskeyExplorerPreset[] {
  return endpoints.map((endpoint) => ({
    category: inferCategory(endpoint),
    title: inferTitle(endpoint),
    endpoint: `/api/${endpoint}`,
    payload: inferPayload(endpoint),
    requiresAuth: inferRequiresAuth(endpoint),
  }));
}

export function buildMisskeyExplorerPresetsFromDefinitionText(definitionText: string): MisskeyExplorerPreset[] {
  return buildMisskeyExplorerPresetsFromEndpoints(extractMisskeyEndpoints(definitionText));
}
