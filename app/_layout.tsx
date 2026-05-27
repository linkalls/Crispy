import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalStateProvider, useGlobalState } from '../src/context/GlobalState';
import { useInteractionState } from '../src/context/InteractionState';
import { useMisskey } from '../src/hooks';
import {
  MediaViewerModal,
  NoteComposerModal,
  QuoteComposerModal,
  RenoteOptionsModal,
  ReactionPickerModal,
  Toast
} from '../src/components';
import { TimelineNote } from '../src/utils/types';
import { normalizeMisskeyReactionInput } from '../src/utils/misskeyApi';
import { globalEvents } from '../src/context/InteractionState';
import { logError } from '../src/utils/logger';

// Catch global uncaught errors if possible
if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    logError(`Global Error (Fatal: ${isFatal})`, error, true).finally(() => {
      // Pass to original handler if it exists
    });
  });
}

function RootModals() {
  const {
    isImageViewerVisible,
    previewMedia,
    previewImageIndex,
    closeImageViewer,
    activeAccount,
    colors,
    serverEmojis,
    setServerEmojis,
  } = useGlobalState();
  const { misskeyRequest } = useMisskey(activeAccount);
  const {
    toast,
    hideToast,
    showToast,
    isNoteComposerVisible,
    setIsNoteComposerVisible,
    quotingNote,
    isQuoteComposerVisible,
    closeQuoteComposer,
    selectedNoteForRenote,
    isRenoteOptionsVisible,
    closeRenoteOptions,
    selectedNoteForReaction,
    isReactionPickerVisible,
    closeReactionPicker,
    triggerRefresh,
  } = useInteractionState();

  const performPureRenote = async (note: TimelineNote) => {
    try {
      // Optimistic update
      globalEvents.emit('noteUpdated', { noteId: note.id, action: 'renote' });
      await misskeyRequest('/api/notes/create', { renoteId: note.targetId }, true);
      showToast('成功', 'リポストしました。');
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リポストに失敗しました。', true);
    }
  };

  useEffect(() => {
    if (!activeAccount || activeAccount.token === 'mock_token') {
      setServerEmojis([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await misskeyRequest<any>('/api/emojis', { limit: 2000 }, false);
        const list = Array.isArray(response) ? response : Array.isArray(response?.emojis) ? response.emojis : [];
        const nextEmojis = list
          .filter((emoji: any) => typeof emoji?.name === 'string' && typeof emoji?.url === 'string')
          .map((emoji: any) => ({ name: emoji.name, url: emoji.url }));

        if (!cancelled) setServerEmojis(nextEmojis);
      } catch (error) {
        if (!cancelled) setServerEmojis([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, misskeyRequest, setServerEmojis]);

  const handleQuoteSubmit = async (text: string) => {
    if (!quotingNote) return;
    try {
      // Optimistic update for the quoted note
      globalEvents.emit('noteUpdated', { noteId: quotingNote.id, action: 'renote' });
      await misskeyRequest('/api/notes/create', { text, renoteId: quotingNote.targetId }, true);
      showToast('成功', '引用リポストを投稿しました。');
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : '引用リポストに失敗しました。', true);
      throw error;
    }
  };

  const performReaction = async (note: TimelineNote, reaction: string) => {
    if (!activeAccount) return;
    try {
      const normalized = normalizeMisskeyReactionInput(reaction);
      if (!normalized) return;
      // Local optimistic update via event bus
      globalEvents.emit('noteUpdated', { noteId: note.id, action: 'reaction', emoji: normalized, isReacting: true });
      await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction: normalized }, true);
      showToast('成功', 'リアクションしました。');
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リアクションに失敗しました。', true);
    }
  };

  return (
    <>
      <MediaViewerModal
        visible={isImageViewerVisible}
        media={previewMedia}
        initialIndex={previewImageIndex}
        onClose={closeImageViewer}
      />

      <NoteComposerModal
        visible={isNoteComposerVisible}
        colors={colors}
        activeAccount={activeAccount}
        misskeyRequest={misskeyRequest as any}
        onClose={() => setIsNoteComposerVisible(false)}
        onSubmit={async (text, cw, visibility, fileIds) => {
          try {
            const payload: any = { visibility, fileIds: fileIds.length > 0 ? fileIds : undefined };
            if (text.trim().length > 0) payload.text = text;
            if (cw && cw.trim().length > 0) payload.cw = cw;
            await misskeyRequest('/api/notes/create', payload, true);
            showToast('投稿しました');
            triggerRefresh();
          } catch (e: any) {
            console.error(e);
            showToast('投稿に失敗しました', e.message, true);
          }
        }}
      />

      <QuoteComposerModal
        visible={isQuoteComposerVisible}
        note={quotingNote}
        colors={colors}
        onClose={closeQuoteComposer}
        onSubmit={handleQuoteSubmit}
      />

      <RenoteOptionsModal
        visible={isRenoteOptionsVisible}
        note={selectedNoteForRenote}
        colors={colors}
        onClose={closeRenoteOptions}
        onRenote={performPureRenote}
        onQuote={(note) => {
          closeRenoteOptions();
          useInteractionState.getState().openQuoteComposer(note);
        }}
      />

      <ReactionPickerModal
        visible={isReactionPickerVisible}
        note={selectedNoteForReaction}
        serverEmojis={serverEmojis}
        colors={colors}
        onClose={closeReactionPicker}
        onSelectReaction={(note, reaction) => {
          performReaction(note, reaction);
          closeReactionPicker();
        }}
      />

      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        isError={toast.isError}
        onHide={hideToast}
        colors={colors}
      />
    </>
  );
}

function RootStack() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="api-explorer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="note/[id]" options={{ presentation: 'card' }} />
      </Stack>
      <RootModals />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GlobalStateProvider>
        <RootStack />
      </GlobalStateProvider>
    </SafeAreaProvider>
  );
}
