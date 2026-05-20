const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

// 1. Safe Area Provider
content = content.replace(
  "import {\n  ActivityIndicator,\n  Alert,\n  Image,\n  Pressable,\n  RefreshControl,\n  SafeAreaView,\n  ScrollView,\n  StyleSheet,\n  Switch,\n  Text,\n  TextInput,\n  View,\n} from 'react-native';",
  "import {\n  ActivityIndicator,\n  Alert,\n  Image,\n  Pressable,\n  RefreshControl,\n  ScrollView,\n  StyleSheet,\n  Switch,\n  Text,\n  TextInput,\n  View,\n  useColorScheme,\n} from 'react-native';\nimport { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';\nimport * as mfm from 'mfm-js';"
);

content = content.replace(
  "export default function App() {",
  "export default function App() {\n  return (\n    <SafeAreaProvider>\n      <AppContent />\n    </SafeAreaProvider>\n  );\n}\n\nfunction AppContent() {"
);

// 2. Add Theme State
content = content.replace(
  "const [devMode, setDevMode] = useState(false);",
  "const [devMode, setDevMode] = useState(false);\n  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');"
);

content = content.replace(
  "devMode: boolean;\n};",
  "devMode: boolean;\n  themeMode?: 'system' | 'light' | 'dark';\n};"
);

content = content.replace(
  "setDevMode(Boolean(parsed.devMode));",
  "setDevMode(Boolean(parsed.devMode));\n        if (parsed.themeMode) setThemeMode(parsed.themeMode);"
);

content = content.replace(
  "      devMode,\n    };\n    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);\n  }, [accounts, activeAccountId, devMode, hydrated]);",
  "      devMode,\n      themeMode,\n    };\n    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);\n  }, [accounts, activeAccountId, devMode, themeMode, hydrated]);"
);

content = content.replace(
  "const activeAccount = useMemo(",
  "const colorScheme = useColorScheme();\n  const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';\n  const colors = isDark ? darkColors : lightColors;\n\n  const activeAccount = useMemo("
);

// 3. Fix JSON Error
content = content.replace(
  "      if (!response.ok) {\n        throw new Error(`Misskey API error: ${response.status}`);\n      }\n\n      return (await response.json()) as T;\n    },",
  "      if (!response.ok) {\n        throw new Error(`Misskey API error: ${response.status}`);\n      }\n      if (response.status === 204) return {} as T;\n      const text = await response.text();\n      return (text ? JSON.parse(text) : {}) as T;\n    },"
);

// 4. Fix WebBrowser Auth
content = content.replace(
  "const [oauthLoading, setOauthLoading] = useState(false);",
  "const [oauthLoading, setOauthLoading] = useState(false);\n  const [activeAuthSession, setActiveAuthSession] = useState<{ session: string; host: string } | null>(null);"
);

content = content.replace(
  /  const startMiAuthLogin = async \(\) => {[\s\S]*?finally {\n      setOauthLoading\(false\);\n    }\n  };/,
  `  const finishMiAuthLogin = useCallback(async (session: string, host: string) => {
    try {
      setOauthLoading(true);
      const checkResponse = await fetch(\`https://\${host}/api/miauth/\${session}/check\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!checkResponse.ok) {
        throw new Error(\`セッション確認失敗: \${checkResponse.status}\`);
      }

      const auth = (await checkResponse.json()) as MisskeyMiAuthCheck;
      if (!auth.ok || !auth.token || !auth.user?.id) {
        throw new Error('ログイン情報が不正です。');
      }

      const newAccount: StoredAccount = {
        id: \`\${host}:\${auth.user.id}\`,
        host,
        token: auth.token,
        userId: auth.user.id,
        username: auth.user.username,
        displayName: auth.user.name || auth.user.username,
        avatarUrl: auth.user.avatarUrl || DEFAULT_AVATAR,
      };

      setAccounts((current) => {
        const withoutCurrent = current.filter((account) => account.id !== newAccount.id);
        return [newAccount, ...withoutCurrent];
      });
      setActiveAccountId(newAccount.id);
      setServerHostInput(host);
      setActiveTab('home');
      setActiveAuthSession(null);
      setOauthError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      setOauthError(message);
    } finally {
      setOauthLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUrl = (event: Linking.EventType) => {
      if (!activeAuthSession) return;
      const parsed = Linking.parse(event.url);
      const callbackSession =
        typeof parsed.queryParams?.session === 'string' ? parsed.queryParams.session : undefined;

      if (callbackSession && callbackSession === activeAuthSession.session) {
        finishMiAuthLogin(activeAuthSession.session, activeAuthSession.host);
      } else if (parsed.hostname === 'auth' && parsed.path === 'callback') {
        setOauthError('OAuth セッション検証に失敗しました。');
        setActiveAuthSession(null);
        setOauthLoading(false);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url && activeAuthSession) {
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeAuthSession, finishMiAuthLogin]);

  const startMiAuthLogin = async () => {
    const host = normalizeHost(serverHostInput);
    if (!host) {
      setOauthError('サーバーのホスト名を入力してください。');
      return;
    }

    setOauthLoading(true);
    setOauthError(null);

    const session = createSessionId();
    setActiveAuthSession({ session, host });

    const callbackUrl = Linking.createURL('auth/callback', { scheme: 'crispy' });
    const permission = [
      'read:account',
      'read:notes',
      'write:notes',
      'write:reactions',
      'write:notifications',
    ].join(',');

    const authUrl = \`https://\${host}/miauth/\${session}?name=\${encodeURIComponent(
      'Crispy'
    )}&callback=\${encodeURIComponent(callbackUrl)}&permission=\${encodeURIComponent(permission)}\`;

    try {
      await Linking.openURL(authUrl);
    } catch (error) {
      setOauthError('ブラウザを開けませんでした。');
      setOauthLoading(false);
      setActiveAuthSession(null);
    }
  };`
);

