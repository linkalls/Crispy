import * as mk from "misskey-js";
import { useCallback } from "react";
import { StoredAccount } from "../utils/types";

export function useMisskey(activeAccount: StoredAccount | null) {
  const misskeyRequest = useCallback(
    async <T>(
      path: string,
      payload: Record<string, unknown>,
      requiresAuth = false,
    ): Promise<T> => {
      if (!activeAccount) {
        throw new Error("先にログインしてください。");
      }

      if (activeAccount.host === 'mock') {
        if (path === '/api/notes/children') {
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
        if (path === '/api/notes/search') {
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
        if (path.includes('timeline')) {
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


      const client = new mk.api.APIClient({
        origin: `https://${activeAccount.host}`,
        credential: activeAccount.token || undefined,
      });

      try {
        const cleanPath = path.replace(/^\/api\//, '');
        // For endpoints that require notes/reactions/delete we must only send noteId
        const isReactionDelete = cleanPath === 'notes/reactions/delete';
        const finalPayload = isReactionDelete ? { noteId: payload.noteId } : payload;

        const response = await client.request(cleanPath as any, finalPayload as any);
        return response as T;
      } catch (error: any) {
        throw new Error(`Misskey API error: ${error.message || error}`);
      }
    },
    [activeAccount],
  );

  return { misskeyRequest };
}
