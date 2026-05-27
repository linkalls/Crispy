import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useGlobalState } from '../src/context/GlobalState';
import { getLogs, clearLogs } from '../src/utils/logger';

export default function LogsScreen() {
  const { colors, devMode } = useGlobalState();
  const [logs, setLogs] = useState<string>('Loading...');

  const fetchLogs = async () => {
    const data = await getLogs();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = async () => {
    await clearLogs();
    await fetchLogs();
  };

  if (!devMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Logs' }} />
        <Text style={{ color: colors.text }}>DevMode is not enabled.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: 'Logs (DevMode)' }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={fetchLogs} style={styles.button}>
          <Text style={{ color: colors.primary }}>Refresh</Text>
        </Pressable>
        <Pressable onPress={handleClear} style={styles.button}>
          <Text style={{ color: 'red' }}>Clear</Text>
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1, padding: 10 }}>
        <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>
          {logs}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: {
    marginLeft: 16,
    padding: 8,
  },
});