// 5. Update UI for Theme & MFM & Multi-account
content = content.replace(
  "<SafeAreaView style={styles.screen}>",
  "<SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>"
);
content = content.replace(
  "<StatusBar style=\"dark\" />",
  "<StatusBar style={isDark ? \"light\" : \"dark\"} />"
);
content = content.replace(
  "<View style={styles.header}>",
  "<View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>"
);
content = content.replace(
  "<Text style={styles.headerAppName}>Crispy</Text>",
  "<Text style={[styles.headerAppName, { color: colors.primaryText }]}>Crispy</Text>"
);
content = content.replace(
  "<Text style={styles.headerName}>{activeAccount.displayName}</Text>",
  "<Text style={[styles.headerName, { color: colors.text }]}>{activeAccount.displayName}</Text>"
);
content = content.replace(
  "<Text style={styles.headerMeta}>@{activeAccount.username} · {activeAccount.host}</Text>",
  "<Text style={[styles.headerMeta, { color: colors.textMuted }]}>@{activeAccount.username} · {activeAccount.host}</Text>"
);
content = content.replace(
  "<Ionicons name=\"settings-outline\" size={20} color=\"#334155\" />",
  "<Ionicons name=\"settings-outline\" size={20} color={colors.text} />"
);
content = content.replace(
  "<View style={styles.tabBar}>",
  "<View style={[styles.tabBar, { backgroundColor: colors.tabBg }]}>"
);

content = content.replace(
  "function TabButton({\n  label,\n  active,\n  onPress,\n}: {",
  "function TabButton({\n  label,\n  active,\n  onPress,\n  colors,\n}: {"
);
content = content.replace(
  "onPress: () => void;\n}) {",
  "onPress: () => void;\n  colors: any;\n}) {"
);
content = content.replace(
  "style={({ pressed }) => [styles.tabButton, active && styles.tabButtonActive, pressed && styles.buttonPressed]}",
  "style={({ pressed }) => [styles.tabButton, active && styles.tabButtonActive, active && { backgroundColor: colors.tabActiveBg }, pressed && styles.buttonPressed]}"
);
content = content.replace(
  "<Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>",
  "<Text style={[styles.tabButtonText, { color: colors.tabText }, active && styles.tabButtonTextActive, active && { color: colors.tabActiveText }]}>{label}</Text>"
);

content = content.replace(
  "<TabButton label=\"For You\" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />",
  "<TabButton label=\"For You\" active={activeTab === 'home'} onPress={() => setActiveTab('home')} colors={colors} />"
);
content = content.replace(
  "<TabButton label=\"Local\" active={activeTab === 'local'} onPress={() => setActiveTab('local')} />",
  "<TabButton label=\"Local\" active={activeTab === 'local'} onPress={() => setActiveTab('local')} colors={colors} />"
);
content = content.replace(
  "<TabButton label=\"Global\" active={activeTab === 'global'} onPress={() => setActiveTab('global')} />",
  "<TabButton label=\"Global\" active={activeTab === 'global'} onPress={() => setActiveTab('global')} colors={colors} />"
);

