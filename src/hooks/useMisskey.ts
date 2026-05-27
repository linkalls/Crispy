import * as mk from "misskey-js";
import { useCallback, useMemo } from "react";
import { useGlobalState } from "../context/GlobalState";
import { logError } from "../utils/logger";
import { normalizeMisskeyEndpoint } from "../utils/misskeyApi";
import {
  buildMisskeyMultipartEntries,
  getMockMisskeyResponse,
} from "../utils/misskeyMock";
import type { StoredAccount } from "../utils/types";

export function useMisskey(activeAccount: StoredAccount | null) {
  const { devMode } = useGlobalState();
  const client = useMemo(() => {
    if (!activeAccount) return null;
    const hostUrl = activeAccount.host.replace(/\/+$/, "");
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

      if (activeAccount.token === "mock_token") {
        const mockResult = getMockMisskeyResponse(endpoint, {
          host: activeAccount.host,
          payload,
        });
        return (mockResult ?? {}) as T;
      }

      if (requiresAuth && !activeAccount.token) {
        throw new Error("認証が必要です。");
      }

      try {
        if (!client) {
          throw new Error("Misskey APIクライアントを初期化できませんでした。");
        }

        const isMultipart = endpoint.startsWith("drive/files/");
        let result;

        if (isMultipart && payload.file) {
          const formData = new FormData();
          for (const [key, value] of buildMisskeyMultipartEntries(
            payload,
            activeAccount.token,
          )) {
            formData.append(key, value as any);
          }

          const hostUrl = activeAccount.host.replace(/\/+$/, "");
          // React Native needs no Content-Type header so it can set the multipart boundary automatically
          const res = await fetch(`https://${hostUrl}/api/${endpoint}`, {
            method: "POST",
            headers: {
              // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS, React Native needs to set boundary
            },
            body: formData,
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            const errorMsg = `API Error on multipart: ${res.status} ${errBody}`;
            await logError("misskeyRequest multipart error", errorMsg, devMode);
            throw new Error(`API Error: ${res.status} ${errBody}`);
          }
          result = await res.json();
        } else {
          result = await client.request(endpoint as any, payload as any);
        }

        return result as T;
      } catch (e: any) {
        await logError(`misskeyRequest error for ${path}`, e, devMode);
        if (e && typeof e === "object" && mk.api.isAPIError(e)) {
          throw new Error(e.message || `${e.code} (${e.id})`);
        }
        throw e;
      }
    },
    [activeAccount, client, devMode],
  );

  return { misskeyRequest };
}
