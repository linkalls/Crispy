import { useEffect, useRef, useState, useCallback } from 'react';
import { StoredAccount } from '../utils/types';
import * as mk from 'misskey-js';

export function useMisskeyStream(activeAccount: StoredAccount | null) {
  const streamRef = useRef<mk.Stream | null>(null);
  const channelRefs = useRef<{
    home?: mk.IChannelConnection<mk.Channels['homeTimeline']>;
    local?: mk.IChannelConnection<mk.Channels['localTimeline']>;
    global?: mk.IChannelConnection<mk.Channels['globalTimeline']>;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  const connect = useCallback(() => {
    if (!activeAccount || !activeAccount.token || activeAccount.token === 'mock_token') return;
    
    if (streamRef.current) {
      streamRef.current.close();
    }

    const stream = new mk.Stream(`https://${activeAccount.host}`, { token: activeAccount.token });

    stream.on('_connected_', () => {
      console.log('[Stream] WebSocket connected');
      setIsConnected(true);
    });

    stream.on('_disconnected_', () => {
      console.log('[Stream] WebSocket closed');
      setIsConnected(false);
    });

    const home = stream.useChannel('homeTimeline', { withFiles: true, withRenotes: true }, 'home');
    const local = stream.useChannel('localTimeline', { withFiles: true, withReplies: true, withRenotes: true }, 'local');
    const global = stream.useChannel('globalTimeline', { withFiles: true, withRenotes: true }, 'global');

    home.on('note', (note) => setLastMessage({ channelId: 'home', note }));
    local.on('note', (note) => setLastMessage({ channelId: 'local', note }));
    global.on('note', (note) => setLastMessage({ channelId: 'global', note }));

    channelRefs.current = { home, local, global };
    streamRef.current = stream;
  }, [activeAccount]);

  useEffect(() => {
    connect();
    return () => {
      channelRefs.current.home?.dispose();
      channelRefs.current.local?.dispose();
      channelRefs.current.global?.dispose();
      channelRefs.current = {};
      streamRef.current?.close();
      streamRef.current = null;
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
