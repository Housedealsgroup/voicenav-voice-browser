// VoiceNav Persistent State — saves and restores session data across app restarts
// Uses AsyncStorage for bookmarks, history, preferences, and learned patterns
// v2: Added encryption, data retention, secure wipe, export/import

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
  ENCRYPTION_SALT: '@voicenav/encryption_salt',
  CONSENT_PREFERENCES: '@voicenav/consent',
  DATA_RETENTION: '@voicenav/data_retention',
} as const;

// --- Encryption Wrapper ---
// Lightweight XOR-based obfuscation for sensitive fields at rest (not a replacement for
// full device encryption, but protects against casual AsyncStorage extraction)

const ENCRYPTION_KEY_PREFIX = 'vn_sec_';

function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getOrCreateSalt(): Promise<string> {
  try {
    let salt = await AsyncStorage.getItem(KEYS.ENCRYPTION_SALT);
    if (!salt) {
      salt = generateSalt();
      await AsyncStorage.setItem(KEYS.ENCRYPTION_SALT, salt);
    }
    return salt;
  } catch {
    return 'fallback_salt_voicenav_2024';
  }
}

function xorEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/** Encrypt a string value for storage */
export async function encryptValue(plaintext: string): Promise<string> {
  const salt = await getOrCreateSalt();
  const encrypted = xorEncrypt(plaintext, ENCRYPTION_KEY_PREFIX + salt);
  return 'ENC:' + btoa(encrypted);
}

/** Decrypt a stored encrypted value */
export async function decryptValue(ciphertext: string): Promise<string> {
  if (!ciphertext.startsWith('ENC:')) return ciphertext;
  const salt = await getOrCreateSalt();
  try {
    const encoded = ciphertext.slice(4);
    const encrypted = atob(encoded);
    return xorEncrypt(encrypted, ENCRYPTION_KEY_PREFIX + salt);
  } catch {
    logger.error('Failed to decrypt value, returning raw');
    return ciphertext;
  }
}

/** Store a sensitive field with encryption */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    const encrypted = await encryptValue(value);
    await AsyncStorage.setItem(key, encrypted);
  } catch (e) {
    logger.error('Failed to store secure item', e);
  }
}

/** Retrieve and decrypt a sensitive field */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return await decryptValue(raw);
  } catch (e) {
    logger.error('Failed to retrieve secure item', e);
    return null;
  }
}

// --- Data Retention Policies ---

export type DataRetentionPolicy = {
  /** Auto-clear command history after N days (0 = never) */
  historyRetentionDays: number;
  /** Auto-clear session stats after N days (0 = never) */
  statsRetentionDays: number;
  /** Maximum number of bookmarks (0 = unlimited) */
  maxBookmarks: number;
  /** Maximum command history entries */
  maxHistoryEntries: number;
};

const DEFAULT_RETENTION: DataRetentionPolicy = {
  historyRetentionDays: 30,
  statsRetentionDays: 90,
  maxBookmarks: 500,
  maxHistoryEntries: 500,
};

export async function loadRetentionPolicy(): Promise<DataRetentionPolicy> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DATA_RETENTION);
    return data ? { ...DEFAULT_RETENTION, ...JSON.parse(data) } : DEFAULT_RETENTION;
  } catch {
    return DEFAULT_RETENTION;
  }
}

export async function saveRetentionPolicy(policy: Partial<DataRetentionPolicy>): Promise<void> {
  try {
    const current = await loadRetentionPolicy();
    const merged = { ...current, ...policy };
    await AsyncStorage.setItem(KEYS.DATA_RETENTION, JSON.stringify(merged));
  } catch (e) {
    logger.error('Failed to save retention policy', e);
  }
}

/** Enforce data retention — call on app startup */
export async function enforceDataRetention(): Promise<{ historyRemoved: number; statsReset: boolean }> {
  const policy = await loadRetentionPolicy();
  let historyRemoved = 0;
  let statsReset = false;

  // Prune old command history
  if (policy.historyRetentionDays > 0) {
    const history = await loadCommandHistory();
    const cutoff = Date.now() - policy.historyRetentionDays * 24 * 60 * 60 * 1000;
    const pruned = history.filter(h => h.timestamp >= cutoff);
    historyRemoved = history.length - pruned.length;
    if (historyRemoved > 0) {
      await AsyncStorage.setItem(KEYS.COMMAND_HISTORY, JSON.stringify(pruned.slice(-policy.maxHistoryEntries)));
    }
  }

  // Prune old session stats
  if (policy.statsRetentionDays > 0) {
    const stats = await loadSessionStats();
    const cutoff = Date.now() - policy.statsRetentionDays * 24 * 60 * 60 * 1000;
    if (stats.lastSessionAt < cutoff && stats.totalSessions > 0) {
      await AsyncStorage.setItem(KEYS.SESSION_STATS, JSON.stringify(getDefaultSessionStats()));
      statsReset = true;
    }
  }

  return { historyRemoved, statsReset };
}

// --- Secure Data Wipe ---

export type WipeResult = {
  success: boolean;
  keysWiped: string[];
  errors: string[];
};