content = content.replace(
  "        <View style={styles.settingsPanel}>\n          <Text style={styles.settingsTitle}>設定</Text>\n\n          <View style={styles.devModeRow}>\n            <Text style={styles.devModeLabel}>devモード</Text>\n            <Switch value={devMode} onValueChange={setDevMode} />\n          </View>",
  "        <View style={[styles.settingsPanel, { backgroundColor: colors.settingsBg, borderColor: colors.border }]}>\n          <Text style={[styles.settingsTitle, { color: colors.text }]}>設定</Text>\n\n          <View style={styles.devModeRow}>\n            <Text style={[styles.devModeLabel, { color: colors.text }]}>テーマ設定: {themeMode}</Text>\n            <Pressable onPress={() => setThemeMode(m => m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system')} style={{ padding: 8, backgroundColor: colors.border, borderRadius: 8 }}><Text style={{color: colors.text}}>{themeMode}</Text></Pressable>\n          </View>\n\n          <View style={styles.devModeRow}>\n            <Text style={[styles.devModeLabel, { color: colors.text }]}>devモード</Text>\n            <Switch value={devMode} onValueChange={setDevMode} />\n          </View>"
);

content = content.replace(
  "<Text style={styles.accountSectionTitle}>アカウント切り替え</Text>",
  "<Text style={[styles.accountSectionTitle, { color: colors.textMuted }]}>アカウント切り替え</Text>"
);
content = content.replace(
  "<Text style={styles.accountName}>{account.displayName}</Text>",
  "<Text style={[styles.accountName, { color: colors.text }]}>{account.displayName}</Text>"
);
content = content.replace(
  "<Text style={styles.accountHost}>@{account.username} · {account.host}</Text>",
  "<Text style={[styles.accountHost, { color: colors.textMuted }]}>@{account.username} · {account.host}</Text>"
);
content = content.replace(
  "<Text style={styles.secondaryButtonText}>現在アカウントを削除</Text>",
  "<Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>現在アカウントを削除</Text>"
);
content = content.replace(
  "<Text style={styles.secondaryButtonText}>別アカウントを追加</Text>",
  "<Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>別アカウントを追加</Text>"
);
content = content.replace(
  /style={styles\.secondaryButton}/g,
  "style={[styles.secondaryButton, { backgroundColor: colors.reactionBg }]}"
);
content = content.replace(
  "<Pressable style={[styles.secondaryButton, { backgroundColor: colors.reactionBg }]} onPress={startMiAuthLogin}>",
  "<Pressable style={[styles.secondaryButton, { backgroundColor: colors.reactionBg }]} onPress={() => { setServerHostInput(DEFAULT_HOST); setActiveAccountId(null); }}>"
);

content = content.replace(
  "<Text style={styles.timelineLoadingText}>タイムラインを読み込み中...</Text>",
  "<Text style={[styles.timelineLoadingText, { color: colors.textMuted }]}>タイムラインを読み込み中...</Text>"
);
content = content.replace(
  "<View style={styles.emptyStateCard}>",
  "<View style={[styles.emptyStateCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>"
);
content = content.replace(
  "<Text style={styles.emptyStateTitle}>表示できるノートがありません</Text>",
  "<Text style={[styles.emptyStateTitle, { color: colors.text }]}>表示できるノートがありません</Text>"
);
content = content.replace(
  "<Text style={styles.emptyStateText}>少し待ってから再読み込みしてください。</Text>",
  "<Text style={[styles.emptyStateText, { color: colors.textMuted }]}>少し待ってから再読み込みしてください。</Text>"
);
content = content.replace(
  "<Text style={styles.secondaryButtonText}>再読み込み</Text>",
  "<Text style={[styles.secondaryButtonText, { color: colors.primaryText }]}>再読み込み</Text>"
);
content = content.replace(
  "style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}",
  "style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.reactionBg }, pressed && styles.buttonPressed]}"
);

content = content.replace(
  "<View key={note.id} style={styles.noteCard}>",
  "<View key={note.id} style={[styles.noteCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>"
);
content = content.replace(
  "{note.renoteUser ? <Text style={styles.renoteText}>{note.renoteUser} がリノート</Text> : null}",
  "{note.renoteUser ? <Text style={[styles.renoteText, { color: colors.textMuted }]}>{note.renoteUser} がリノート</Text> : null}"
);
content = content.replace(
  "<Text style={styles.noteName}>{note.user.name}</Text>",
  "<Text style={[styles.noteName, { color: colors.text }]}>{note.user.name}</Text>"
);
content = content.replace(
  "<Text style={styles.noteMeta}>",
  "<Text style={[styles.noteMeta, { color: colors.textMuted }]}>"
);
content = content.replace(
  "<Text style={styles.noteContent}>{note.content}</Text>",
  "<MfmRenderer nodes={mfm.parseSimple(note.content)} colors={colors} />"
);
content = content.replace(
  "<Text style={styles.noteCount}>💬 {note.replies}</Text>",
  "<Text style={[styles.noteCount, { color: colors.textMuted }]}>💬 {note.replies}</Text>"
);
content = content.replace(
  "<Text style={styles.noteCount}>🔁 {note.renotes}</Text>",
  "<Text style={[styles.noteCount, { color: colors.textMuted }]}>🔁 {note.renotes}</Text>"
);

