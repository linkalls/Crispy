import { useCallback, useMemo } from "react";
import { StoredAccount } from "../utils/types";
import * as mk from 'misskey-js';
import { normalizeMisskeyEndpoint } from "../utils/misskeyApi";

export function useMisskey(activeAccount: StoredAccount | null) {
  const client = useMemo(() => {
    if (!activeAccount) return null;
    const hostUrl = activeAccount.host.replace(/\/+$/, '');
    return new mk.api.APIClient({
      origin: `https://${hostUrl}`,
      credential: activeAccount.token || undefined,
    });
  }, [activeAccount]);

  const misskeyRequest = useCallback(
    async <T>(
      path: string,
      payload: Record<string, unknown>,
      requiresAuth = false,
    ): Promise<T> => {
      if (!activeAccount) {
        throw new Error("先にログインしてください。");
      }

      const endpoint = normalizeMisskeyEndpoint(path);

      if (activeAccount.token === 'mock_token') {
        if (endpoint === 'notes/children') {
          return [
            {
              id: 'mock_reply_1',
              createdAt: new Date().toISOString(),
              text: 'これは返信のモックデータです！ $[spin 最高]\nUIの階層表示などを確認してください。',
              user: {
                id: 'mock_user_reply',
                name: 'Reply User',
                username: 'reply_user',
                avatarUrl: 'https://sushi.ski/identicon/reply',
                host: null,
              },
              repliesCount: 0,
              renotesCount: 0,
              reactions: { '❤️': 2 },
            },
            {
              id: 'mock_reply_2',
              createdAt: new Date(Date.now() - 60000).toISOString(),
              text: '二つ目の返信です！',
              user: {
                id: 'mock_user_reply2',
                name: 'Reply User 2',
                username: 'reply_user2',
                avatarUrl: 'https://sushi.ski/identicon/reply2',
                host: null,
              },
              repliesCount: 1,
              renotesCount: 0,
              reactions: {},
            }
          ] as unknown as T;
        }
        if (endpoint === 'notes/search') {
          return [
            {
              id: 'mock_search_1',
              createdAt: new Date().toISOString(),
              text: `「${(payload.query as string) || ''}」の検索結果のモックです！`,
              user: {
                id: 'mock_user_search',
                name: 'Searcher',
                username: 'searcher',
                avatarUrl: 'https://sushi.ski/identicon/searcher',
                host: null,
              },
              repliesCount: 0,
              renotesCount: 0,
              reactions: {},
            }
          ] as unknown as T;
        }
        if (endpoint.includes('timeline')) {
          return [
            {
              id: 'mock_note_1',
              createdAt: new Date().toISOString(),
              text: 'これはUIテスト用のモックノートです！ $[spin MFMアニメーション]も表示されます。\n長めのテキストを書いて、UIがどのように見えるかテストします。',
              user: {
                id: 'mock_user_1',
                name: 'Crispy User',
                username: 'crispy',
                avatarUrl: 'https://sushi.ski/identicon/crispy',
                host: null,
              },
              repliesCount: 3,
              renotesCount: 1,
              reactions: { '👍': 5, '🎉': 2 },
            },
            {
              id: 'mock_note_2',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              text: '画像付きのノートテスト',
              user: {
                id: 'mock_user_2',
                name: 'Tester',
                username: 'tester',
                avatarUrl: 'https://sushi.ski/identicon/tester',
                host: 'misskey.io',
              },
              files: [{ id: 'mock_file_1', type: 'image/jpeg', url: 'https://picsum.photos/400/300', name: 'test.jpg' }],
              repliesCount: 0,
              renotesCount: 10,
              reactions: {},
            }
          ] as unknown as T;
        }
        return {} as T;
      }

      if (requiresAuth && !activeAccount.token) {
        throw new Error("認証が必要です。");
      }

      try {
        if (!client) {
          throw new Error("Misskey APIクライアントを初期化できませんでした。");
        }

        const isMultipart = endpoint.startsWith('drive/files/');
        let result;

        if (isMultipart && payload.file) {
          // Handle React Native FormData upload manually instead of going through misskey-js
          const formData = new FormData();
          formData.append('i', activeAccount.token);

          for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined && value !== null) {
              if (key === 'file' && typeof value === 'object' && 'uri' in value) {
                 // For React Native fetch blob, we pass it as a file directly with uri, name, type
                 formData.append(key, value as any);
              } else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
                 formData.append(key, String(value));
              } else {
                 // For multipart/form-data, object arrays or objects usually need to be omitted or correctly handled.
                 // The Misskey drive/files/create endpoint accepts: folderId, name, comment, isSensitive, force, file.
                 // All of them are scalar strings or booleans except file.
                 formData.append(key, String(value));
              }
            }
          }

          const hostUrl = activeAccount.host.replace(/\/+$/, '');
          // React Native needs no Content-Type header so it can set the multipart boundary automatically
          const res = await fetch(`https://${hostUrl}/api/${endpoint}`, {
            method: 'POST',
            headers: {
              // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS, React Native needs to set boundary
            },
            body: formData,
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            console.error(`API Error on multipart: ${res.status} ${errBody}`);
            throw new Error(`API Error: ${res.status} ${errBody}`);
          }
          result = await res.json();
        } else {
          result = await client.request(endpoint as any, payload as any);
        }

        return result as T;
      } catch (e: any) {
        if (e && typeof e === 'object' && mk.api.isAPIError(e)) {
          throw new Error(e.message || `${e.code} (${e.id})`);
        }
        throw e;
      }
    },
    [activeAccount, client],
  );

  return { misskeyRequest };
}
