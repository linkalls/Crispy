import { Stack } from 'expo-router';
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

function RootModals() {
  const { isImageViewerVisible, previewMedia, previewImageIndex, closeImageViewer, activeAccount, colors } = useGlobalState();
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
      await misskeyRequest('/api/notes/create', { renoteId: note.targetId }, true);
      showToast('成功', 'リポストしました。');
      triggerRefresh();
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : 'リポストに失敗しました。', true);
    }
  };

  const handleQuoteSubmit = async (text: string) => {
    if (!quotingNote) return;
    try {
      await misskeyRequest('/api/notes/create', { text, renoteId: quotingNote.targetId }, true);
      showToast('成功', '引用リポストを投稿しました。');
      triggerRefresh();
    } catch (error) {
      showToast('失敗', error instanceof Error ? error.message : '引用リポストに失敗しました。', true);
      throw error;
    }
  };

  const performReaction = async (note: TimelineNote, reaction: string) => {
    if (!activeAccount) return;
    try {
      await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction }, true);
      showToast('成功', 'リアクションしました。');
      triggerRefresh();
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
        <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="note/[id]" options={{ presentation: 'card' }} />
      </Stack>
      <RootModals />
    </>
  );
}

export default function RootLayout() {
  return (
    <GlobalStateProvider>
      <RootStack />
    </GlobalStateProvider>
  );
}
