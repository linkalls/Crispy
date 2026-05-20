import { useEffect, useRef, useState, useCallback } from 'react';
import { StoredAccount } from '../utils/types';

export function useMisskeyStream(activeAccount: StoredAccount | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  const connect = useCallback(() => {
    if (!activeAccount || !activeAccount.token || activeAccount.token === 'mock_token') return;
    
    // 既存の接続があれば閉じる
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`wss://${activeAccount.host}/streaming?i=${activeAccount.token}`);
    
    ws.onopen = () => {
      console.log('[Stream] WebSocket connected');
      setIsConnected(true);
      
      // ホームタイムラインに接続
      ws.send(JSON.stringify({
        type: 'connect',
        body: {
          channel: 'homeTimeline',
          id: 'home'
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'channel' && msg.body.id === 'home' && msg.body.type === 'note') {
          setLastMessage(msg.body.body);
        }
      } catch (e) {
        console.error('[Stream] Parse error', e);
      }
    };

    ws.onclose = () => {
      console.log('[Stream] WebSocket closed');
      setIsConnected(false);
      // 再接続（10秒後）
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 10000);
    };

    ws.onerror = (e) => {
      console.error('[Stream] WebSocket error', e);
    };

    wsRef.current = ws;
  }, [activeAccount]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
