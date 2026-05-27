import { create } from 'zustand';
import { TimelineNote } from '../utils/types';

interface ToastState {
  visible: boolean;
  title: string;
  message?: string;
  isError?: boolean;
}

interface InteractionState {
  toast: ToastState;
  showToast: (title: string, message?: string, isError?: boolean) => void;
  hideToast: () => void;

  isNoteComposerVisible: boolean;
  setIsNoteComposerVisible: (visible: boolean) => void;

  quotingNote: TimelineNote | null;
  isQuoteComposerVisible: boolean;
  openQuoteComposer: (note: TimelineNote) => void;
  closeQuoteComposer: () => void;

  selectedNoteForRenote: TimelineNote | null;
  isRenoteOptionsVisible: boolean;
  openRenoteOptions: (note: TimelineNote) => void;
  closeRenoteOptions: () => void;

  selectedNoteForReaction: TimelineNote | null;
  isReactionPickerVisible: boolean;
  openReactionPicker: (note: TimelineNote) => void;
  closeReactionPicker: () => void;

  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useInteractionState = create<InteractionState>((set) => ({
  toast: { visible: false, title: '' },
  showToast: (title, message, isError = false) => set({ toast: { visible: true, title, message, isError } }),
  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),

  isNoteComposerVisible: false,
  setIsNoteComposerVisible: (visible) => set({ isNoteComposerVisible: visible }),

  quotingNote: null,
  isQuoteComposerVisible: false,
  openQuoteComposer: (note) => set({ quotingNote: note, isQuoteComposerVisible: true }),
  closeQuoteComposer: () => set({ quotingNote: null, isQuoteComposerVisible: false }),

  selectedNoteForRenote: null,
  isRenoteOptionsVisible: false,
  openRenoteOptions: (note) => set({ selectedNoteForRenote: note, isRenoteOptionsVisible: true }),
  closeRenoteOptions: () => set({ selectedNoteForRenote: null, isRenoteOptionsVisible: false }),

  selectedNoteForReaction: null,
  isReactionPickerVisible: false,
  openReactionPicker: (note) => set({ selectedNoteForReaction: note, isReactionPickerVisible: true }),
  closeReactionPicker: () => set({ selectedNoteForReaction: null, isReactionPickerVisible: false }),

  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

// Global event emitter for optimistic UI updates across screens without heavy prop drilling.
type EventCallback = (payload: any) => void;
const listeners: Record<string, EventCallback[]> = {};

export const globalEvents = {
  on(event: string, callback: EventCallback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => this.off(event, callback);
  },
  off(event: string, callback: EventCallback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  },
  emit(event: string, payload: any) {
    if (!listeners[event]) return;
    listeners[event].forEach((cb) => cb(payload));
  },
};
