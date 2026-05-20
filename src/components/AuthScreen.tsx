import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, SafeAreaView, StatusBar, Text, TextInput, View } from 'react-native';
import { styles } from '../styles/styles';

export function AuthScreen({
  serverHostInput,
  onServerHostChange,
  oauthLoading,
  oauthError,
  onLogin,
}: {
  serverHostInput: string;
  onServerHostChange: (text: string) => void;
  oauthLoading: boolean;
  oauthError: string | null;
  onLogin: () => void;
}) {
  return (
    <SafeAreaView style={styles.onboardingScreen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.onboardingCard}>
        <View style={styles.onboardingBrand}>
          <View style={styles.onboardingBrandIcon}>
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </View>
          <Text style={styles.onboardingBrandText}>Crispy</Text>
        </View>
        <Text style={styles.onboardingTitle}>Misskeyをもっと快適に</Text>
        <Text style={styles.onboardingSubTitle}>Misskey にログインしてはじめる</Text>

        <Text style={styles.inputLabel}>サーバー</Text>
        <TextInput
          value={serverHostInput}
          onChangeText={onServerHostChange}
          style={styles.onboardingInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="misskey.io"
          placeholderTextColor="#6b7280"
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={onLogin}
        />

        <Pressable
          style={({ pressed }) => [styles.oauthButton, pressed && styles.buttonPressed]}
          onPress={onLogin}
          disabled={oauthLoading}
        >
          {oauthLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.oauthButtonText}>Misskeyでログイン</Text>
          )}
        </Pressable>

        {oauthError ? <Text style={styles.oauthErrorText}>{oauthError}</Text> : null}
        <Text style={styles.onboardingHint}>
          初回起動時にサーバーを入力し、OAuth(MiAuth) でログインします。
        </Text>
      </View>
    </SafeAreaView>
  );
}
