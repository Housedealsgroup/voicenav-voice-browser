// VoiceNav Persistent State — saves and restores session data across app restarts
// Uses AsyncStorage for bookmarks, history, preferences, and learned patterns

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const KEYS = {
  BOOKMARKS: '@voicenav/bookmarks',
  COMMAND_HISTORY: '@voicenav/command_history',
  USER_PREFERENCES: '@voicenav/preferences',
  COMMAND_PATTERNS: '@voicenav/command_patterns',
  VOICE_SHORTCUTS: '@voicenav/voice_shortcuts',
  SESSION_STATS: '@voicenav/session_stats',
  ONBOARDING_COMPLETE: '@voicenav/onboarding_complete',
  THEME: '@voicenav/theme',
  LANGUAGE_PREFS: '@voicenav/language_prefs',
} as const;

export type PersistedBookmark = {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  tags?: string[];
};

export type PersistedCommand = {
  command: string;
  timestamp: number;
  pageUrl?: string;
  success: boolean;
};

export type UserPreferences = {
  autoRead?: boolean;
  voiceSpeed?: number;
  voicePitch?: number;
  hapticFeedback?: boolean;
  continuousListening?: boolean;
  defaultLanguage?: string;
  speechRate?: number;
  confirmActions?: boolean;
  darkMode?: boolean;
  compactMode?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
};

export type VoiceShortcut = {
  id: string;
  phrase: string;
  command: string;
  createdAt: number;
  useCount: number;
};

export type SessionStats = {
  totalSessions: number;
  totalCommands: number;
  totalBookmarks: number;
  averageSessionDuration: number;
  mostUsedCommand: string | null;
  lastSessionAt: number;
  firstSessionAt: number;
};

// --- Bookmarks ---
export async function loadBookmarks(): Promise<PersistedBookmark[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    logger.error('Failed to load bookmarks', e);
    return [];
  }
}

export async function saveBookmarks(bookmarks: PersistedBookmark[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (e) {
    logger.error('Failed to save bookmarks', e);
  }
}

export async function addBookmark(bookmark: Omit<PersistedBookmark, 'id' | 'createdAt'>): Promise<PersistedBookmark> {
  const bookmarks = await loadBookmarks();
  const newBookmark: PersistedBookmark = {
    ...bookmark,
    id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  bookmarks.unshift(newBookmark);
  await saveBookmarks(bookmarks);
  return newBookmark;
}

export async function removeBookmark(id: string): Promise<boolean> {
  const bookmarks = await loadBookmarks();
  const filtered = bookmarks.filter(b => b.id !== id);
  if (filtered.length < bookmarks.length) {
    await saveBookmarks(filtered);
    return true;
  }
  return false;
}

export async function findBookmarkByUrl(url: string): Promise<PersistedBookmark | null> {
  const bookmarks = await loadBookmarks();
  return bookmarks.find(b => b.url === url) || null;
}

// --- Command History ---
export async function loadCommandHistory(): Promise<PersistedCommand[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.COMMAND_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    logger.error('Failed to load command history', e);
    return [];
  }
}

export async function saveCommand(command: string, pageUrl?: string, success: boolean = true): Promise<void> {
  try {
    const history = await loadCommandHistory();
    history.push({ command, timestamp: Date.now(), pageUrl, success });
    // Keep last 500 commands
    const trimmed = history.slice(-500);
    await AsyncStorage.setItem(KEYS.COMMAND_HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    logger.error('Failed to save command', e);
  }
}

export async function getRecentCommands(count: number = 20): Promise<PersistedCommand[]> {
  const history = await loadCommandHistory();
  return history.slice(-count).reverse();
}

// --- User Preferences ---
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : getDefaultPreferences();
  } catch (e) {
    logger.error('Failed to load preferences', e);
    return getDefaultPreferences();
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await loadPreferences();
    const merged = { ...current, ...prefs };
    await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(merged));
  } catch (e) {
    logger.error('Failed to save preferences', e);
  }
}

function getDefaultPreferences(): UserPreferences {
  return {
    autoRead: false,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    hapticFeedback: true,
    continuousListening: false,
    defaultLanguage: 'en',
    speechRate: 1.0,
    confirmActions: true,
    darkMode: true,
    compactMode: false,
    showSuggestions: true,
    maxSuggestions: 5,
  };
}

