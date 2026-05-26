import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, useColorScheme } from 'react-native';
import { PersistedState, StoredAccount, ColorScheme, TimelineTab, TimelineNote } from '../utils/types';
import { STORAGE_KEY } from '../utils/formatting';
import { lightColors, darkColors } from '../utils/colors';

interface GlobalStateContextType {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  activeAccount: StoredAccount | null;
  devMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  colors: ColorScheme;
  isReady: boolean;

  // Global Viewers
  isImageViewerVisible: boolean;
  previewMedia: { url: string; thumbnailUrl?: string; type?: string }[];
  previewImageIndex: number;

  // Actions
  setAccounts: React.Dispatch<React.SetStateAction<StoredAccount[]>>;
  openImageViewer: (media: { url: string; thumbnailUrl?: string; type?: string }[], index: number) => void;
  closeImageViewer: () => void;
  setActiveAccountId: React.Dispatch<React.SetStateAction<string | null>>;
  setDevMode: React.Dispatch<React.SetStateAction<boolean>>;
  setThemeMode: React.Dispatch<React.SetStateAction<'system' | 'light' | 'dark'>>;
  logoutCurrent: () => void;
  removeAccount: (id: string) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [isReady, setIsReady] = useState(false);

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; thumbnailUrl?: string; type?: string }[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const systemColorScheme = useColorScheme();

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: PersistedState = JSON.parse(raw);
          setAccounts(stored.accounts || []);
          setActiveAccountId(stored.activeAccountId || null);
          setDevMode(!!stored.devMode);
          if (stored.themeMode) setThemeMode(stored.themeMode);
        }
      } catch (e) {
        console.error('Failed to load state', e);
      } finally {
        setIsReady(true);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (!isReady) return;
    const state: PersistedState = {
      accounts,
      activeAccountId,
      devMode,
      themeMode,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [accounts, activeAccountId, devMode, themeMode, isReady]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) ?? null,
    [accounts, activeAccountId]
  );

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemColorScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  const logoutCurrent = useCallback(() => {
    if (!activeAccountId) return;
    setAccounts((prev) => prev.filter((a) => a.id !== activeAccountId));
    setActiveAccountId((prevId) => {
      const remaining = accounts.filter((a) => a.id !== prevId);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }, [activeAccountId, accounts]);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (activeAccountId === id) {
      const remaining = accounts.filter((a) => a.id !== id);
      setActiveAccountId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeAccountId, accounts]);

  const openImageViewer = useCallback((media: { url: string; thumbnailUrl?: string; type?: string }[], index: number) => {
    setPreviewMedia(media);
    setPreviewImageIndex(index);
    setIsImageViewerVisible(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerVisible(false);
    setPreviewMedia([]);
    setPreviewImageIndex(0);
  }, []);

  const value = {
    accounts,
    activeAccountId,
    activeAccount,
    devMode,
    themeMode,
    colors,
    isReady,
    isImageViewerVisible,
    previewMedia,
    previewImageIndex,
    setAccounts,
    setActiveAccountId,
    setDevMode,
    setThemeMode,
    logoutCurrent,
    removeAccount,
    openImageViewer,
    closeImageViewer,
  };

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
