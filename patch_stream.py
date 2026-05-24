import re

with open('src/hooks/useMisskeyStream.ts', 'r', encoding='utf-8') as f:
    content = f.read()

search_connect = """    ws.onopen = () => {
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
    };"""

replace_connect = """    ws.onopen = () => {
      console.log('[Stream] WebSocket connected');
      setIsConnected(true);

      ws.send(JSON.stringify({
        type: 'connect',
        body: { channel: 'homeTimeline', id: 'home' }
      }));
      ws.send(JSON.stringify({
        type: 'connect',
        body: { channel: 'localTimeline', id: 'local' }
      }));
      ws.send(JSON.stringify({
        type: 'connect',
        body: { channel: 'globalTimeline', id: 'global' }
      }));
    };"""
content = content.replace(search_connect, replace_connect)

search_message = """    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'channel' && msg.body.id === 'home' && msg.body.type === 'note') {
          setLastMessage(msg.body.body);
        }
      } catch (e) {
        console.error('[Stream] Parse error', e);
      }
    };"""

replace_message = """    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'channel' && ['home', 'local', 'global'].includes(msg.body.id) && msg.body.type === 'note') {
          setLastMessage({ channelId: msg.body.id, note: msg.body.body });
        }
      } catch (e) {
        console.error('[Stream] Parse error', e);
      }
    };"""
content = content.replace(search_message, replace_message)

with open('src/hooks/useMisskeyStream.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("useMisskeyStream.ts patched")

with open('App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

search_app = """  useEffect(() => {
    if (lastMessage && mainTab === 'home' && activeTab === 'home') {
      setNotes((prev) => {
        const exists = prev.find(n => n.id === lastMessage.id);
        if (exists) return prev;
        return [mapNote(lastMessage, activeAccount?.host || DEFAULT_HOST), ...prev];
      });
    }
  }, [lastMessage, activeAccount?.host, mainTab, activeTab]);"""

replace_app = """  useEffect(() => {
    if (lastMessage && mainTab === 'home') {
      if (lastMessage.channelId === activeTab) {
        setNotes((prev) => {
          const exists = prev.find(n => n.id === lastMessage.note.id);
          if (exists) return prev;
          return [mapNote(lastMessage.note, activeAccount?.host || DEFAULT_HOST), ...prev];
        });
      }
    }
  }, [lastMessage, activeAccount?.host, mainTab, activeTab]);"""
app_content = app_content.replace(search_app, replace_app)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
print("App.tsx patched for stream")
