// VoiceNav Session Memory — tracks conversation context, entities, and page history
// Enables pronoun resolution, contextual commands, and intelligent suggestions

import type { PageSnapshot, AgentAction } from '../browser/types';
import type { NLUResult } from './nlu';
import { logger } from '../utils/logger';

export type ConversationTurn = {
  id: string;
  timestamp: number;
  command: string;
  nluResult?: NLUResult;
  action?: AgentAction;
  result?: 'success' | 'failure' | 'partial';
  response?: string;
  pageUrl?: string;
  pageTitle?: string;
};

export type EntityMemory = {
  lastElement?: { id: number; text: string; role: string; label: string };
  lastLink?: { href: string; text: string };
  lastButton?: { text: string; id: number };
  lastInput?: { id: number; placeholder: string; label: string };
  lastProduct?: { name: string; price: string; url: string };
  lastSearchQuery?: string;
  lastNavigatedUrl?: string;
  lastFormFields?: Array<{ name: string; value: string }>;
  mentionedNumbers?: number[];
  mentionedSites?: string[];
};

export type PageHistoryEntry = {
  url: string;
  title: string;
  pageType?: string;
  timestamp: number;
  snapshot?: PageSnapshot;
};

export type SessionContext = {
  turns: ConversationTurn[];
  entities: EntityMemory;
  pageHistory: PageHistoryEntry[];
  currentGoal?: string; // e.g., "find a laptop under $500"
  goalSteps?: string[];
  activeMacro?: string;
  isTaskRunning: boolean;
  taskName?: string;
  totalCommands: number;
  sessionStartTime: number;
};

const MAX_TURNS = 50;
const MAX_PAGE_HISTORY = 30;

let session: SessionContext = createFreshSession();

function createFreshSession(): SessionContext {
  return {
    turns: [],
    entities: {},
    pageHistory: [],
    isTaskRunning: false,
    totalCommands: 0,
    sessionStartTime: Date.now(),
  };
}

// --- Session Management ---
export function resetSession(): void {
  session = createFreshSession();
}

export function getSession(): SessionContext {
  return session;
}

// --- Turn Tracking ---
let turnCounter = 0;
export function addTurn(turn: Omit<ConversationTurn, 'id' | 'timestamp'>): ConversationTurn {
  const fullTurn: ConversationTurn = {
    ...turn,
    id: `turn-${++turnCounter}`,
    timestamp: Date.now(),
  };
  session.turns.push(fullTurn);
  if (session.turns.length > MAX_TURNS) {
    session.turns = session.turns.slice(-MAX_TURNS);
  }
  session.totalCommands++;
  return fullTurn;
}

export function getLastTurn(): ConversationTurn | undefined {
  return session.turns[session.turns.length - 1];
}

export function getRecentTurns(count: number = 5): ConversationTurn[] {
  return session.turns.slice(-count);
}

// --- Entity Memory ---
export function updateEntityMemory(updates: Partial<EntityMemory>): void {
  session.entities = { ...session.entities, ...updates };
}

export function getEntityMemory(): EntityMemory {
  return session.entities;
}

export function resolveReference(text: string): { type: string; value: any } | null {
  const normalized = text.toLowerCase().trim();
  const entities = session.entities;

  // Pronoun/pointer resolution
  if (/\b(it|that|this|them|those)\b/.test(normalized)) {
    if (entities.lastElement) return { type: 'element', value: entities.lastElement };
    if (entities.lastButton) return { type: 'button', value: entities.lastButton };
    if (entities.lastLink) return { type: 'link', value: entities.lastLink };
  }

  // "the product" / "that product"
  if (/\b(product|item|thing)\b/.test(normalized) && entities.lastProduct) {
    return { type: 'product', value: entities.lastProduct };
  }

  // "the link" / "that link"
  if (/\blink\b/.test(normalized) && entities.lastLink) {
    return { type: 'link', value: entities.lastLink };
  }

  // "the search" / "my search"
  if (/\b(search|query|results?)\b/.test(normalized) && entities.lastSearchQuery) {
    return { type: 'search', value: entities.lastSearchQuery };
  }

  // "the page" / "this page"
  if (/\b(page|site|website)\b/.test(normalized) && entities.lastNavigatedUrl) {
    return { type: 'page', value: entities.lastNavigatedUrl };
  }

  // Number references: "the first one", "number 3", "the second result"
  const ordinals: Record<string, number> = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'last': -1, 'next': -2,
  };
  for (const [word, num] of Object.entries(ordinals)) {
    if (normalized.includes(word)) return { type: 'index', value: num };
  }
  const numMatch = normalized.match(/(?:number|#|no\.?\s*)(\d+)/);
  if (numMatch) return { type: 'index', value: parseInt(numMatch[1]) };

  return null;
}

// --- Page History ---
export function addPageToHistory(url: string, title: string, pageType?: string, snapshot?: PageSnapshot): void {
  session.pageHistory.push({ url, title, pageType, timestamp: Date.now(), snapshot });
  if (session.pageHistory.length > MAX_PAGE_HISTORY) {
    session.pageHistory = session.pageHistory.slice(-MAX_PAGE_HISTORY);
  }
  session.entities.lastNavigatedUrl = url;
}

export function getPageHistory(): PageHistoryEntry[] {
  return session.pageHistory;
}

export function getPreviousPage(): PageHistoryEntry | undefined {
  return session.pageHistory.length >= 2 ? session.pageHistory[session.pageHistory.length - 2] : undefined;
}

// --- Goal Tracking ---
export function setCurrentGoal(goal: string, steps?: string[]): void {
  session.currentGoal = goal;
  session.goalSteps = steps;
}

export function clearCurrentGoal(): void {
  session.currentGoal = undefined;
  session.goalSteps = undefined;
}

export function getCurrentGoal(): string | undefined {
  return session.currentGoal;
}

// --- Task State ---
export function setTaskState(running: boolean, taskName?: string): void {
  session.isTaskRunning = running;
  session.taskName = taskName;
}

export function getTaskState(): { running: boolean; taskName?: string } {
  return { running: session.isTaskRunning, taskName: session.taskName };
}

// --- Context Summary (for NLU) ---
export function getContextForNLU(): { lastCommand?: string; lastTarget?: string; pageType?: string } {
  const lastTurn = getLastTurn();
  return {
    lastCommand: lastTurn?.command,
    lastTarget: lastTurn?.nluResult?.target || session.entities.lastElement?.text,
    pageType: session.pageHistory[session.pageHistory.length - 1]?.pageType,
  };
}

// --- Session Stats ---
export function getSessionStats(): { duration: number; commands: number; pagesVisited: number } {
  return {
    duration: Date.now() - session.sessionStartTime,
    commands: session.totalCommands,
    pagesVisited: session.pageHistory.length,
  };
}