/** Perform a secure wipe of all VoiceNav data, including encrypted fields */
export async function secureWipeAll(): Promise<WipeResult> {
  const keysWiped: string[] = [];
  const errors: string[] = [];
  const allKeys = Object.values(KEYS);

  // First pass: overwrite each key with random data before removal
  for (const key of allKeys) {
    try {
      // Overwrite with random data to prevent recovery
      const randomData = generateSalt() + generateSalt();
      await AsyncStorage.setItem(key, randomData);
      await AsyncStorage.removeItem(key);
      keysWiped.push(key);
    } catch (e) {
      errors.push(`Failed to wipe ${key}: ${String(e)}`);
    }
  }

  // Also clear any ENC:-prefixed secure items we may have stored
  try {
    const allStoredKeys = await AsyncStorage.getAllKeys?.() ?? [];
    const encKeys = allStoredKeys.filter(k => k.startsWith('ENC:') || k.startsWith('@voicenav/'));
    for (const key of encKeys) {
      try {
        const randomData = generateSalt();
        await AsyncStorage.setItem(key, randomData);
        await AsyncStorage.removeItem(key);
        keysWiped.push(key);
      } catch (e) {
        errors.push(`Failed to wipe ${key}: ${String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to enumerate keys: ${String(e)}`);
  }

  logger.agent('secureWipe', { keysWiped: keysWiped.length, errors: errors.length });
  return { success: errors.length === 0, keysWiped, errors };
}

// --- Export / Import Settings ---

export type ExportData = {
  version: number;
  exportedAt: number;
  bookmarks: PersistedBookmark[];
  preferences: UserPreferences;
  shortcuts: VoiceShortcut[];
  languagePrefs: { preferred?: string; autoDetect: boolean };
  retentionPolicy: DataRetentionPolicy;
};

/** Export all user settings and data as a JSON-serializable object (PII-safe) */
export async function exportSettings(): Promise<ExportData> {
  const [bookmarks, preferences, shortcuts, languagePrefs, retentionPolicy] = await Promise.all([
    loadBookmarks(),
    loadPreferences(),
    loadShortcuts(),
    loadLanguagePrefs(),
    loadRetentionPolicy(),
  ]);

  // Strip any potentially sensitive data from bookmarks before export
  const safeBookmarks = bookmarks.map(b => ({
    ...b,
    // Keep URL and title but strip any embedded credentials
    url: b.url.replace(/\/\/[^@]+@/, '//***@'),
  }));

  return {
    version: 1,
    exportedAt: Date.now(),
    bookmarks: safeBookmarks,
    preferences,
    shortcuts,
    languagePrefs,
    retentionPolicy,
  };
}

/** Import settings from a previously exported JSON object */
export async function importSettings(data: ExportData): Promise<{ success: boolean; imported: string[]; errors: string[] }> {
  const imported: string[] = [];
  const errors: string[] = [];

  if (!data || data.version !== 1) {
    return { success: false, imported, errors: ['Invalid or unsupported export format'] };
  }

  if (data.bookmarks) {
    try {
      await saveBookmarks(data.bookmarks);
      imported.push('bookmarks');
    } catch (e) { errors.push(`bookmarks: ${String(e)}`); }
  }

  if (data.preferences) {
    try {
      await savePreferences(data.preferences);
      imported.push('preferences');
    } catch (e) { errors.push(`preferences: ${String(e)}`); }
  }

  if (data.shortcuts) {
    try {
      await AsyncStorage.setItem(KEYS.VOICE_SHORTCUTS, JSON.stringify(data.shortcuts));
      imported.push('shortcuts');
    } catch (e) { errors.push(`shortcuts: ${String(e)}`); }
  }

  if (data.languagePrefs) {
    try {
      await saveLanguagePrefs(data.languagePrefs);
      imported.push('languagePrefs');
    } catch (e) { errors.push(`languagePrefs: ${String(e)}`); }
  }

  if (data.retentionPolicy) {
    try {
      await saveRetentionPolicy(data.retentionPolicy);
      imported.push('retentionPolicy');
    } catch (e) { errors.push(`retentionPolicy: ${String(e)}`); }
  }

  logger.agent('importSettings', { imported: imported.length, errors: errors.length });
  return { success: errors.length === 0, imported, errors };
}

export type PersistedBookmark = {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  tags?: string[];
  /** Whether the bookmark contains encrypted sensitive fields */
  encrypted?: boolean;
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
  /** Data retention policy overrides */
  dataRetention?: Partial<DataRetentionPolicy>;
  /** Crash reporting consent */
  crashReportingConsent?: boolean;
  /** Analytics consent */
  analyticsConsent?: boolean;
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
    crashReportingConsent: false,
    analyticsConsent: false,
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

// --- Consent Management ---

export type ConsentRecord = {
  crashReporting: boolean;
  analytics: boolean;
  updatedAt: number;
};

export async function loadConsent(): Promise<ConsentRecord> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONSENT_PREFERENCES);
    return data ? JSON.parse(data) : { crashReporting: false, analytics: false, updatedAt: 0 };
  } catch {
    return { crashReporting: false, analytics: false, updatedAt: 0 };
  }
}

export async function saveConsent(consent: Partial<ConsentRecord>): Promise<void> {
  try {
    const current = await loadConsent();
    const merged = { ...current, ...consent, updatedAt: Date.now() };
    await AsyncStorage.setItem(KEYS.CONSENT_PREFERENCES, JSON.stringify(merged));
  } catch (e) {
    logger.error('Failed to save consent', e);
  }
}

export async function hasConsent(type: 'crashReporting' | 'analytics'): Promise<boolean> {
  const consent = await loadConsent();
  return consent[type] === true;
}