// --- Voice Shortcuts ---
export async function loadShortcuts(): Promise<VoiceShortcut[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.VOICE_SHORTCUTS);
    return data ? JSON.parse(data) : getDefaultShortcuts();
  } catch (e) {
    logger.error('Failed to load shortcuts', e);
    return getDefaultShortcuts();
  }
}

export async function saveShortcut(shortcut: Omit<VoiceShortcut, 'id' | 'createdAt' | 'useCount'>): Promise<VoiceShortcut> {
  const shortcuts = await loadShortcuts();
  const newShortcut: VoiceShortcut = {
    ...shortcut,
    id: `sc-${Date.now()}`,
    createdAt: Date.now(),
    useCount: 0,
  };
  shortcuts.push(newShortcut);
  await AsyncStorage.setItem(KEYS.VOICE_SHORTCUTS, JSON.stringify(shortcuts));
  return newShortcut;
}

export async function removeShortcut(id: string): Promise<boolean> {
  const shortcuts = await loadShortcuts();
  const filtered = shortcuts.filter(s => s.id !== id);
  if (filtered.length < shortcuts.length) {
    await AsyncStorage.setItem(KEYS.VOICE_SHORTCUTS, JSON.stringify(filtered));
    return true;
  }
  return false;
}

export async function resolveShortcut(phrase: string): Promise<string | null> {
  const shortcuts = await loadShortcuts();
  const normalized = phrase.toLowerCase().trim();
  const match = shortcuts.find(s => normalized.includes(s.phrase.toLowerCase()));
  if (match) {
    match.useCount++;
    await AsyncStorage.setItem(KEYS.VOICE_SHORTCUTS, JSON.stringify(shortcuts));
    return match.command;
  }
  return null;
}

function getDefaultShortcuts(): VoiceShortcut[] {
  return [
    { id: 'default-1', phrase: 'my email', command: 'go to gmail', createdAt: Date.now(), useCount: 0 },
    { id: 'default-2', phrase: 'my calendar', command: 'go to calendar', createdAt: Date.now(), useCount: 0 },
    { id: 'default-3', phrase: 'my drive', command: 'go to drive', createdAt: Date.now(), useCount: 0 },
    { id: 'default-4', phrase: 'check messages', command: 'go to gmail', createdAt: Date.now(), useCount: 0 },
    { id: 'default-5', phrase: 'watch videos', command: 'go to youtube', createdAt: Date.now(), useCount: 0 },
  ];
}

// --- Session Stats ---
export async function loadSessionStats(): Promise<SessionStats> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SESSION_STATS);
    return data ? JSON.parse(data) : getDefaultSessionStats();
  } catch (e) {
    return getDefaultSessionStats();
  }
}

export async function updateSessionStats(update: Partial<SessionStats>): Promise<void> {
  try {
    const current = await loadSessionStats();
    const merged = { ...current, ...update, lastSessionAt: Date.now() };
    await AsyncStorage.setItem(KEYS.SESSION_STATS, JSON.stringify(merged));
  } catch (e) {
    logger.error('Failed to update session stats', e);
  }
}

export async function incrementCommandCount(): Promise<void> {
  const stats = await loadSessionStats();
  await updateSessionStats({ totalCommands: stats.totalCommands + 1 });
}

function getDefaultSessionStats(): SessionStats {
  return {
    totalSessions: 0,
    totalCommands: 0,
    totalBookmarks: 0,
    averageSessionDuration: 0,
    mostUsedCommand: null,
    lastSessionAt: Date.now(),
    firstSessionAt: Date.now(),
  };
}

// --- Onboarding ---
export async function isOnboardingDone(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (e) {
    logger.error('Failed to mark onboarding complete', e);
  }
}

// --- Language Preferences ---
export async function loadLanguagePrefs(): Promise<{ preferred?: string; autoDetect: boolean }> {
  try {
    const data = await AsyncStorage.getItem(KEYS.LANGUAGE_PREFS);
    return data ? JSON.parse(data) : { autoDetect: true };
  } catch {
    return { autoDetect: true };
  }
}

export async function saveLanguagePrefs(prefs: { preferred?: string; autoDetect: boolean }): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LANGUAGE_PREFS, JSON.stringify(prefs));
  } catch (e) {
    logger.error('Failed to save language prefs', e);
  }
}

// --- Clear All Data ---
export async function clearAllData(): Promise<void> {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
    logger.agent('dataCleared', {});
  } catch (e) {
    logger.error('Failed to clear data', e);
  }
}
