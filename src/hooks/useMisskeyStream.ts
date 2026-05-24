import * as mk from 'misskey-js';
import { useEffect, useRef, useState, useCallback } from 'react';
import { StoredAccount, TimelineTab } from '../utils/types';

export function useMisskeyStream(activeAccount: StoredAccount | null, activeTab: TimelineTab) {
  const streamRef = useRef<mk.Stream | null>(null);
  const connectionRef = useRef<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  const connect = useCallback(() => {
    if (!activeAccount || !activeAccount.token || activeAccount.token === 'mock_token') return;
    
    if (connectionRef.current) {
      connectionRef.current.dispose();
      connectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }

    try {
      const stream = new mk.Stream(`https://${activeAccount.host}`, {
        token: activeAccount.token
      });
      streamRef.current = stream;

      stream.on('_connected_', () => {
        console.log('[Stream] connected');
        setIsConnected(true);
      });

      stream.on('_disconnected_', () => {
        console.log('[Stream] disconnected');
        setIsConnected(false);
      });

      const channelMap: Record<TimelineTab, "homeTimeline" | "localTimeline" | "globalTimeline"> = {
        home: "homeTimeline",
        local: "localTimeline",
        global: "globalTimeline"
      };

      const conn = stream.useChannel(channelMap[activeTab]);
      conn.on('note', (note: any) => {
        setLastMessage(note);
      });

      connectionRef.current = conn as any;
    } catch (e) {
      console.error('[Stream] Error initializing', e);
    }
  }, [activeAccount, activeTab]);

  useEffect(() => {
    connect();
    return () => {
      if (connectionRef.current) {
        connectionRef.current.dispose();
      }
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
