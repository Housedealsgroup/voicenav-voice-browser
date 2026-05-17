// VoiceNav Command History — v9
// Full command history with search, replay, favorites, and analytics
// Tracks patterns for smarter predictions

import { logger } from '../utils/logger';

export type CommandEntry = {
  id: string;
  command: string;
  timestamp: number;
  intent?: string;
  target?: string;
  success: boolean;
  pageUrl?: string;
  duration?: number;
  isFavorite: boolean;
  tags: string[];
};

export type CommandStats = {
  totalCommands: number;
  successRate: number;
  topCommands: Array<{ command: string; count: number }>;
  topIntents: Array<{ intent: string; count: number }>;
  avgCommandsPerSession: number;
  favoriteCommands: CommandEntry[];
  recentCommands: CommandEntry[];
};

const MAX_HISTORY = 500;
const history: CommandEntry[] = [];
let idCounter = 0;

export function addCommand(
  command: string,
  options: {
    intent?: string;
    target?: string;
    success?: boolean;
    pageUrl?: string;
    duration?: number;
    tags?: string[];
  } = {}
): CommandEntry {
  const entry: CommandEntry = {
    id: `cmd-${++idCounter}`,
    command: command.trim().toLowerCase(),
    timestamp: Date.now(),
    intent: options.intent,
    target: options.target,
    success: options.success ?? true,
    pageUrl: options.pageUrl,
    duration: options.duration,
    isFavorite: false,
    tags: options.tags || [],
  };

  history.unshift(entry);

  // Trim history
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  logger.agent('commandHistory', { event: 'add', command: entry.command, intent: entry.intent });

  return entry;
}

export function searchCommands(query: string, limit = 20): CommandEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return history.slice(0, limit);

  return history
    .filter(e =>
      e.command.includes(q) ||
      e.intent?.includes(q) ||
      e.target?.includes(q) ||
      e.tags.some(t => t.includes(q))
    )
    .slice(0, limit);
}

export function getRecentCommands(limit = 20): CommandEntry[] {
  return history.slice(0, limit);
}

export function getFavoriteCommands(): CommandEntry[] {
  return history.filter(e => e.isFavorite);
}

export function toggleFavorite(id: string): boolean {
  const entry = history.find(e => e.id === id);
  if (!entry) return false;
  entry.isFavorite = !entry.isFavorite;
  return entry.isFavorite;
}

export function deleteCommand(id: string): boolean {
  const idx = history.findIndex(e => e.id === id);
  if (idx === -1) return false;
  history.splice(idx, 1);
  return true;
}

export function clearHistory(): void {
  history.length = 0;
}

export function getCommandsByPage(url: string): CommandEntry[] {
  return history.filter(e => e.pageUrl === url);
}

export function getCommandsByIntent(intent: string): CommandEntry[] {
  return history.filter(e => e.intent === intent);
}

export function replayCommand(id: string): string | null {
  const entry = history.find(e => e.id === id);
  return entry?.command || null;
}

export function getCommandStats(): CommandStats {
  const totalCommands = history.length;
  const successful = history.filter(e => e.success).length;
  const successRate = totalCommands > 0 ? successful / totalCommands : 0;

  // Top commands
  const cmdCounts: Record<string, number> = {};
  for (const entry of history) {
    cmdCounts[entry.command] = (cmdCounts[entry.command] || 0) + 1;
  }
  const topCommands = Object.entries(cmdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([command, count]) => ({ command, count }));

  // Top intents
  const intentCounts: Record<string, number> = {};
  for (const entry of history) {
    if (entry.intent) {
      intentCounts[entry.intent] = (intentCounts[entry.intent] || 0) + 1;
    }
  }
  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([intent, count]) => ({ intent, count }));

  // Session estimate (commands within 30 min = same session)
  let sessions = 1;
  for (let i = 1; i < history.length; i++) {
    if (history[i - 1].timestamp - history[i].timestamp > 30 * 60 * 1000) {
      sessions++;
    }
  }

  return {
    totalCommands,
    successRate,
    topCommands,
    topIntents,
    avgCommandsPerSession: sessions > 0 ? totalCommands / sessions : 0,
    favoriteCommands: getFavoriteCommands(),
    recentCommands: getRecentCommands(10),
  };
}

export function getPatternSuggestions(currentCommand: string): string[] {
  const q = currentCommand.toLowerCase().trim();
  if (!q) return [];

  // Find commands that often follow the current command
  const following: Record<string, number> = {};
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].command === q) {
      const next = history[i + 1].command;
      following[next] = (following[next] || 0) + 1;
    }
  }

  return Object.entries(following)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cmd]) => cmd);
}

export function exportHistory(): string {
  return JSON.stringify(history, null, 2);
}

export function importHistory(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return false;
    history.length = 0;
    for (const entry of data) {
      if (entry.command && entry.timestamp) {
        history.push(entry);
      }
    }
    return true;
  } catch {
    return false;
  }
}
