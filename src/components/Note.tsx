import { Ionicons } from '@expo/vector-icons';
import * as mfm from 'mfm-js';
import { Image, Pressable, Text, View, Linking } from 'react-native';
import { styles } from '../styles/styles';
import { ColorScheme, TimelineNote } from '../utils/types';
import { resolveImagePreviewUrl } from '../utils/misskeyApi';
import { MfmRenderer } from './MfmRenderer';
import { ReplyComposer } from './ReplyComposer';

export function Note({
  note,
  isReplying,
  replyText,
  isSendingReply,
  colors,
  onPress,
  onReplyPress,
  onReplyTextChange,
  onReplySubmit,
  onRenotePress,
  onSharePress,
  onReactionPress,
  onUserPress,
  onImagePress,
}: {
  note: TimelineNote;
  isReplying: boolean;
  replyText: string;
  isSendingReply: boolean;
  colors: ColorScheme;
  onPress?: () => void;
  onReplyPress: () => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: () => void;
  onRenotePress: () => void;
  onSharePress: () => void;
  onReactionPress: (index: number) => void;
  onUserPress?: (userId: string) => void;
  onImagePress?: (media: { url: string; thumbnailUrl?: string; type?: string }[], index: number) => void;
}) {
  return (
    <Pressable
      style={[styles.noteCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={onPress}
    >
      {/* 返信プレビュー表示 */}
      {note.reply ? (
        <View style={[styles.replyPreview, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.replyPreviewLabel, { color: colors.textMuted }]}>返信:</Text>
          <View style={styles.replyPreviewContent}>
            <Image source={{ uri: note.reply.user.avatar }} style={styles.replyPreviewAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyPreviewName, { color: colors.text }]} numberOfLines={1}>
                {note.reply.user.name}
              </Text>
              <Text style={[styles.replyPreviewText, { color: colors.textMuted }]} numberOfLines={2}>
                {note.reply.content}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* リノート表示 */}
      {note.renoteUser ? (
        <Text style={[styles.renoteText, { color: colors.textMuted }]}>
          {note.renoteUser} がリノート
        </Text>
      ) : null}

      {/* ノート本体 */}
      <View style={styles.noteRow}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (note.user.id) onUserPress?.(note.user.id);
          }}
        >
          <Image source={{ uri: note.user.avatar }} style={styles.noteAvatar} />
        </Pressable>
        <View style={styles.noteMain}>
          {/* ユーザー情報 */}
          <View style={styles.noteHeaderRow}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (note.user.id) onUserPress?.(note.user.id);
              }}
            >
              <Text style={[styles.noteName, { color: colors.text }]} numberOfLines={1}>
                {note.user.name}
              </Text>
            </Pressable>
            <Text style={[styles.noteMeta, { color: colors.textMuted }]} numberOfLines={1}>
              @{note.user.username}@{note.user.host} · {note.createdAtLabel}
            </Text>
          </View>

          {/* コンテンツ */}
          <MfmRenderer nodes={mfm.parse(note.content)} emojis={note.emojis} colors={colors} />

          {/* メディア表示 */}
          {note.files.length > 0 && (
            <View style={styles.mediaContainer}>
              {note.files.map((file, idx) => {
                const isImage = file.type?.startsWith('image/');
                const isVideo = file.type?.startsWith('video/');
                return (
                  <View key={idx} style={styles.mediaItem}>
                    {isImage || isVideo ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          const mediaItems = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: f.url, thumbnailUrl: f.url, type: f.type }));
                          const mediaIndex = note.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                          const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                          if (onImagePress) onImagePress(mediaItems, mediaIndex);
                          else Linking.openURL(previewUrl);
                        }}
                      >
                        <Image
                          source={{ uri: file.thumbnailUrl || file.url }}
                          style={styles.mediaImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ) : (
                      <View style={[styles.mediaFile, { backgroundColor: colors.reactionBg }]}>
                        <Ionicons name="document-outline" size={24} color={colors.textMuted} />
                        <Text
                          style={[styles.mediaFileName, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {file.url.split('/').pop() || 'ファイル'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* 引用ノート表示 */}
          {note.quote ? (
            <View style={[styles.quoteCard, { borderColor: colors.border, backgroundColor: colors.bg }]}>
              <View style={styles.quoteHeaderRow}>
                <Image source={{ uri: note.quote.user.avatar }} style={styles.quoteAvatar} />
                <Text style={[styles.quoteName, { color: colors.text }]} numberOfLines={1}>
                  {note.quote.user.name}
                </Text>
                <Text style={[styles.quoteMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  @{note.quote.user.username}@{note.quote.user.host} · {note.quote.createdAtLabel}
                </Text>
              </View>
              <MfmRenderer nodes={mfm.parse(note.quote.content)} emojis={note.quote.emojis} colors={colors} />
              
              {note.quote.files.length > 0 && (
                <View style={styles.quoteMediaContainer}>
                  {note.quote.files.map((file, idx) => {
                    const isImage = file.type?.startsWith('image/');
                    const isVideo = file.type?.startsWith('video/');
                    return (
                      <View key={idx} style={styles.quoteMediaItem}>
                        {isImage || isVideo ? (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              const mediaItems = note.quote!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).map(f => ({ url: f.url, thumbnailUrl: f.url, type: f.type }));
                              const mediaIndex = note.quote!.files.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/')).findIndex(f => f.url === file.url);
                              const previewUrl = resolveImagePreviewUrl(file.url, file.thumbnailUrl);
                              if (onImagePress) onImagePress(mediaItems, mediaIndex);
                              else Linking.openURL(previewUrl);
                            }}
                          >
                            <Image
                              source={{ uri: file.thumbnailUrl || file.url }}
                              style={styles.quoteMediaImage}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ) : (
                          <View style={[styles.quoteMediaFile, { backgroundColor: colors.reactionBg }]}>
                            <Ionicons name="document-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.quoteMediaFileName, { color: colors.textMuted }]} numberOfLines={1}>
                              {file.url.split('/').pop() || 'ファイル'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}

          {/* リアクション表示 */}
          {note.reactions && note.reactions.length > 0 ? (
            <View style={styles.reactionWrap}>
              {note.reactions.slice(0, 8).map((reaction, index) => {
                const reactionEmojiUrl = reaction.url;
                return (
                  <Pressable
                    key={`${note.id}-${reaction.emoji}-${index}`}
                    style={({ pressed }) => [
                      styles.reactionButton,
                      { backgroundColor: colors.reactionBg, borderColor: colors.reactionBorder },
                      reaction.reacted && [
                        styles.reactionActive,
                        {
                          backgroundColor: colors.reactionActiveBg,
                          borderColor: colors.reactionActiveBorder,
                        },
                      ],
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => onReactionPress(index)}
                  >
                    {reactionEmojiUrl ? (
                      <Image
                        source={{ uri: reactionEmojiUrl }}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[styles.reactionText, { color: colors.text }]}>{reaction.emoji}</Text>
                    )}
                    <Text style={[styles.reactionCount, { color: colors.textMuted }]}>
                      {reaction.count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* アクションボタン */}
          <View style={styles.actionRow}>
            <View style={styles.actionGroup}>
              <Pressable style={styles.actionItem} onPress={onReplyPress}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                {note.replies > 0 ? <Text style={[styles.actionCount, { color: colors.textMuted }]}>{note.replies}</Text> : null}
              </Pressable>
              <Pressable style={styles.actionItem} onPress={onRenotePress}>
                <Ionicons name="repeat-outline" size={16} color={colors.textMuted} />
                {note.renotes > 0 ? <Text style={[styles.actionCount, { color: colors.textMuted }]}>{note.renotes}</Text> : null}
              </Pressable>
              <Pressable style={styles.actionItem} onPress={onSharePress}>
                <Ionicons name="share-social-outline" size={16} color={colors.textMuted} />
              </Pressable>
              <Pressable style={styles.actionItem} onPress={() => onReactionPress(-1)}>
                <Ionicons name="add-outline" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* 返信作成パネル */}
          {isReplying ? (
            <ReplyComposer
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              isSending={isSendingReply}
              onSend={onReplySubmit}
              colors={colors}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
