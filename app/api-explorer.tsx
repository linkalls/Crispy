import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalState } from '../src/context/GlobalState';
import { useMisskey } from '../src/hooks';
import {
  MISSKEY_EXPLORER_PRESETS,
  groupMisskeyExplorerPresets,
  normalizeMisskeyExplorerEndpoint,
  parseMisskeyExplorerPayload,
} from '../src/utils/misskeyExplorer';

export default function ApiExplorerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeAccount, colors } = useGlobalState();
  const { misskeyRequest } = useMisskey(activeAccount);

  const [endpoint, setEndpoint] = useState('/api/notes/timeline');
  const [payloadText, setPayloadText] = useState(JSON.stringify({ limit: 20 }, null, 2));
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('まだ実行されていません');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const presetGroups = useMemo(() => groupMisskeyExplorerPresets(MISSKEY_EXPLORER_PRESETS), []);
  const categories = ['All', ...Object.keys(presetGroups)];
  const filteredPresets = (categoryFilter === 'All' ? MISSKEY_EXPLORER_PRESETS : presetGroups[categoryFilter] ?? []).filter((preset) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [preset.category, preset.title, preset.endpoint].some((value) => value.toLowerCase().includes(query));
  });

  const applyPreset = (preset: (typeof MISSKEY_EXPLORER_PRESETS)[number]) => {
    setEndpoint(preset.endpoint);
    setPayloadText(JSON.stringify(preset.payload, null, 2));
    setRequiresAuth(preset.requiresAuth ?? true);
  };

  const runRequest = async () => {
    if (!activeAccount) return;

    const parsed = parseMisskeyExplorerPayload(payloadText);
    if (!parsed.ok) {
      setErrorText(parsed.error);
      return;
    }
    const payload = parsed.value;

    setLoading(true);
    setErrorText(null);

    try {
      const normalized = normalizeMisskeyExplorerEndpoint(endpoint);
      const result = await misskeyRequest(normalized, payload, requiresAuth);
      setResultText(JSON.stringify(result, null, 2));
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'API 実行に失敗しました。');
      setResultText('');
    } finally {
      setLoading(false);
    }
  };

  if (!activeAccount) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Pressable style={styles.headerIcon} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>API Explorer</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>任意の Misskey endpoint を試す</Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>misskey-js の入口を一か所に</Text>
          <Text style={[styles.heroText, { color: colors.textMuted }]}>endpoint と JSON を差し替えるだけで、各種 API の動作確認ができます。</Text>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="endpoint / title を検索"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                { backgroundColor: categoryFilter === category ? colors.primary : colors.cardBg, borderColor: colors.border },
              ]}
              onPress={() => setCategoryFilter(category)}
            >
              <Text style={[styles.filterChipText, { color: categoryFilter === category ? colors.primaryText : colors.text }]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {filteredPresets.map((preset) => (
            <Pressable key={preset.title} style={[styles.presetChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => applyPreset(preset)}>
              <Text style={[styles.presetChipText, { color: colors.text }]}>{preset.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Endpoint</Text>
          <TextInput
            value={endpoint}
            onChangeText={setEndpoint}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="/api/notes/timeline"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>認証が必要</Text>
            <Pressable
              onPress={() => setRequiresAuth((prev) => !prev)}
              style={[styles.togglePill, { backgroundColor: requiresAuth ? colors.primary : colors.border }]}
            >
              <Text style={[styles.togglePillText, { color: requiresAuth ? colors.primaryText : colors.text }]}>{requiresAuth ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 12 }]}>Payload JSON</Text>
          <TextInput
            value={payloadText}
            onChangeText={setPayloadText}
            style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />

          <Pressable
            onPress={runRequest}
            disabled={loading}
            style={({ pressed }) => [styles.runButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
          >
            {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.runButtonText, { color: colors.primaryText }]}>実行する</Text>}
          </Pressable>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Result</Text>
          <ScrollView horizontal>
            <Text selectable style={[styles.resultText, { color: colors.text }]}>{resultText}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 40,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  heroText: {
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  presetRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textarea: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Courier',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  togglePill: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  runButton: {
    marginTop: 2,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
  resultText: {
    minWidth: '100%',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Courier',
  },
});