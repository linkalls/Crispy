import * as mk from 'misskey-js';
import type { MisskeyMiAuthCheck } from './types.ts';

export function createMisskeyApiClient(host: string, credential?: string | null) {
  return new mk.api.APIClient({
    origin: `https://${host.replace(/\/+$/, '')}`,
    credential: credential || undefined,
  });
}

export async function checkMiAuthSession(
  host: string,
  session: string,
  client = createMisskeyApiClient(host),
): Promise<MisskeyMiAuthCheck> {
  return client.request(`miauth/${session}/check` as any, {} as any) as Promise<MisskeyMiAuthCheck>;
}
