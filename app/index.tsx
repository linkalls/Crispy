import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useGlobalState } from '../src/context/GlobalState';
import { AuthScreen } from '../src/components';
import { createSessionId, DEFAULT_HOST as DEFAULT_HOST_CONST, normalizeHost } from '../src/utils/formatting';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { MisskeyMiAuthCheck, MisskeyUser } from '../src/utils/types';
import { checkMiAuthSession } from '../src/utils/misskeyAuth';



export default function Index() {
  const { isReady, activeAccountId, setAccounts, setActiveAccountId, colors } = useGlobalState();
  const [serverHostInput, setServerHostInput] = useState(DEFAULT_HOST_CONST);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [activeAuthSession, setActiveAuthSession] = useState<{ session: string; host: string } | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const url = event.url;
      if (url && activeAuthSession && url.includes('session=')) {
        WebBrowser.dismissBrowser();
        await finishMiAuthLogin(activeAuthSession.session, activeAuthSession.host);
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [activeAuthSession]);

  const finishMiAuthLogin = async (session: string, host: string) => {
    try {
      setOauthLoading(true);
      setOauthError(null);
      const data: MisskeyMiAuthCheck = await checkMiAuthSession(host, session);
      if (data.ok && data.token) {
        setAccounts((prev) => {
          const exists = prev.find((a) => a.id === `${host}-${data.user.id}`);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: `${host}-${data.user.id}`,
              host,
              token: data.token,
              userId: data.user.id,
              username: data.user.username,
              displayName: data.user.name || data.user.username,
              avatarUrl: data.user.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${data.user.username}`,
            },
          ];
        });
        setActiveAccountId(`${host}-${data.user.id}`);
        setActiveAuthSession(null);
      } else {
        throw new Error('認証が完了していません');
      }
    } catch (e: any) {
      setOauthError(e.message);
    } finally {
      setOauthLoading(false);
    }
  };

  const startMiAuthLogin = async () => {
    if (!serverHostInput.trim()) return;
    setOauthLoading(true);
    setOauthError(null);
    try {
      if (serverHostInput.trim() === 'mock') {
        const mockHost = 'sushi.ski';
        const mockUserId = 'mock_user_1';
        setAccounts((prev) => [
          ...prev,
          {
            id: `${mockHost}-${mockUserId}`,
            host: mockHost,
            token: 'mock_token',
            userId: mockUserId,
            username: 'crispy_mock',
            displayName: 'Crispy Mock User',
            avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=mock`,
          },
        ]);
        setActiveAccountId(`${mockHost}-${mockUserId}`);
        setOauthLoading(false);
        return;
      }
      const hostUrl = normalizeHost(serverHostInput);
      const session = createSessionId();
      const returnUrl = Linking.createURL('/oauth-callback');
      const authUrl = `https://${hostUrl}/miauth/${session}?name=Crispy&callback=${encodeURIComponent(returnUrl)}&permission=read:account,write:account,read:blocks,write:blocks,read:drive,write:drive,read:favorites,write:favorites,read:following,write:following,read:messaging,write:messaging,read:mutes,write:mutes,write:notes,read:notifications,write:notifications,read:reactions,write:reactions,write:votes,read:pages,write:pages,write:page-likes,read:page-likes,read:user-groups,write:user-groups,read:channels,write:channels,read:gallery,write:gallery,read:gallery-likes,write:gallery-likes`;

      setActiveAuthSession({ session, host: hostUrl });
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      if (result.type === 'success' && result.url) {
        await finishMiAuthLogin(session, hostUrl);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        setOauthLoading(false);
        setActiveAuthSession(null);
      }
    } catch (e: any) {
      setOauthError(e.message);
      setOauthLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  if (activeAccountId) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <AuthScreen
      serverHostInput={serverHostInput}
      oauthLoading={oauthLoading}
      oauthError={oauthError}
      onServerHostChange={setServerHostInput}
      onLogin={startMiAuthLogin}
    />
  );
}
