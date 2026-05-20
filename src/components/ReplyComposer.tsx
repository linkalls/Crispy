import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme } from '../utils/types';

export function ReplyComposer({
  replyText,
  onReplyTextChange,
  isSending,
  onSend,
  colors,
}: {
  replyText: string;
  onReplyTextChange: (text: string) => void;
  isSending: boolean;
  onSend: () => void;
  colors: ColorScheme;
}) {
  const isDisabled = isSending || !replyText.trim();

  return (
    <View style={[styles.replyComposer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <TextInput
        value={replyText}
        onChangeText={onReplyTextChange}
        style={[styles.replyInput, { color: colors.text }]}
        multiline
        placeholder="返信を入力"
        placeholderTextColor={colors.textMuted}
      />
      <Pressable
        style={({ pressed }) => [
          styles.replySendButton,
          { backgroundColor: colors.primary },
          isDisabled && styles.replySendButtonDisabled,
          pressed && !isDisabled && styles.buttonPressed,
        ]}
        onPress={onSend}
        disabled={isDisabled}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.replySendText}>送信</Text>
        )}
      </Pressable>
    </View>
  );
}
