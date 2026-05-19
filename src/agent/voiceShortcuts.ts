// VoiceNav Voice Shortcuts — custom voice command aliases
// Users can create shortcuts like "my email" -> "go to gmail"
// Supports natural language creation: "when I say my email, go to gmail"

import { logger } from '../utils/logger';
import { loadShortcuts, saveShortcut, removeShortcut, type VoiceShortcut } from '../store/persistentState';

export type ShortcutMatch = {
  shortcut: VoiceShortcut;
  resolvedCommand: string;
  confidence: number;
};

// Built-in shortcuts that cannot be removed
const BUILT_IN_SHORTCUTS: VoiceShortcut[] = [
  { id: 'builtin-myemail', phrase: 'my email', command: 'go to gmail', createdAt: 0, useCount: 0 },
  { id: 'builtin-mycal', phrase: 'my calendar', command: 'go to calendar', createdAt: 0, useCount: 0 },
  { id: 'builtin-mydrive', phrase: 'my drive', command: 'go to drive', createdAt: 0, useCount: 0 },
  { id: 'builtin-messages', phrase: 'check messages', command: 'go to gmail', createdAt: 0, useCount: 0 },
  { id: 'builtin-watch', phrase: 'watch videos', command: 'go to youtube', createdAt: 0, useCount: 0 },
  { id: 'builtin-listen', phrase: 'listen to music', command: 'go to spotify', createdAt: 0, useCount: 0 },
  { id: 'builtin-news', phrase: 'what is happening', command: 'go to news', createdAt: 0, useCount: 0 },
  { id: 'builtin-shopping', phrase: 'go shopping', command: 'go to amazon', createdAt: 0, useCount: 0 },
];

// Patterns for creating shortcuts via voice
const CREATE_PATTERNS = [
  /(?:when i say|when i say|if i say|shortcut|create shortcut)\s+["']?(.+?)["']?\s+(?:then|do|run|execute|go to|open|make it)\s+(.+)/i,
  /(?:make|create|add|set)\s+(?:a\s+)?(?:shortcut|alias|command)\s+(?:for|called|named)\s+["']?(.+?)["']?\s+(?:to|that|which)\s+(?:does?|goes? to|opens?|runs?)\s+(.+)/i,
  /(?:shortcut)\s+["']?(.+?)["']?\s+(?:to|->|equals?|=)\s+(.+)/i,
];

const DELETE_PATTERNS = [
  /(?:delete|remove|erase)\s+(?:the\s+)?(?:shortcut|alias)\s+(?:for\s+|called\s+|named\s+)?["']?(.+?)["']?$/i,
  /(?:remove|delete)\s+["']?(.+?)["']?\s+shortcut/i,
];

const LIST_PATTERN = /(?:list|show|what are|what's|whats)\s+(?:my\s+)?(?:shortcuts|aliases|custom commands)/i;

export function isShortcutCommand(text: string): 'create' | 'delete' | 'list' | 'use' | null {
  const normalized = text.toLowerCase().trim();

  for (const pattern of CREATE_PATTERNS) {
    if (pattern.test(normalized)) return 'create';
  }
  for (const pattern of DELETE_PATTERNS) {
    if (pattern.test(normalized)) return 'delete';
  }
  if (LIST_PATTERN.test(normalized)) return 'list';

  // Check if it matches a shortcut
  const allShortcuts = [...BUILT_IN_SHORTCUTS];
  for (const sc of allShortcuts) {
    if (normalized.includes(sc.phrase.toLowerCase())) return 'use';
  }

  return null;
}

export function parseShortcutCreation(text: string): { phrase: string; command: string } | null {
  const normalized = text.toLowerCase().trim();

  for (const pattern of CREATE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        phrase: match[1].trim().replace(/^["']|["']$/g, ''),
        command: match[2].trim().replace(/^["']|["']$/g, ''),
      };
    }
  }
  return null;
}

export function parseShortcutDeletion(text: string): string | null {
  const normalized = text.toLowerCase().trim();

  for (const pattern of DELETE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

export async function createUserShortcut(phrase: string, command: string): Promise<VoiceShortcut> {
  logger.agent('shortcutCreated', { phrase, command });
  return saveShortcut({ phrase, command });
}

export async function deleteUserShortcut(phrase: string): Promise<boolean> {
  const shortcuts = await loadShortcuts();
  const match = shortcuts.find(s => s.phrase.toLowerCase() === phrase.toLowerCase());
  if (match) {
    const result = await removeShortcut(match.id);
    if (result) logger.agent('shortcutDeleted', { phrase });
    return result;
  }
  return false;
}

export async function matchShortcut(text: string): Promise<ShortcutMatch | null> {
  const normalized = text.toLowerCase().trim();

  // Check built-in shortcuts first
  for (const sc of BUILT_IN_SHORTCUTS) {
    if (normalized.includes(sc.phrase.toLowerCase()) || normalized === sc.phrase.toLowerCase()) {
      return {
        shortcut: sc,
        resolvedCommand: sc.command,
        confidence: 0.95,
      };
    }
  }

  // Check user shortcuts
  const userShortcuts = await loadShortcuts();
  for (const sc of userShortcuts) {
    if (normalized.includes(sc.phrase.toLowerCase()) || normalized === sc.phrase.toLowerCase()) {
      return {
        shortcut: sc,
        resolvedCommand: sc.command,
        confidence: 0.9,
      };
    }
  }

  // Fuzzy match
  const allShortcuts = [...BUILT_IN_SHORTCUTS, ...userShortcuts];
  let bestMatch: VoiceShortcut | null = null;
  let bestScore = 0;

  for (const sc of allShortcuts) {
    const score = fuzzyMatch(normalized, sc.phrase.toLowerCase());
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = sc;
    }
  }

  if (bestMatch) {
    return {
      shortcut: bestMatch,
      resolvedCommand: bestMatch.command,
      confidence: bestScore * 0.8,
    };
  }

  return null;
}

function fuzzyMatch(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  let matches = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb || wa.includes(wb) || wb.includes(wa)) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(wordsA.length, wordsB.length);
}

export async function getAllShortcuts(): Promise<VoiceShortcut[]> {
  const userShortcuts = await loadShortcuts();
  return [...BUILT_IN_SHORTCUTS, ...userShortcuts];
}

export async function getUserShortcuts(): Promise<VoiceShortcut[]> {
  return loadShortcuts();
}

export function getBuiltInShortcuts(): VoiceShortcut[] {
  return [...BUILT_IN_SHORTCUTS];
}

export function formatShortcutsList(shortcuts: VoiceShortcut[]): string {
  if (shortcuts.length === 0) return 'You have no shortcuts.';

  const lines = shortcuts.map(s => `"${s.phrase}" does "${s.command}"`);
  return `Your shortcuts: ${lines.join('. ')}.`;
}

export function getShortcutSuggestions(): string[] {
  return [
    'When I say "work" then go to slack',
    'Shortcut "music" to go to spotify',
    'Create shortcut for "shopping" that goes to amazon',
    'Make a shortcut called "inbox" to go to gmail',
  ];
}