content = content.replace(
  "style={({ pressed }) => [\n                          styles.reactionButton,\n                          reaction.reacted && styles.reactionActive,\n                          pressed && styles.buttonPressed,\n                        ]}",
  "style={({ pressed }) => [\n                          styles.reactionButton, { backgroundColor: colors.reactionBg, borderColor: colors.reactionBorder },\n                          reaction.reacted && [styles.reactionActive, { backgroundColor: colors.reactionActiveBg, borderColor: colors.reactionActiveBorder }],\n                          pressed && styles.buttonPressed,\n                        ]}"
);

content = content.replace(
  "<Text style={styles.reactionText}>{reaction.emoji}</Text>",
  "<Text style={[styles.reactionText, { color: colors.text }]}>{reaction.emoji}</Text>"
);
content = content.replace(
  "<Text style={styles.reactionCount}>{reaction.count}</Text>",
  "<Text style={[styles.reactionCount, { color: colors.textMuted }]}>{reaction.count}</Text>"
);

// MfmRenderer
const mfmComponent = `
function MfmRenderer({ nodes, colors }: { nodes: mfm.MfmNode[]; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {nodes.map((node, i) => {
        if (node.type === 'text') {
          return <Text key={i} style={{ color: colors.text }}>{node.props.text}</Text>;
        }
        if (node.type === 'unicodeEmoji') {
          return <Text key={i}>{node.props.emoji}</Text>;
        }
        if (node.type === 'emojiCode') {
          return <Text key={i} style={{ color: colors.text }}>:{node.props.name}:</Text>;
        }
        if (node.type === 'url' || node.type === 'link') {
          return (
            <Text
              key={i}
              style={{ color: colors.primaryText, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL(node.props.url)}
            >
              {node.type === 'link' ? <MfmRenderer nodes={node.children} colors={colors} /> : node.props.url}
            </Text>
          );
        }
        if (node.type === 'mention') {
          return <Text key={i} style={{ color: colors.primaryText }}>{node.props.acct}</Text>;
        }
        if (node.type === 'hashtag') {
          return <Text key={i} style={{ color: colors.primaryText }}>#{node.props.hashtag}</Text>;
        }
        if (node.type === 'bold') {
          return (
            <Text key={i} style={{ fontWeight: 'bold', color: colors.text }}>
              <MfmRenderer nodes={node.children} colors={colors} />
            </Text>
          );
        }
        if (node.type === 'italic') {
          return (
            <Text key={i} style={{ fontStyle: 'italic', color: colors.text }}>
              <MfmRenderer nodes={node.children} colors={colors} />
            </Text>
          );
        }
        if (node.type === 'strike') {
          return (
            <Text key={i} style={{ textDecorationLine: 'line-through', color: colors.text }}>
              <MfmRenderer nodes={node.children} colors={colors} />
            </Text>
          );
        }
        if (node.type === 'quote') {
          return (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.border, paddingLeft: 8, marginVertical: 4 }}>
              <MfmRenderer nodes={node.children} colors={colors} />
            </View>
          );
        }
        if ('children' in node && Array.isArray(node.children)) {
          return <MfmRenderer key={i} nodes={node.children} colors={colors} />;
        }
        return null;
      })}
    </View>
  );
}
`;

content = content.replace("function normalizeHost(input: string): string {", mfmComponent + "\nfunction normalizeHost(input: string): string {");

const darkThemeCode = `
const lightColors = {
  bg: '#f6f8ff',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#dbeafe',
  primary: '#2563eb',
  primaryText: '#1d4ed8',
  tabBg: '#eaf1ff',
  tabActiveBg: '#ffffff',
  tabText: '#475569',
  tabActiveText: '#1e40af',
  headerBg: '#ffffff',
  settingsBg: '#f8fbff',
  reactionBg: '#f8fbff',
  reactionBorder: '#dbeafe',
  reactionActiveBg: '#dbeafe',
  reactionActiveBorder: '#60a5fa',
};

const darkColors = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#334155',
  primary: '#3b82f6',
  primaryText: '#60a5fa',
  tabBg: '#1e293b',
  tabActiveBg: '#334155',
  tabText: '#94a3b8',
  tabActiveText: '#f8fafc',
  headerBg: '#0f172a',
  settingsBg: '#1e293b',
  reactionBg: '#1e293b',
  reactionBorder: '#334155',
  reactionActiveBg: '#334155',
  reactionActiveBorder: '#3b82f6',
};
`;

content = content.replace("const styles = StyleSheet.create({", darkThemeCode + "\nconst styles = StyleSheet.create({");

fs.writeFileSync('App.tsx', content);
