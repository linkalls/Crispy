import { Stack } from 'expo-router';
import { GlobalStateProvider } from '../src/context/GlobalState';

export default function RootLayout() {
  return (
    <GlobalStateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="note/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </GlobalStateProvider>
  );
}
